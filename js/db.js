/* ============================================================
   db.js — Firebase Firestore CRUD操作レイヤー
   ============================================================
   Firestoreコレクション: clients / projects / domains / hostings / expenses
   設定（config.js CFG）:
     firebaseApiKey, firebaseProjectId, firebaseAppId
   ============================================================ */

let _db = null;
let _isConnected = false;
let _collection, _doc, _getDocs, _getDoc, _addDoc, _setDoc,
    _updateDoc, _deleteDoc, _query, _where, _orderBy, _limit, _onSnapshot;

let _cache = {
  projects: [], clients: [], domains: [], hostings: [], expenses: [], lastFetch: null,
};

function initFirebase() {
  const cfg       = window.CFG || {};
  const apiKey    = cfg.firebaseApiKey;
  const projectId = cfg.firebaseProjectId;
  const appId     = cfg.firebaseAppId || '';

  if (!apiKey || !projectId) {
    console.warn('Firebase設定が未設定です。');
    updateDbStatus(false, '未設定');
    return false;
  }

  // window.firebaseApp/firebaseFirestoreが未定義の場合（Safari等）
  // firebase グローバルから直接構築する
  if (!window.firebaseApp || !window.firebaseFirestore) {
    if (typeof firebase === 'undefined') {
      console.error('Firebase SDKが読み込まれていません');
      updateDbStatus(false, 'SDK未ロード');
      return false;
    }
    console.warn('window.firebaseApp未定義 → firebase グローバルから再構築');
    window.firebaseApp = {
      initializeApp: (cfg) => firebase.initializeApp(cfg),
      getApps: () => firebase.apps,
    };
    window.firebaseFirestore = {
      getFirestore: (app) => app.firestore(),
      collection: (db, path) => db.collection(path),
      doc: (db, path, id) => db.collection(path).doc(id),
      getDocs: (q) => q.get().then(snap => ({
        docs: snap.docs.map(d => ({ id: d.id, data: () => d.data() }))
      })),
      getDoc: (ref) => ref.get().then(d => ({
        id: d.id, exists: () => d.exists, data: () => d.data(),
      })),
      addDoc: (colRef, data) => colRef.add(data),
      setDoc: (ref, data) => ref.set(data),
      updateDoc: (ref, data) => ref.update(data),
      deleteDoc: (ref) => ref.delete(),
      query: (colRef, ...constraints) => {
        let q = colRef;
        constraints.forEach(c => { if (typeof c === 'function') q = c(q); });
        return q;
      },
      where:   (f, op, v) => (q) => q.where(f, op, v),
      orderBy: (f, dir)   => (q) => q.orderBy(f, dir || 'asc'),
      limit:   (n)        => (q) => q.limit(n),
      onSnapshot: (q, cb) => q.onSnapshot(snap => {
        cb({ docChanges: () => snap.docChanges().map(c => ({
          type: c.type, doc: { id: c.doc.id, data: () => c.doc.data() }
        }))});
      }),
    };
  }

  try {
    const { initializeApp, getApps } = window.firebaseApp;
    const fs = window.firebaseFirestore;
    const app = getApps().length === 0
      ? initializeApp({ apiKey, projectId, appId })
      : getApps()[0];
    _db = fs.getFirestore(app);
    _collection = fs.collection; _doc = fs.doc;
    _getDocs = fs.getDocs; _getDoc = fs.getDoc;
    _addDoc = fs.addDoc; _setDoc = fs.setDoc;
    _updateDoc = fs.updateDoc; _deleteDoc = fs.deleteDoc;
    _query = fs.query; _where = fs.where;
    _orderBy = fs.orderBy; _limit = fs.limit;
    _onSnapshot = fs.onSnapshot;
    updateDbStatus(true, '接続済');
    console.log('✅ Firebase接続成功:', projectId);
    return true;
  } catch (e) {
    console.error('Firebase初期化エラー:', e);
    updateDbStatus(false, 'エラー');
    return false;
  }
}

// Supabase版との互換性のためエイリアスを提供
const initSupabase = initFirebase;

function updateDbStatus(connected, label) {
  _isConnected = connected;
  const dot  = document.getElementById('dbDot');
  const text = document.getElementById('dbStatusText');
  if (dot)  dot.style.background = connected ? '#2e8b57' : '#888';
  if (text) text.textContent = label || (connected ? '接続済' : '未接続');
}

