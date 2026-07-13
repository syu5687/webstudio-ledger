/* ============================================================
   config.js — 設定管理
   自社情報はFirestoreのcompany_settingsコレクションで管理
   ============================================================ */

const DEFAULT_COMPANY = {
  name: '', zip: '', addr: '', tel: '', fax: '', email: '', regNo: '',
  bank: '', account: '', holder: '',
  taxRate: 10, dueDays: 30,
  stampDataUrl: '',
};

function getEnv() {
  const env = window.ENV || {};
  return {
    firebaseApiKey:    env.FIREBASE_API_KEY    || '',
    firebaseProjectId: env.FIREBASE_PROJECT_ID || '',
    firebaseAppId:     env.FIREBASE_APP_ID     || '',
    resendApiKey:    env.RESEND_API_KEY    || 're_2uUwkqYF_QELAZsUopJCY2KC3h2Ngw75J',
    resendFromEmail: env.RESEND_FROM_EMAIL || 'estimate@nfz33.com',
  };
}

window.CFG = { company: { ...DEFAULT_COMPANY }, ...getEnv() };

// ── FirestoreからcompanySettings読み込み ──
async function loadCompanyFromDB() {
  if (!isDbReady()) return;
  try {
    const snap = await _getDoc(_doc(_db, 'company_settings', 'main'));
    if (!snap.exists()) return;
    const data = snap.data();
    window.CFG.company = {
      name:         data.name         || '',
      zip:          data.zip          || '',
      addr:         data.addr         || '',
      tel:          data.tel          || '',
      fax:          data.fax          || '',
      email:        data.email        || '',
      regNo:        data.regNo        || data.reg_no || '',
      bank:         data.bank         || '',
      account:      data.account      || '',
      holder:       data.holder       || '',
      taxRate:      data.taxRate      ?? data.tax_rate ?? 10,
      dueDays:      data.dueDays      ?? data.due_days ?? 30,
      stampDataUrl: data.stampDataUrl || data.stamp_data_url || '',
    };
    applyConfigToForm();
    console.log('✅ 自社情報をFirestoreから読み込みました');
  } catch(e) {
    console.warn('company_settings取得失敗:', e);
  }
}

// ── Firestoreへcompany_settings保存 ──
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

  const previewImg = document.getElementById('co-stamp-preview');
  if (previewImg && previewImg.src && previewImg.src.startsWith('data:')) {
    company.stampDataUrl = previewImg.src;
  }

  window.CFG.company = company;

  if (!isDbReady()) {
    toast('Firebase未接続のため保存できません', '⚠️', 'error');
    return;
  }

  try {
    await _setDoc(_doc(_db, 'company_settings', 'main'), {
      ...company,
      updatedAt: new Date().toISOString(),
    });
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

async function testFirebaseConnection() {
  const { firebaseApiKey, firebaseProjectId } = window.CFG;
  if (!firebaseApiKey || !firebaseProjectId) {
    toast('Firebase環境変数が未設定です', '⚠️');
    return;
  }
  try {
    await _getDocs(_query(_collection(_db, 'projects'), _limit(1)));
    toast('Firebase接続OK ✅', '✅', 'success');
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
