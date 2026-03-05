/* ============================================================
   invoice.js — 見積書 / 請求書 プレビュー & 印刷
   ============================================================ */

function calcSubtotal(lines) {
  return (lines || []).reduce((s, l) => s + (Number(l.qty) || 0) * (Number(l.price) || 0), 0);
}

function fmtDate(d) {
  if (!d) return '—';
  const parts = String(d).split('-');
  if (parts.length < 3) return d;
  return `${parts[0]}/${parts[1]}/${parts[2]}`;
}

function fmtDatetime(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return `${d.getFullYear()}/${String(d.getMonth()+1).padStart(2,'0')}/${String(d.getDate()).padStart(2,'0')} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
}

function openInvoicePreviewById(projectId, type) {
  const p = _cache.projects.find(x => x.id === projectId);
  if (!p) return;
  window._currentInvoiceData = { project: p, type };
  renderInvoicePreview(p, type);
  openModal('invoiceModal');
}

function openInvoicePreview(type) {
  const lines = collectLines();
  const pseudo = {
    id: window._editingProjectId,
    code: document.getElementById('p-code')?.value,
    name: document.getElementById('p-name')?.value || '（未入力）',
    clientId: document.getElementById('p-client')?.value,
    manager: document.getElementById('p-manager')?.value,
    orderDate: document.getElementById('p-order-date')?.value,
    dueDate: document.getElementById('p-due-date')?.value,
    estNo: document.getElementById('p-est-no')?.value,
    invNo: document.getElementById('p-inv-no')?.value,
    lines,
    _client: getClientById(document.getElementById('p-client')?.value),
  };
  window._currentInvoiceData = { project: pseudo, type };
  renderInvoicePreview(pseudo, type);
  openModal('invoiceModal');
}

function renderInvoicePreview(p, type) {
  const co = window.CFG.company;
  const client = getClientById(p.clientId) || p._client || { name: '（取引先未設定）' };
  const isEstimate = type === 'estimate';
  const docTitle = isEstimate ? '見積書' : '請求書';
  const docNo = isEstimate ? (p.estNo || '—') : (p.invNo || '—');

  document.getElementById('invoiceModalTitle').textContent = docTitle + 'プレビュー';

  const sub = calcSubtotal(p.lines);
  const taxRate = Number(co.taxRate) || 10;
  const tax = Math.round(sub * taxRate / 100);
  const grand = sub + tax;

  const today = new Date();
  const dueDate = new Date(today.getTime() + (Number(co.dueDays) || 30) * 86400000);
  const fmtD = (d) => `${d.getFullYear()}年${d.getMonth()+1}月${d.getDate()}日`;

  const lineRows = (p.lines || []).filter(l => l.name || l.price).map(l => {
    const total = (Number(l.qty) || 0) * (Number(l.price) || 0);
    return `<tr>
      <td>${l.name}</td>
      <td style="text-align:center">${l.qty}</td>
      <td style="text-align:right;font-family:'Space Mono',monospace">¥${Number(l.price).toLocaleString()}</td>
      <td style="text-align:right;font-family:'Space Mono',monospace">¥${total.toLocaleString()}</td>
    </tr>`;
  }).join('');

  const orderSection = isEstimate ? `
    <div class="order-cta">
      <p style="margin:0 0 4px;font-size:13px;color:#2e6b47;font-weight:600">上記の内容でご発注いただける場合</p>
      <p style="margin:0 0 16px;font-size:12px;color:#5a8a6a">下のボタンをクリックしてください。担当者に自動で通知されます。</p>
      <button class="order-cta-btn" onclick="clientOrder('${p.id || ''}','${p.estNo || docNo}')">
        ✅ この見積内容で受注する
      </button>
      <p style="margin:12px 0 0;font-size:11px;color:#8aaa95">※ボタンを押すと担当者へ受注通知が送信されます</p>
    </div>` : '';

  document.getElementById('invoicePreviewContent').innerHTML = `
    <div class="invoice-preview" id="printArea">
      <div class="inv-header">
        <div>
          <div class="inv-company">${co.name || 'Web Studio'}</div>
          <div class="inv-addr">
            〒${co.zip || ''}<br>${co.addr || ''}<br>
            TEL: ${co.tel || ''}<br>${co.email || ''}
          </div>
        </div>
        <div class="inv-title-block">
          <div class="inv-title">${docTitle}</div>
          <div class="inv-number">No. ${docNo}</div>
          <div style="font-size:12px;color:var(--muted);margin-top:8px">発行日：${fmtD(today)}</div>
          ${!isEstimate ? `<div style="font-size:12px;color:var(--muted)">支払期限：${fmtD(dueDate)}</div>` : ''}
        </div>
      </div>

      <div class="inv-to">
        <div class="inv-to-label">宛先</div>
        <div class="inv-to-name">${client.name} 御中</div>
        ${client.contact ? `<div style="font-size:13px;color:var(--muted)">${client.contact} 様</div>` : ''}
      </div>

      <div style="margin-bottom:16px;padding:12px 16px;background:var(--paper);border-radius:4px;border-left:4px solid var(--ink)">
        <div style="font-size:12px;color:var(--muted);margin-bottom:4px">件名</div>
        <div style="font-size:14px;font-weight:600">${p.name}</div>
      </div>

      <table class="inv-items">
        <thead>
          <tr>
            <th style="width:50%">品目</th>
            <th style="width:10%;text-align:center">数量</th>
            <th style="width:20%;text-align:right">単価</th>
            <th style="width:20%;text-align:right">金額</th>
          </tr>
        </thead>
        <tbody>${lineRows || '<tr><td colspan="4" style="text-align:center;color:var(--muted);padding:20px">明細を追加してください</td></tr>'}</tbody>
      </table>

      <div class="inv-total-block">
        <div class="inv-row"><span class="ll">小計</span><span class="rr">¥${sub.toLocaleString()}</span></div>
        <div class="inv-row"><span class="ll">消費税（${taxRate}%）</span><span class="rr">¥${tax.toLocaleString()}</span></div>
        <div class="inv-row total"><span class="ll">合計</span><span class="rr">¥${grand.toLocaleString()}</span></div>
      </div>

      ${!isEstimate && co.bank ? `
      <div class="inv-note">
        <div style="font-weight:600;margin-bottom:8px;color:var(--ink)">お振込先</div>
        <div>${co.bank}</div>
        <div>${co.account || ''}</div>
        <div>口座名義：${co.holder || ''}</div>
      </div>` : ''}

      ${orderSection}
    </div>`;
}

function downloadPDF() {
  toast('印刷ダイアログでPDF保存をお選びください', '📄');
  setTimeout(() => window.print(), 300);
}

/* クライアント側の受注ボタン処理 */
async function clientOrder(projectId, estNo) {
  if (!projectId) { toast('案件IDが見つかりません', '⚠️'); return; }

  const p = _cache.projects.find(x => x.id === projectId);
  if (p?.alreadyOrdered) {
    document.getElementById('invoicePreviewContent').innerHTML = `
      <div style="text-align:center;padding:48px 20px">
        <div style="font-size:48px;margin-bottom:16px">ℹ️</div>
        <div style="font-size:18px;font-weight:700;margin-bottom:8px">すでに受注済みです</div>
        <div style="font-size:14px;color:var(--muted)">このお見積はすでに受注確定済みです。<br>ご不明な点はお問い合わせください。</div>
      </div>`;
    return;
  }

  // 受注処理
  try {
    await dbUpdateProjectStatus(projectId, 'ordered', {
      isNewOrder: true,
      alreadyOrdered: true,
      orderRoute: '見積書承認',
      orderedAt: new Date().toISOString(),
    });

    // ローカルキャッシュ更新
    if (p) {
      p.status = 'ordered';
      p.isNewOrder = true;
      p.alreadyOrdered = true;
      p.orderRoute = '見積書承認';
      p.orderedAt = new Date().toISOString();
    }

    document.getElementById('invoicePreviewContent').innerHTML = `
      <div style="text-align:center;padding:48px 20px">
        <div style="font-size:64px;margin-bottom:16px">✅</div>
        <div style="font-size:22px;font-weight:700;margin-bottom:8px;color:#2e8b57">受注を承りました！</div>
        <div style="font-size:14px;color:var(--muted);margin-bottom:24px">ご発注ありがとうございます。<br>担当者より改めてご連絡いたします。</div>
        <div style="background:var(--paper);border-radius:6px;padding:16px 28px;display:inline-block;text-align:left;border:1px solid var(--border)">
          <div style="font-size:11px;color:var(--muted);margin-bottom:6px">受注内容</div>
          <div style="font-size:15px;font-weight:600;margin-bottom:4px">${p?.name || '—'}</div>
          <div style="font-size:13px;color:var(--muted)">見積No. ${estNo}</div>
          <div style="font-size:14px;font-family:'Space Mono',monospace;margin-top:10px">
            合計 ¥${(calcSubtotal(p?.lines||[]) + Math.round(calcSubtotal(p?.lines||[]) * ((Number(window.CFG.company.taxRate)||10)/100))).toLocaleString()}（税込）
          </div>
        </div>
      </div>`;

    document.getElementById('invoiceModalTitle').textContent = '受注完了';

    // 管理画面データ更新
    renderTable();
    updateKPI();
    updateOrderBadge();

    // 受注通知バナー
    const banner = document.getElementById('orderNotifyBanner');
    if (banner) {
      banner.style.display = 'flex';
      document.getElementById('orderNotifyTitle').textContent = `🎉 新しい受注「${p?.name}」`;
      document.getElementById('orderNotifyDetail').textContent = `見積No. ${estNo} ／ ${fmtDatetime(p?.orderedAt)}`;
    }

    toast(`受注確定！「${p?.name}」`, '🎉', 'success');
  } catch (e) {
    toast('受注処理に失敗しました: ' + e.message, '❌', 'error');
  }
}

/* URLパラメータ処理（メールリンク経由） */
function handleUrlOrder() {
  const params = new URLSearchParams(location.search);
  const orderId = params.get('order');
  if (!orderId) return;
  history.replaceState({}, '', location.pathname);
  setTimeout(() => {
    const p = _cache.projects.find(x => x.id === orderId);
    if (p) {
      window._currentInvoiceData = { project: p, type: 'estimate' };
      renderInvoicePreview(p, 'estimate');
      openModal('invoiceModal');
    }
  }, 500);
}