function isDbReady() { return !!_db && _isConnected; }

/* ── PROJECTS ── */

async function dbFetchProjects() {
  if (!isDbReady()) return _cache.projects;
  try {
    const snap = await _getDocs(_query(_collection(_db,'projects'), _orderBy('createdAt','desc')));
    _cache.projects = snap.docs.map(d => normalizeProject({ id: d.id, ...d.data() }));
    _cache.lastFetch = Date.now();
    return _cache.projects;
  } catch (e) {
    console.error('プロジェクト取得エラー:', e);
    toast('データ取得エラー: ' + e.message, '❌', 'error');
    return _cache.projects;
  }
}

async function dbSaveProject(projectData) {
  if (!isDbReady()) {
    const now = new Date().toISOString();
    if (projectData.id && !String(projectData.id).startsWith('local-')) {
      // 既存案件の更新：キャッシュをマージして完全なオブジェクトを返す
      const idx = _cache.projects.findIndex(p => p.id === projectData.id);
      const merged = normalizeProject({
        ...( idx >= 0 ? _cache.projects[idx] : {} ),
        ...projectData,
        updatedAt: now,
      });
      if (idx >= 0) _cache.projects[idx] = merged;
      toast('⚠️ オフラインモード：DBに保存されていません', '⚠️');
      return merged;
    } else {
      // 新規案件：local-IDを付与して完全なオブジェクトを返す
      const newId = 'local-' + Date.now();
      const merged = normalizeProject({ ...projectData, id: newId, createdAt: now, updatedAt: now });
      _cache.projects.unshift(merged);
      toast('⚠️ オフラインモード：DBに保存されていません', '⚠️');
      return merged;
    }
  }
  try {
    const payload = denormalizeProject(projectData);
    const now = new Date().toISOString();
    if (projectData.id && !String(projectData.id).startsWith('local-')) {
      const { id, createdAt, ...upd } = payload;
      upd.updatedAt = now;
      await _updateDoc(_doc(_db, 'projects', projectData.id), upd);
      const snap = await _getDoc(_doc(_db, 'projects', projectData.id));
      return normalizeProject({ id: snap.id, ...snap.data() });
    } else {
      if (!payload.code) payload.code = await dbNextCode();
      payload.createdAt = now; payload.updatedAt = now;
      delete payload.id;
      const ref = await _addDoc(_collection(_db, 'projects'), payload);
      const snap = await _getDoc(_doc(_db, 'projects', ref.id));
      return normalizeProject({ id: snap.id, ...snap.data() });
    }
  } catch (e) {
    console.error('プロジェクト保存エラー:', e);
    toast('保存エラー: ' + e.message, '❌', 'error');
    throw e;
  }
}

async function dbDeleteProject(id) {
  if (!isDbReady()) { _cache.projects = _cache.projects.filter(p => p.id !== id); return true; }
  try {
    await _deleteDoc(_doc(_db, 'projects', id));
    _cache.projects = _cache.projects.filter(p => p.id !== id);
    return true;
  } catch (e) { console.error('削除エラー:', e); toast('削除エラー: ' + e.message, '❌', 'error'); throw e; }
}

async function dbUpdateProjectStatus(id, status, extra = {}) {
  if (!isDbReady()) {
    const p = _cache.projects.find(x => x.id === id);
    if (p) Object.assign(p, { status, ...extra });
    return true;
  }
  try {
    await _updateDoc(_doc(_db, 'projects', id), { status, updatedAt: new Date().toISOString(), ...extra });
    const p = _cache.projects.find(x => x.id === id);
    if (p) Object.assign(p, { status, ...extra });
    return true;
  } catch (e) { console.error('ステータス更新エラー:', e); toast('更新エラー: ' + e.message, '❌', 'error'); throw e; }
}

/* ── CLIENTS ── */

async function dbFetchClients() {
  if (!isDbReady()) return _cache.clients;
  try {
    const snap = await _getDocs(_query(_collection(_db,'clients'), _orderBy('name')));
    _cache.clients = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    return _cache.clients;
  } catch (e) { console.error('取引先取得エラー:', e); return _cache.clients; }
}

