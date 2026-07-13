/* ============================================================
   email.js — Brevo SMTP API によるメール送信
   ============================================================
   ブラウザ → /api/send-email.php (Brevo API プロキシ) → Brevo
   @version v20260309-0186-firebase | 2026-03-09 | webstudio-ledger
   ============================================================ */

/**
 * メール送信
 * @param {Object} opts
 * @param {string} opts.to        - 宛先メールアドレス
 * @param {string} [opts.cc]      - CC
 * @param {string} opts.subject   - 件名
 * @param {string} opts.html      - HTMLメール本文
 * @param {string} [opts.text]    - テキスト本文（フォールバック）
 * @returns {Promise<{success:boolean, id?:string, error?:string}>}
 */
async function sendEmail({ to, cc, subject, html, text }) {
  const apiKey   = window.CFG.brevoApiKey;
  const fromEmail = window.CFG.brevoFromEmail || window.CFG.resendFromEmail;

  if (!apiKey) {
    return { success: false, error: 'Brevo APIキーが設定されていません' };
  }
  if (!fromEmail) {
    return { success: false, error: '送信元メールアドレスが設定されていません' };
  }

  const payload = {
    from: `${window.CFG.company?.name || 'Web Studio'} <${fromEmail}>`,
    to:   [to],
    subject,
    html,
    text: text || html.replace(/<[^>]+>/g, ''),
  };
  if (cc) payload.cc = [cc];

  // /api/send-email.php 経由（PHPがBrevo APIキーを保持）
  try {
    const res = await fetch('/api/send-email.php', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || data.message || `HTTP ${res.status}`);
    return { success: true, id: data.id };
  } catch (e) {
    console.error('メール送信エラー:', e);
    return { success: false, error: e.message };
  }
}

/* ============================================================
   メールモーダル制御
   ============================================================ */

let _emailTabMode = 'edit'; // 'edit' | 'preview'

function switchEmailTab(tab) {
  _emailTabMode = tab;
  const editEl    = document.getElementById('emailTabEdit');
  const previewEl = document.getElementById('emailTabPreview');
  const editBtn   = document.getElementById('emailTab-edit');
  const previewBtn = document.getElementById('emailTab-preview');
  if (editEl)    editEl.style.display    = tab === 'edit'    ? '' : 'none';
  if (previewEl) previewEl.style.display = tab === 'preview' ? '' : 'none';
  if (editBtn)   editBtn.style.borderBottomColor  = tab === 'edit'    ? 'var(--accent)' : 'transparent';
  if (editBtn)   editBtn.style.color              = tab === 'edit'    ? 'var(--ink)'    : 'var(--muted)';
  if (previewBtn) previewBtn.style.borderBottomColor = tab === 'preview' ? 'var(--accent)' : 'transparent';
  if (previewBtn) previewBtn.style.color             = tab === 'preview' ? 'var(--ink)'    : 'var(--muted)';
  if (tab === 'preview') {
    const html = document.getElementById('mail-body-html')?.value || '';
    const frame = document.getElementById('emailPreviewFrame');
    if (frame) {
      frame.srcdoc = html;
    }
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

  const result = await sendEmail({ to, cc, subject, html });

  if (result.success) {
    if (statusEl) statusEl.textContent = '✅ 送信完了';
    closeModal('emailModal');

    // モード判定
    const isBillingMode    = document.getElementById('sendEmailBtn')?.dataset?.billingMode    === '1';
    const isInvoiceSendMode = document.getElementById('sendEmailBtn')?.dataset?.invoiceSendMode === '1';

    if (isBillingMode && typeof executeBillingFinalize === 'function') {
      const sendBtn = document.getElementById('sendEmailBtn');
      if (sendBtn) { sendBtn.textContent = '📧 送信する'; delete sendBtn.dataset.billingMode; }
      await executeBillingFinalize(null);

    } else if (isInvoiceSendMode && window._sendingInvNo) {
      const sendBtn = document.getElementById('sendEmailBtn');
      if (sendBtn) { sendBtn.textContent = '📧 送信する'; delete sendBtn.dataset.invoiceSendMode; }
      const invNo = window._sendingInvNo;
      window._sendingInvNo = null;
      const targets = (_cache.projects||[]).filter(p => p.invNo === invNo);
      for (const p of targets) {
        await dbUpdateProjectStatus(p.id, 'sent');
      }
      toast(`請求書 ${invNo} を送付しました`, '📧', 'success');
      if (typeof renderInvoicesView === 'function') renderInvoicesView();
      if (typeof renderTable === 'function') renderTable();

    } else {
      toast(`メールを送信しました（${to}）`, '📧', 'success');
      const isEstimate = document.getElementById('mail-view-url')?.value?.includes('type=estimate');
      const orderUrl   = document.getElementById('mail-order-url')?.value;
      if (isEstimate && orderUrl) {
        setTimeout(() => showEstUrlPanel(orderUrl), 600);
      }
    }
  } else {
    if (statusEl) statusEl.textContent = '送信失敗: ' + result.error;
    toast('送信失敗: ' + result.error, '❌', 'error');
  }

  if (btn) { btn.disabled = false; btn.textContent = '📧 送信する'; }
}

function showEstUrlPanel(url) {
  const el = document.createElement('div');
  el.style.cssText = 'position:fixed;bottom:80px;right:24px;z-index:999;background:#fff;border:1px solid #d8d4cc;border-radius:8px;padding:18px 20px;box-shadow:0 8px 32px rgba(0,0,0,0.15);max-width:380px;animation:toastIn 0.2s ease';
  el.innerHTML = `
    <button onclick="this.closest('div').remove()" style="position:absolute;top:8px;right:12px;background:none;border:none;color:#8a8680;font-size:18px;cursor:pointer;line-height:1">✕</button>
    <div style="font-weight:700;margin-bottom:8px;font-size:14px">📋 受注URLをコピー</div>
    <div style="font-size:12px;color:#8a8680;margin-bottom:10px">お客様の受注確定・ファイル送付に使用してください</div>
    <input value="${url}" readonly style="width:100%;padding:8px;font-size:12px;border:1px solid #d8d4cc;border-radius:4px;box-sizing:border-box;margin-bottom:8px">
    <button onclick="navigator.clipboard.writeText('${url}').then(()=>toast('コピーしました','📋','success'))" style="width:100%;padding:8px;background:#3d3933;color:#fff;border:none;border-radius:4px;cursor:pointer;font-size:13px">📋 URLをコピー</button>
  `;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 15000);
}
