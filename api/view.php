<?php
/**
 * 見積書・請求書 公開閲覧ページ
 * URL: /api/view.php?type=estimate&id=PROJECT_ID
 *      /api/view.php?type=invoice&id=PROJECT_ID
 */

$type = $_GET['type'] ?? '';
$id   = $_GET['id']   ?? '';

if (!$type || !$id || !in_array($type, ['estimate','invoice'])) {
    http_response_code(400);
    echo '不正なリクエストです';
    exit;
}

$supabaseUrl  = getenv('SUPABASE_URL')      ?: '';
$supabaseKey  = getenv('SUPABASE_ANON_KEY') ?: '';

if (!$supabaseUrl || !$supabaseKey) {
    http_response_code(500);
    echo 'サーバー設定エラー';
    exit;
}

// プロジェクト取得
function supabaseGet($url, $key, $endpoint) {
    $ch = curl_init($url . $endpoint);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER => [
            'apikey: ' . $key,
            'Authorization: Bearer ' . $key,
            'Content-Type: application/json',
        ],
        CURLOPT_TIMEOUT => 10,
    ]);
    $res = curl_exec($ch);
    curl_close($ch);
    return json_decode($res, true);
}

function supabasePatch($url, $key, $endpoint, $data) {
    $ch = curl_init($url . $endpoint);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_CUSTOMREQUEST  => 'PATCH',
        CURLOPT_POSTFIELDS     => json_encode($data),
        CURLOPT_HTTPHEADER => [
            'apikey: ' . $key,
            'Authorization: Bearer ' . $key,
            'Content-Type: application/json',
            'Prefer: return=minimal',
        ],
        CURLOPT_TIMEOUT => 10,
    ]);
    $res = curl_exec($ch);
    curl_close($ch);
    return $res;
}

$projects = supabaseGet($supabaseUrl, $supabaseKey, '/rest/v1/projects?id=eq.' . urlencode($id) . '&select=*');
if (empty($projects) || !isset($projects[0])) {
    http_response_code(404);
    echo '案件が見つかりません';
    exit;
}
$p = $projects[0];

// 取引先取得
$clients = [];
if (!empty($p['client_id'])) {
    $clients = supabaseGet($supabaseUrl, $supabaseKey, '/rest/v1/clients?id=eq.' . urlencode($p['client_id']) . '&select=*');
}
$client = $clients[0] ?? [];

// 開封済み記録（初回のみ）
$openedField = ($type === 'estimate') ? 'est_opened_at' : 'inv_opened_at';
if (empty($p[$openedField])) {
    supabasePatch($supabaseUrl, $supabaseKey, '/rest/v1/projects?id=eq.' . urlencode($id), [
        $openedField => date('c'),
    ]);
}

// 自社情報取得（振込先・税率）
$companyRows = supabaseGet($supabaseUrl, $supabaseKey, '/rest/v1/company_settings?id=eq.1&select=*');
$co = $companyRows[0] ?? [];
$coBank    = $co['bank']    ?? '';
$coAccount = $co['account'] ?? '';
$coHolder  = $co['holder']  ?? '';
$taxRate   = isset($co['tax_rate']) ? (int)$co['tax_rate'] : 10;
$lines    = is_array($p['lines']) ? $p['lines'] : json_decode($p['lines'] ?? '[]', true);
$subtotal = array_reduce($lines, fn($s, $l) => $s + (floatval($l['price'] ?? 0) * floatval($l['qty'] ?? 1)), 0);
$tax      = round($subtotal * $taxRate / 100);
$grand    = $subtotal + $tax;

// 自社情報 $co をview用マッピングに変換
$co = [
    'name'    => $companyRows[0]['name']           ?? '',
    'postal'  => $companyRows[0]['zip']            ?? '',
    'address' => $companyRows[0]['addr']           ?? '',
    'tel'     => $companyRows[0]['tel']            ?? '',
    'fax'     => $companyRows[0]['fax']            ?? '',
    'email'   => $companyRows[0]['email']          ?? '',
    'reg'     => $companyRows[0]['reg_no']         ?? '',
    'stamp'   => $companyRows[0]['stamp_data_url'] ?? '',
];

$docTitle = $type === 'estimate' ? '見積書' : '請求書';
$docNo    = $type === 'estimate' ? ($p['est_no'] ?? '—') : ($p['inv_no'] ?? '—');

// 日付：手動設定値があればそれを優先、なければ今日
$rawDate  = $type === 'estimate' ? ($p['est_date'] ?? '') : ($p['inv_date'] ?? '');
if ($rawDate) {
    $dt    = new DateTime($rawDate);
    $today = $dt->format('Y年n月j日');
} else {
    $today = date('Y年n月j日');
}
$isEst    = $type === 'estimate';

