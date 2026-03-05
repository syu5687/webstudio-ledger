/* ============================================================
   config.js — 設定管理
   優先順位: window.ENV（Netlify環境変数） > localStorage
   ============================================================ */

const CONFIG_KEY = 'webstudio_company';

const DEFAULT_COMPANY = {
  name: '', zip: '', addr: '', tel: '', email: '',
  bank: '', account: '', holder: '',
  taxRate: 10, dueDays: 30,
};

function loadCompany() {
  try {
    const saved = localStorage.getItem(CONFIG_KEY);
    if (saved) return { ...DEFAULT_COMPANY, ...JSON.parse(saved) };
  } catch (e) { console.warn('自社情報読み込みエラー:', e); }
  return { ...DEFAULT_COMPANY };
}

function saveCompanyToStorage(data) {
  try { localStorage.setItem(CONFIG_KEY, JSON.stringify(data)); }
  catch (e) { console.error('自社情報保存エラー:', e); }
}

function getEnv() {
  const env = window.ENV || {};
  return {
    supabaseUrl:     env.SUPABASE_URL      || '',
    supabaseAnonKey: env.SUPABASE_ANON_KEY || '',
    resendApiKey:    env.RESEND_API_KEY    || '',
    resendFromEmail: env.RESEND_FROM_EMAIL || '',
  };
}

window.CFG = { company: loadCompany(), ...getEnv() };

function applyConfigToForm() {
  const c = window.CFG.company;
  const set = (id, val) => { const el = document.getElementById(id); if (el) el.value = val ?? ''; };
  set('co-name', c.name); set('co-zip', c.zip); set('co-addr', c.addr);
  set('co-tel', c.tel); set('co-email', c.email); set('co-bank', c.bank);
  set('co-account', c.account); set('co-holder', c.holder);
  set('co-tax', c.taxRate); set('co-due', c.dueDays);
}

function saveCompany() {
  const get = (id) => document.getElementById(id)?.value?.trim() || '';
  const company = {
    name: get('co-name'), zip: get('co-zip'), addr: get('co-addr'),
    tel: get('co-tel'), email: get('co-email'), bank: get('co-bank'),
    account: get('co-account'), holder: get('co-holder'),
    taxRate: Number(get('co-tax')) || 10, dueDays: Number(get('co-due')) || 30,
  };
  window.CFG.company = company;
  saveCompanyToStorage(company);
  toast('自社情報を保存しました', '✅', 'success');
}

async function testSupabaseConnection() {
  const { supabaseUrl, supabaseAnonKey } = window.CFG;
  if (!supabaseUrl || !supabaseAnonKey) {
    toast('Supabase環境変数が未設定です（Netlify管理画面で設定）', '⚠️');
    return;
  }
  try {
    const client = supabase.createClient(supabaseUrl, supabaseAnonKey);
    const { error } = await client.from('projects').select('id').limit(1);
    if (error && error.code !== 'PGRST116') throw error;
    toast('Supabase接続OK ✅', '✅', 'success');
    updateDbStatus(true);
  } catch (e) {
    toast('接続失敗: ' + (e.message || e), '❌', 'error');
    updateDbStatus(false);
  }
}

async function testEmailSend() {
  const to = window.CFG.company.email || prompt('テスト送信先メールアドレス:');
  if (!to) return;
  toast('テストメール送信中...', '📧');
  const result = await sendEmail({
    to, subject: '【テスト】メール送信設定確認',
    html: '<h2>✅ メール設定OK</h2><p>案件台帳システムからのメール送信が正常に動作しています。</p>',
    text: 'テスト送信。案件台帳システムのメール設定が正常に完了しました。',
  });
  if (result.success) toast('テストメール送信成功！', '✅', 'success');
  else toast('送信失敗: ' + result.error, '❌', 'error');
}
