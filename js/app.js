
/* ── DEMO DATA（アーティファクト・オフライン時用） ── */
function loadDemoData() {
  _cache.clients = [
    { id: 'demo-c1', name: '株式会社田中商事', contact: '田中 太郎', email: 'tanaka@example.com', tel: '092-111-1111', zip: '840-0001', addr: '佐賀市栄町1-1' },
    { id: 'demo-c2', name: '山田フーズ株式会社', contact: '山田 花子', email: 'yamada@example.com', tel: '0955-22-2222', zip: '845-0001', addr: '小城市三日月町1-1' },
    { id: 'demo-c3', name: '佐賀観光株式会社', contact: '佐藤 次郎', email: 'sato@example.com', tel: '0952-33-3333', zip: '841-0201', addr: '鳥栖市原町1-1' },
  ];
  _cache.projects = [
    { id: 'demo-p1', code: 'WEB-2025-001', name: '採用サイト制作', clientId: 'demo-c1', _client: _cache.clients[0], manager: '松岡', status: 'wip', orderDate: '2025-01-10', dueDate: '2025-02-28', lines: [{name:'デザイン',qty:1,unit:'式',price:300000},{name:'コーディング',qty:1,unit:'式',price:400000}], estNo: 'EST-2025-001', orderRoute: '手動登録' },
    { id: 'demo-p2', code: 'WEB-2025-002', name: 'ECサイトリニューアル', clientId: 'demo-c2', _client: _cache.clients[1], manager: '松岡', status: 'ordered', orderDate: '2025-02-01', dueDate: '2025-04-30', lines: [{name:'要件定義',qty:1,unit:'式',price:200000},{name:'デザイン',qty:1,unit:'式',price:500000},{name:'実装',qty:1,unit:'式',price:800000}], estNo: 'EST-2025-002', orderRoute: '手動登録' },
    { id: 'demo-p3', code: 'WEB-2025-003', name: 'LP制作（春キャンペーン）', clientId: 'demo-c3', _client: _cache.clients[2], manager: '松岡', status: 'delivered', orderDate: '2025-03-01', dueDate: '2025-03-20', lines: [{name:'LP制作一式',qty:1,unit:'式',price:150000}], invNo: 'INV-2025-001', orderRoute: '手動登録' },
    { id: 'demo-p4', code: 'WEB-2025-004', name: 'コーポレートサイト制作', clientId: 'demo-c1', _client: _cache.clients[0], manager: '松岡', status: 'invoiced', orderDate: '2024-11-01', dueDate: '2025-01-31', lines: [{name:'サイト制作一式',qty:1,unit:'式',price:1200000}], invNo: 'INV-2025-002', orderRoute: '手動登録' },
    { id: 'demo-p5', code: 'WEB-2024-003', name: 'ランディングページ制作', clientId: 'demo-c2', _client: _cache.clients[1], manager: '松岡', status: 'paid', orderDate: '2024-10-01', dueDate: '2024-11-30', lines: [{name:'LP制作',qty:1,unit:'式',price:250000}], invNo: 'INV-2024-003', orderRoute: '手動登録' },
  ];
  _cache.domains = [
    { id: 'demo-d1', domain_name: 'tanaka-shoji.co.jp', client_id: 'demo-c1', renewal_month: new Date().getMonth() + 1, billing_month: new Date().getMonth() + 1, registrar: 'お名前.com', memo: '' },
    { id: 'demo-d2', domain_name: 'yamada-foods.jp', client_id: 'demo-c2', renewal_month: (new Date().getMonth() + 2) > 12 ? 1 : new Date().getMonth() + 2, billing_month: (new Date().getMonth() + 2) > 12 ? 1 : new Date().getMonth() + 2, registrar: 'ムームードメイン', memo: 'SSL更新も同月' },
    { id: 'demo-d3', domain_name: 'saga-kanko.jp', client_id: 'demo-c3', renewal_month: 6, billing_month: 5, registrar: 'さくらインターネット', memo: '' },
    { id: 'demo-d4', domain_name: 'tanaka-recruit.com', client_id: 'demo-c1', renewal_month: 9, billing_month: 8, registrar: 'お名前.com', memo: '採用サイト用' },
  ];
  _cache.hostings = [
    { id: 'demo-h1', service_name: '田中商事 VPS', client_id: 'demo-c1', plan: 'スタンダード', registrar: 'さくらインターネット', renewal_month: new Date().getMonth() + 1, billing_month: new Date().getMonth() + 1, monthly_fee: 2200, annual_fee: 0, memo: '' },
    { id: 'demo-h2', service_name: '山田フーズ 共有サーバー', client_id: 'demo-c2', plan: 'ビジネス', registrar: 'エックスサーバー', renewal_month: (new Date().getMonth() + 2) > 12 ? 1 : new Date().getMonth() + 2, billing_month: (new Date().getMonth() + 2) > 12 ? 1 : new Date().getMonth() + 2, monthly_fee: 1320, annual_fee: 0, memo: '' },
    { id: 'demo-h3', service_name: '佐賀観光 クラウド', client_id: 'demo-c3', plan: 'エコノミー', registrar: 'ロリポップ', renewal_month: 5, billing_month: 4, monthly_fee: 0, annual_fee: 14800, memo: '年払い' },
  ];
}

/* ============================================================
   app.js — メインアプリケーションロジック
   ============================================================ */

/* ── STATE ── */
window._editingProjectId = null;
window._editingClientId = null;
window._currentInvoiceData = null;
let _statusFilter = 'all';

/* ── INIT ── */
async function init() {
  // まずデモデータをセットしてすぐに画面を表示
  loadDemoData();
  applyConfigToForm();
  renderTable();
  updateKPI();
  updateOrderBadge();
  renderClients();
  renderInvoiceList();
  populateYearFilter();
  hideLoading();

  // Supabase接続はバックグラウンドで試みる
  try {
    const { supabaseUrl, supabaseAnonKey } = window.CFG || {};
    if (supabaseUrl && supabaseAnonKey && typeof supabase !== 'undefined') {
      const connected = initSupabase();
      if (connected) {
        await Promise.race([
          Promise.all([dbFetchProjects(), dbFetchClients(), dbFetchDomains()]),
          new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 5000))
        ]);
        renderTable(); updateKPI(); updateOrderBadge(); renderClients();
        subscribeToOrders((p) => {
          toast(`🎉 新受注！「${p.name}」`, '🎉', 'success');
          updateOrderBadge(); refreshData();
        });
      }
    }
  } catch(e) {
    console.warn('DB接続スキップ:', e.message);
    updateDbStatus(false, 'デモ');
  }

  handleUrlOrder();
  return; // 以下は旧コードの重複実行を防ぐ

}

function setLoadingMsg(msg) {
  const el = document.getElementById('loadingMsg');
  if (el) el.textContent = msg;
}

function hideLoading() {
  const loading = document.getElementById('appLoading');
  const shell = document.getElementById('appShell');
  if (loading) loading.style.display = 'none';
  if (shell) shell.style.display = '';
}

async function refreshData() {
  await Promise.all([dbFetchProjects(), dbFetchClients(), dbFetchDomains(), dbFetchHostings()]);
  renderTable();
  updateKPI();
  updateOrderBadge();
  renderClients();
  renderInvoiceList();
  populateYearFilter();
  toast('データを更新しました', '🔄');
}

/* ── VIEW ── */
function showView(view) {
  ['ledger','orders','invoice','clients','domains','hostings','monthly','dashboard','own-servers','own-subscriptions','company'].forEach(v => {
    const el = document.getElementById('view-'+v);
    if (el) el.style.display = v === view ? '' : 'none';
  });
  document.querySelectorAll('.nav-item[data-view]').forEach(el => {
    el.classList.toggle('active', el.dataset.view === view);
  });
  const titles = { ledger:'案件台帳', orders:'受注管理', invoice:'見積・請求書', clients:'取引先', domains:'ドメイン管理', hostings:'ホスティング管理', monthly:'月次請求リスト', dashboard:'売上ダッシュボード', 'own-servers':'サーバー管理', 'own-subscriptions':'サブスク管理', company:'自社情報設定' };
  document.getElementById('pageTitle').textContent = titles[view] || '';
  document.getElementById('newProjectBtn').style.display = view === 'ledger' ? '' : 'none';
  if (view === 'orders') renderOrdersTable();
  if (view === 'company') applyConfigToForm();
  if (view === 'domains') renderDomains();
  if (view === 'hostings') renderHostings();
  if (view === 'monthly') renderMonthly();
  if (view === 'dashboard') renderDashboard();
  if (view === 'own-servers') renderOwnServers();
  if (view === 'own-subscriptions') renderOwnSubscriptions();
}