$lineRows = '';
foreach ($lines as $l) {
    $total = floatval($l['price'] ?? 0) * floatval($l['qty'] ?? 1);
    $lineRows .= '<tr>
        <td style="padding:10px 12px;border-bottom:1px solid #e8e4de">' . htmlspecialchars($l['name'] ?? '') . '</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e8e4de;text-align:center">' . htmlspecialchars($l['qty'] ?? '') . '</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e8e4de;text-align:right;font-family:monospace">¥' . number_format($l['price'] ?? 0) . '</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e8e4de;text-align:right;font-family:monospace">¥' . number_format($total) . '</td>
    </tr>';
}

$orderBtn = '';
if ($isEst && !in_array($p['status'] ?? '', ['ordered','wip','delivered','invoiced','paid'])) {
    $orderBtn = '<div style="margin-top:32px;padding:24px;background:#f0faf4;border:2px solid #2e8b57;border-radius:8px;text-align:center">
        <p style="margin:0 0 8px;font-size:14px;font-weight:600;color:#2e6b47">上記内容でご発注いただける場合</p>
        <p style="margin:0 0 16px;font-size:13px;color:#5a8a6a">下のボタンをクリックしてください</p>
        <a href="/api/order.php?id=' . urlencode($id) . '" style="display:inline-block;background:#2e8b57;color:#fff;padding:14px 40px;border-radius:6px;font-size:16px;font-weight:700;text-decoration:none">✅ この見積内容で受注する</a>
    </div>';
}

