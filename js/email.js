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
  const { apiKey, fromEmail } = window.CFG.resend;

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

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || data.name || `HTTP ${res.status}`);
    }
    return { success: true, id: data.id };
  } catch (e) {
    console.error('メール送信エラー:', e);
    return { success: false, error: e.message };
  }
}

/**
 * 見積書メール本文を生成
 */
function buildEstimateEmailHtml(project, client, company, orderUrl) {
  const co = company;
  const sub = calcSubtotal(project.lines);
  const tax = Math.round(sub * (Number(co.taxRate) || 10) / 100);
  const grand = sub + tax;

  const lineRows = (project.lines || []).map(l => {
    const total = (Number(l.qty) || 0) * (Number(l.price) || 0);
    return `
      <tr>
        <td style="padding:10px 12px;border-bottom:1px solid #e8e4de;font-size:13px">${l.name}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e8e4de;font-size:13px;text-align:center">${l.qty}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e8e4de;font-size:13px;text-align:right;font-family:monospace">¥${Number(l.price).toLocaleString()}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e8e4de;font-size:13px;text-align:right;font-family:monospace">¥${total.toLocaleString()}</td>
      </tr>`;
  }).join('');

  const orderSection = orderUrl ? `
    <div style="margin-top:32px;padding:24px;background:#f0faf4;border:2px solid #2e8b57;border-radius:8px;text-align:center">
      <p style="margin:0 0 6px;font-size:14px;color:#2e6b47;font-weight:600">上記の内容でご発注いただける場合</p>
      <p style="margin:0 0 16px;font-size:13px;color:#5a8a6a">下記のボタンをクリックしてください。担当者に自動で通知されます。</p>
      <a href="${orderUrl}" style="display:inline-block;background:#2e8b57;color:#fff;text-decoration:none;padding:14px 40px;font-size:15px;font-weight:700;border-radius:6px;letter-spacing:0.03em">
        ✅ この見積内容で受注する
      </a>
      <p style="margin:12px 0 0;font-size:11px;color:#8aaa95">※ボタンを押すと担当者へ受注通知が送信されます</p>
    </div>` : '';

  return `<!DOCTYPE html>
<html lang="ja">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f3ee;font-family:'Helvetica Neue',Arial,'Hiragino Sans',sans-serif">
  <div style="max-width:680px;margin:32px auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08)">
    
    <!-- ヘッダー -->
    <div style="background:#0f0f14;padding:28px 32px;display:flex;justify-content:space-between;align-items:flex-start">
      <div>
        <div style="font-size:11px;color:#d4451a;letter-spacing:0.15em;text-transform:uppercase;margin-bottom:6px;font-family:monospace">Web Studio</div>
        <div style="font-size:16px;font-weight:700;color:#fff">${co.name || 'Web Studio'}</div>
      </div>
      <div style="text-align:right">
        <div style="font-size:22px;font-weight:900;color:#d4451a;letter-spacing:0.06em">見積書</div>
        <div style="font-size:12px;color:#666;font-family:monospace">No. ${project.estNo || '—'}</div>
      </div>
    </div>

    <div style="padding:32px">
      <!-- 宛先 -->
      <div style="margin-bottom:24px">
        <div style="font-size:10px;color:#8a8680;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;margin-bottom:6px">送付先</div>
        <div style="font-size:18px;font-weight:700">${client.name || ''} 御中</div>
        ${client.contact ? `<div style="font-size:13px;color:#8a8680;margin-top:2px">${client.contact} 様</div>` : ''}
      </div>

      <!-- 件名 -->
      <div style="margin-bottom:24px;padding:14px 18px;background:#f5f3ee;border-radius:4px;border-left:4px solid #0f0f14">
        <div style="font-size:11px;color:#8a8680;margin-bottom:4px">件名</div>
        <div style="font-size:15px;font-weight:600">${project.name}</div>
      </div>

      <!-- 明細表 -->
      <table style="width:100%;border-collapse:collapse;margin-bottom:16px">
        <thead>
          <tr style="background:#0f0f14">
            <th style="padding:10px 12px;text-align:left;font-size:11px;font-weight:600;color:#fff;letter-spacing:0.05em">品目</th>
            <th style="padding:10px 12px;text-align:center;font-size:11px;font-weight:600;color:#fff;width:60px">数量</th>
            <th style="padding:10px 12px;text-align:right;font-size:11px;font-weight:600;color:#fff;width:120px">単価</th>
            <th style="padding:10px 12px;text-align:right;font-size:11px;font-weight:600;color:#fff;width:120px">金額</th>
          </tr>
        </thead>
        <tbody>${lineRows}</tbody>
      </table>

      <!-- 合計 -->
      <div style="display:flex;flex-direction:column;align-items:flex-end;gap:4px;border-top:2px solid #0f0f14;padding-top:12px">
        <div style="display:flex;gap:20px;font-size:13px">
          <span style="color:#8a8680;min-width:90px;text-align:right">小計</span>
          <span style="font-family:monospace;min-width:110px;text-align:right">¥${sub.toLocaleString()}</span>
        </div>
        <div style="display:flex;gap:20px;font-size:13px">
          <span style="color:#8a8680;min-width:90px;text-align:right">消費税（${co.taxRate || 10}%）</span>
          <span style="font-family:monospace;min-width:110px;text-align:right">¥${tax.toLocaleString()}</span>
        </div>
        <div style="display:flex;gap:20px;font-size:17px;font-weight:700;border-top:1px solid #d8d4cc;padding-top:8px;margin-top:4px">
          <span style="min-width:90px;text-align:right">合計</span>
          <span style="font-family:monospace;min-width:110px;text-align:right">¥${grand.toLocaleString()}</span>
        </div>
      </div>

      <!-- 受注ボタン -->
      ${orderSection}
    </div>

    <!-- フッター -->
    <div style="background:#f5f3ee;padding:20px 32px;border-top:1px solid #d8d4cc;font-size:12px;color:#8a8680;line-height:1.8">
      <div style="font-weight:600;color:#0f0f14;margin-bottom:6px">${co.name || ''}</div>
      <div>〒${co.zip || ''} ${co.addr || ''}</div>
      <div>TEL: ${co.tel || ''} ／ ${co.email || ''}</div>
      ${co.bank ? `<div style="margin-top:8px;padding-top:8px;border-top:1px solid #d8d4cc">振込先：${co.bank} ${co.account || ''} （${co.holder || ''}）</div>` : ''}
    </div>
  </div>
</body>
</html>`;
}