/* ── KPI ── */
function updateKPI() {
  const projects = _cache.projects;
  const statuses = ['all','preparation','estimate_request','estimating','ordered','wip','delivered','invoiced','paid','unpaid','lost','no_change','lease','lease_delivered','lease_contracted','lease_invoiced','domain_renewal'];
  statuses.forEach(s => {
    const list = s === 'all' ? projects : projects.filter(p => p.status === s);
    const total = list.reduce((sum, p) => sum + calcSubtotal(p.lines), 0);
    const cEl = document.getElementById('kpi-'+s);
    const aEl = document.getElementById('kpi-'+s+'-amt');
    if (cEl) cEl.textContent = list.length;
    if (aEl) aEl.textContent = list.length ? '¥' + total.toLocaleString() : '';
  });
}

/* ── PROJECT TABLE ── */
function renderTable() {
  const search = (document.getElementById('searchInput')?.value || '').toLowerCase();
  const year = document.getElementById('yearFilter')?.value || '';
  const sort = document.getElementById('sortSelect')?.value || 'date-desc';

  let data = _cache.projects.filter(p => {
    const client = getClientById(p.clientId);
    const matchSearch = !search ||
      (p.name || '').toLowerCase().includes(search) ||
      (client?.name || '').toLowerCase().includes(search) ||
      (p.code || '').toLowerCase().includes(search);
    const matchStatus = _statusFilter === 'all' || p.status === _statusFilter;
    const matchYear = !year || (p.orderDate || '').startsWith(year);
    return matchSearch && matchStatus && matchYear;
  });

  data = [...data].sort((a, b) => {
    if (sort === 'date-desc') return (b.orderDate || '') > (a.orderDate || '') ? 1 : -1;
    if (sort === 'date-asc') return (a.orderDate || '') > (b.orderDate || '') ? 1 : -1;
    if (sort === 'amount-desc') return calcSubtotal(b.lines) - calcSubtotal(a.lines);
    if (sort === 'amount-asc') return calcSubtotal(a.lines) - calcSubtotal(b.lines);
    return 0;
  });

  const tbody = document.getElementById('projectTableBody');
  if (!tbody) return;

  if (data.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7"><div class="empty-state"><div class="icon">📭</div><p>該当する案件がありません</p></div></td></tr>`;
    return;
  }

  tbody.innerHTML = data.map(p => {
    const client = getClientById(p.clientId);
    const sub = calcSubtotal(p.lines);
    const due = p.dueDate && isOverdue(p.dueDate, p.status);
    return `<tr onclick="openEditProject('${p.id}')">
      <td><span class="project-code">${p.code || '—'}</span></td>
      <td>
        <div class="project-name">${p.name}</div>
        <div class="project-client">${client?.name || '—'}</div>
      </td>
      <td>${statusBadge(p.status)}</td>
      <td style="font-size:13px">${fmtDate(p.orderDate)}</td>
      <td style="font-size:11px">${openedBadge(p)}</td>
      <td style="font-size:13px;${due ? 'color:var(--accent);font-weight:600' : ''}">${fmtDate(p.dueDate)}${due ? ' ⚠' : ''}</td>
      <td class="amount">¥${sub.toLocaleString()}</td>
      <td>
        <div class="row-actions">
          <button class="btn btn-ghost btn-sm" onclick="event.stopPropagation();openInvoicePreviewById('${p.id}','estimate')">見積</button>
          <button class="btn btn-ghost btn-sm" onclick="event.stopPropagation();openInvoicePreviewById('${p.id}','invoice')">請求</button>
        </div>
      </td>
    </tr>`;
  }).join('');
}

function isOverdue(dateStr, status) {
  if (['preparation','invoiced','paid','delivered','lease_contracted','lease_invoiced','lost','domain_renewal'].includes(status)) return false;
  return new Date(dateStr) < new Date();
}

function statusBadge(s) {
  const map = {
    preparation:'案件準備',
    estimate_request:'見積依頼',  estimating:'見積提示中',
    ordered:'受注',               wip:'作業中',
    delivered:'納品済',           invoiced:'請求済',
    paid:'入金済',                unpaid:'未入金',
    lost:'失注',                  no_change:'No変更',
    lease:'リース',               lease_delivered:'リース納品済',
    lease_contracted:'リース契約済', lease_invoiced:'リース請求済',
    domain_renewal:'ドメイン更新',
  };
  return `<span class="badge badge-${s}">${map[s] || s}</span>`;
}

function openedBadge(p) {
  let b = '';
  if (p.estOpenedAt) b += '<span style="background:#e3f2fd;color:#1565c0;padding:1px 5px;border-radius:3px;font-size:10px;margin-right:2px" title="' + fmtDatetime(p.estOpenedAt) + '">見積開封✓</span>';
  if (p.invOpenedAt) b += '<span style="background:#f3e5f5;color:#6a1b9a;padding:1px 5px;border-radius:3px;font-size:10px" title="' + fmtDatetime(p.invOpenedAt) + '">請求開封✓</span>';
  return b || '<span style="color:#ccc;font-size:10px">—</span>';
}

function filterByStatus(status) {
  _statusFilter = status;
  document.querySelectorAll('.kpi-card').forEach(el => el.classList.remove('active'));
  document.querySelector(`.kpi-card[data-status="${status}"]`)?.classList.add('active');
  renderTable();
}

function populateYearFilter() {
  const years = [...new Set(_cache.projects
    .map(p => p.orderDate ? p.orderDate.split('-')[0] : null)
    .filter(Boolean))].sort().reverse();
  const sel = document.getElementById('yearFilter');
  if (!sel) return;
  sel.innerHTML = '<option value="">全年度</option>' + years.map(y => `<option value="${y}">${y}年度</option>`).join('');
}

/* ── ORDERS VIEW ── */
function renderOrdersTable() {
  const search = (document.getElementById('orderSearch')?.value || '').toLowerCase();
  const sf = document.getElementById('orderStatusFilter')?.value || '';
  const now = new Date();
  const thisMonth = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;

  // サマリー
  ['ordered','wip','lease','lease_delivered','lease_contracted'].forEach(s => {
    const list = _cache.projects.filter(p => p.status === s);
    const el = document.getElementById(`ord-count-${s}`);
    const ae = document.getElementById(`ord-amt-${s}`);
    if (el) el.textContent = list.length;
    if (ae) ae.textContent = list.length ? '¥' + list.reduce((s, p) => s + calcSubtotal(p.lines), 0).toLocaleString() : '';
  });
  const mList = _cache.projects.filter(p => (p.orderedAt || p.orderDate || '').startsWith(thisMonth));
  const mc = document.getElementById('ord-count-month');
  const ma = document.getElementById('ord-amt-month');
  if (mc) mc.textContent = mList.length;
  if (ma) ma.textContent = mList.length ? '¥' + mList.reduce((s, p) => s + calcSubtotal(p.lines), 0).toLocaleString() : '';

  const list = _cache.projects.filter(p => {
    const client = getClientById(p.clientId);
    return ['ordered','wip','lease','lease_delivered','lease_contracted'].includes(p.status) &&
      (!sf || p.status === sf) &&
      (!search || (p.name||'').toLowerCase().includes(search) || (client?.name||'').toLowerCase().includes(search));
  });

  const tbody = document.getElementById('ordersTableBody');
  if (!tbody) return;

  if (list.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7"><div class="empty-state"><div class="icon">📭</div><p>受注・作業中の案件がありません</p></div></td></tr>`;
    return;
  }

  tbody.innerHTML = list.map(p => {
    const client = getClientById(p.clientId);
    const sub = calcSubtotal(p.lines);
    const isNew = p.isNewOrder;
    const routeColor = p.orderRoute === '見積書承認' ? 'color:var(--status-ordered);font-weight:600' : 'color:var(--muted)';
    return `<tr onclick="openEditProject('${p.id}')" style="${isNew ? 'background:rgba(46,139,87,0.04)' : ''}">
      <td>
        <span class="project-code">${p.code || '—'}</span>
        ${isNew ? '<span class="badge-new" style="margin-left:6px">NEW</span>' : ''}
      </td>
      <td><div class="project-name">${p.name}</div><div class="project-client">${client?.name || '—'}</div></td>
      <td>${statusBadge(p.status)}</td>
      <td style="font-size:12px;color:var(--muted)">${p.orderedAt ? fmtDatetime(p.orderedAt) : fmtDate(p.orderDate)}</td>
      <td><span style="font-size:12px;${routeColor}">${p.orderRoute || '手動登録'}</span></td>
      <td class="amount">¥${sub.toLocaleString()}</td>
      <td onclick="event.stopPropagation()">
        <div style="display:flex;gap:4px">
          ${p.status === 'ordered' ? `<button class="btn btn-sm btn-green" onclick="changeProjectStatus('${p.id}','wip')">作業開始</button>` : ''}
          ${p.status === 'wip' ? `<button class="btn btn-sm" style="background:var(--status-delivered);color:#fff" onclick="changeProjectStatus('${p.id}','delivered')">納品済へ</button>` : ''}
        </div>
      </td>
    </tr>`;
  }).join('');

  updateOrderBadge();
}