async function dbSaveClient(clientData) {
  if (!isDbReady()) {
    if (clientData.id && !String(clientData.id).startsWith('local-')) {
      const idx = _cache.clients.findIndex(c => c.id === clientData.id);
      if (idx >= 0) _cache.clients[idx] = clientData;
    } else { _cache.clients.push({ ...clientData, id: 'local-' + Date.now() }); }
    toast('⚠️ オフラインモード', '⚠️'); return clientData;
  }
  try {
    const now = new Date().toISOString();
    if (clientData.id && !String(clientData.id).startsWith('local-')) {
      const { id, createdAt, ...upd } = clientData; upd.updatedAt = now;
      await _updateDoc(_doc(_db,'clients', clientData.id), upd);
      const snap = await _getDoc(_doc(_db,'clients', clientData.id));
      return { id: snap.id, ...snap.data() };
    } else {
      const { id, ...ins } = clientData; ins.createdAt = now;
      const ref = await _addDoc(_collection(_db,'clients'), ins);
      const snap = await _getDoc(_doc(_db, 'clients', ref.id));
      return { id: snap.id, ...snap.data() };
    }
  } catch (e) { console.error('取引先保存エラー:', e); toast('保存エラー: ' + e.message, '❌', 'error'); throw e; }
}

async function dbDeleteClient(id) {
  if (!isDbReady()) { _cache.clients = _cache.clients.filter(c => c.id !== id); return true; }
  try {
    await _deleteDoc(_doc(_db,'clients', id));
    _cache.clients = _cache.clients.filter(c => c.id !== id);
    return true;
  } catch (e) { console.error('取引先削除エラー:', e); toast('削除エラー: ' + e.message, '❌', 'error'); throw e; }
}

/* ── COUNTER（採番） ── */

async function dbNextCode() {
  const year = new Date().getFullYear();
  const prefix = `WEB-${year}-`;
  if (!isDbReady()) {
    const count = _cache.projects.filter(p => p.code?.startsWith(prefix)).length;
    return `${prefix}${String(count + 1).padStart(3, '0')}`;
  }
  try {
    const snap = await _getDocs(_query(_collection(_db,'projects'),
      _where('code','>=', prefix), _where('code','<=', prefix+'\uf8ff'),
      _orderBy('code','desc'), _limit(1)));
    const last = snap.docs[0]?.data()?.code;
    const lastNum = last ? parseInt(last.replace(prefix,'')) || 0 : 0;
    return `${prefix}${String(lastNum + 1).padStart(3, '0')}`;
  } catch (e) {
    const count = _cache.projects.filter(p => p.code?.startsWith(prefix)).length;
    return `${prefix}${String(count + 1).padStart(3, '0')}`;
  }
}

async function dbNextDocNo(type) {
  const year = new Date().getFullYear();
  const prefix = type === 'estimate' ? `EST-${year}-` : `INV-${year}-`;
  const field  = type === 'estimate' ? 'estNo' : 'invNo';
  if (!isDbReady()) {
    const count = _cache.projects.filter(p => p[field]?.startsWith(prefix)).length;
    return `${prefix}${String(count + 1).padStart(3, '0')}`;
  }
  try {
    const snap = await _getDocs(_query(_collection(_db,'projects'),
      _where(field,'>=', prefix), _where(field,'<=', prefix+'\uf8ff'),
      _orderBy(field,'desc'), _limit(1)));
    const last = snap.docs[0]?.data()?.[field];
    const lastNum = last ? parseInt(last.replace(prefix,'')) || 0 : 0;
    return `${prefix}${String(lastNum + 1).padStart(3, '0')}`;
  } catch (e) {
    const count = _cache.projects.filter(p => p[field]?.startsWith(prefix)).length;
    return `${prefix}${String(count + 1).padStart(3, '0')}`;
  }
}

/* ── NORMALIZERS ── */

