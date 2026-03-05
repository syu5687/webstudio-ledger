
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
  applyConfigToForm();

  const { supabaseUrl, supabaseAnonKey } = window.CFG || {};
  const hasSupabase = supabaseUrl && supabaseAnonKey && typeof supabase !== 'undefined';

  if (!hasSupabase) {
    // Supabase未設定時はデモデータで即表示
    loadDemoData();
    renderTable(); updateKPI(); updateOrderBadge(); renderClients(); renderInvoiceList(); populateYearFilter();
    hideLoading();
  } else {
    // Supabase設定済み：DB取得後に表示（デモデータは一切表示しない）
    try {
      const connected = initSupabase();
      if (connected) {
        await Promise.race([
          Promise.all([dbFetchProjects(), dbFetchClients(), dbFetchDomains()]),
          new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 5000))
        ]);
        await loadCompanyFromDB();  // 自社情報をSupabaseから取得
        await autoUpdateDomainBillStatus();  // 請求月チェック→自動「請求予定」化
        renderTable(); updateKPI(); updateOrderBadge(); renderClients(); renderInvoiceList(); populateYearFilter();
        subscribeToOrders((p) => {
          toast(`🎉 新受注！「${p.name}」`, '🎉', 'success');
          updateOrderBadge(); refreshData();
        });
      }
    } catch(e) {
      console.warn('DB接続スキップ:', e.message);
      updateDbStatus(false, 'デモ');
    }
    hideLoading();
  }

  handleUrlOrder();
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
  ['ledger','orders','billing','invoice','clients','domains','hostings','monthly','dashboard','own-servers','own-subscriptions','company'].forEach(v => {
    const el = document.getElementById('view-'+v);
    if (el) el.style.display = v === view ? '' : 'none';
  });
  document.querySelectorAll('.nav-item[data-view]').forEach(el => {
    el.classList.toggle('active', el.dataset.view === view);
  });
  const titles = { ledger:'案件台帳', orders:'受注管理', billing:'請求書作成', invoice:'見積・請求書', clients:'取引先', domains:'ドメイン管理', hostings:'ホスティング管理', monthly:'月次請求リスト', dashboard:'売上ダッシュボード', board:'カンバンボード', 'own-servers':'サーバー管理', 'own-subscriptions':'サブスク管理', company:'自社情報設定' };
  document.getElementById('pageTitle').textContent = titles[view] || '';
  document.getElementById('newProjectBtn').style.display = view === 'ledger' ? '' : 'none';
  if (view === 'orders') renderOrdersTable();
  if (view === 'company') applyConfigToForm();
  if (view === 'domains') renderDomains();
  if (view === 'hostings') renderHostings();
  if (view === 'monthly') renderMonthly();
  if (view === 'dashboard') renderDashboard();
  if (view === 'board') renderBoard();
  if (view === 'own-servers') renderOwnServers();
  if (view === 'own-subscriptions') renderOwnSubscriptions();
  if (view === 'billing') renderBillingView();
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
  document.getElementById('p-est-no').value  = estNo;
  document.getElementById('p-est-date').value = new Date().toISOString().slice(0,10);
  document.getElementById('p-inv-no').value   = invNo;
  document.getElementById('p-inv-date').value = '';

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
  document.getElementById('p-est-no').value   = p.estNo  || '';
  document.getElementById('p-est-date').value = p.estDate || '';
  document.getElementById('p-inv-no').value   = p.invNo  || '';
  document.getElementById('p-inv-date').value = p.invDate || '';

  populateClientSelect(p.clientId);
  clearLineItems();

  // ドメイン合算モードの場合は合算した明細を使う
  const merge = _domainInvoiceMerge;
  if (merge && merge.projId === id) {
    merge.lines.forEach(l => addLineItem(l));
    _domainInvoiceMerge = null;
    // 請求書No未設定なら自動生成
    if (!p.invNo) {
      const now = new Date();
      const auto = `INV-${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
      document.getElementById('p-inv-no').value = auto;
    }
  } else {
    (p.lines || []).forEach(l => addLineItem(l));
  }

  calcTotals();
  updateStatusFlow(p.status);
  switchTab('project','info');
  openModal('projectModal');
}
// openProjectModal は openEditProject の別名
function openProjectModal(id) { openEditProject(id); }

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
      estNo:    document.getElementById('p-est-no')?.value,
      estDate:  document.getElementById('p-est-date')?.value || null,
      invNo:    document.getElementById('p-inv-no')?.value,
      invDate:  document.getElementById('p-inv-date')?.value || null,
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

    // 請求書作成画面からの保留処理があれば確定
    const wasPendingBilling = !!_pendingBilling;
    if (_pendingBilling) {
      const pb = _pendingBilling;
      _pendingBilling = null;

      // 既存案件のステータスを「請求済」に変更（先頭案件はsaveProjectで保存済みなので2件目以降のみ）
      const remainingProjIds = pb.checkedProjIds.filter(pid => pid !== window._editingProjectId);
      for (const pid of remainingProjIds) {
        const proj = (_cache.projects||[]).find(p => p.id === pid);
        if (!proj) continue;
        const updData = { ...proj, status: 'invoiced', invNo: proj.invNo || pb.invNo };
        const s = await dbSaveProject(updData);
        const idx = (_cache.projects||[]).findIndex(p => p.id === pid);
        if (idx >= 0) _cache.projects[idx] = s || { ..._cache.projects[idx], status: 'invoiced' };
      }

      // ドメイン・ホスティング明細がある場合は新規案件として登録
      if (pb.extraLines.length > 0) {
        const parts = [];
        if (pb.checkedDomainIds.length > 0) parts.push(`ドメイン${pb.checkedDomainIds.length}件`);
        if (pb.checkedHostingIds.length > 0) parts.push(`ホスティング${pb.checkedHostingIds.length}件`);
        const client = getClientById(_billingSelectedClientId || pb.checkedProjIds.reduce((cid, pid) => {
          return cid || (_cache.projects||[]).find(p => p.id === pid)?.clientId;
        }, null));
        const extraProj = {
          name:       (client?.name ? client.name + ' ' : '') + parts.join('・') + '請求',
          clientId:   client?.id || _billingSelectedClientId,
          status:     'invoiced',
          lines:      pb.extraLines,
          invNo:      pb.invNo,
          invDate:    new Date().toISOString().slice(0, 10),
          orderRoute: '手動登録',
        };
        const savedExtra = await dbSaveProject(extraProj);
        if (savedExtra?.id) _cache.projects.unshift(savedExtra);
      }

      // ドメイン → 請求済
      for (const did of pb.checkedDomainIds) {
        const d = (_cache.domains||[]).find(x => x.id === did);
        if (!d) continue;
        await dbSaveDomain({ ...d, bill_status: 'invoiced' });
        const idx = (_cache.domains||[]).findIndex(x => x.id === did);
        if (idx >= 0) _cache.domains[idx].bill_status = 'invoiced';
      }

      // ホスティング → 毎月はリセット、それ以外は請求済
      for (const hid of pb.checkedHostingIds) {
        const h = (_cache.hostings||[]).find(x => x.id === hid);
        if (!h) continue;
        const newStatus = Number(h?.billing_month) === 0 ? null : 'invoiced';
        await dbSaveHosting({ ...h, bill_status: newStatus });
        const idx = (_cache.hostings||[]).findIndex(x => x.id === hid);
        if (idx >= 0) _cache.hostings[idx].bill_status = newStatus;
      }
    }

    closeModal('projectModal');
    renderTable();
    updateKPI();
    renderInvoiceList();
    populateYearFilter();
    // 請求書作成からの確定保存だった場合は選択をリセットして一覧に戻す
    if (wasPendingBilling) {
      _billingSelectedClientId = null;
    }
    renderBillingView();
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
function closeModal(id) {
  document.getElementById(id)?.classList.remove('open');
  if (id === 'projectModal' && _pendingBilling) _pendingBilling = null;
}

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
    const price = d.price ? `¥${Number(d.price).toLocaleString()}` : '<span style="color:var(--muted)">-</span>';

    // 今月・来月は強調
    const isUrgent = d.renewal_month === thisMonth;
    const isSoon   = d.renewal_month === nextMonth;
    const badge = isUrgent
      ? '<span style="background:#ff5252;color:#fff;padding:2px 6px;border-radius:4px;font-size:10px;margin-left:6px">今月</span>'
      : isSoon
      ? '<span style="background:#ff9800;color:#fff;padding:2px 6px;border-radius:4px;font-size:10px;margin-left:6px">来月</span>'
      : '';

    const billStatusMap = { pending: ['請求予定','#ff9800'], invoiced: ['請求済','#2196f3'], paid: ['入金済','#2e8b57'] };
    const bs = billStatusMap[d.bill_status];
    const billBadge = bs
      ? `<span style="background:${bs[1]};color:#fff;padding:2px 7px;border-radius:4px;font-size:11px">${bs[0]}</span>`
      : '<span style="color:var(--muted)">-</span>';

    return `<tr onclick="openDomainModal('${d.id}')" style="cursor:pointer">
      <td><strong>${d.domain_name}</strong>${badge}</td>
      <td>${clientName}</td>
      <td>${d.registrar || '<span style="color:var(--muted)">-</span>'}</td>
      <td style="text-align:center">${renewal}</td>
      <td style="text-align:center">${billing}</td>
      <td style="text-align:right;font-family:monospace">${price}</td>
      <td style="text-align:center">${billBadge}</td>
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
  document.getElementById('dm-name').value        = domain?.domain_name   || '';
  document.getElementById('dm-renewal').value     = domain?.renewal_month || '';
  document.getElementById('dm-billing').value     = domain?.billing_month || '';
  document.getElementById('dm-registrar').value   = domain?.registrar     || '';
  document.getElementById('dm-memo').value        = domain?.memo          || '';
  document.getElementById('dm-price').value       = domain?.price         || '';
  document.getElementById('dm-bill-status').value = domain?.bill_status   || '';

  // 請求書作成エリアは請求書作成専用画面に統合したため削除
  openModal('domainModal');
}

function _updateDomainInvoiceArea(domain) {
  const area = document.getElementById('dm-invoice-area');
  const relDiv = document.getElementById('dm-related-projects');
  if (!area || !relDiv) return;

  const clientId = domain?.client_id;
  const billStatus = domain?.bill_status;
  if (!clientId || billStatus !== 'pending') { area.style.display = 'none'; return; }

  // 同クライアントの納品済案件を探す
  const related = (_cache.projects || []).filter(p =>
    p.clientId === clientId && p.status === 'delivered'
  );

  area.style.display = '';
  if (related.length === 0) {
    relDiv.innerHTML = '<span style="color:var(--muted)">納品済案件なし（ドメイン費用のみで請求書作成）</span>';
  } else {
    relDiv.innerHTML = '合算対象案件：' + related.map(p =>
      `<span style="background:var(--surface3);padding:2px 8px;border-radius:4px;margin:2px;display:inline-block">${p.name}</span>`
    ).join('');
  }
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
    price:         Number(document.getElementById('dm-price').value) || null,
    bill_status:   document.getElementById('dm-bill-status').value || null,
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

/* ── ドメイン費用を含む請求書作成 ── */
async function createDomainInvoice() {
  const domain = _editingDomainId ? (_cache.domains || []).find(d => d.id === _editingDomainId) : null;
  if (!domain) return;

  const clientId = domain.client_id;
  const client = getClientById(clientId);

  // 同クライアントの納品済案件
  const relatedProjects = (_cache.projects || []).filter(p =>
    p.clientId === clientId && p.status === 'delivered'
  );

  // 請求明細を構築：案件の明細 + ドメイン費用
  let lines = [];
  relatedProjects.forEach(p => {
    (p.lines || []).forEach(l => lines.push({ ...l }));
  });
  // ドメイン費用を追加
  if (domain.price) {
    lines.push({
      name:  `ドメイン更新費（${domain.domain_name}）`,
      qty:   1,
      unit:  '年',
      price: Number(domain.price),
    });
  }

  if (lines.length === 0) {
    toast('請求明細がありません。ドメイン費用を設定してください。', '⚠️'); return;
  }

  // 請求書番号を生成
  const now = new Date();
  const invNo = `INV-${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-D${String(now.getDate()).padStart(2,'0')}`;

  // 案件モーダルを請求書として開く（新規案件として）
  closeModal('domainModal');

  // 案件を1つ選択または新規作成して請求書を開く
  if (relatedProjects.length > 0) {
    // 最初の納品済案件に合算して請求書を表示
    const proj = relatedProjects[0];
    // 既存案件にドメイン費用の行を追加して請求書モーダルを開く
    const mergedLines = [...(proj.lines || [])];
    if (domain.price) {
      mergedLines.push({
        name: `ドメイン更新費（${domain.domain_name}）`,
        qty: 1, unit: '年', price: Number(domain.price),
      });
    }
    // 一時的にキャッシュを上書きして請求書プレビューへ
    _domainInvoiceMerge = { projId: proj.id, domainId: domain.id, lines: mergedLines };
    openProjectModal(proj.id);
    setTimeout(() => {
      switchTab('project', 'estimate');
      toast(`「${proj.name}」にドメイン費用を合算した請求書を確認してください`, '📄');
    }, 200);
  } else {
    // 案件なし：ドメイン費用のみの新規案件として請求書を作成
    const newProj = {
      name: `ドメイン更新（${domain.domain_name}）`,
      client_id: clientId,
      status: 'invoiced',
      lines: lines,
      inv_no: invNo,
      order_route: '手動登録',
    };
    try {
      const saved = await dbSaveProject(newProj);
      _cache.projects.unshift(saved);
      renderTable(); updateKPI();
      openProjectModal(saved.id);
      setTimeout(() => switchTab('project', 'estimate'), 200);
      toast('ドメイン費用の請求書を作成しました', '✅', 'success');
    } catch(e) {
      toast('作成エラー: ' + e.message, '❌', 'error');
    }
  }
}
let _domainInvoiceMerge = null;

/* ============================================================
   DOMAIN AUTO BILL STATUS
   起動時に請求月 = 今月のドメインを自動で「請求予定」にする
   ============================================================ */
async function autoUpdateDomainBillStatus() {
  const thisMonth = new Date().getMonth() + 1;

  // ドメイン：請求月=今月 かつ 未設定のもの
  const domainTargets = (_cache.domains || []).filter(d =>
    d.billing_month === thisMonth &&
    (!d.bill_status || d.bill_status === '')
  );
  for (const d of domainTargets) {
    try {
      await dbSaveDomain({ ...d, bill_status: 'pending' });
      const idx = (_cache.domains || []).findIndex(x => x.id === d.id);
      if (idx >= 0) _cache.domains[idx].bill_status = 'pending';
    } catch(e) { console.warn('ドメイン自動更新エラー:', d.domain_name, e); }
  }

  // ホスティング：毎月(0) or 請求月=今月 かつ 未設定のもの
  const hostingTargets = (_cache.hostings || []).filter(h =>
    (Number(h.billing_month) === 0 || h.billing_month === thisMonth) &&
    (!h.bill_status || h.bill_status === '')
  );
  for (const h of hostingTargets) {
    try {
      await dbSaveHosting({ ...h, bill_status: 'pending' });
      const idx = (_cache.hostings || []).findIndex(x => x.id === h.id);
      if (idx >= 0) _cache.hostings[idx].bill_status = 'pending';
    } catch(e) { console.warn('ホスティング自動更新エラー:', h.service_name, e); }
  }

  const total = domainTargets.length + hostingTargets.length;
  if (total > 0) toast(`${total}件を「請求予定」に更新しました`, '🔔');
}

/* ============================================================
   BILLING VIEW — 請求書作成専用画面
   ============================================================ */
let _billingSelectedClientId = null;
let _pendingBilling = null; // 請求書作成画面からの未確定選択情報

function renderBillingView() {
  _renderBillingClientList();
  // 選択中クライアントがいれば右ペインも再描画、いなければ空表示
  if (_billingSelectedClientId) {
    selectBillingClient(_billingSelectedClientId);
  } else {
    document.getElementById('billingRightEmpty').style.display = 'flex';
    document.getElementById('billingRightContent').style.display = 'none';
  }
}

function _renderBillingClientList() {
  const el = document.getElementById('billingClientList');
  if (!el) return;

  // 請求可能な案件・ドメインをクライアント別に集計
  const deliveredProjects = (_cache.projects || []).filter(p => p.status === 'delivered');
  const pendingDomains    = (_cache.domains  || []).filter(d => d.bill_status === 'pending');
  const pendingHostings   = (_cache.hostings || []).filter(h => h.bill_status === 'pending');

  const clientMap = {};
  deliveredProjects.forEach(p => {
    if (!p.clientId) return;
    if (!clientMap[p.clientId]) clientMap[p.clientId] = { projects: 0, domains: 0, hostings: 0 };
    clientMap[p.clientId].projects++;
  });
  pendingDomains.forEach(d => {
    if (!d.client_id) return;
    if (!clientMap[d.client_id]) clientMap[d.client_id] = { projects: 0, domains: 0, hostings: 0 };
    clientMap[d.client_id].domains++;
  });
  pendingHostings.forEach(h => {
    if (!h.client_id) return;
    if (!clientMap[h.client_id]) clientMap[h.client_id] = { projects: 0, domains: 0, hostings: 0 };
    clientMap[h.client_id].hostings++;
  });

  const clientIds = Object.keys(clientMap);
  if (clientIds.length === 0) {
    el.innerHTML = '<div style="padding:20px;text-align:center;color:var(--muted);font-size:13px">請求可能な案件・<br>ドメインがありません</div>';
    return;
  }

  el.innerHTML = clientIds.map(cid => {
    const client = getClientById(cid);
    if (!client) return '';
    const cnt = clientMap[cid];
    const badges = [];
    if (cnt.projects > 0) badges.push(`<span style="background:#2e8b57;color:#fff;padding:1px 6px;border-radius:10px;font-size:10px">案件 ${cnt.projects}</span>`);
    if (cnt.domains  > 0) badges.push(`<span style="background:#1976d2;color:#fff;padding:1px 6px;border-radius:10px;font-size:10px">ドメイン ${cnt.domains}</span>`);
    if (cnt.hostings > 0) badges.push(`<span style="background:#7b1fa2;color:#fff;padding:1px 6px;border-radius:10px;font-size:10px">ホスティング ${cnt.hostings}</span>`);
    const isSelected = cid === _billingSelectedClientId;
    return `<div onclick="selectBillingClient('${cid}')" style="padding:12px 16px;cursor:pointer;border-bottom:1px solid var(--border);${isSelected ? 'background:var(--accent2-light, rgba(99,179,237,0.1));border-left:3px solid var(--accent2)' : 'border-left:3px solid transparent'}">
      <div style="font-size:13px;font-weight:600;margin-bottom:4px">${client.name}</div>
      <div style="display:flex;gap:4px;flex-wrap:wrap">${badges.join('')}</div>
    </div>`;
  }).join('');
}

function selectBillingClient(clientId) {
  _billingSelectedClientId = clientId;
  _renderBillingClientList();

  const client = getClientById(clientId);
  const deliveredProjects = (_cache.projects || []).filter(p => p.clientId === clientId && p.status === 'delivered');
  const pendingDomains    = (_cache.domains  || []).filter(d => d.client_id === clientId && d.bill_status === 'pending');
  const pendingHostings   = (_cache.hostings || []).filter(h => h.client_id === clientId && h.bill_status === 'pending');

  document.getElementById('billingRightEmpty').style.display = 'none';
  document.getElementById('billingRightContent').style.display = 'flex';
  document.getElementById('billingClientName').textContent = client?.name || '';
  document.getElementById('billingClientSub').textContent =
    `納品済案件 ${deliveredProjects.length}件　請求予定ドメイン ${pendingDomains.length}件　ホスティング ${pendingHostings.length}件`;

  // 案件一覧
  const projEl = document.getElementById('billingProjectsList');
  if (deliveredProjects.length === 0) {
    projEl.innerHTML = '<div style="color:var(--muted);font-size:13px;padding:4px 0">なし</div>';
  } else {
    projEl.innerHTML = deliveredProjects.map(p => {
      const sub = (p.lines || []).reduce((s, l) => s + floatval(l.price) * floatval(l.qty), 0);
      const tax = Math.round(sub * 0.1);
      return `<label style="display:flex;align-items:flex-start;gap:10px;padding:10px 12px;background:var(--surface3);border-radius:8px;margin-bottom:6px;cursor:pointer;border:1px solid var(--border)">
        <input type="checkbox" class="billing-proj-check" data-id="${p.id}" checked style="margin-top:2px;flex-shrink:0" onchange="updateBillingTotal()">
        <div style="flex:1">
          <div style="font-size:13px;font-weight:600">${p.name}</div>
          <div style="font-size:11px;color:var(--muted);margin-top:2px">${(p.lines||[]).map(l=>l.name).join(' / ') || '明細なし'}</div>
        </div>
        <div style="font-size:13px;font-weight:600;font-family:monospace;white-space:nowrap">¥${(sub+tax).toLocaleString()}</div>
      </label>`;
    }).join('');
  }

  // ドメイン一覧
  const domEl = document.getElementById('billingDomainsList');
  if (pendingDomains.length === 0) {
    domEl.innerHTML = '<div style="color:var(--muted);font-size:13px;padding:4px 0">なし</div>';
  } else {
    domEl.innerHTML = pendingDomains.map(d => {
      return `<label style="display:flex;align-items:center;gap:10px;padding:10px 12px;background:var(--surface3);border-radius:8px;margin-bottom:6px;cursor:pointer;border:1px solid var(--border)">
        <input type="checkbox" class="billing-domain-check" data-id="${d.id}" checked style="flex-shrink:0" onchange="updateBillingTotal()">
        <div style="flex:1">
          <div style="font-size:13px;font-weight:600">${d.domain_name}</div>
          <div style="font-size:11px;color:var(--muted);margin-top:2px">ドメイン更新費　${d.billing_month ? d.billing_month+'月請求' : ''}</div>
        </div>
        <div style="font-size:13px;font-weight:600;font-family:monospace;white-space:nowrap">${d.price ? '¥'+Number(d.price).toLocaleString() : '金額未設定'}</div>
      </label>`;
    }).join('');
  }

  // ホスティング一覧
  const htEl = document.getElementById('billingHostingsList');
  if (htEl) {
    if (pendingHostings.length === 0) {
      htEl.innerHTML = '<div style="color:var(--muted);font-size:13px;padding:4px 0">なし</div>';
    } else {
      htEl.innerHTML = pendingHostings.map(h => {
        const fee = h.monthly_fee || h.annual_fee || 0;
        const feeLabel = h.monthly_fee ? `月額 ¥${Number(h.monthly_fee).toLocaleString()}` : (h.annual_fee ? `年額 ¥${Number(h.annual_fee).toLocaleString()}` : '金額未設定');
        const cycleLabel = Number(h.billing_month) === 0 ? '毎月' : (h.billing_month ? h.billing_month+'月請求' : '');
        return `<label style="display:flex;align-items:center;gap:10px;padding:10px 12px;background:var(--surface3);border-radius:8px;margin-bottom:6px;cursor:pointer;border:1px solid var(--border)">
          <input type="checkbox" class="billing-hosting-check" data-id="${h.id}" checked style="flex-shrink:0" onchange="updateBillingTotal()">
          <div style="flex:1">
            <div style="font-size:13px;font-weight:600">${h.service_name}</div>
            <div style="font-size:11px;color:var(--muted);margin-top:2px">${h.plan || 'ホスティング'}　${cycleLabel}</div>
          </div>
          <div style="font-size:13px;font-weight:600;font-family:monospace;white-space:nowrap">${fee ? '¥'+Number(fee).toLocaleString() : '金額未設定'}</div>
        </label>`;
      }).join('');
    }
  }

  updateBillingTotal();
}

function floatval(v) { return parseFloat(v) || 0; }

function updateBillingTotal() {
  let subtotal = 0;

  // チェック済み案件の合計
  document.querySelectorAll('.billing-proj-check:checked').forEach(cb => {
    const proj = (_cache.projects || []).find(p => p.id === cb.dataset.id);
    if (proj) subtotal += (proj.lines || []).reduce((s, l) => s + floatval(l.price) * floatval(l.qty), 0);
  });

  // チェック済みドメインの合計
  document.querySelectorAll('.billing-domain-check:checked').forEach(cb => {
    const dom = (_cache.domains || []).find(d => d.id === cb.dataset.id);
    if (dom && dom.price) subtotal += Number(dom.price);
  });

  // チェック済みホスティングの合計
  document.querySelectorAll('.billing-hosting-check:checked').forEach(cb => {
    const h = (_cache.hostings || []).find(x => x.id === cb.dataset.id);
    if (h) subtotal += Number(h.monthly_fee || h.annual_fee || 0);
  });

  const tax   = Math.round(subtotal * 0.1);
  const grand = subtotal + tax;
  document.getElementById('billingSubtotal').textContent = '¥' + subtotal.toLocaleString();
  document.getElementById('billingTax').textContent      = '¥' + tax.toLocaleString();
  document.getElementById('billingGrand').textContent    = '¥' + grand.toLocaleString();
}

async function createBatchInvoice() {
  if (!_billingSelectedClientId) return;

  const checkedProjIds    = [...document.querySelectorAll('.billing-proj-check:checked')].map(c => c.dataset.id);
  const checkedDomainIds  = [...document.querySelectorAll('.billing-domain-check:checked')].map(c => c.dataset.id);
  const checkedHostingIds = [...document.querySelectorAll('.billing-hosting-check:checked')].map(c => c.dataset.id);

  if (checkedProjIds.length === 0 && checkedDomainIds.length === 0 && checkedHostingIds.length === 0) {
    toast('請求対象を選択してください', '⚠️'); return;
  }

  // ドメイン・ホスティングの追加明細
  const extraLines = [];
  checkedDomainIds.forEach(did => {
    const dom = (_cache.domains || []).find(d => d.id === did);
    if (dom && dom.price)
      extraLines.push({ name: `ドメイン更新費（${dom.domain_name}）`, qty: 1, unit: '年', price: Number(dom.price) });
  });
  checkedHostingIds.forEach(hid => {
    const h = (_cache.hostings || []).find(x => x.id === hid);
    if (h) {
      const fee = Number(h.monthly_fee || h.annual_fee || 0);
      const unit = h.monthly_fee ? '月' : '年';
      if (fee > 0) extraLines.push({ name: `ホスティング費（${h.service_name}）`, qty: 1, unit, price: fee });
    }
  });

  const now = new Date();
  const invNo = `INV-${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;

  // ── 選択情報を保留しておき、モーダルを開くだけ（DBはまだ変更しない）──
  _pendingBilling = { checkedProjIds, checkedDomainIds, checkedHostingIds, extraLines, invNo };

  if (checkedProjIds.length > 0) {
    // 既存案件の先頭をモーダルで開く（ドメイン・ホスティングは別案件になるので明細は混ぜない）
    const firstProj = (_cache.projects || []).find(p => p.id === checkedProjIds[0]);
    if (!firstProj) return;
    const previewProj = { ...firstProj, status: 'invoiced', invNo: firstProj.invNo || invNo };
    _pendingBilling.previewProjId = firstProj.id;
    openEditProjectPreview(previewProj);
    setTimeout(() => switchTab('project', 'estimate'), 200);
  } else {
    // 案件なし → 新規案件として仮表示
    if (extraLines.length === 0) { toast('明細がありません。金額を設定してください', '⚠️'); return; }
    const parts = [];
    if (checkedDomainIds.length > 0) parts.push(`ドメイン${checkedDomainIds.length}件`);
    if (checkedHostingIds.length > 0) parts.push(`ホスティング${checkedHostingIds.length}件`);
    const previewProj = { id: null, name: parts.join('・')+'請求', clientId: _billingSelectedClientId,
      status: 'invoiced', lines: extraLines, invNo, orderRoute: '手動登録', estNo: '', estDate: '', invDate: new Date().toISOString().slice(0,10) };
    openEditProjectPreview(previewProj);
    setTimeout(() => switchTab('project', 'estimate'), 200);
  }
}

// モーダルをプレビューモードで開く（キャッシュを変更しない）
function openEditProjectPreview(proj) {
  window._editingProjectId = proj.id || null;
  document.getElementById('projectModalTitle').textContent = proj.id ? '請求書確認・編集' : '請求書作成';
  document.getElementById('deleteProjectBtn').style.display = 'none';
  document.getElementById('p-code').value    = proj.code || '';
  document.getElementById('p-status').value  = proj.status || 'invoiced';
  document.getElementById('p-name').value    = proj.name || '';
  document.getElementById('p-manager').value = proj.manager || '';
  document.getElementById('p-order-date').value = proj.orderDate || '';
  document.getElementById('p-due-date').value   = proj.dueDate || '';
  document.getElementById('p-desc').value    = proj.desc || '';
  document.getElementById('p-memo').value    = proj.memo || '';
  document.getElementById('p-est-no').value  = proj.estNo || '';
  document.getElementById('p-est-date').value = proj.estDate || '';
  document.getElementById('p-inv-no').value  = proj.invNo || '';
  document.getElementById('p-inv-date').value = proj.invDate || new Date().toISOString().slice(0,10);
  populateClientSelect(proj.clientId);
  clearLineItems();
  (proj.lines || []).forEach(l => addLineItem(l));
  updateStatusFlow(proj.status || 'invoiced');
  openModal('projectModal');
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
    const billingLabel = Number(h.billing_month) === 0 ? '毎月' : (h.billing_month ? h.billing_month+'月' : '-');
    const billStatusMap = { pending: ['請求予定','#ff9800'], invoiced: ['請求済','#2196f3'], paid: ['入金済','#2e8b57'] };
    const bs = billStatusMap[h.bill_status];
    const billBadge = bs
      ? `<span style="background:${bs[1]};color:#fff;padding:2px 7px;border-radius:4px;font-size:11px">${bs[0]}</span>`
      : '<span style="color:var(--muted)">-</span>';
    return `<tr onclick="openHostingModal('${h.id}')" style="cursor:pointer">
      <td><strong>${h.service_name}</strong>${badge}</td>
      <td>${client?.name || '<span style="color:var(--muted)">未設定</span>'}</td>
      <td>${h.plan || '<span style="color:var(--muted)">-</span>'}</td>
      <td>${h.registrar || '<span style="color:var(--muted)">-</span>'}</td>
      <td style="text-align:center">${h.renewal_month ? h.renewal_month+'月' : '-'}</td>
      <td style="text-align:center">${billingLabel}</td>
      <td style="text-align:right">${h.monthly_fee ? '¥'+Number(h.monthly_fee).toLocaleString() : '-'}</td>
      <td style="text-align:right">${h.annual_fee ? '¥'+Number(h.annual_fee).toLocaleString() : '-'}</td>
      <td style="text-align:center">${billBadge}</td>
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
  document.getElementById('ht-name').value        = h?.service_name   || '';
  document.getElementById('ht-plan').value        = h?.plan           || '';
  document.getElementById('ht-registrar').value   = h?.registrar      || '';
  document.getElementById('ht-renewal').value     = h?.renewal_month  ?? '';
  document.getElementById('ht-billing').value     = h?.billing_month != null ? String(h.billing_month) : '';
  document.getElementById('ht-monthly').value     = h?.monthly_fee    || '';
  document.getElementById('ht-annual').value      = h?.annual_fee     || '';
  document.getElementById('ht-memo').value        = h?.memo           || '';
  document.getElementById('ht-bill-status').value = h?.bill_status    || '';
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
    billing_month: document.getElementById('ht-billing').value === '' ? null : Number(document.getElementById('ht-billing').value),
    monthly_fee:   Number(document.getElementById('ht-monthly').value) || 0,
    annual_fee:    Number(document.getElementById('ht-annual').value) || 0,
    memo:          document.getElementById('ht-memo').value.trim() || null,
    bill_status:   document.getElementById('ht-bill-status').value || null,
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

  // ── 売掛表：請求済（未入金）案件 ──
  const arProjects = (_cache.projects || []).filter(p => p.status === 'invoiced');
  const arBody = document.getElementById('arTableBody');
  const arFoot = document.getElementById('arTableFoot');
  const arKPI  = document.getElementById('arKPI');

  // 取引先別に集計
  const clientTotals = {};
  let arSubtotal = 0, arTax = 0;

  arProjects.forEach(p => {
    const sub = (p.lines || []).reduce((s, l) => s + floatval(l.price) * floatval(l.qty), 0);
    const tax = Math.round(sub * 0.1);
    const cid = p.clientId || '';
    if (!clientTotals[cid]) clientTotals[cid] = { subtotal: 0, tax: 0, projects: [] };
    clientTotals[cid].subtotal += sub;
    clientTotals[cid].tax     += tax;
    clientTotals[cid].projects.push(p);
    arSubtotal += sub;
    arTax      += tax;
  });

  if (arBody) {
    if (arProjects.length === 0) {
      arBody.innerHTML = `<tr><td colspan="7" style="text-align:center;color:var(--muted);padding:24px">請求済（未入金）の案件はありません</td></tr>`;
    } else {
      let rows = '';
      Object.entries(clientTotals).forEach(([cid, ct]) => {
        const clientName = getClientById(cid)?.name || '不明';
        ct.projects.forEach((p, i) => {
          const sub = (p.lines || []).reduce((s, l) => s + floatval(l.price) * floatval(l.qty), 0);
          const tax = Math.round(sub * 0.1);
          rows += `<tr style="${i === 0 ? 'border-top:2px solid var(--border)' : ''}">
            <td style="font-weight:${i===0?'600':'400'};color:${i===0?'var(--text)':'var(--muted)'}">${i===0 ? clientName : ''}</td>
            <td style="font-size:13px">${p.name}</td>
            <td style="font-size:12px;color:var(--muted)">${p.invNo || '—'}</td>
            <td style="text-align:right;font-family:monospace">¥${sub.toLocaleString()}</td>
            <td style="text-align:right;font-family:monospace;color:var(--muted)">¥${tax.toLocaleString()}</td>
            <td style="text-align:right;font-family:monospace;font-weight:600">¥${(sub+tax).toLocaleString()}</td>
            <td><button class="btn btn-ghost btn-sm" onclick="openEditProject('${p.id}')">開く</button></td>
          </tr>`;
        });
        // 取引先小計行
        if (ct.projects.length > 1) {
          rows += `<tr style="background:var(--surface2)">
            <td colspan="3" style="text-align:right;font-size:12px;color:var(--muted)">${clientName} 小計</td>
            <td style="text-align:right;font-family:monospace">¥${ct.subtotal.toLocaleString()}</td>
            <td style="text-align:right;font-family:monospace;color:var(--muted)">¥${ct.tax.toLocaleString()}</td>
            <td style="text-align:right;font-family:monospace;font-weight:600">¥${(ct.subtotal+ct.tax).toLocaleString()}</td>
            <td></td>
          </tr>`;
        }
      });
      arBody.innerHTML = rows;
    }
  }

  if (arFoot) {
    arFoot.innerHTML = arProjects.length === 0 ? '' : `
      <tr style="background:var(--surface3);border-top:2px solid var(--border)">
        <td colspan="3" style="font-weight:700;padding:10px 12px">合計（${arProjects.length}件）</td>
        <td style="text-align:right;font-family:monospace;font-weight:600">¥${arSubtotal.toLocaleString()}</td>
        <td style="text-align:right;font-family:monospace;color:var(--muted)">¥${arTax.toLocaleString()}</td>
        <td style="text-align:right;font-family:monospace;font-weight:700;font-size:15px;color:var(--accent2)">¥${(arSubtotal+arTax).toLocaleString()}</td>
        <td></td>
      </tr>`;
  }

  if (arKPI) {
    arKPI.innerHTML = `
      <div style="background:var(--surface);border-radius:10px;padding:16px;border:1px solid var(--border)">
        <div style="font-size:12px;color:var(--muted)">売掛件数</div>
        <div style="font-size:28px;font-weight:700;margin-top:4px">${arProjects.length}<span style="font-size:13px;font-weight:400"> 件</span></div>
      </div>
      <div style="background:var(--surface);border-radius:10px;padding:16px;border:1px solid var(--border)">
        <div style="font-size:12px;color:var(--muted)">売掛取引先数</div>
        <div style="font-size:28px;font-weight:700;margin-top:4px">${Object.keys(clientTotals).length}<span style="font-size:13px;font-weight:400"> 社</span></div>
      </div>
      <div style="background:var(--surface);border-radius:10px;padding:16px;border:1px solid var(--border)">
        <div style="font-size:12px;color:var(--muted)">売掛合計（税込）</div>
        <div style="font-size:24px;font-weight:700;color:var(--accent2);margin-top:4px">¥${(arSubtotal+arTax).toLocaleString()}</div>
      </div>`;
  }

  // ── ドメイン（請求月が一致）──
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

  // ── ホスティング（請求月が一致 or 毎月）──
  const hostings = (_cache.hostings || []).filter(h => Number(h.billing_month) === 0 || h.billing_month === month);
  const hostingBody = document.getElementById('monthlyHostingBody');
  if (hostingBody) {
    hostingBody.innerHTML = hostings.length === 0
      ? `<tr><td colspan="7" style="text-align:center;color:var(--muted);padding:16px">該当なし</td></tr>`
      : hostings.map(h => {
          const cn = getClientById(h.client_id)?.name || '-';
          const billingLabel = Number(h.billing_month) === 0 ? '<span style="background:#7b1fa2;color:#fff;padding:1px 6px;border-radius:4px;font-size:10px">毎月</span>' : h.billing_month+'月';
          return `<tr><td>${h.service_name}</td><td>${cn}</td><td>${h.plan||'-'}</td>
            <td style="text-align:center">${h.renewal_month ? h.renewal_month+'月' : '-'}</td>
            <td style="text-align:center">${billingLabel}</td>
            <td style="text-align:right">${h.monthly_fee ? '¥'+Number(h.monthly_fee).toLocaleString() : '-'}</td>
            <td style="text-align:right">${h.annual_fee ? '¥'+Number(h.annual_fee).toLocaleString() : '-'}</td></tr>`;
        }).join('');
  }
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

/* ============================================================
   KANBAN BOARD
   ============================================================ */
const KANBAN_COLS = [
  { id: 'ordered',   label: '受注',   color: '#1565c0' },
  { id: 'wip',       label: '作業中', color: '#e65100' },
  { id: 'delivered', label: '納品済', color: '#4527a0' },
  { id: 'invoiced',  label: '請求済', color: '#ad1457' },
  { id: 'paid',      label: '入金済', color: '#2e7d32' },
];

let _dragCard   = null;
let _dragCardId = null;

function renderBoard() {
  const wrap = document.getElementById('kanbanBoard');
  if (!wrap) return;
  const projects = _cache.projects || [];

  wrap.innerHTML = KANBAN_COLS.map(col => {
    const cards = projects.filter(p => p.status === col.id);
    const totalAmt = cards.reduce((s, p) => {
      const sub = calcSubtotal(p.lines);
      return s + sub + Math.round(sub * (Number(window.CFG?.company?.taxRate) || 10) / 100);
    }, 0);

    const cardsHtml = cards.map(p => {
      const client = getClientById(p.clientId) || p._client || {};
      const sub    = calcSubtotal(p.lines);
      const grand  = sub + Math.round(sub * (Number(window.CFG?.company?.taxRate) || 10) / 100);
      const over   = p.dueDate && isOverdue(p.dueDate, p.status);
      const dueStr = p.dueDate ? p.dueDate.replace(/-/g, '/') : '';
      const dueClass = over ? 'overdue' : '';

      return `<div class="kanban-card${over ? ' overdue-card' : ''}"
        draggable="true"
        data-id="${p.id}"
        ondragstart="onCardDragStart(event,'${p.id}')"
        ondragend="onCardDragEnd(event)"
        onclick="openEditProject('${p.id}')">
        <div class="kanban-card-name">${p.name}</div>
        <div class="kanban-card-client">🏢 ${client.name || '—'}</div>
        <div class="kanban-card-meta">
          <span class="kanban-card-amount">¥${grand.toLocaleString()}</span>
          <span class="kanban-card-due ${dueClass}">${dueStr ? '📅 ' + dueStr : ''}</span>
        </div>
        ${p.manager ? `<div class="kanban-card-manager">👤 ${p.manager}</div>` : ''}
        ${over ? '<div style="font-size:10px;color:#ff5252;margin-top:4px">⚠️ 納期超過</div>' : ''}
      </div>`;
    }).join('');

    return `<div class="kanban-col"
      ondragover="onColDragOver(event)"
      ondragleave="onColDragLeave(event)"
      ondrop="onColDrop(event,'${col.id}')">
      <div class="kanban-col-header" style="background:${col.color}22;border-top:3px solid ${col.color}">
        <span style="color:${col.color}">${col.label}</span>
        <div style="display:flex;align-items:center;gap:6px">
          ${cards.length > 0 ? `<span style="font-size:10px;color:${col.color};font-family:monospace">¥${(totalAmt/10000).toFixed(0)}万</span>` : ''}
          <span class="kanban-count" style="background:${col.color}44;color:${col.color}">${cards.length}</span>
        </div>
      </div>
      <div class="kanban-col-body" id="col-${col.id}">
        ${cardsHtml}
        ${cards.length === 0 ? '<div style="text-align:center;font-size:12px;color:var(--muted);padding:20px 0;border:1px dashed #3a3a42;border-radius:6px">案件なし</div>' : ''}
      </div>
    </div>`;
  }).join('');
}

/* ── Drag & Drop ── */
function onCardDragStart(e, id) {
  _dragCardId = id;
  e.target.classList.add('dragging');
  e.dataTransfer.effectAllowed = 'move';
}
function onCardDragEnd(e) {
  e.target.classList.remove('dragging');
  document.querySelectorAll('.kanban-col').forEach(c => c.classList.remove('drag-over'));
}
function onColDragOver(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
  e.currentTarget.classList.add('drag-over');
}
function onColDragLeave(e) {
  e.currentTarget.classList.remove('drag-over');
}
async function onColDrop(e, newStatus) {
  e.preventDefault();
  e.currentTarget.classList.remove('drag-over');
  if (!_dragCardId) return;

  const p = (_cache.projects || []).find(x => x.id === _dragCardId);
  if (!p || p.status === newStatus) { _dragCardId = null; return; }

  const prev = p.status;
  p.status = newStatus;

  // 受注ステータスに変わった && 受注日未設定なら今日をセット
  const orderedStatuses = ['ordered','wip','delivered','invoiced','paid'];
  if (orderedStatuses.includes(newStatus) && !orderedStatuses.includes(prev) && !p.orderDate) {
    p.orderDate = new Date().toISOString().split('T')[0];
  }

  renderBoard();
  try {
    await dbSaveProject(p);
    toast(`「${p.name}」を「${KANBAN_COLS.find(c=>c.id===newStatus)?.label||newStatus}」に移動しました`, '🗂️', 'success');
  } catch(err) {
    p.status = prev;
    renderBoard();
    toast('更新に失敗しました', '❌');
  }
  _dragCardId = null;
}
