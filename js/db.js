/* ============================================================
   db.js — Supabase CRUD 操作レイヤー
   ============================================================

   テーブル構成（Supabaseで作成するSQL）:

   -- 取引先
   CREATE TABLE clients (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     name TEXT NOT NULL,
     contact TEXT,
     email TEXT,
     tel TEXT,
     zip TEXT,
     addr TEXT,
     created_at TIMESTAMPTZ DEFAULT now()
   );

   -- 案件
   CREATE TABLE projects (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     code TEXT UNIQUE NOT NULL,
     name TEXT NOT NULL,
     client_id UUID REFERENCES clients(id),
     manager TEXT,
     status TEXT DEFAULT 'ordered',
     order_date DATE,
     due_date DATE,
     description TEXT,
     memo TEXT,
     est_no TEXT,
     inv_no TEXT,
     lines JSONB DEFAULT '[]',
     order_route TEXT DEFAULT '手動登録',
     ordered_at TIMESTAMPTZ,
     is_new_order BOOLEAN DEFAULT false,
     already_ordered BOOLEAN DEFAULT false,
     created_at TIMESTAMPTZ DEFAULT now(),
     updated_at TIMESTAMPTZ DEFAULT now()
   );

   -- RLS（Row Level Security）は開発中は無効化推奨
   ALTER TABLE clients DISABLE ROW LEVEL SECURITY;
   ALTER TABLE projects DISABLE ROW LEVEL SECURITY;
   ============================================================ */

let _supabase = null;
let _isConnected = false;

// メモリキャッシュ
let _cache = {
  projects: [],
  clients: [],
  domains: [],
  hostings: [],
  lastFetch: null,
};

function initSupabase() {
  const { url, anonKey } = window.CFG.supabase;
  if (!url || !anonKey) {
    console.warn('Supabase設定が未入力です。自社情報設定から設定してください。');
    updateDbStatus(false, '未設定');
    return false;
  }
  try {
    _supabase = supabase.createClient(url, anonKey);
    updateDbStatus(true, '接続済');
    return true;
  } catch (e) {
    console.error('Supabase初期化エラー:', e);
    updateDbStatus(false, 'エラー');
    return false;
  }
}

function updateDbStatus(connected, label) {
  _isConnected = connected;
  const dot = document.getElementById('dbDot');
  const text = document.getElementById('dbStatusText');
  if (dot) dot.style.background = connected ? '#2e8b57' : '#888';
  if (text) text.textContent = label || (connected ? '接続済' : '未接続');
}

function isDbReady() {
  return _supabase && _isConnected;
}

/* ── PROJECTS ── */

async function dbFetchProjects() {
  if (!isDbReady()) return _cache.projects;
  try {
    const { data, error } = await _supabase
      .from('projects')
      .select('*, clients(id, name, email, contact, tel, zip, addr)')
      .order('created_at', { ascending: false });
    if (error) throw error;
    _cache.projects = (data || []).map(normalizeProject);
    _cache.lastFetch = Date.now();
    return _cache.projects;
  } catch (e) {
    console.error('プロジェクト取得エラー:', e);
    toast('データ取得エラー: ' + e.message, '❌', 'error');
    return _cache.projects;
  }
}

async function dbSaveProject(projectData) {
  const payload = denormalizeProject(projectData);
  if (!isDbReady()) {
    // ローカルキャッシュのみ更新
    if (payload.id) {
      const idx = _cache.projects.findIndex(p => p.id === payload.id);
      if (idx >= 0) _cache.projects[idx] = { ..._cache.projects[idx], ...projectData };
    } else {
      const newId = 'local-' + Date.now();
      _cache.projects.unshift({ ...projectData, id: newId });
    }
    toast('⚠️ オフラインモード：DBに保存されていません', '⚠️');
    return { id: payload.id };
  }

  try {
    if (payload.id && !payload.id.startsWith('local-')) {
      // UPDATE
      const { id, created_at, clients, ...updateData } = payload;
      updateData.updated_at = new Date().toISOString();
      const { data, error } = await _supabase
        .from('projects')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return normalizeProject(data);
    } else {
      // INSERT
      const { id, created_at, clients, ...insertData } = payload;
      const { data, error } = await _supabase
        .from('projects')
        .insert(insertData)
        .select()
        .single();
      if (error) throw error;
      return normalizeProject(data);
    }
  } catch (e) {
    console.error('プロジェクト保存エラー:', e);
    toast('保存エラー: ' + e.message, '❌', 'error');
    throw e;
  }
}