function normalizeProject(d) {
  return {
    id:             d.id,
    code:           d.code           || '',
    name:           d.name           || '',
    clientId:       d.clientId       || d.client_id    || null,
    _client:        null,
    manager:        d.manager        || '',
    status:         d.status         || 'ordered',
    orderDate:      d.orderDate      || d.order_date   || null,
    dueDate:        d.dueDate        || d.due_date     || null,
    desc:           d.desc           || d.description  || '',
    memo:           d.memo           || '',
    estNo:          d.estNo          || d.est_no       || '',
    estDate:        d.estDate        || d.est_date     || null,
    invNo:          d.invNo          || d.inv_no       || '',
    invDate:        d.invDate        || d.inv_date     || null,
    lines:          d.lines          || [],
    costLines:      d.costLines      || d.cost_lines   || [],
    recipientName:  d.recipientName  || d.recipient_name  || '',
    recipientEmail: d.recipientEmail || d.recipient_email || '',
    orderRoute:     d.orderRoute     || d.order_route  || '手動登録',
    orderedAt:      d.orderedAt      || d.ordered_at   || null,
    isNewOrder:     d.isNewOrder     || d.is_new_order || false,
    alreadyOrdered: d.alreadyOrdered || d.already_ordered || false,
    autoRegistered: d.autoRegistered || d.auto_registered || null,
    estOpenedAt:    d.estOpenedAt    || d.est_opened_at || null,
    invOpenedAt:    d.invOpenedAt    || d.inv_opened_at || null,
    contacts:       d.contacts       || [],
    createdAt:      d.createdAt      || null,
    updatedAt:      d.updatedAt      || null,
  };
}

function denormalizeProject(p) {
  return {
    id:             p.id,
    code:           p.code           || null,
    name:           p.name           || '',
    clientId:       p.clientId       || null,
    manager:        p.manager        || null,
    status:         p.status         || 'ordered',
    orderDate:      p.orderDate      || null,
    dueDate:        p.dueDate        || null,
    desc:           p.desc           || null,
    memo:           p.memo           || null,
    estNo:          p.estNo          || null,
    estDate:        p.estDate        || null,
    invNo:          p.invNo          || null,
    invDate:        p.invDate        || null,
    lines:          p.lines          || [],
    costLines:      p.costLines      || [],
    recipientName:  p.recipientName  || null,
    recipientEmail: p.recipientEmail || null,
    orderRoute:     p.orderRoute     || '手動登録',
    orderedAt:      p.orderedAt      || null,
    isNewOrder:     p.isNewOrder     || false,
    alreadyOrdered: p.alreadyOrdered || false,
    autoRegistered: p.autoRegistered || null,
  };
}

function getClientById(id) {
  return _cache.clients.find(c => c.id === id) || null;
}

// リアルタイム受注通知（Firestore onSnapshot）
function subscribeToOrders(onNewOrder) {
  if (!isDbReady()) return;
  _onSnapshot(
    _query(_collection(_db,'projects'), _where('isNewOrder','==', true)),
    (snap) => {
      snap.docChanges().forEach(change => {
        if (change.type === 'modified' || change.type === 'added') {
          const project = normalizeProject({ id: change.doc.id, ...change.doc.data() });
          if (project.isNewOrder && !project.alreadyOrdered) onNewOrder(project);
        }
      });
    }
  );
}

/* ── DOMAINS ── */

async function dbFetchDomains() {
  if (!isDbReady()) return _cache.domains || [];
  try {
    const snap = await _getDocs(_query(_collection(_db,'domains'), _orderBy('domain_name')));
    _cache.domains = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    return _cache.domains;
  } catch (e) { console.error('ドメイン取得エラー:', e); toast('ドメイン取得エラー: '+e.message,'❌','error'); return _cache.domains||[]; }
}

async function dbSaveDomain(domainData) {
  if (!isDbReady()) {
    if (!_cache.domains) _cache.domains = [];
    if (domainData.id && !String(domainData.id).startsWith('local-')) {
      const idx = _cache.domains.findIndex(d => d.id === domainData.id);
      if (idx >= 0) _cache.domains[idx] = domainData;
    } else { _cache.domains.push({ ...domainData, id: 'local-'+Date.now() }); }
    toast('⚠️ オフラインモード', '⚠️'); return domainData;
  }
  try {
    const now = new Date().toISOString();
    if (domainData.id && !String(domainData.id).startsWith('local-')) {
      const { id, ...upd } = domainData; upd.updated_at = now;
      await _updateDoc(_doc(_db,'domains', domainData.id), upd);
      const snap = await _getDoc(_doc(_db,'domains', domainData.id));
      return { id: snap.id, ...snap.data() };
    } else {
      const { id, ...ins } = domainData; ins.created_at = now;
      const ref = await _addDoc(_collection(_db,'domains'), ins);
      const snap = await _getDoc(_doc(_db, 'domains', ref.id));
      return { id: snap.id, ...snap.data() };
    }
  } catch (e) { console.error('ドメイン保存エラー:', e); toast('保存エラー: '+e.message,'❌','error'); throw e; }
}

