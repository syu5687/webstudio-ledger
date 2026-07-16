/* ============================================================
   email.js — Brevo SMTP API メール送信
   ブラウザ → /api/send-email.php → Brevo API
   ============================================================ */

async function sendEmail({ to, cc, subject, html, text }) {
  const fromEmail = window.CFG?.brevoFromEmail || 'noreply@nfz33.com';
  const companyName = window.CFG?.company?.name || 'Web Studio';

  const payload = {
    from: `${companyName} <${fromEmail}>`,
    to: Array.isArray(to) ? to : [to],
    subject,
    html,
    text: text || html.replace(/<[^>]+>/g, ''),
  };
  if (cc) payload.cc = Array.isArray(cc) ? cc : [cc];

  try {
    const res = await fetch('/api/send-email.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || data.message || `HTTP ${res.status}`);
    return { success: true, id: data.id };
  } catch (e) {
    console.error('メール送信エラー:', e);
    return { success: false, error: e.message };
  }
}

/* ── メールタブ切替 ── */
function switchEmailTab(tab) {
  const editEl     = document.getElementById('emailTabEdit');
  const previewEl  = document.getElementById('emailTabPreview');
  const editBtn    = document.getElementById('emailTab-edit');
  const previewBtn = document.getElementById('emailTab-preview');
  if (editEl)    editEl.style.display    = tab === 'edit'    ? '' : 'none';
  if (previewEl) previewEl.style.display = tab === 'preview' ? '' : 'none';
  if (editBtn) {
    editBtn.style.borderBottomColor = tab === 'edit'    ? 'var(--accent)' : 'transparent';
    editBtn.style.color             = tab === 'edit'    ? 'var(--ink)'    : 'var(--muted)';
  }
  if (previewBtn) {
    previewBtn.style.borderBottomColor = tab === 'preview' ? 'var(--accent)' : 'transparent';
    previewBtn.style.color             = tab === 'preview' ? 'var(--ink)'    : 'var(--muted)';
  }
  if (tab === 'preview') {
    const html  = document.getElementById('mail-body-html')?.value || '';
    const frame = document.getElementById('emailPreviewFrame');
    if (frame) frame.srcdoc = html;
  }
}

/* ── メール送信実行 ── */
async function executeSendEmail() {
  const to      = document.getElementById('mail-to')?.value?.trim();
  const cc      = document.getElementById('mail-cc')?.value?.trim();
  const subject = document.getElementById('mail-subject')?.value?.trim();
  const html    = document.getElementById('mail-body-html')?.value?.trim();

  if (!to)      { toast('宛先を入力してください', '⚠️'); return; }
  if (!subject) { toast('件名を入力してください', '⚠️'); return; }
  if (!html)    { toast('本文を入力してください', '⚠️'); return; }

  const btn      = document.getElementById('sendEmailBtn');
  const statusEl = document.getElementById('emailSendStatus');
  if (btn) { btn.disabled = true; btn.textContent = '送信中...'; }
  if (statusEl) statusEl.textContent = '';

  const result = await sendEmail({ to, cc: cc || null, subject, html });

  if (result.success) {
    if (statusEl) statusEl.textContent = '✅ 送信完了';
    closeModal('emailModal');

    const isBillingMode     = btn?.dataset?.billingMode     === '1';
    const isInvoiceSendMode = btn?.dataset?.invoiceSendMode === '1';

    if (isBillingMode && typeof executeBillingFinalize === 'function') {
      if (btn) { btn.textContent = '📧 送信する'; delete btn.dataset.billingMode; }
      await executeBillingFinalize(null);

    } else if (isInvoiceSendMode && window._sendingInvNo) {
      if (btn) { btn.textContent = '📧 送信する'; delete btn.dataset.invoiceSendMode; }
      const invNo = window._sendingInvNo;
      window._sendingInvNo = null;
      const targets = (_cache.projects||[]).filter(p => p.invNo === invNo);
      for (const p of targets) await dbUpdateProjectStatus(p.id, 'sent');
      toast(`請求書 ${invNo} を送付しました`, '📧', 'success');
      if (typeof renderInvoicesView === 'function') renderInvoicesView();
      if (typeof renderTable === 'function') renderTable();

    } else {
      toast(`メールを送信しました（${to}）`, '📧', 'success');
      const orderUrl = document.getElementById('mail-order-url')?.value;
      const viewUrl  = document.getElementById('mail-view-url')?.value || '';
      const isEstimate = viewUrl.includes('type=estimate');
      if (isEstimate && orderUrl) setTimeout(() => showEstUrlPanel(orderUrl), 600);
    }
  } else {
    if (statusEl) statusEl.textContent = '送信失敗: ' + result.error;
    toast('送信失敗: ' + result.error, '❌', 'error');
  }

  if (btn) { btn.disabled = false; btn.textContent = '📧 送信する'; }
}

function showEstUrlPanel(url) {
  const el = document.createElement('div');
  el.style.cssText = 'position:fixed;bottom:80px;right:24px;z-index:999;background:#fff;border:1px solid #d8d4cc;border-radius:8px;padding:18px 20px;box-shadow:0 8px 32px rgba(0,0,0,0.15);max-width:380px';
  el.innerHTML = `
    <button onclick="this.closest('div').remove()" style="position:absolute;top:8px;right:12px;background:none;border:none;color:#8a8680;font-size:18px;cursor:pointer">✕</button>
    <div style="font-weight:700;margin-bottom:8px;font-size:14px">📋 受注URLをコピー</div>
    <input value="${url}" readonly style="width:100%;padding:8px;font-size:12px;border:1px solid #d8d4cc;border-radius:4px;box-sizing:border-box;margin-bottom:8px">
    <button onclick="navigator.clipboard.writeText('${url}').then(()=>toast('コピーしました','📋','success'))" style="width:100%;padding:8px;background:#3d3933;color:#fff;border:none;border-radius:4px;cursor:pointer;font-size:13px">📋 URLをコピー</button>`;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 15000);
}
