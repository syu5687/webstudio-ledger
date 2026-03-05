/* ============================================================
   config.js — 設定管理
   自社情報はSupabaseのcompany_settingsテーブルで管理
   ============================================================ */

const DEFAULT_COMPANY = {
  name: '', zip: '', addr: '', tel: '', fax: '', email: '', regNo: '',
  bank: '', account: '', holder: '',
  taxRate: 10, dueDays: 30,
  stampDataUrl: '',  // base64 data URL
};

function getEnv() {
  const env = window.ENV || {};
  return {
    supabaseUrl:     env.SUPABASE_URL      || 'https://ehovgxyqlongollwyrml.supabase.co',
    supabaseAnonKey: env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVob3ZneHlxbG9uZ29sbHd5cm1sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI2NzcyMDgsImV4cCI6MjA4ODI1MzIwOH0.rdkzvNrsO8PkKDuMJNZwqY0pQDnabfVcmJnDhiv1wfc',
    resendApiKey:    env.RESEND_API_KEY    || 're_2uUwkqYF_QELAZsUopJCY2KC3h2Ngw75J',
    resendFromEmail: env.RESEND_FROM_EMAIL || 'estimate@nfz33.com',
  };
}

window.CFG = { company: { ...DEFAULT_COMPANY }, ...getEnv() };

// ── Supabaseからcompany_settings読み込み ──
async function loadCompanyFromDB() {
  if (!isDbReady()) return;
  try {
    const client = _supabase;
    const { data, error } = await client
      .from('company_settings')
      .select('*')
      .eq('id', 1)
      .maybeSingle();
    if (error) { console.warn('company_settings読み込みエラー:', error.message); return; }
    if (data) {
      window.CFG.company = {
        name:         data.name         || '',
        zip:          data.zip          || '',
        addr:         data.addr         || '',
        tel:          data.tel          || '',
        fax:          data.fax          || '',
        email:        data.email        || '',
        regNo:        data.reg_no       || '',
        bank:         data.bank         || '',
        account:      data.account      || '',
        holder:       data.holder       || '',
        taxRate:      data.tax_rate     ?? 10,
        dueDays:      data.due_days     ?? 30,
        stampDataUrl: data.stamp_data_url || '',
      };
      applyConfigToForm();
      console.log('✅ 自社情報をSupabaseから読み込みました');
    }
  } catch(e) {
    console.warn('company_settings取得失敗:', e);
  }
}

// ── Supabaseへcompany_settings保存 ──
async function saveCompany() {
  const get = (id) => document.getElementById(id)?.value?.trim() || '';
  const company = {
    name:    get('co-name'),   zip:     get('co-zip'),  addr:    get('co-addr'),
    tel:     get('co-tel'),    fax:     get('co-fax'),  email:   get('co-email'),
    regNo:   get('co-regno'),  bank:    get('co-bank'),
    account: get('co-account'), holder: get('co-holder'),
    taxRate: Number(get('co-tax')) || 10,
    dueDays: Number(get('co-due')) || 30,
    stampDataUrl: window.CFG.company.stampDataUrl || '',
  };

  // 印鑑プレビューから最新のdataURLを取得
  const previewImg = document.getElementById('co-stamp-preview');
  if (previewImg && previewImg.src && previewImg.src.startsWith('data:')) {
    company.stampDataUrl = previewImg.src;
  }

  window.CFG.company = company;

  if (!isDbReady()) {
    toast('Supabase未接続のため保存できません', '⚠️', 'error');
    return;
  }

  try {
    const payload = {
      id:             1,
      name:           company.name,
      zip:            company.zip,
      addr:           company.addr,
      tel:            company.tel,
      fax:            company.fax,
      email:          company.email,
      reg_no:         company.regNo,
      bank:           company.bank,
      account:        company.account,
      holder:         company.holder,
      tax_rate:       company.taxRate,
      due_days:       company.dueDays,
      stamp_data_url: company.stampDataUrl,
      updated_at:     new Date().toISOString(),
    };
    const { error } = await _supabase
      .from('company_settings')
      .upsert(payload, { onConflict: 'id' });
    if (error) throw error;
    toast('自社情報を保存しました', '✅', 'success');
  } catch(e) {
    toast('保存失敗: ' + (e.message || e), '❌', 'error');
  }
}

function applyConfigToForm() {
  const c = window.CFG.company;
  const set = (id, val) => { const el = document.getElementById(id); if (el) el.value = val ?? ''; };
  set('co-name', c.name); set('co-zip', c.zip); set('co-addr', c.addr);
  set('co-tel', c.tel); set('co-fax', c.fax); set('co-email', c.email);
  set('co-regno', c.regNo); set('co-bank', c.bank);
  set('co-account', c.account); set('co-holder', c.holder);
  set('co-tax', c.taxRate); set('co-due', c.dueDays);
  // 印鑑プレビュー
  const preview = document.getElementById('co-stamp-preview');
  const noStamp = document.getElementById('co-stamp-none');
  if (preview && c.stampDataUrl) {
    preview.src = c.stampDataUrl;
    preview.style.display = 'block';
    if (noStamp) noStamp.style.display = 'none';
  } else if (preview) {
    preview.style.display = 'none';
    if (noStamp) noStamp.style.display = 'block';
  }
}

// 印鑑画像選択処理
function onStampFileChange(input) {
  const file = input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    // Canvas で 100x100 にリサイズ
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 100; canvas.height = 100;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, 100, 100);
      const dataUrl = canvas.toDataURL('image/png');
      window.CFG.company.stampDataUrl = dataUrl;
      const preview = document.getElementById('co-stamp-preview');
      const noStamp = document.getElementById('co-stamp-none');
      if (preview) { preview.src = dataUrl; preview.style.display = 'block'; }
      if (noStamp) noStamp.style.display = 'none';
      toast('印鑑画像を読み込みました（保存するには「設定を保存」を押してください）', '🖋️');
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

async function testSupabaseConnection() {
  const { supabaseUrl, supabaseAnonKey } = window.CFG;
  if (!supabaseUrl || !supabaseAnonKey) {
    toast('Supabase環境変数が未設定です', '⚠️');
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