async function dbDeleteDomain(id) {
  if (!isDbReady()) { _cache.domains = (_cache.domains||[]).filter(d => d.id !== id); return true; }
  try {
    await _deleteDoc(_doc(_db,'domains', id));
    _cache.domains = (_cache.domains||[]).filter(d => d.id !== id);
    return true;
  } catch (e) { console.error('ドメイン削除エラー:', e); toast('削除エラー: '+e.message,'❌','error'); throw e; }
}

/* ── HOSTINGS ── */

async function dbFetchHostings() {
  if (!isDbReady()) return _cache.hostings || [];
  try {
    const snap = await _getDocs(_query(_collection(_db,'hostings'), _orderBy('service_name')));
    _cache.hostings = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    return _cache.hostings;
  } catch (e) { console.error('ホスティング取得エラー:', e); return _cache.hostings||[]; }
}

async function dbSaveHosting(data) {
  if (!isDbReady()) {
    if (!_cache.hostings) _cache.hostings = [];
    if (data.id && !String(data.id).startsWith('local-')) {
      const idx = _cache.hostings.findIndex(h => h.id === data.id);
      if (idx >= 0) _cache.hostings[idx] = data;
    } else { _cache.hostings.push({ ...data, id: 'local-'+Date.now() }); }
    return data;
  }
  try {
    const now = new Date().toISOString();
    if (data.id && !String(data.id).startsWith('local-')) {
      const { id, ...upd } = data; upd.updated_at = now;
      await _updateDoc(_doc(_db,'hostings', data.id), upd);
      const snap = await _getDoc(_doc(_db,'hostings', data.id));
      return { id: snap.id, ...snap.data() };
    } else {
      const { id, ...ins } = data; ins.created_at = now;
      const ref = await _addDoc(_collection(_db,'hostings'), ins);
      const snap = await _getDoc(_doc(_db, 'hostings', ref.id));
      return { id: snap.id, ...snap.data() };
    }
  } catch (e) { console.error('ホスティング保存エラー:', e); throw e; }
}

async function dbDeleteHosting(id) {
  if (!isDbReady()) { _cache.hostings = (_cache.hostings||[]).filter(h => h.id !== id); return true; }
  try {
    await _deleteDoc(_doc(_db,'hostings', id));
    _cache.hostings = (_cache.hostings||[]).filter(h => h.id !== id);
    return true;
  } catch (e) { console.error('ホスティング削除エラー:', e); throw e; }
}

/* ── EXPENSES ── */

async function dbLoadExpenses() {
  if (!isDbReady()) return _cache.expenses || [];
  try {
    const snap = await _getDocs(_query(_collection(_db,'expenses'), _orderBy('expense_date','desc')));
    _cache.expenses = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    return _cache.expenses;
  } catch (e) { console.error('経費取得エラー:', e); return _cache.expenses||[]; }
}

async function dbSaveExpense(data) {
  if (!isDbReady()) {
    if (!_cache.expenses) _cache.expenses = [];
    if (data.id && !String(data.id).startsWith('local-')) {
      const idx = _cache.expenses.findIndex(e => e.id === data.id);
      if (idx >= 0) _cache.expenses[idx] = data;
    } else { _cache.expenses.unshift({ ...data, id: 'local-'+Date.now() }); }
    return data;
  }
  try {
    const now = new Date().toISOString();
    if (data.id && !String(data.id).startsWith('local-')) {
      const { id, ...upd } = data; upd.updated_at = now;
      await _updateDoc(_doc(_db,'expenses', data.id), upd);
      const snap = await _getDoc(_doc(_db,'expenses', data.id));
      return { id: snap.id, ...snap.data() };
    } else {
      const { id, ...ins } = data; ins.created_at = now;
      const ref = await _addDoc(_collection(_db,'expenses'), ins);
      const snap = await _getDoc(_doc(_db, 'expenses', ref.id));
      return { id: snap.id, ...snap.data() };
    }
  } catch (e) { console.error('経費保存エラー:', e); throw e; }
}

async function dbDeleteExpense(id) {
  if (!isDbReady()) { _cache.expenses = (_cache.expenses||[]).filter(e => e.id !== id); return true; }
  try {
    await _deleteDoc(_doc(_db,'expenses', id));
    _cache.expenses = (_cache.expenses||[]).filter(e => e.id !== id);
    return true;
  } catch (e) { console.error('経費削除エラー:', e); throw e; }
}