/**
 * 請求書メールHTML生成
 */
function buildInvoiceEmailHtml(project, client, company) {
  const co = company;
  const sub = calcSubtotal(project.lines);
  const taxRate = Number(co.taxRate) || 10;
  const tax = Math.round(sub * taxRate / 100);
  const grand = sub + tax;
  const today = new Date();
  const dueDate = new Date(today.getTime() + (Number(co.dueDays) || 30) * 86400000);
  const fmtD = (d) => `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;

  const lineRows = (project.lines || []).map(l => {
    const total = (Number(l.qty) || 0) * (Number(l.price) || 0);
    return `<tr>
      <td style="padding:10px 12px;border-bottom:1px solid #e8e4de;font-size:13px">${l.name}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #e8e4de;font-size:13px;text-align:center">${l.qty}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #e8e4de;font-size:13px;text-align:right;font-family:monospace">¥${Number(l.price).toLocaleString()}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #e8e4de;font-size:13px;text-align:right;font-family:monospace">¥${total.toLocaleString()}</td>
    </tr>`;
  }).join('');

  return `<!DOCTYPE html>
<html lang="ja">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f5f3ee;font-family:'Helvetica Neue',Arial,'Hiragino Sans',sans-serif">
  <div style="max-width:680px;margin:32px auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08)">
    <div style="background:#0f0f14;padding:28px 32px;display:flex;justify-content:space-between;align-items:flex-start">
      <div>
        <div style="font-size:11px;color:#d4451a;letter-spacing:0.15em;text-transform:uppercase;margin-bottom:6px;font-family:monospace">Web Studio</div>
        <div style="font-size:16px;font-weight:700;color:#fff">${co.name || ''}</div>
      </div>
      <div style="text-align:right">
        <div style="font-size:22px;font-weight:900;color:#d4451a;letter-spacing:0.06em">請求書</div>
        <div style="font-size:12px;color:#666;font-family:monospace">No. ${project.invNo || '—'}</div>
        <div style="font-size:11px;color:#666;margin-top:4px">発行日：${fmtD(today)}</div>
        <div style="font-size:11px;color:#666">支払期限：${fmtD(dueDate)}</div>
      </div>
    </div>
    <div style="padding:32px">
      <div style="margin-bottom:24px">
        <div style="font-size:10px;color:#8a8680;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;margin-bottom:6px">請求先</div>
        <div style="font-size:18px;font-weight:700">${client.name || ''} 御中</div>
        ${client.contact ? `<div style="font-size:13px;color:#8a8680;margin-top:2px">${client.contact} 様</div>` : ''}
      </div>
      <div style="margin-bottom:24px;padding:14px 18px;background:#f5f3ee;border-radius:4px;border-left:4px solid #0f0f14">
        <div style="font-size:11px;color:#8a8680;margin-bottom:4px">件名</div>
        <div style="font-size:15px;font-weight:600">${project.name}</div>
      </div>
      <table style="width:100%;border-collapse:collapse;margin-bottom:16px">
        <thead>
          <tr style="background:#0f0f14">
            <th style="padding:10px 12px;text-align:left;font-size:11px;font-weight:600;color:#fff">品目</th>
            <th style="padding:10px 12px;text-align:center;font-size:11px;font-weight:600;color:#fff;width:60px">数量</th>
            <th style="padding:10px 12px;text-align:right;font-size:11px;font-weight:600;color:#fff;width:120px">単価</th>
            <th style="padding:10px 12px;text-align:right;font-size:11px;font-weight:600;color:#fff;width:120px">金額</th>
          </tr>
        </thead>
        <tbody>${lineRows}</tbody>
      </table>
      <div style="display:flex;flex-direction:column;align-items:flex-end;gap:4px;border-top:2px solid #0f0f14;padding-top:12px">
        <div style="display:flex;gap:20px;font-size:13px"><span style="color:#8a8680;min-width:100px;text-align:right">小計</span><span style="font-family:monospace;min-width:110px;text-align:right">¥${sub.toLocaleString()}</span></div>
        <div style="display:flex;gap:20px;font-size:13px"><span style="color:#8a8680;min-width:100px;text-align:right">消費税（${taxRate}%）</span><span style="font-family:monospace;min-width:110px;text-align:right">¥${tax.toLocaleString()}</span></div>
        <div style="display:flex;gap:20px;font-size:17px;font-weight:700;border-top:1px solid #d8d4cc;padding-top:8px;margin-top:4px">
          <span style="min-width:100px;text-align:right">合計</span>
          <span style="font-family:monospace;min-width:110px;text-align:right">¥${grand.toLocaleString()}</span>
        </div>
      </div>
      <div style="margin-top:24px;padding-top:16px;border-top:1px solid #d8d4cc;font-size:12px;color:#8a8680;line-height:1.8">
        <div style="font-weight:600;color:#0f0f14;margin-bottom:4px">お振込先</div>
        <div>${co.bank || ''}</div>
        <div>${co.account || ''}</div>
        <div>口座名義：${co.holder || ''}</div>
      </div>
    </div>
    <div style="background:#f5f3ee;padding:20px 32px;border-top:1px solid #d8d4cc;font-size:12px;color:#8a8680;line-height:1.8">
      <div style="font-weight:600;color:#0f0f14;margin-bottom:4px">${co.name || ''}</div>
      <div>〒${co.zip || ''} ${co.addr || ''}</div>
      <div>TEL: ${co.tel || ''} ／ ${co.email || ''}</div>
    </div>
  </div>
</body>
</html>`;
}

/* ── メール送付UI関数 ── */

function sendByEmail() {
  const { project: p, type } = window._currentInvoiceData || {};
  if (!p) return;
  const co = window.CFG.company;
  const client = getClientById(p.clientId) || p._client || {};
  const isEstimate = type === 'estimate';

  // Resend未設定の警告
  const warn = document.getElementById('emailConfigWarning');
  if (warn) warn.style.display = window.CFG.resend.apiKey ? 'none' : 'block';

  document.getElementById('mail-to').value = client.email || '';
  document.getElementById('mail-cc').value = co.email || '';
  document.getElementById('mail-subject').value = `【${isEstimate ? '見積書' : '請求書'}送付】${p.name}`;

  const sub = calcSubtotal(p.lines);
  const grand = sub + Math.round(sub * (Number(co.taxRate) || 10) / 100);

  document.getElementById('mail-body').value =
`${client.name || ''} 御中
${client.contact ? client.contact + ' 様\n' : ''}
いつもお世話になっております。
${co.name} でございます。

このたびは、${p.name} のご依頼をいただき、誠にありがとうございます。

下記のとおり${isEstimate ? '見積書' : '請求書'}をお送りいたします。
ご確認のほど、よろしくお願いいたします。

━━━━━━━━━━━━━━━━━━━━━━━
　案件名　：${p.name}
　合計金額：¥${grand.toLocaleString()}（税込）
━━━━━━━━━━━━━━━━━━━━━━━

ご不明な点がございましたら、お気軽にご連絡ください。
今後ともよろしくお願いいたします。

────────────────────────
${co.name}
TEL: ${co.tel || ''}
MAIL: ${co.email || ''}
────────────────────────`;

  closeModal('invoiceModal');
  openModal('emailModal');
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
  if (!window.CFG.resend.apiKey) {
    // Resend未設定の場合はテキストのみ（mailto風）
    toast('Resend APIキー未設定のため送信できません', '❌', 'error');
    if (btn) { btn.disabled = false; btn.textContent = '📧 送信する'; }
    return;
  }

  if (isEstimate && p) {
    html = buildEstimateEmailHtml(p, client, co, orderUrl);
  } else if (p) {
    html = buildInvoiceEmailHtml(p, client, co);
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