async function changeProjectStatus(id, newStatus) {
  const p = _cache.projects.find(x => x.id === id);
  if (!p) return;
  try {
    await dbUpdateProjectStatus(id, newStatus, { isNewOrder: false });
    const labels = {
    estimate_request:'見積依頼', estimating:'見積提示中',
    ordered:'受注', wip:'作業中', delivered:'納品済',
    invoiced:'請求済', paid:'入金済', unpaid:'未入金',
    lost:'失注', no_change:'No変更', lease:'リース',
    lease_delivered:'リース納品済', lease_contracted:'リース契約済',
    lease_invoiced:'リース請求済', domain_renewal:'ドメイン更新',
  };
    toast(`「${p.name}」を${labels[newStatus]}に変更`, '✅', 'success');
    renderOrdersTable();
    renderTable();
    updateKPI();
  } catch(e) {}
}

function updateOrderBadge() {
  const count = _cache.projects.filter(p => p.isNewOrder).length;
  const badge = document.getElementById('orderBadge');
  if (!badge) return;
  badge.style.display = count > 0 ? 'inline-block' : 'none';
  badge.textContent = count;
}

/* ── INVOICE LIST ── */
function renderInvoiceList() {
  const search = (document.getElementById('invSearch')?.value || '').toLowerCase();
  const tbody = document.getElementById('invoiceListBody');
  if (!tbody) return;

  const list = _cache.projects.filter(p =>
    !search ||
    (p.name||'').toLowerCase().includes(search) ||
    (p.estNo||'').toLowerCase().includes(search) ||
    (p.invNo||'').toLowerCase().includes(search) ||
    (getClientById(p.clientId)?.name||'').toLowerCase().includes(search)
  );

  tbody.innerHTML = list.map(p => {
    const client = getClientById(p.clientId);
    const sub = calcSubtotal(p.lines);
    const grand = sub + Math.round(sub * (Number(window.CFG.company.taxRate) || 10) / 100);
    return `<tr>
      <td>
        <div class="font-mono" style="font-size:12px">${p.estNo || '—'}</div>
        <div class="font-mono text-muted" style="font-size:11px">${p.invNo || '—'}</div>
      </td>
      <td><div style="font-weight:500">${p.name}</div><div class="text-muted" style="font-size:12px">${client?.name || '—'}</div></td>
      <td>${fmtDate(p.orderDate)}</td>
      <td class="amount">¥${grand.toLocaleString()}</td>
      <td>${statusBadge(p.status)}</td>
      <td>
        <div style="display:flex;gap:4px">
          <button class="btn btn-ghost btn-sm" onclick="openInvoicePreviewById('${p.id}','estimate')">見積</button>
          <button class="btn btn-ghost btn-sm" onclick="openInvoicePreviewById('${p.id}','invoice')">請求</button>
        </div>
      </td>
    </tr>`;
  }).join('');
}

/* ── PROJECT MODAL ── */
async function openNewProject() {
  window._editingProjectId = null;
  document.getElementById('projectModalTitle').textContent = '新規案件登録';
  document.getElementById('deleteProjectBtn').style.display = 'none';

  const today = new Date().toISOString().split('T')[0];
  const [code, estNo, invNo] = await Promise.all([
    dbNextCode(),
    dbNextDocNo('estimate'),
    dbNextDocNo('invoice'),
  ]);

  document.getElementById('p-code').value = code;
  document.getElementById('p-status').value = 'estimate_request';
  document.getElementById('p-name').value = '';
  document.getElementById('p-manager').value = '';
  document.getElementById('p-order-date').value = '';
  document.getElementById('p-due-date').value = '';
  document.getElementById('p-desc').value = '';
  document.getElementById('p-memo').value = '';
  document.getElementById('p-est-no').value = estNo;
  document.getElementById('p-inv-no').value = invNo;

  populateClientSelect();
  clearLineItems();
  addLineItem();
  updateStatusFlow('estimate_request');
  switchTab('project','info');
  openModal('projectModal');
}

function openEditProject(id) {
  const p = _cache.projects.find(x => x.id === id);
  if (!p) return;
  window._editingProjectId = id;

  document.getElementById('projectModalTitle').textContent = '案件詳細';
  document.getElementById('deleteProjectBtn').style.display = 'inline-flex';
  document.getElementById('p-code').value = p.code || '';
  document.getElementById('p-status').value = p.status;
  document.getElementById('p-name').value = p.name;
  document.getElementById('p-manager').value = p.manager || '';
  document.getElementById('p-order-date').value = p.orderDate || '';
  document.getElementById('p-due-date').value = p.dueDate || '';
  document.getElementById('p-desc').value = p.desc || '';
  document.getElementById('p-memo').value = p.memo || '';
  document.getElementById('p-est-no').value = p.estNo || '';
  document.getElementById('p-inv-no').value = p.invNo || '';

  populateClientSelect(p.clientId);
  clearLineItems();
  (p.lines || []).forEach(l => addLineItem(l));
  calcTotals();
  updateStatusFlow(p.status);
  switchTab('project','info');
  openModal('projectModal');
}

async function saveProject() {
  const name = document.getElementById('p-name')?.value?.trim();
  if (!name) { toast('案件名を入力してください', '⚠️'); return; }

  const btn = document.getElementById('saveProjectBtn');
  if (btn) { btn.disabled = true; btn.innerHTML = '<span class="spinner"></span> 保存中...'; }

  try {
    const data = {
      id: window._editingProjectId,
      code: document.getElementById('p-code')?.value,
      name,
      status: document.getElementById('p-status')?.value,
      clientId: document.getElementById('p-client')?.value,
      manager: document.getElementById('p-manager')?.value,
      orderDate: document.getElementById('p-order-date')?.value || null,
      dueDate: document.getElementById('p-due-date')?.value || null,
      desc: document.getElementById('p-desc')?.value,
      memo: document.getElementById('p-memo')?.value,
      estNo: document.getElementById('p-est-no')?.value,
      invNo: document.getElementById('p-inv-no')?.value,
      lines: collectLines(),
      orderRoute: window._editingProjectId ?
        (_cache.projects.find(p => p.id === window._editingProjectId)?.orderRoute || '手動登録') :
        '手動登録',
    };

    const saved = await dbSaveProject(data);

    // キャッシュ更新
    if (window._editingProjectId) {
      const idx = _cache.projects.findIndex(p => p.id === window._editingProjectId);
      if (idx >= 0) _cache.projects[idx] = { ..._cache.projects[idx], ...data, id: saved.id || window._editingProjectId };
    } else {
      _cache.projects.unshift({ ...data, id: saved.id });
    }

    closeModal('projectModal');
    renderTable();
    updateKPI();
    renderInvoiceList();
    populateYearFilter();
    toast(window._editingProjectId ? '案件を更新しました' : '案件を登録しました', '✅', 'success');
  } catch (e) {
    // エラーはdbSaveProject内でtoast済み
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = '保存する'; }
  }
}

async function deleteProject() {
  const id = window._editingProjectId;
  if (!id) return;
  const p = _cache.projects.find(x => x.id === id);
  if (!confirm(`「${p?.name}」を削除しますか？この操作は取り消せません。`)) return;
  try {
    await dbDeleteProject(id);
    closeModal('projectModal');
    renderTable();
    updateKPI();
    renderInvoiceList();
    toast('案件を削除しました', '🗑');
  } catch (e) {}
}

function setStatus(s) {
  const prev = document.getElementById('p-status').value;
  document.getElementById('p-status').value = s;
  updateStatusFlow(s);

  // 受注ステータスに変わったとき、受注日が空なら今日をセット
  const orderedStatuses = ['ordered','wip','delivered','invoiced','paid','lease','lease_delivered','lease_contracted','lease_invoiced'];
  const orderDateEl = document.getElementById('p-order-date');
  if (orderedStatuses.includes(s) && !orderedStatuses.includes(prev) && orderDateEl && !orderDateEl.value) {
    orderDateEl.value = new Date().toISOString().split('T')[0];
    orderDateEl.style.background = '#fff8e1';
    setTimeout(() => { orderDateEl.style.background = ''; }, 1500);
  }
}