async function dbDeleteProject(id) {
  if (!isDbReady()) {
    _cache.projects = _cache.projects.filter(p => p.id !== id);
    return true;
  }
  try {
    const { error } = await _supabase.from('projects').delete().eq('id', id);
    if (error) throw error;
    _cache.projects = _cache.projects.filter(p => p.id !== id);
    return true;
  } catch (e) {
    console.error('削除エラー:', e);
    toast('削除エラー: ' + e.message, '❌', 'error');
    throw e;
  }
}

async function dbUpdateProjectStatus(id, status, extra = {}) {
  const payload = { status, updated_at: new Date().toISOString(), ...extra };
  if (!isDbReady()) {
    const p = _cache.projects.find(x => x.id === id);
    if (p) Object.assign(p, { status, ...extra });
    return true;
  }
  try {
    const { error } = await _supabase.from('projects').update(payload).eq('id', id);
    if (error) throw error;
    const p = _cache.projects.find(x => x.id === id);
    if (p) Object.assign(p, { status, ...extra });
    return true;
  } catch (e) {
    console.error('ステータス更新エラー:', e);
    toast('更新エラー: ' + e.message, '❌', 'error');
    throw e;
  }
}

/* ── CLIENTS ── */

async function dbFetchClients() {
  if (!isDbReady()) return _cache.clients;
  try {
    const { data, error } = await _supabase
      .from('clients')
      .select('*')
      .order('name');
    if (error) throw error;
    _cache.clients = data || [];
    return _cache.clients;
  } catch (e) {
    console.error('取引先取得エラー:', e);
    return _cache.clients;
  }
}

async function dbSaveClient(clientData) {
  if (!isDbReady()) {
    if (clientData.id) {
      const idx = _cache.clients.findIndex(c => c.id === clientData.id);
      if (idx >= 0) _cache.clients[idx] = clientData;
    } else {
      _cache.clients.push({ ...clientData, id: 'local-' + Date.now() });
    }
    toast('⚠️ オフラインモード', '⚠️');
    return clientData;
  }
  try {
    if (clientData.id && !clientData.id.startsWith('local-')) {
      const { id, created_at, ...updateData } = clientData;
      const { data, error } = await _supabase.from('clients').update(updateData).eq('id', id).select().single();
      if (error) throw error;
      return data;
    } else {
      const { id, created_at, ...insertData } = clientData;
      const { data, error } = await _supabase.from('clients').insert(insertData).select().single();
      if (error) throw error;
      return data;
    }
  } catch (e) {
    console.error('取引先保存エラー:', e);
    toast('保存エラー: ' + e.message, '❌', 'error');
    throw e;
  }
}

async function dbDeleteClient(id) {
  if (!isDbReady()) {
    _cache.clients = _cache.clients.filter(c => c.id !== id);
    return true;
  }
  try {
    const { error } = await _supabase.from('clients').delete().eq('id', id);
    if (error) throw error;
    _cache.clients = _cache.clients.filter(c => c.id !== id);
    return true;
  } catch (e) {
    console.error('取引先削除エラー:', e);
    toast('削除エラー: ' + e.message, '❌', 'error');
    throw e;
  }
}

/* ── COUNTER ── */

