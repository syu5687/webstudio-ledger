
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
  await Promise.all([dbFetchProjects(), dbFetchClients(), dbFetchDomains()]);
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
  ['ledger','orders','invoice','clients','domains','company'].forEach(v => {
    const el = document.getElementById('view-'+v);
    if (el) el.style.display = v === view ? '' : 'none';
  });
  document.querySelectorAll('.nav-item[data-view]').forEach(el => {
    el.classList.toggle('active', el.dataset.view === view);
  });
  const titles = { ledger:'案件台帳', orders:'受注管理', invoice:'見積・請求書', clients:'取引先', domains:'ドメイン管理', company:'自社情報設定' };
  document.getElementById('pageTitle').textContent = titles[view] || '';
  document.getElementById('newProjectBtn').style.display = view === 'ledger' ? '' : 'none';
  if (view === 'orders') renderOrdersTable();
  if (view === 'company') applyConfigToForm();
  if (view === 'domains') renderDomains();
}

/* ── KPI ── */
function updateKPI() {
  const projects = _cache.projects;
  const statuses = ['all','ordered','wip','delivered','invoiced','paid'];
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
  if (['invoiced','paid','delivered'].includes(status)) return false;
  return new Date(dateStr) < new Date();
}

function statusBadge(s) {
  const map = { ordered:'受注', wip:'作業中', delivered:'納品済', invoiced:'請求済', paid:'領収済' };
  return `<span class="badge badge-${s}">${map[s] || s}</span>`;
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
  ['ordered','wip'].forEach(s => {
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
    return ['ordered','wip'].includes(p.status) &&
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
    const labels = { wip:'作業中', delivered:'納品済', invoiced:'請求済', paid:'領収済' };
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
  document.getElementById('p-status').value = 'ordered';
  document.getElementById('p-name').value = '';
  document.getElementById('p-manager').value = '';
  document.getElementById('p-order-date').value = today;
  document.getElementById('p-due-date').value = '';
  document.getElementById('p-desc').value = '';
  document.getElementById('p-memo').value = '';
  document.getElementById('p-est-no').value = estNo;
  document.getElementById('p-inv-no').value = invNo;

  populateClientSelect();
  clearLineItems();
  addLineItem();
  updateStatusFlow('ordered');
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
  document.getElementById('p-status').value = s;
  updateStatusFlow(s);
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