function updateStatusFlow(s) {
  document.querySelectorAll('.status-step').forEach(el => {
    el.classList.toggle('current', el.dataset.s === s);
  });
}

/* ── LINE ITEMS ── */
function clearLineItems() { document.getElementById('lineItems').innerHTML = ''; }

function addLineItem(line = {}) {
  const tbody = document.getElementById('lineItems');
  const tr = document.createElement('tr');
  tr.innerHTML = `
    <td><input type="text" value="${line.name||''}" placeholder="品目名" oninput="calcTotals()"></td>
    <td><input type="number" value="${line.qty||1}" min="0" step="0.5" style="text-align:center" oninput="calcTotals()"></td>
    <td><input type="number" value="${line.price||0}" min="0" style="text-align:right" oninput="calcTotals()"></td>
    <td class="line-total text-right"></td>
    <td><button class="delete-line" onclick="this.closest('tr').remove();calcTotals()">✕</button></td>`;
  tbody.appendChild(tr);
  calcTotals();
}

function collectLines() {
  return Array.from(document.querySelectorAll('#lineItems tr')).map(tr => {
    const inputs = tr.querySelectorAll('input');
    return { name: inputs[0]?.value || '', qty: Number(inputs[1]?.value) || 0, price: Number(inputs[2]?.value) || 0 };
  }).filter(l => l.name || l.price > 0);
}

function calcTotals() {
  let subtotal = 0;
  document.querySelectorAll('#lineItems tr').forEach(tr => {
    const inputs = tr.querySelectorAll('input');
    const qty = Number(inputs[1]?.value) || 0;
    const price = Number(inputs[2]?.value) || 0;
    const total = qty * price;
    subtotal += total;
    const td = tr.querySelector('.line-total');
    if (td) td.textContent = '¥' + total.toLocaleString();
  });
  const taxRate = Number(window.CFG.company.taxRate) || 10;
  const tax = Math.round(subtotal * taxRate / 100);
  const grand = subtotal + tax;
  const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  set('sub-subtotal', '¥' + subtotal.toLocaleString());
  set('sub-tax', '¥' + tax.toLocaleString());
  set('sub-total', '¥' + grand.toLocaleString());
  const taxLabel = document.getElementById('sub-tax-label');
  if (taxLabel) taxLabel.textContent = `消費税（${taxRate}%）`;
}

/* ── CLIENT SELECT ── */
function populateClientSelect(selectedId = '') {
  const sel = document.getElementById('p-client');
  if (!sel) return;
  sel.innerHTML = _cache.clients.length
    ? _cache.clients.map(c => `<option value="${c.id}" ${c.id === selectedId ? 'selected' : ''}>${c.name}</option>`).join('')
    : '<option value="">取引先を先に登録してください</option>';
}

/* ── CLIENTS ── */
function renderClients() {
  const search = (document.getElementById('clientSearch')?.value || '').toLowerCase();
  const tbody = document.getElementById('clientTableBody');
  if (!tbody) return;
  const list = _cache.clients.filter(c => !search || c.name.toLowerCase().includes(search));
  tbody.innerHTML = list.map(c => {
    const cnt = _cache.projects.filter(p => p.clientId === c.id).length;
    return `<tr onclick="openEditClient('${c.id}')">
      <td style="font-weight:500">${c.name}</td>
      <td>${c.contact||'—'}</td>
      <td><a href="mailto:${c.email}" style="color:var(--accent2)" onclick="event.stopPropagation()">${c.email||'—'}</a></td>
      <td>${c.tel||'—'}</td>
      <td class="font-mono">${cnt}</td>
      <td><div class="row-actions"><button class="btn btn-ghost btn-sm" onclick="event.stopPropagation();openEditClient('${c.id}')">編集</button></div></td>
    </tr>`;
  }).join('');
}

function openClientModal() {
  window._editingClientId = null;
  document.getElementById('clientModalTitle').textContent = '取引先登録';
  document.getElementById('deleteClientBtn').style.display = 'none';
  ['cl-name','cl-contact','cl-email','cl-tel','cl-zip','cl-addr'].forEach(id => {
    const el = document.getElementById(id); if (el) el.value = '';
  });
  openModal('clientModal');
}

function openEditClient(id) {
  const c = _cache.clients.find(x => x.id === id);
  if (!c) return;
  window._editingClientId = id;
  document.getElementById('clientModalTitle').textContent = '取引先編集';
  document.getElementById('deleteClientBtn').style.display = 'inline-flex';
  document.getElementById('cl-name').value = c.name || '';
  document.getElementById('cl-contact').value = c.contact || '';
  document.getElementById('cl-email').value = c.email || '';
  document.getElementById('cl-tel').value = c.tel || '';
  document.getElementById('cl-zip').value = c.zip || '';
  document.getElementById('cl-addr').value = c.addr || '';
  openModal('clientModal');
}

async function saveClient() {
  const name = document.getElementById('cl-name')?.value?.trim();
  if (!name) { toast('会社名を入力してください', '⚠️'); return; }
  const clientData = {
    id: window._editingClientId,
    name,
    contact: document.getElementById('cl-contact')?.value || null,
    email: document.getElementById('cl-email')?.value || null,
    tel: document.getElementById('cl-tel')?.value || null,
    zip: document.getElementById('cl-zip')?.value || null,
    addr: document.getElementById('cl-addr')?.value || null,
  };
  try {
    const saved = await dbSaveClient(clientData);
    if (window._editingClientId) {
      const idx = _cache.clients.findIndex(c => c.id === window._editingClientId);
      if (idx >= 0) _cache.clients[idx] = { ..._cache.clients[idx], ...clientData };
    } else {
      _cache.clients.push({ ...clientData, id: saved.id });
    }
    closeModal('clientModal');
    renderClients();
    populateClientSelect();
    toast(window._editingClientId ? '取引先を更新しました' : '取引先を登録しました', '✅', 'success');
  } catch (e) {}
}

async function deleteClient() {
  const id = window._editingClientId;
  if (!id) return;
  const c = _cache.clients.find(x => x.id === id);
  if (!confirm(`「${c?.name}」を削除しますか？`)) return;
  try {
    await dbDeleteClient(id);
    closeModal('clientModal');
    renderClients();
    toast('取引先を削除しました', '🗑');
  } catch (e) {}
}

/* ── MODAL / TAB HELPERS ── */
function openModal(id) { document.getElementById(id)?.classList.add('open'); }
function closeModal(id) { document.getElementById(id)?.classList.remove('open'); }

document.querySelectorAll('.overlay').forEach(el => {
  el.addEventListener('click', (e) => { if (e.target === el) el.classList.remove('open'); });
});

function switchTab(prefix, tab) {
  const tabs = { project: ['info','estimate','memo'] };
  const list = tabs[prefix] || [];
  document.querySelectorAll(`#${prefix}Modal .tab`).forEach((el, i) => {
    el.classList.toggle('active', list[i] === tab);
  });
  document.querySelectorAll(`#${prefix}Modal .tab-panel`).forEach(el => {
    el.classList.toggle('active', el.id === `${prefix}-tab-${tab}`);
  });
}

/* ── TOAST ── */
function toast(msg, icon = '✓', type = '') {
  const el = document.createElement('div');
  el.className = `toast${type ? ' ' + type : ''}`;
  el.innerHTML = `<span>${icon}</span><span>${msg}</span>`;
  document.getElementById('toastContainer').appendChild(el);
  setTimeout(() => el.remove(), 3500);
}

/* ── START ── */
init();

/* ============================================================
   DOMAIN MANAGEMENT
   ============================================================ */

let _editingDomainId = null;