async function dbNextCode() {
  const year = new Date().getFullYear();
  const prefix = `WEB-${year}-`;
  if (!isDbReady()) {
    const count = _cache.projects.filter(p => p.code && p.code.startsWith(prefix)).length;
    return `${prefix}${String(count + 1).padStart(3, '0')}`;
  }
  try {
    const { data } = await _supabase
      .from('projects')
      .select('code')
      .like('code', `${prefix}%`)
      .order('code', { ascending: false })
      .limit(1);
    const last = data?.[0]?.code;
    const lastNum = last ? parseInt(last.split('-')[2]) : 0;
    return `${prefix}${String(lastNum + 1).padStart(3, '0')}`;
  } catch (e) {
    const count = _cache.projects.filter(p => p.code?.startsWith(prefix)).length;
    return `${prefix}${String(count + 1).padStart(3, '0')}`;
  }
}

async function dbNextDocNo(type) {
  const year = new Date().getFullYear();
  const prefix = type === 'estimate' ? `EST-${year}-` : `INV-${year}-`;
  const field = type === 'estimate' ? 'est_no' : 'inv_no';
  if (!isDbReady()) {
    const count = _cache.projects.filter(p => p[type === 'estimate' ? 'estNo' : 'invNo']?.startsWith(prefix)).length;
    return `${prefix}${String(count + 1).padStart(3, '0')}`;
  }
  try {
    const { data } = await _supabase
      .from('projects')
      .select(field)
      .like(field, `${prefix}%`)
      .order(field, { ascending: false })
      .limit(1);
    const last = data?.[0]?.[field];
    const lastNum = last ? parseInt(last.split('-')[2]) : 0;
    return `${prefix}${String(lastNum + 1).padStart(3, '0')}`;
  } catch (e) {
    const key = type === 'estimate' ? 'estNo' : 'invNo';
    const count = _cache.projects.filter(p => p[key]?.startsWith(prefix)).length;
    return `${prefix}${String(count + 1).padStart(3, '0')}`;
  }
}

/* ── NORMALIZERS（DB列名 ↔ JS camelCase変換） ── */

