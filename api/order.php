<?php
/**
 * 受注処理エンドポイント
 * URL: /api/order.php?id=PROJECT_ID
 */
$id = $_GET['id'] ?? '';
if (!$id) { http_response_code(400); echo '不正なリクエスト'; exit; }

$supabaseUrl = getenv('SUPABASE_URL')      ?: '';
$supabaseKey = getenv('SUPABASE_ANON_KEY') ?: '';

// ステータスをorderedに更新
$ch = curl_init($supabaseUrl . '/rest/v1/projects?id=eq.' . urlencode($id));
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_CUSTOMREQUEST  => 'PATCH',
    CURLOPT_POSTFIELDS     => json_encode([
        'status'      => 'ordered',
        'ordered_at'  => date('c'),
        'order_route' => '見積書承認（URL）',
    ]),
    CURLOPT_HTTPHEADER => [
        'apikey: ' . $supabaseKey,
        'Authorization: Bearer ' . $supabaseKey,
        'Content-Type: application/json',
        'Prefer: return=minimal',
    ],
    CURLOPT_TIMEOUT => 10,
]);
curl_exec($ch);
$code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);
?>
<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>受注完了</title>
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;700&display=swap" rel="stylesheet">
<style>
  body { font-family:'Noto Sans JP',sans-serif; background:#f5f5f0; display:flex; align-items:center; justify-content:center; min-height:100vh; margin:0; }
  .card { background:#fff; border-radius:12px; padding:48px 40px; text-align:center; max-width:480px; box-shadow:0 4px 24px rgba(0,0,0,0.08); }
  .icon { font-size:64px; margin-bottom:16px; }
  h1 { font-size:22px; font-weight:700; color:#2e6b47; margin-bottom:12px; }
  p { font-size:14px; color:#666; line-height:1.7; }
</style>
</head>
<body>
<div class="card">
  <div class="icon">🎉</div>
  <h1>受注が完了しました</h1>
  <p>ご発注いただきありがとうございます。<br>担当者より改めてご連絡いたします。<br><br>このページは閉じていただいて構いません。</p>
</div>
</body>
</html>