/* ── レンダリング ── */
function renderDomains() {
  const search = (document.getElementById('domainSearch')?.value || '').toLowerCase();
  const monthFilter = document.getElementById('domainMonthFilter')?.value;
  const tbody = document.getElementById('domainTableBody');
  if (!tbody) return;

  let domains = _cache.domains || [];

  // フィルタ
  if (search) {
    domains = domains.filter(d => {
      const clientName = getClientById(d.client_id)?.name || '';
      return d.domain_name.toLowerCase().includes(search) || clientName.toLowerCase().includes(search);
    });
  }
  if (monthFilter) {
    domains = domains.filter(d => String(d.renewal_month) === monthFilter);
  }

  // 今月・来月の更新アラート
  const now = new Date();
  const thisMonth = now.getMonth() + 1;
  const nextMonth = thisMonth === 12 ? 1 : thisMonth + 1;
  const alertDomains = (_cache.domains || []).filter(d =>
    d.renewal_month === thisMonth || d.renewal_month === nextMonth
  );
  const alertEl = document.getElementById('domainAlert');
  if (alertEl) {
    if (alertDomains.length > 0) {
      const names = alertDomains.map(d => `<strong>${d.domain_name}</strong>（${d.renewal_month}月更新）`).join('、');
      alertEl.innerHTML = `⚠️ 更新が近いドメイン: ${names}`;
      alertEl.style.display = '';
    } else {
      alertEl.style.display = 'none';
    }
  }

  if (domains.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;color:var(--muted);padding:32px">ドメインが登録されていません</td></tr>`;
    return;
  }

  tbody.innerHTML = domains.map(d => {
    const client = getClientById(d.client_id);
    const clientName = client ? client.name : '<span style="color:var(--muted)">未設定</span>';
    const renewal = d.renewal_month ? `${d.renewal_month}月` : '<span style="color:var(--muted)">-</span>';
    const billing = d.billing_month ? `${d.billing_month}月` : '<span style="color:var(--muted)">-</span>';

    // 今月・来月は強調
    const isUrgent = d.renewal_month === thisMonth;
    const isSoon   = d.renewal_month === nextMonth;
    const badge = isUrgent
      ? '<span style="background:#ff5252;color:#fff;padding:2px 6px;border-radius:4px;font-size:10px;margin-left:6px">今月</span>'
      : isSoon
      ? '<span style="background:#ff9800;color:#fff;padding:2px 6px;border-radius:4px;font-size:10px;margin-left:6px">来月</span>'
      : '';

    return `<tr onclick="openDomainModal('${d.id}')" style="cursor:pointer">
      <td><strong>${d.domain_name}</strong>${badge}</td>
      <td>${clientName}</td>
      <td>${d.registrar || '<span style="color:var(--muted)">-</span>'}</td>
      <td style="text-align:center">${renewal}</td>
      <td style="text-align:center">${billing}</td>
      <td style="color:var(--muted);font-size:12px">${d.memo || ''}</td>
      <td><button class="btn btn-ghost btn-sm" onclick="event.stopPropagation();openDomainModal('${d.id}')">編集</button></td>
    </tr>`;
  }).join('');
}

/* ── モーダル開閉 ── */
function openDomainModal(id) {
  _editingDomainId = id || null;
  const domain = id ? (_cache.domains || []).find(d => d.id === id) : null;

  document.getElementById('domainModalTitle').textContent = domain ? 'ドメイン編集' : 'ドメイン追加';
  document.getElementById('deleteDomainBtn').style.display = domain ? '' : 'none';

  // クライアントセレクト構築
  const sel = document.getElementById('dm-client');
  sel.innerHTML = '<option value="">（未設定）</option>' +
    (_cache.clients || []).map(c =>
      `<option value="${c.id}" ${domain?.client_id === c.id ? 'selected' : ''}>${c.name}</option>`
    ).join('');

  // フォームにデータ設定
  document.getElementById('dm-name').value      = domain?.domain_name   || '';
  document.getElementById('dm-renewal').value   = domain?.renewal_month || '';
  document.getElementById('dm-billing').value   = domain?.billing_month || '';
  document.getElementById('dm-registrar').value = domain?.registrar     || '';
  document.getElementById('dm-memo').value      = domain?.memo          || '';

  openModal('domainModal');
}

/* ── 保存 ── */
async function saveDomain() {
  const name = document.getElementById('dm-name').value.trim();
  if (!name) { toast('ドメイン名を入力してください', '⚠️'); return; }

  const data = {
    domain_name:   name,
    client_id:     document.getElementById('dm-client').value || null,
    renewal_month: Number(document.getElementById('dm-renewal').value) || null,
    billing_month: Number(document.getElementById('dm-billing').value) || null,
    registrar:     document.getElementById('dm-registrar').value.trim() || null,
    memo:          document.getElementById('dm-memo').value.trim() || null,
  };

  if (_editingDomainId) data.id = _editingDomainId;

  try {
    const saved = await dbSaveDomain(data);
    // キャッシュ更新
    if (!_cache.domains) _cache.domains = [];
    if (_editingDomainId) {
      const idx = _cache.domains.findIndex(d => d.id === _editingDomainId);
      if (idx >= 0) _cache.domains[idx] = { ..._cache.domains[idx], ...saved };
    } else {
      _cache.domains.unshift(saved);
    }
    closeModal('domainModal');
    renderDomains();
    toast(_editingDomainId ? 'ドメインを更新しました' : 'ドメインを追加しました', '✅', 'success');
  } catch(e) {
    toast('保存エラー: ' + e.message, '❌', 'error');
  }
}

/* ── 削除 ── */
async function deleteDomain() {
  if (!_editingDomainId) return;
  const domain = (_cache.domains || []).find(d => d.id === _editingDomainId);
  if (!confirm(`「${domain?.domain_name}」を削除しますか？`)) return;
  try {
    await dbDeleteDomain(_editingDomainId);
    _cache.domains = (_cache.domains || []).filter(d => d.id !== _editingDomainId);
    closeModal('domainModal');
    renderDomains();
    toast('削除しました', '🗑');
  } catch(e) {
    toast('削除エラー: ' + e.message, '❌', 'error');
  }
}

/* ============================================================
   HOSTING MANAGEMENT
   ============================================================ */
let _editingHostingId = null;

function renderHostings() {
  const search = (document.getElementById('hostingSearch')?.value || '').toLowerCase();
  const monthFilter = document.getElementById('hostingMonthFilter')?.value;
  const tbody = document.getElementById('hostingTableBody');
  if (!tbody) return;

  let hostings = _cache.hostings || [];
  if (search) hostings = hostings.filter(h => {
    const cn = getClientById(h.client_id)?.name || '';
    return h.service_name.toLowerCase().includes(search) || cn.toLowerCase().includes(search);
  });
  if (monthFilter) hostings = hostings.filter(h => String(h.renewal_month) === monthFilter);

  const now = new Date();
  const thisMonth = now.getMonth() + 1;
  const nextMonth = thisMonth === 12 ? 1 : thisMonth + 1;
  const alertItems = (_cache.hostings || []).filter(h => h.renewal_month === thisMonth || h.renewal_month === nextMonth);
  const alertEl = document.getElementById('hostingAlert');
  if (alertEl) {
    if (alertItems.length > 0) {
      alertEl.innerHTML = `⚠️ 更新が近いサービス: ${alertItems.map(h => `<strong>${h.service_name}</strong>（${h.renewal_month}月）`).join('、')}`;
      alertEl.style.display = '';
    } else { alertEl.style.display = 'none'; }
  }

  if (hostings.length === 0) {
    tbody.innerHTML = `<tr><td colspan="9" style="text-align:center;color:var(--muted);padding:32px">ホスティングが登録されていません</td></tr>`;
    return;
  }
  tbody.innerHTML = hostings.map(h => {
    const client = getClientById(h.client_id);
    const isUrgent = h.renewal_month === thisMonth;
    const isSoon   = h.renewal_month === nextMonth;
    const badge = isUrgent ? '<span style="background:#ff5252;color:#fff;padding:2px 6px;border-radius:4px;font-size:10px;margin-left:6px">今月</span>'
      : isSoon ? '<span style="background:#ff9800;color:#fff;padding:2px 6px;border-radius:4px;font-size:10px;margin-left:6px">来月</span>' : '';
    return `<tr onclick="openHostingModal('${h.id}')" style="cursor:pointer">
      <td><strong>${h.service_name}</strong>${badge}</td>
      <td>${client?.name || '<span style="color:var(--muted)">未設定</span>'}</td>
      <td>${h.plan || '<span style="color:var(--muted)">-</span>'}</td>
      <td>${h.registrar || '<span style="color:var(--muted)">-</span>'}</td>
      <td style="text-align:center">${h.renewal_month ? h.renewal_month+'月' : '-'}</td>
      <td style="text-align:center">${h.billing_month ? h.billing_month+'月' : '-'}</td>
      <td style="text-align:right">${h.monthly_fee ? '¥'+h.monthly_fee.toLocaleString() : '-'}</td>
      <td style="text-align:right">${h.annual_fee ? '¥'+h.annual_fee.toLocaleString() : '-'}</td>
      <td><button class="btn btn-ghost btn-sm" onclick="event.stopPropagation();openHostingModal('${h.id}')">編集</button></td>
    </tr>`;
  }).join('');
}