$docFilename = $docTitle . '_' . ($client['name'] ?? '') . '_' . date('Ymd') . '.pdf';
$pdfBtn = '<button onclick="downloadPdf()" style="display:inline-block;background:#1565c0;color:#fff;padding:10px 24px;border-radius:6px;font-size:14px;font-weight:600;border:none;cursor:pointer">📥 PDFダウンロード</button>';
?>
<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title><?= htmlspecialchars($docTitle) ?> - <?= htmlspecialchars($p['name'] ?? '') ?></title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Noto Sans JP', 'Hiragino Kaku Gothic ProN', sans-serif; background: #f5f5f0; color: #222; }
  .page { max-width: 800px; margin: 32px auto; background: #fff; padding: 48px; border-radius: 8px; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
  .header { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 32px; }
  .title-band { background: #e0e0e0; text-align: center; padding: 10px; font-size: 22px; font-weight: 700; margin-bottom: 16px; }
  table { width: 100%; border-collapse: collapse; }
  thead tr { background: #222; color: #fff; }
  thead th { padding: 10px 12px; text-align: left; font-size: 13px; }
  .total-block { margin-top: 16px; max-width: 320px; margin-left: auto; }
  .total-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e8e4de; font-size: 14px; }
  .total-row.grand { font-size: 18px; font-weight: 700; border-bottom: 2px solid #222; padding-top: 12px; }
  @media print { body { background: #fff; } .page { box-shadow: none; margin: 0; } .no-print { display: none; } }
</style>
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;600;700&display=swap" rel="stylesheet">
</head>
<body>
<div class="page" id="printArea">
  <div class="header">
    <div style="padding-top:40px">
      <div style="font-size:18px;font-weight:700;margin-bottom:6px"><?= htmlspecialchars($client['name'] ?? '') ?> 御中</div>
      <?php
        $recipientName = $p['recipient_name'] ?? '';
        if (empty($recipientName)) $recipientName = $client['contact'] ?? '';
        if (!empty($recipientName)):
      ?>
      <div style="font-size:13px;color:#555;margin-bottom:4px"><?= htmlspecialchars($recipientName) ?> 様</div>
      <?php endif; ?>
      <div style="margin-top:20px;font-size:13px;font-weight:600">件名：<?= htmlspecialchars($p['name'] ?? '') ?></div>
      <div style="margin-top:12px;font-size:13px"><?= $isEst ? '下記のとおりお見積申し上げます。' : '下記のとおりご請求申し上げます。' ?></div>
      <div style="margin-top:16px">
        <span style="font-size:14px;font-weight:600">お<?= $isEst ? '見積' : '請求' ?>金額</span>
        <span style="font-size:22px;font-weight:700;margin-left:24px">¥<?= number_format($grand) ?> -</span>
      </div>
      <div style="border-bottom:2px solid #333;margin-top:4px"></div>
    </div>
    <div>
      <div class="title-band"><?= $docTitle ?></div>
      <div style="text-align:right;font-size:13px;margin-bottom:12px">
        <?= $today ?><br>
        <?= $isEst ? '見積番号' : '請求番号' ?>：<?= htmlspecialchars($docNo) ?>
      </div>
      <?php if ($co['name'] || $co['stamp']): ?>
      <div style="display:flex;justify-content:flex-end;align-items:flex-start;gap:12px;margin-top:8px">
        <div style="font-size:12px;color:#444;line-height:1.8;text-align:right">
          <?php if ($co['name']): ?>
          <div style="font-size:13px;font-weight:700"><?= htmlspecialchars($co['name']) ?></div>
          <?php endif; ?>
          <?php if ($co['postal']): ?>
          <div>〒<?= htmlspecialchars($co['postal']) ?></div>
          <?php endif; ?>
          <?php if ($co['address']): ?>
          <div><?= htmlspecialchars($co['address']) ?></div>
          <?php endif; ?>
          <?php if ($co['tel']): ?>
          <div>TEL: <?= htmlspecialchars($co['tel']) ?></div>
          <?php endif; ?>
          <?php if ($co['fax']): ?>
          <div>FAX: <?= htmlspecialchars($co['fax']) ?></div>
          <?php endif; ?>
          <?php if ($co['email']): ?>
          <div><?= htmlspecialchars($co['email']) ?></div>
          <?php endif; ?>
          <?php if ($co['reg']): ?>
          <div style="margin-top:4px;font-size:11px;color:#888">登録番号：<?= htmlspecialchars($co['reg']) ?></div>
          <?php endif; ?>
        </div>
        <?php if ($co['stamp']): ?>
        <div style="flex-shrink:0">
          <img src="<?= htmlspecialchars($co['stamp']) ?>" style="width:72px;height:72px;object-fit:contain;opacity:0.85" alt="印鑑">
        </div>
        <?php endif; ?>
      </div>
      <?php endif; ?>
    </div>
  </div>

  <table>
    <thead><tr>
      <th style="width:50%">品目</th>
      <th style="width:10%;text-align:center">数量</th>
      <th style="width:20%;text-align:right">単価</th>
      <th style="width:20%;text-align:right">金額</th>
    </tr></thead>
    <tbody><?= $lineRows ?></tbody>
  </table>

  <div class="total-block">
    <div class="total-row"><span>小計</span><span>¥<?= number_format($subtotal) ?></span></div>
    <div class="total-row"><span>消費税（<?= $taxRate ?>%）</span><span>¥<?= number_format($tax) ?></span></div>
    <div class="total-row grand"><span>合計</span><span>¥<?= number_format($grand) ?></span></div>
  </div>

<?php if ($type === 'invoice' && ($coBank || $coAccount)): ?>
  <div style="margin-top:28px;border:1.5px solid #d0ccc4;border-radius:8px;overflow:hidden">
    <div style="background:#f0ece4;padding:8px 16px;font-size:12px;font-weight:700;color:#555;letter-spacing:0.05em">お振込先</div>
    <div style="padding:14px 20px;font-size:14px;line-height:2">
      <?php if ($coBank):?><div><span style="color:#888;font-size:12px;display:inline-block;width:80px">金融機関</span><strong><?= htmlspecialchars($coBank) ?></strong></div><?php endif;?>
      <?php if ($coAccount):?><div><span style="color:#888;font-size:12px;display:inline-block;width:80px">口座番号</span><strong><?= htmlspecialchars($coAccount) ?></strong></div><?php endif;?>
      <?php if ($coHolder):?><div><span style="color:#888;font-size:12px;display:inline-block;width:80px">口座名義</span><strong><?= htmlspecialchars($coHolder) ?></strong></div><?php endif;?>
    </div>
  </div>
<?php endif; ?>

  <?= $orderBtn ?>
  <div class="no-print" style="margin-top:32px;padding:20px;border-top:2px solid #e8e4de;text-align:center;display:flex;gap:12px;justify-content:center;flex-wrap:wrap">
    <?= $pdfBtn ?>
    <button onclick="window.close()" style="background:#e8e4de;color:#444;padding:10px 24px;border-radius:6px;font-size:14px;font-weight:600;border:none;cursor:pointer">✕ 閉じる</button>
  </div>
</div>
<script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"></script>
<script>
function downloadPdf() {
  const btn = document.querySelector('[onclick="downloadPdf()"]');
  if (btn) { btn.disabled = true; btn.textContent = '⏳ 生成中...'; }

  const el = document.getElementById('printArea');
  const opt = {
    margin:       [8, 8, 8, 8],
    filename:     '<?= addslashes($docFilename) ?>',
    image:        { type: 'jpeg', quality: 0.98 },
    html2canvas:  { scale: 2, useCORS: true, logging: false },
    jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' },
    pagebreak:    { mode: ['avoid-all'] }
  };

  html2pdf().set(opt).from(el).save().then(() => {
    if (btn) { btn.disabled = false; btn.textContent = '📥 PDFダウンロード'; }
  }).catch(() => {
    if (btn) { btn.disabled = false; btn.textContent = '📥 PDFダウンロード'; }
  });
}
</script>
</body>
</html>
