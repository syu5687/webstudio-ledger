/* ============================================================
   email.js — Resend API によるメール送信
   ============================================================
   Resend は CORS対応のためブラウザから直接呼び出し可能です
   https://resend.com/docs/api-reference/emails/send-email
   ============================================================ */

/**
 * メール送信
 * @param {Object} opts
 * @param {string} opts.to - 宛先メールアドレス
 * @param {string} [opts.cc] - CC
 * @param {string} opts.subject - 件名
 * @param {string} opts.html - HTMLメール本文
 * @param {string} opts.text - テキスト本文（フォールバック）
 * @returns {Promise<{success: boolean, id?: string, error?: string}>}
 */
async function sendEmail({ to, cc, subject, html, text }) {
  const apiKey = window.CFG.resendApiKey;
  const fromEmail = window.CFG.resendFromEmail;

  if (!apiKey) {
    return { success: false, error: 'Resend APIキーが設定されていません' };
  }
  if (!fromEmail) {
    return { success: false, error: '送信元メールアドレスが設定されていません' };
  }

  const payload = {
    from: `${window.CFG.company.name || 'Web Studio'} <${fromEmail}>`,
    to: [to],
    subject,
    html,
    text: text || html.replace(/<[^>]+>/g, ''),
  };
  if (cc) payload.cc = [cc];

  // ローカルファイル（file://）ではPHPプロキシが使えないため直接呼び出し
  const isLocal = location.protocol === 'file:' || location.hostname === 'localhost';
  const endpoint = isLocal
    ? 'https://api.resend.com/emails'
    : '/api/send-email.php';
  const headers = isLocal
    ? { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` }
    : { 'Content-Type': 'application/json' };

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || data.name || `HTTP ${res.status}`);
    }
    return { success: true, id: data.id };
  } catch (e) {
    console.error('メール送信エラー:', e);
    // ローカルプレビューでのCORSエラーの場合はわかりやすいメッセージ
    const msg = (e.message === 'Load failed' || e.message === 'Failed to fetch')
      ? 'プレビュー環境からは送信できません。Cloud RunにデプロイしたURLから送信してください。'
      : e.message;
    return { success: false, error: msg };
  }
}

/**
 * 見積書メール本文を生成
 */
function buildEstimateEmailHtml(project, client, company, viewUrl) {
  const co = company;
  const sub = calcSubtotal(project.lines);
  const tax = Math.round(sub * (Number(co.taxRate) || 10) / 100);
  const grand = sub + tax;
  const url = viewUrl || '';

  return '<!DOCTYPE html>' +
    '<html lang="ja"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>' +
    '<body style="margin:0;padding:0;background:#f5f3ee;font-family:Helvetica Neue,Arial,Hiragino Sans,sans-serif">' +
    '<div style="max-width:600px;margin:32px auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08)">' +
    '<div style="background:#0f0f14;padding:24px 32px">' +
    '<div style="font-size:11px;color:#d4451a;letter-spacing:0.15em;margin-bottom:4px">WEB STUDIO</div>' +
    '<div style="font-size:15px;font-weight:700;color:#fff">' + (co.name || '') + '</div>' +
    '</div>' +
    '<div style="padding:32px">' +
    '<p style="margin:0 0 8px;font-size:15px;font-weight:700">' + (client.name || '') + ' 御中</p>' +
    (client.contact ? '<p style="margin:0 0 20px;font-size:13px;color:#666">' + client.contact + ' 様</p>' : '<p style="margin:0 0 20px"></p>') +
    '<p style="margin:0 0 20px;font-size:14px;line-height:1.8">いつもお世話になっております。<br>' + (co.name || '') + 'でございます。<br><br>' +
    'このたびは、<strong>' + project.name + '</strong> のご依頼をいただき、誠にありがとうございます。<br>' +
    '下記のとおり見積書をお送りいたします。ご確認のほど、よろしくお願いいたします。</p>' +
    '<div style="background:#f5f3ee;border-radius:6px;padding:20px 24px;margin-bottom:24px">' +
    '<div style="font-size:12px;color:#8a8680;margin-bottom:8px">■ 見積内容</div>' +
    '<div style="font-size:14px;margin-bottom:4px">案件名：<strong>' + project.name + '</strong></div>' +
    '<div style="font-size:20px;font-weight:700;margin-top:8px">お見積金額：¥' + grand.toLocaleString() + '<span style="font-size:12px;font-weight:400;color:#666">（税込）</span></div>' +
    '</div>' +
    (url ? (
      '<div style="background:#fff8e1;border:1px solid #f0c040;border-radius:6px;padding:20px 24px;margin-bottom:24px;text-align:center">' +
      '<div style="font-size:13px;color:#666;margin-bottom:12px">見積書の詳細はこちらからご確認いただけます</div>' +
      '<a href="' + url + '" style="display:inline-block;background:#0f0f14;color:#fff;text-decoration:none;padding:12px 32px;font-size:14px;font-weight:700;border-radius:6px;margin-bottom:12px">📄 見積書を確認する</a>' +
      '<div style="font-size:12px;color:#888;word-break:break-all;margin-top:8px">' + url + '</div>' +
      '<div style="margin-top:16px;padding-top:16px;border-top:1px solid #f0c040">' +
      '<div style="font-size:13px;color:#666;margin-bottom:10px">上記内容でご発注いただける場合は、見積書ページの受注ボタンをご利用ください</div>' +
      '<a href="' + url + '" style="display:inline-block;background:#2e8b57;color:#fff;text-decoration:none;padding:10px 28px;font-size:14px;font-weight:700;border-radius:6px">✅ 見積書を確認して受注する</a>' +
      '</div></div>'
    ) : '') +
    '<p style="font-size:13px;line-height:1.8;color:#444">ご不明な点がございましたら、お気軽にご連絡ください。<br>今後ともよろしくお願いいたします。</p>' +
    '</div>' +
    '<div style="background:#f5f3ee;padding:20px 32px;border-top:1px solid #d8d4cc;font-size:12px;color:#8a8680;line-height:1.8">' +
    '<div style="font-weight:600;color:#0f0f14;margin-bottom:4px">' + (co.name || '') + '</div>' +
    '<div>TEL: ' + (co.tel || '') + ' / ' + (co.email || '') + '</div>' +
    (co.bank ? '<div style="margin-top:6px">振込先：' + co.bank + ' ' + (co.account || '') + '（' + (co.holder || '') + '）</div>' : '') +
    '</div></div></body></html>';
}

function buildInvoiceEmailHtml(project, client, company, viewUrl) {
  const co = company;
  const sub = calcSubtotal(project.lines);
  const tax = Math.round(sub * (Number(co.taxRate) || 10) / 100);
  const grand = sub + tax;
  const url = viewUrl || '';

  return '<!DOCTYPE html>' +
    '<html lang="ja"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>' +
    '<body style="margin:0;padding:0;background:#f5f3ee;font-family:Helvetica Neue,Arial,Hiragino Sans,sans-serif">' +
    '<div style="max-width:600px;margin:32px auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08)">' +
    '<div style="background:#0f0f14;padding:24px 32px">' +
    '<div style="font-size:11px;color:#d4451a;letter-spacing:0.15em;margin-bottom:4px">WEB STUDIO</div>' +
    '<div style="font-size:15px;font-weight:700;color:#fff">' + (co.name || '') + '</div>' +
    '</div>' +
    '<div style="padding:32px">' +
    '<p style="margin:0 0 8px;font-size:15px;font-weight:700">' + (client.name || '') + ' 御中</p>' +
    (client.contact ? '<p style="margin:0 0 20px;font-size:13px;color:#666">' + client.contact + ' 様</p>' : '<p style="margin:0 0 20px"></p>') +
    '<p style="margin:0 0 20px;font-size:14px;line-height:1.8">いつもお世話になっております。<br>' + (co.name || '') + 'でございます。<br><br>' +
    'このたびは、<strong>' + project.name + '</strong> のご依頼をいただき、誠にありがとうございます。<br>' +
    '下記のとおり請求書をお送りいたします。ご確認のほど、よろしくお願いいたします。</p>' +
    '<div style="background:#f5f3ee;border-radius:6px;padding:20px 24px;margin-bottom:24px">' +
    '<div style="font-size:12px;color:#8a8680;margin-bottom:8px">■ 請求内容</div>' +
    '<div style="font-size:14px;margin-bottom:4px">案件名：<strong>' + project.name + '</strong></div>' +
    '<div style="font-size:20px;font-weight:700;margin-top:8px">ご請求金額：¥' + grand.toLocaleString() + '<span style="font-size:12px;font-weight:400;color:#666">（税込）</span></div>' +
    '</div>' +
    (url ? (
      '<div style="background:#e8f4fd;border:1px solid #90caf9;border-radius:6px;padding:20px 24px;margin-bottom:24px;text-align:center">' +
      '<div style="font-size:13px;color:#666;margin-bottom:12px">請求書の詳細確認・PDFダウンロードはこちら</div>' +
      '<a href="' + url + '" style="display:inline-block;background:#1565c0;color:#fff;text-decoration:none;padding:12px 32px;font-size:14px;font-weight:700;border-radius:6px;margin-bottom:8px">📄 請求書を確認・ダウンロード</a>' +
      '<div style="font-size:12px;color:#888;word-break:break-all;margin-top:8px">' + url + '</div>' +
      '</div>'
    ) : '') +
    '<p style="font-size:13px;line-height:1.8;color:#444">お振込の際は下記口座をご利用ください。<br>ご不明な点がございましたら、お気軽にご連絡ください。</p>' +
    (co.bank ? '<div style="background:#f5f3ee;border-radius:4px;padding:12px 16px;font-size:13px;margin-bottom:16px">振込先：' + co.bank + ' ' + (co.account || '') + '（' + (co.holder || '') + '）</div>' : '') +
    '</div>' +
    '<div style="background:#f5f3ee;padding:20px 32px;border-top:1px solid #d8d4cc;font-size:12px;color:#8a8680;line-height:1.8">' +
    '<div style="font-weight:600;color:#0f0f14;margin-bottom:4px">' + (co.name || '') + '</div>' +
    '<div>TEL: ' + (co.tel || '') + ' / ' + (co.email || '') + '</div>' +
    '</div></div></body></html>';
}


function sendByEmail() {
  const { project: p, type } = window._currentInvoiceData || {};
  if (!p) {
    toast('案件情報が読み込まれていません。一度閉じて再度開いてください。', '⚠️', 'error');
    return;
  }
  const co = window.CFG.company;
  const client = getClientById(p.clientId) || p._client || {};
  const isEstimate = type === 'estimate';

  // Resend未設定の警告
  const warn = document.getElementById('emailConfigWarning');
  if (warn) warn.style.display = window.CFG.resendApiKey ? 'none' : 'block';

  // 閲覧URL生成
  const baseUrl = window.location.origin;
  const viewUrl = `${baseUrl}/api/view.php?type=${isEstimate ? 'estimate' : 'invoice'}&id=${p.id}`;

  document.getElementById('mail-to').value      = client.email || '';
  document.getElementById('mail-cc').value      = co.email || '';
  document.getElementById('mail-subject').value = `【${isEstimate ? '見積書' : '請求書'}送付】${p.name}`;
  const viewUrlEl = document.getElementById('mail-view-url');
  if (viewUrlEl) viewUrlEl.value = viewUrl;

  const sub   = calcSubtotal(p.lines);
  const grand = sub + Math.round(sub * (Number(co.taxRate) || 10) / 100);
  const urlNote = isEstimate
    ? '※上記URLより内容をご確認のうえ、そのままご発注いただけます。'
    : '※上記URLより請求書のご確認・PDFダウンロードが可能です。';

  const NL = '\n';
  const mailBody = [
    (client.name || '') + ' 御中',
    (client.contact ? client.contact + ' 様' : ''),
    '',
    'いつもお世話になっております。',
    (co.name || '') + ' でございます。',
    '',
    'このたびは、' + p.name + ' のご依頼をいただき、誠にありがとうございます。',
    '',
    '下記のとおり' + (isEstimate ? '見積書' : '請求書') + 'をお送りいたします。',
    'ご確認のほど、よろしくお願いいたします。',
    '',
    '━━━━━━━━━━━━━━━━━━━━━━━',
    '　案件名　：' + p.name,
    '　合計金額：¥' + grand.toLocaleString() + '（税込）',
    '━━━━━━━━━━━━━━━━━━━━━━━',
    '',
    '【' + (isEstimate ? '見積書' : '請求書') + 'の閲覧URL】',
    viewUrl,
    urlNote,
    '',
    'ご不明な点がございましたら、お気軽にご連絡ください。',
    '今後ともよろしくお願いいたします。',
    '',
    '────────────────────────',
    (co.name || ''),
    'TEL: ' + (co.tel || ''),
    'MAIL: ' + (co.email || ''),
    '────────────────────────',
  ].join(NL);
  document.getElementById('mail-body').value = mailBody;

  closeModal('invoiceModal');
  setTimeout(() => openModal('emailModal'), 50);
}

function copyViewUrl() {
  const el = document.getElementById('mail-view-url');
  if (!el || !el.value) return;
  navigator.clipboard.writeText(el.value).then(() => {
    toast('URLをコピーしました', '📋', 'success');
  });
}

async function executeSendEmail() {
  const to = document.getElementById('mail-to')?.value?.trim();
  const cc = document.getElementById('mail-cc')?.value?.trim();
  const subject = document.getElementById('mail-subject')?.value?.trim();
  const bodyText = document.getElementById('mail-body')?.value?.trim();
  const includeLink = document.getElementById('mail-include-link')?.checked;

  if (!to) { toast('宛先を入力してください', '⚠️'); return; }
  if (!subject) { toast('件名を入力してください', '⚠️'); return; }

  const { project: p, type } = window._currentInvoiceData || {};
  const co = window.CFG.company;
  const client = p ? (getClientById(p.clientId) || p._client || {}) : {};
  const isEstimate = type === 'estimate';

  // 送信ボタンをローディング状態に
  const btn = document.getElementById('sendEmailBtn');
  const statusEl = document.getElementById('emailSendStatus');
  if (btn) { btn.disabled = true; btn.innerHTML = '<span class="spinner"></span> 送信中...'; }
  if (statusEl) statusEl.textContent = '';

  // 受注URLの生成（見積書のみ）
  let orderUrl = null;
  if (isEstimate && includeLink && p?.id) {
    const base = location.href.split('?')[0];
    orderUrl = `${base}?order=${p.id}&est=${encodeURIComponent(p.estNo || '')}`;
  }

  // HTML本文生成
  let html;
  if (!window.CFG.resendApiKey) {
    // Resend未設定の場合はテキストのみ（mailto風）
    toast('Resend APIキー未設定のため送信できません', '❌', 'error');
    if (btn) { btn.disabled = false; btn.textContent = '📧 送信する'; }
    return;
  }

  // 閲覧URL（view.php）
  const viewUrl2 = p?.id ? (window.location.origin + '/api/view.php?type=' + (isEstimate ? 'estimate' : 'invoice') + '&id=' + p.id) : '';

  if (isEstimate && p) {
    html = buildEstimateEmailHtml(p, client, co, viewUrl2);
  } else if (p) {
    html = buildInvoiceEmailHtml(p, client, co, viewUrl2);
  } else {
    // プレーンテキストのHTMLラップ
    html = `<pre style="font-family:sans-serif;white-space:pre-wrap">${bodyText}</pre>`;
  }

  const result = await sendEmail({ to, cc, subject, html, text: bodyText });

  if (result.success) {
    closeModal('emailModal');
    toast(`メールを送信しました（${to}）`, '📧', 'success');
    if (isEstimate && orderUrl) {
      setTimeout(() => showEstUrlPanel(orderUrl), 600);
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
    <div style="font-size:12px;font-weight:700;color:#0f0f14;margin-bottom:6px">📎 受注リンク（クライアント用）</div>
    <div style="font-size:11px;color:#8a8680;margin-bottom:10px">クライアントがこのURLを開き「受注する」ボタンを押すと管理画面に通知されます。</div>
    <div style="display:flex;gap:6px">
      <input id="_estUrl" value="${url}" readonly style="flex:1;font-size:10px;padding:6px 8px;border:1px solid #d8d4cc;border-radius:3px;background:#f5f3ee;font-family:monospace;color:#8a8680;outline:none">
      <button onclick="navigator.clipboard.writeText(document.getElementById('_estUrl').value).then(()=>{this.textContent='✓ 済';this.style.background='#2e8b57'})" style="white-space:nowrap;background:#0f0f14;color:#fff;border:none;padding:6px 12px;border-radius:3px;font-size:11px;cursor:pointer">コピー</button>
    </div>`;
  document.body.appendChild(el);
  setTimeout(() => { if (el.parentNode) el.remove(); }, 15000);
}