function openHostingModal(id) {
  _editingHostingId = id || null;
  const h = id ? (_cache.hostings || []).find(x => x.id === id) : null;
  document.getElementById('hostingModalTitle').textContent = h ? 'ホスティング編集' : 'ホスティング追加';
  document.getElementById('deleteHostingBtn').style.display = h ? '' : 'none';
  const sel = document.getElementById('ht-client');
  sel.innerHTML = '<option value="">（未設定）</option>' +
    (_cache.clients || []).map(c => `<option value="${c.id}" ${h?.client_id === c.id ? 'selected' : ''}>${c.name}</option>`).join('');
  document.getElementById('ht-name').value      = h?.service_name   || '';
  document.getElementById('ht-plan').value      = h?.plan           || '';
  document.getElementById('ht-registrar').value = h?.registrar      || '';
  document.getElementById('ht-renewal').value   = h?.renewal_month  || '';
  document.getElementById('ht-billing').value   = h?.billing_month  || '';
  document.getElementById('ht-monthly').value   = h?.monthly_fee    || '';
  document.getElementById('ht-annual').value    = h?.annual_fee     || '';
  document.getElementById('ht-memo').value      = h?.memo           || '';
  openModal('hostingModal');
}

async function saveHosting() {
  const name = document.getElementById('ht-name').value.trim();
  if (!name) { toast('サービス名を入力してください', '⚠️'); return; }
  const data = {
    service_name:  name,
    client_id:     document.getElementById('ht-client').value || null,
    plan:          document.getElementById('ht-plan').value.trim() || null,
    registrar:     document.getElementById('ht-registrar').value.trim() || null,
    renewal_month: Number(document.getElementById('ht-renewal').value) || null,
    billing_month: Number(document.getElementById('ht-billing').value) || null,
    monthly_fee:   Number(document.getElementById('ht-monthly').value) || 0,
    annual_fee:    Number(document.getElementById('ht-annual').value) || 0,
    memo:          document.getElementById('ht-memo').value.trim() || null,
  };
  if (_editingHostingId) data.id = _editingHostingId;
  try {
    const saved = await dbSaveHosting(data);
    if (!_cache.hostings) _cache.hostings = [];
    if (_editingHostingId) {
      const idx = _cache.hostings.findIndex(h => h.id === _editingHostingId);
      if (idx >= 0) _cache.hostings[idx] = { ..._cache.hostings[idx], ...saved };
    } else { _cache.hostings.unshift(saved); }
    closeModal('hostingModal');
    renderHostings();
    toast(_editingHostingId ? 'ホスティングを更新しました' : 'ホスティングを追加しました', '✅', 'success');
  } catch(e) { toast('保存エラー: ' + e.message, '❌', 'error'); }
}

async function deleteHosting() {
  if (!_editingHostingId) return;
  const h = (_cache.hostings || []).find(x => x.id === _editingHostingId);
  if (!confirm(`「${h?.service_name}」を削除しますか？`)) return;
  try {
    await dbDeleteHosting(_editingHostingId);
    _cache.hostings = (_cache.hostings || []).filter(h => h.id !== _editingHostingId);
    closeModal('hostingModal');
    renderHostings();
    toast('削除しました', '🗑');
  } catch(e) { toast('削除エラー: ' + e.message, '❌', 'error'); }
}

/* ============================================================
   MONTHLY BILLING LIST
   ============================================================ */
function renderMonthly() {
  const sel = document.getElementById('monthlyMonthSel');
  if (!sel) return;

  // セレクト初期化
  if (sel.options.length === 0) {
    const now = new Date();
    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - 3 + i, 1);
      const val = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
      const label = `${d.getFullYear()}年${d.getMonth()+1}月`;
      const opt = new Option(label, val);
      if (i === 3) opt.selected = true;
      sel.appendChild(opt);
    }
  }

  const [year, month] = sel.value.split('-').map(Number);

  // ドメイン（請求月が一致）
  const domains = (_cache.domains || []).filter(d => d.billing_month === month);
  const domainBody = document.getElementById('monthlyDomainBody');
  if (domainBody) {
    domainBody.innerHTML = domains.length === 0
      ? `<tr><td colspan="6" style="text-align:center;color:var(--muted);padding:16px">該当なし</td></tr>`
      : domains.map(d => {
          const cn = getClientById(d.client_id)?.name || '-';
          return `<tr><td>${d.domain_name}</td><td>${cn}</td><td>${d.registrar||'-'}</td>
            <td style="text-align:center">${d.renewal_month ? d.renewal_month+'月' : '-'}</td>
            <td style="text-align:center">${d.billing_month}月</td>
            <td style="color:var(--muted);font-size:12px">${d.memo||''}</td></tr>`;
        }).join('');
  }

  // ホスティング（請求月が一致）
  const hostings = (_cache.hostings || []).filter(h => h.billing_month === month);
  const hostingBody = document.getElementById('monthlyHostingBody');
  let hostingTotal = 0;
  if (hostingBody) {
    hostingBody.innerHTML = hostings.length === 0
      ? `<tr><td colspan="7" style="text-align:center;color:var(--muted);padding:16px">該当なし</td></tr>`
      : hostings.map(h => {
          const cn = getClientById(h.client_id)?.name || '-';
          const fee = h.annual_fee || h.monthly_fee || 0;
          hostingTotal += fee;
          return `<tr><td>${h.service_name}</td><td>${cn}</td><td>${h.plan||'-'}</td>
            <td style="text-align:center">${h.renewal_month ? h.renewal_month+'月' : '-'}</td>
            <td style="text-align:center">${h.billing_month}月</td>
            <td style="text-align:right">${h.monthly_fee ? '¥'+h.monthly_fee.toLocaleString() : '-'}</td>
            <td style="text-align:right">${h.annual_fee ? '¥'+h.annual_fee.toLocaleString() : '-'}</td></tr>`;
        }).join('');
  }

  // KPI
  const kpiEl = document.getElementById('monthlyKPI');
  if (kpiEl) {
    kpiEl.innerHTML = `
      <div style="background:var(--surface);border-radius:10px;padding:16px">
        <div style="font-size:12px;color:var(--muted)">ドメイン請求件数</div>
        <div style="font-size:28px;font-weight:700;color:var(--text);margin-top:4px">${domains.length}<span style="font-size:14px;font-weight:400"> 件</span></div>
      </div>
      <div style="background:var(--surface);border-radius:10px;padding:16px">
        <div style="font-size:12px;color:var(--muted)">ホスティング請求件数</div>
        <div style="font-size:28px;font-weight:700;color:var(--text);margin-top:4px">${hostings.length}<span style="font-size:14px;font-weight:400"> 件</span></div>
      </div>
      <div style="background:var(--surface);border-radius:10px;padding:16px">
        <div style="font-size:12px;color:var(--muted)">ホスティング請求合計</div>
        <div style="font-size:28px;font-weight:700;color:var(--accent-green);margin-top:4px">¥${hostingTotal.toLocaleString()}</div>
      </div>
      <div style="background:var(--surface);border-radius:10px;padding:16px">
        <div style="font-size:12px;color:var(--muted)">合計件数</div>
        <div style="font-size:28px;font-weight:700;color:var(--text);margin-top:4px">${domains.length + hostings.length}<span style="font-size:14px;font-weight:400"> 件</span></div>
      </div>`;
  }

  const totalEl = document.getElementById('monthlyTotal');
  if (totalEl) totalEl.textContent = `合計 ${domains.length + hostings.length} 件`;
}

/* ============================================================
   SALES DASHBOARD
   ============================================================ */
let _charts = {};