function normalizeProject(row) {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    clientId: row.client_id,
    // JOIN結果があればキャッシュに同期
    _client: row.clients || null,
    manager: row.manager,
    status: row.status,
    orderDate: row.order_date,
    dueDate: row.due_date,
    desc: row.description,
    memo: row.memo,
    estNo: row.est_no,
    invNo: row.inv_no,
    lines: row.lines || [],
    orderRoute: row.order_route || '手動登録',
    orderedAt: row.ordered_at,
    isNewOrder: row.is_new_order || false,
    alreadyOrdered: row.already_ordered || false,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function denormalizeProject(p) {
  return {
    id: p.id,
    code: p.code,
    name: p.name,
    client_id: p.clientId,
    manager: p.manager || null,
    status: p.status,
    order_date: p.orderDate || null,
    due_date: p.dueDate || null,
    description: p.desc || null,
    memo: p.memo || null,
    est_no: p.estNo || null,
    inv_no: p.invNo || null,
    lines: p.lines || [],
    order_route: p.orderRoute || '手動登録',
    ordered_at: p.orderedAt || null,
    is_new_order: p.isNewOrder || false,
    already_ordered: p.alreadyOrdered || false,
  };
}

function getClientById(id) {
  // プロジェクトのJOIN結果を優先
  const fromProject = _cache.projects.find(p => p.clientId === id)?._client;
  if (fromProject) return fromProject;
  return _cache.clients.find(c => c.id === id) || null;
}

// Supabase Realtime（リアルタイム受注通知）
function subscribeToOrders(onNewOrder) {
  if (!isDbReady()) return;
  _supabase
    .channel('project-orders')
    .on('postgres_changes', {
      event: 'UPDATE',
      schema: 'public',
      table: 'projects',
      filter: 'is_new_order=eq.true',
    }, (payload) => {
      const project = normalizeProject(payload.new);
      onNewOrder(project);
    })
    .subscribe();
}

/* ── DOMAINS ── */

async function dbFetchDomains() {
  if (!isDbReady()) return _cache.domains || [];
  try {
    const { data, error } = await _supabase
      .from('domains')
      .select('*')
      .order('domain_name');
    if (error) throw error;
    _cache.domains = data || [];
    return _cache.domains;
  } catch (e) {
    console.error('ドメイン取得エラー:', e);
    toast('ドメイン取得エラー: ' + e.message, '❌', 'error');
    return _cache.domains || [];
  }
}

async function dbSaveDomain(domainData) {
  if (!isDbReady()) {
    if (!_cache.domains) _cache.domains = [];
    if (domainData.id) {
      const idx = _cache.domains.findIndex(d => d.id === domainData.id);
      if (idx >= 0) _cache.domains[idx] = domainData;
    } else {
      _cache.domains.push({ ...domainData, id: 'local-' + Date.now() });
    }
    toast('⚠️ オフラインモード', '⚠️');
    return domainData;
  }
  try {
    if (domainData.id && !domainData.id.startsWith('local-')) {
      const { id, created_at, ...updateData } = domainData;
      updateData.updated_at = new Date().toISOString();
      const { data, error } = await _supabase.from('domains').update(updateData).eq('id', id).select().single();
      if (error) throw error;
      return data;
    } else {
      const { id, created_at, ...insertData } = domainData;
      const { data, error } = await _supabase.from('domains').insert(insertData).select().single();
      if (error) throw error;
      return data;
    }
  } catch (e) {
    console.error('ドメイン保存エラー:', e);
    toast('保存エラー: ' + e.message, '❌', 'error');
    throw e;
  }
}

async function dbDeleteDomain(id) {
  if (!isDbReady()) {
    _cache.domains = (_cache.domains || []).filter(d => d.id !== id);
    return true;
  }
  try {
    const { error } = await _supabase.from('domains').delete().eq('id', id);
    if (error) throw error;
    _cache.domains = (_cache.domains || []).filter(d => d.id !== id);
    return true;
  } catch (e) {
    console.error('ドメイン削除エラー:', e);
    toast('削除エラー: ' + e.message, '❌', 'error');
    throw e;
  }
}

/* ── HOSTINGS ── */
async function dbFetchHostings() {
  if (!isDbReady()) return _cache.hostings || [];
  try {
    const { data, error } = await _supabase.from('hostings').select('*').order('service_name');
    if (error) throw error;
    _cache.hostings = data || [];
    return _cache.hostings;
  } catch(e) {
    console.error('ホスティング取得エラー:', e);
    return _cache.hostings || [];
  }
}

async function dbSaveHosting(data) {
  if (!isDbReady()) {
    if (!_cache.hostings) _cache.hostings = [];
    if (data.id) {
      const idx = _cache.hostings.findIndex(h => h.id === data.id);
      if (idx >= 0) _cache.hostings[idx] = data;
    } else { _cache.hostings.push({ ...data, id: 'local-' + Date.now() }); }
    return data;
  }
  try {
    if (data.id && !data.id.startsWith('local-')) {
      const { id, created_at, ...upd } = data;
      upd.updated_at = new Date().toISOString();
      const { data: d, error } = await _supabase.from('hostings').update(upd).eq('id', id).select().single();
      if (error) throw error;
      return d;
    } else {
      const { id, created_at, ...ins } = data;
      const { data: d, error } = await _supabase.from('hostings').insert(ins).select().single();
      if (error) throw error;
      return d;
    }
  } catch(e) { console.error('ホスティング保存エラー:', e); throw e; }
}

async function dbDeleteHosting(id) {
  if (!isDbReady()) { _cache.hostings = (_cache.hostings||[]).filter(h => h.id !== id); return true; }
  try {
    const { error } = await _supabase.from('hostings').delete().eq('id', id);
    if (error) throw error;
    _cache.hostings = (_cache.hostings||[]).filter(h => h.id !== id);
    return true;
  } catch(e) { console.error('ホスティング削除エラー:', e); throw e; }
}