function renderDashboard() {
  const projects = _cache.projects || [];

  // KPI
  const totalSales = projects.reduce((s, p) => s + calcTotal(p.lines), 0);
  const ordered    = projects.filter(p => ['ordered','wip','delivered','invoiced','paid','lease','lease_delivered','lease_contracted','lease_invoiced'].includes(p.status)).length;
  const paid       = projects.filter(p => p.status === 'paid').length;
  const avgSales   = projects.length ? Math.round(totalSales / projects.length) : 0;

  const kpiEl = document.getElementById('dashKPI');
  if (kpiEl) {
    kpiEl.innerHTML = `
      <div style="background:var(--surface);border-radius:10px;padding:16px;border-top:3px solid var(--accent)">
        <div style="font-size:12px;color:var(--muted)">総売上（税抜）</div>
        <div style="font-size:24px;font-weight:700;color:var(--accent);margin-top:4px">¥${totalSales.toLocaleString()}</div>
      </div>
      <div style="background:var(--surface);border-radius:10px;padding:16px;border-top:3px solid #4caf50">
        <div style="font-size:12px;color:var(--muted)">受注件数</div>
        <div style="font-size:24px;font-weight:700;color:#4caf50;margin-top:4px">${ordered} 件</div>
      </div>
      <div style="background:var(--surface);border-radius:10px;padding:16px;border-top:3px solid #2196f3">
        <div style="font-size:12px;color:var(--muted)">入金済件数</div>
        <div style="font-size:24px;font-weight:700;color:#2196f3;margin-top:4px">${paid} 件</div>
      </div>
      <div style="background:var(--surface);border-radius:10px;padding:16px;border-top:3px solid #ff9800">
        <div style="font-size:12px;color:var(--muted)">案件平均単価</div>
        <div style="font-size:24px;font-weight:700;color:#ff9800;margin-top:4px">¥${avgSales.toLocaleString()}</div>
      </div>`;
  }

  // 月別売上グラフ（過去12ヶ月）
  const now = new Date();
  const months = Array.from({length: 12}, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1);
    return { label: `${d.getMonth()+1}月`, year: d.getFullYear(), month: d.getMonth()+1, total: 0 };
  });
  projects.forEach(p => {
    if (!p.orderDate) return;
    const d = new Date(p.orderDate);
    const m = months.find(x => x.year === d.getFullYear() && x.month === d.getMonth()+1);
    if (m) m.total += calcTotal(p.lines);
  });

  destroyChart('salesChart');
  const salesCtx = document.getElementById('salesChart');
  if (salesCtx) {
    _charts.salesChart = new Chart(salesCtx, {
      type: 'bar',
      data: {
        labels: months.map(m => m.label),
        datasets: [{ label: '売上（税抜）', data: months.map(m => m.total),
          backgroundColor: 'rgba(229,82,43,0.7)', borderColor: '#e5522b', borderWidth: 1, borderRadius: 4 }]
      },
      options: { responsive: true, plugins: { legend: { display: false } },
        scales: { y: { ticks: { callback: v => '¥'+v.toLocaleString() } } } }
    });
  }

  // ステータス別件数
  const statusLabels = {
    estimate_request:'見積依頼', estimating:'見積提示中',
    ordered:'受注', wip:'作業中', delivered:'納品済',
    invoiced:'請求済', paid:'入金済', unpaid:'未入金',
    lost:'失注', no_change:'No変更', lease:'リース',
    lease_delivered:'リース納品済', lease_contracted:'リース契約済',
    lease_invoiced:'リース請求済', domain_renewal:'ドメイン更新',
  };
  const statusCounts = Object.keys(statusLabels).map(k => projects.filter(p => p.status === k).length);
  destroyChart('statusChart');
  const statusCtx = document.getElementById('statusChart');
  if (statusCtx) {
    _charts.statusChart = new Chart(statusCtx, {
      type: 'doughnut',
      data: {
        labels: Object.values(statusLabels),
        datasets: [{ data: statusCounts,
          backgroundColor: ['#e5522b','#ff9800','#2196f3','#9c27b0','#4caf50'] }]
      },
      options: { responsive: true, plugins: { legend: { position: 'right' } } }
    });
  }

  // 取引先別売上TOP10
  const clientSales = {};
  projects.forEach(p => {
    const cn = getClientById(p.clientId || p.client_id)?.name || p._client?.name || '不明';
    clientSales[cn] = (clientSales[cn] || 0) + calcTotal(p.lines);
  });
  const top10 = Object.entries(clientSales).sort((a,b) => b[1]-a[1]).slice(0,10);
  destroyChart('clientChart');
  const clientCtx = document.getElementById('clientChart');
  if (clientCtx) {
    _charts.clientChart = new Chart(clientCtx, {
      type: 'bar',
      data: {
        labels: top10.map(x => x[0]),
        datasets: [{ label: '売上', data: top10.map(x => x[1]),
          backgroundColor: 'rgba(33,150,243,0.7)', borderColor: '#2196f3', borderWidth: 1, borderRadius: 4 }]
      },
      options: { indexAxis: 'y', responsive: true, plugins: { legend: { display: false } },
        scales: { x: { ticks: { callback: v => '¥'+v.toLocaleString() } } } }
    });
  }
}

function destroyChart(id) {
  if (_charts[id]) { _charts[id].destroy(); delete _charts[id]; }
}

function calcTotal(lines) {
  if (!lines || !Array.isArray(lines)) return 0;
  return lines.reduce((s, l) => s + (Number(l.price || l.unitPrice || 0) * Number(l.qty || l.quantity || 1)), 0);
}

/* ============================================================
   OWN SERVER MANAGEMENT（自社サーバー管理）
   ============================================================ */
if (!_cache.ownServers)       _cache.ownServers = [];
if (!_cache.ownSubscriptions) _cache.ownSubscriptions = [];

let _editingOwnServerId = null;

function renderOwnServers() {
  const search = (document.getElementById('ownServerSearch')?.value || '').toLowerCase();
  const tbody = document.getElementById('ownServerTableBody');
  if (!tbody) return;

  let items = _cache.ownServers || [];
  if (search) items = items.filter(s =>
    s.name?.toLowerCase().includes(search) ||
    s.purpose?.toLowerCase().includes(search)
  );

  const now = new Date();
  const thisMonth = now.getMonth() + 1;
  const nextMonth = thisMonth === 12 ? 1 : thisMonth + 1;
  const urgent = (_cache.ownServers || []).filter(s => s.renewal_month === thisMonth || s.renewal_month === nextMonth);
  const alertEl = document.getElementById('ownServerAlert');
  if (alertEl) {
    alertEl.style.display = urgent.length > 0 ? '' : 'none';
    if (urgent.length > 0) alertEl.innerHTML = `⚠️ 更新が近いサーバー: ${urgent.map(s => `<strong>${s.name}</strong>（${s.renewal_month}月）`).join('、')}`;
  }

  if (items.length === 0) {
    tbody.innerHTML = `<tr><td colspan="9" style="text-align:center;color:var(--muted);padding:32px">サーバーが登録されていません</td></tr>`;
    return;
  }
  tbody.innerHTML = items.map(s => {
    const isUrgent = s.renewal_month === thisMonth;
    const isSoon   = s.renewal_month === nextMonth;
    const badge = isUrgent ? '<span style="background:#ff5252;color:#fff;padding:2px 6px;border-radius:4px;font-size:10px;margin-left:6px">今月</span>'
      : isSoon ? '<span style="background:#ff9800;color:#fff;padding:2px 6px;border-radius:4px;font-size:10px;margin-left:6px">来月</span>' : '';
    return `<tr onclick="openOwnServerModal('${s.id}')" style="cursor:pointer">
      <td><strong>${s.name}</strong>${badge}</td>
      <td>${s.purpose || '-'}</td>
      <td>${s.company || '-'}</td>
      <td>${s.plan || '-'}</td>
      <td style="text-align:center">${s.renewal_month ? s.renewal_month+'月' : '-'}</td>
      <td style="text-align:right">${s.monthly_fee ? '¥'+Number(s.monthly_fee).toLocaleString() : '-'}</td>
      <td style="text-align:right">${s.annual_fee ? '¥'+Number(s.annual_fee).toLocaleString() : '-'}</td>
      <td style="font-size:12px;color:var(--muted)">${s.memo || ''}</td>
      <td><button class="btn btn-ghost btn-sm" onclick="event.stopPropagation();openOwnServerModal('${s.id}')">編集</button></td>
    </tr>`;
  }).join('');
}

function openOwnServerModal(id) {
  _editingOwnServerId = id || null;
  const s = id ? (_cache.ownServers || []).find(x => x.id === id) : null;
  document.getElementById('ownServerModalTitle').textContent = s ? 'サーバー編集' : 'サーバー追加';
  document.getElementById('deleteOwnServerBtn').style.display = s ? '' : 'none';
  document.getElementById('os-name').value    = s?.name          || '';
  document.getElementById('os-purpose').value = s?.purpose       || '';
  document.getElementById('os-company').value = s?.company       || '';
  document.getElementById('os-plan').value    = s?.plan          || '';
  document.getElementById('os-renewal').value = s?.renewal_month || '';
  document.getElementById('os-monthly').value = s?.monthly_fee   || '';
  document.getElementById('os-annual').value  = s?.annual_fee    || '';
  document.getElementById('os-memo').value    = s?.memo          || '';
  openModal('ownServerModal');
}

function saveOwnServer() {
  const name = document.getElementById('os-name').value.trim();
  if (!name) { toast('サーバー名を入力してください', '⚠️'); return; }
  const data = {
    name, purpose: document.getElementById('os-purpose').value.trim() || null,
    company: document.getElementById('os-company').value.trim() || null,
    plan: document.getElementById('os-plan').value.trim() || null,
    renewal_month: Number(document.getElementById('os-renewal').value) || null,
    monthly_fee: Number(document.getElementById('os-monthly').value) || 0,
    annual_fee: Number(document.getElementById('os-annual').value) || 0,
    memo: document.getElementById('os-memo').value.trim() || null,
  };
  if (!_cache.ownServers) _cache.ownServers = [];
  if (_editingOwnServerId) {
    data.id = _editingOwnServerId;
    const idx = _cache.ownServers.findIndex(s => s.id === _editingOwnServerId);
    if (idx >= 0) _cache.ownServers[idx] = data;
  } else {
    data.id = 'os-' + Date.now();
    _cache.ownServers.unshift(data);
  }
  // localStorageに保存
  try { localStorage.setItem('own_servers', JSON.stringify(_cache.ownServers)); } catch(e){}
  closeModal('ownServerModal');
  renderOwnServers();
  toast(_editingOwnServerId ? 'サーバーを更新しました' : 'サーバーを追加しました', '✅', 'success');
}

function deleteOwnServer() {
  if (!_editingOwnServerId) return;
  const s = (_cache.ownServers || []).find(x => x.id === _editingOwnServerId);
  if (!confirm(`「${s?.name}」を削除しますか？`)) return;
  _cache.ownServers = (_cache.ownServers || []).filter(x => x.id !== _editingOwnServerId);
  try { localStorage.setItem('own_servers', JSON.stringify(_cache.ownServers)); } catch(e){}
  closeModal('ownServerModal');
  renderOwnServers();
  toast('削除しました', '🗑');
}

/* ============================================================
   OWN SUBSCRIPTION MANAGEMENT（自社サブスク管理）
   ============================================================ */
let _editingOwnSubId = null;

function renderOwnSubscriptions() {
  const search = (document.getElementById('ownSubSearch')?.value || '').toLowerCase();
  const tbody = document.getElementById('ownSubTableBody');
  if (!tbody) return;

  let items = _cache.ownSubscriptions || [];
  if (search) items = items.filter(s =>
    s.name?.toLowerCase().includes(search) ||
    s.category?.toLowerCase().includes(search)
  );

  // KPI
  const all = _cache.ownSubscriptions || [];
  const totalMonthly = all.reduce((sum, s) => sum + (Number(s.monthly_fee) || 0), 0);
  const totalAnnual  = totalMonthly * 12;
  const kpiEl = document.getElementById('ownSubKPI');
  if (kpiEl) {
    kpiEl.innerHTML = `
      <div style="background:var(--surface);border-radius:10px;padding:16px;border-top:3px solid var(--accent)">
        <div style="font-size:12px;color:var(--muted)">月額合計（税抜）</div>
        <div style="font-size:24px;font-weight:700;color:var(--accent);margin-top:4px">¥${totalMonthly.toLocaleString()}</div>
      </div>
      <div style="background:var(--surface);border-radius:10px;padding:16px;border-top:3px solid #2196f3">
        <div style="font-size:12px;color:var(--muted)">年間合計（月額換算×12）</div>
        <div style="font-size:24px;font-weight:700;color:#2196f3;margin-top:4px">¥${totalAnnual.toLocaleString()}</div>
      </div>
      <div style="background:var(--surface);border-radius:10px;padding:16px;border-top:3px solid #4caf50">
        <div style="font-size:12px;color:var(--muted)">登録件数</div>
        <div style="font-size:24px;font-weight:700;color:#4caf50;margin-top:4px">${all.length} 件</div>
      </div>`;
  }

  if (items.length === 0) {
    tbody.innerHTML = `<tr><td colspan="9" style="text-align:center;color:var(--muted);padding:32px">サブスクが登録されていません</td></tr>`;
    return;
  }
  const now = new Date();
  const thisMonth = now.getMonth() + 1;
  tbody.innerHTML = items.map(s => {
    const isNext = s.next_month === thisMonth || s.next_month === (thisMonth === 12 ? 1 : thisMonth + 1);
    const badge = isNext ? '<span style="background:#ff9800;color:#fff;padding:2px 5px;border-radius:4px;font-size:10px;margin-left:4px">まもなく</span>' : '';
    return `<tr onclick="openOwnSubModal('${s.id}')" style="cursor:pointer">
      <td><strong>${s.name}</strong>${badge}</td>
      <td>${s.category ? `<span style="background:var(--surface);padding:2px 8px;border-radius:10px;font-size:11px">${s.category}</span>` : '-'}</td>
      <td>${s.plan || '-'}</td>
      <td style="text-align:center">${s.cycle === 'annual' ? '年払い' : '月払い'}</td>
      <td style="text-align:center">${s.next_month ? s.next_month+'月' : '-'}</td>
      <td style="text-align:right;font-weight:600">¥${Number(s.monthly_fee||0).toLocaleString()}</td>
      <td>${s.payment || '-'}</td>
      <td style="font-size:12px;color:var(--muted)">${s.memo || ''}</td>
      <td><button class="btn btn-ghost btn-sm" onclick="event.stopPropagation();openOwnSubModal('${s.id}')">編集</button></td>
    </tr>`;
  }).join('');
}

function openOwnSubModal(id) {
  _editingOwnSubId = id || null;
  const s = id ? (_cache.ownSubscriptions || []).find(x => x.id === id) : null;
  document.getElementById('ownSubModalTitle').textContent = s ? 'サブスク編集' : 'サブスク追加';
  document.getElementById('deleteOwnSubBtn').style.display = s ? '' : 'none';
  document.getElementById('sub-name').value       = s?.name       || '';
  document.getElementById('sub-category').value   = s?.category   || '';
  document.getElementById('sub-plan').value       = s?.plan       || '';
  document.getElementById('sub-cycle').value      = s?.cycle      || 'monthly';
  document.getElementById('sub-next-month').value = s?.next_month || '';
  document.getElementById('sub-monthly').value    = s?.monthly_fee|| '';
  document.getElementById('sub-payment').value    = s?.payment    || '';
  document.getElementById('sub-memo').value       = s?.memo       || '';
  openModal('ownSubModal');
}

function saveOwnSub() {
  const name = document.getElementById('sub-name').value.trim();
  if (!name) { toast('サービス名を入力してください', '⚠️'); return; }
  const data = {
    name, category: document.getElementById('sub-category').value || null,
    plan: document.getElementById('sub-plan').value.trim() || null,
    cycle: document.getElementById('sub-cycle').value || 'monthly',
    next_month: Number(document.getElementById('sub-next-month').value) || null,
    monthly_fee: Number(document.getElementById('sub-monthly').value) || 0,
    payment: document.getElementById('sub-payment').value.trim() || null,
    memo: document.getElementById('sub-memo').value.trim() || null,
  };
  if (!_cache.ownSubscriptions) _cache.ownSubscriptions = [];
  if (_editingOwnSubId) {
    data.id = _editingOwnSubId;
    const idx = _cache.ownSubscriptions.findIndex(s => s.id === _editingOwnSubId);
    if (idx >= 0) _cache.ownSubscriptions[idx] = data;
  } else {
    data.id = 'sub-' + Date.now();
    _cache.ownSubscriptions.unshift(data);
  }
  try { localStorage.setItem('own_subscriptions', JSON.stringify(_cache.ownSubscriptions)); } catch(e){}
  closeModal('ownSubModal');
  renderOwnSubscriptions();
  toast(_editingOwnSubId ? 'サブスクを更新しました' : 'サブスクを追加しました', '✅', 'success');
}

function deleteOwnSub() {
  if (!_editingOwnSubId) return;
  const s = (_cache.ownSubscriptions || []).find(x => x.id === _editingOwnSubId);
  if (!confirm(`「${s?.name}」を削除しますか？`)) return;
  _cache.ownSubscriptions = (_cache.ownSubscriptions || []).filter(x => x.id !== _editingOwnSubId);
  try { localStorage.setItem('own_subscriptions', JSON.stringify(_cache.ownSubscriptions)); } catch(e){}
  closeModal('ownSubModal');
  renderOwnSubscriptions();
  toast('削除しました', '🗑');
}

// 起動時にlocalStorageから読み込み
(function loadOwnData() {
  try {
    const servers = localStorage.getItem('own_servers');
    const subs    = localStorage.getItem('own_subscriptions');
    if (servers) _cache.ownServers = JSON.parse(servers);
    if (subs)    _cache.ownSubscriptions = JSON.parse(subs);
  } catch(e) {}
})();
