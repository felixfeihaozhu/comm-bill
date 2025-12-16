/**
 * CRM 导航模块
 * 管理侧边栏导航和视图切换
 */

// 当前活动视图
let currentView = 'documents';

// 当前单据类型
let currentDocType = 'bill';

// 编辑器是否显示
let isEditorVisible = false;

// 防止重复初始化
let isInitialized = false;

// 数据缓存（避免重复请求）
let dataCache = {
  bills: null,
  billsTimestamp: 0,
  customers: null,
  customersTimestamp: 0
};

// 缓存有效期（30秒）
const CACHE_TTL = 30000;

/**
 * 获取缓存的账单数据
 */
async function getCachedBills(forceRefresh = false) {
  const now = Date.now();
  if (!forceRefresh && dataCache.bills && (now - dataCache.billsTimestamp) < CACHE_TTL) {
    console.log('📦 使用缓存的账单数据');
    return dataCache.bills;
  }
  
  if (!window.SupabaseAPI?.bills?.list) return [];
  
  console.log('🔄 从服务器加载账单数据...');
  const bills = await window.SupabaseAPI.bills.list({ limit: 200 });
  dataCache.bills = bills;
  dataCache.billsTimestamp = now;
  return bills;
}

/**
 * 获取缓存的客户数据
 */
async function getCachedCustomers(forceRefresh = false) {
  const now = Date.now();
  if (!forceRefresh && dataCache.customers && (now - dataCache.customersTimestamp) < CACHE_TTL) {
    console.log('📦 使用缓存的客户数据');
    return dataCache.customers;
  }
  
  if (!window.SupabaseAPI?.customers?.list) return [];
  
  console.log('🔄 从服务器加载客户数据...');
  const customers = await window.SupabaseAPI.customers.list();
  dataCache.customers = customers;
  dataCache.customersTimestamp = now;
  return customers;
}

/**
 * 清除缓存（用于保存后刷新）
 */
function clearDataCache() {
  dataCache.bills = null;
  dataCache.billsTimestamp = 0;
  dataCache.customers = null;
  dataCache.customersTimestamp = 0;
}

// 视图配置
const views = {
  dashboard: { title: '数据概览', subtitle: '实时查看业务数据和趋势' },
  customers: { title: '客户管理', subtitle: '管理和跟踪所有客户信息' },
  documents: { title: '单据中心', subtitle: '账单、报价、票据统一管理' },
  tracking: { title: '邮轮订单跟踪', subtitle: '管理邮轮订单出发提醒、注意事项和船票发送' },
  finance: { title: '财务管理', subtitle: '管理账户和每日对账' },
  settings: { title: '系统设置', subtitle: '系统设置功能开发中...' }
};

// 单据类型映射到模式
const docTypeToMode = {
  all: 'bill',  // 默认使用账单模式
  bill: 'bill',
  quote: 'quote',
  ticket: 'ticket',
  compare: 'compare'
};

/**
 * 初始化 CRM 导航
 */
function initCRMNav() {
  // 防止重复初始化
  if (isInitialized) {
    console.log('⚠️ CRM Nav already initialized, skipping');
    return;
  }
  isInitialized = true;
  
  console.log('🚀 Initializing CRM Nav...');
  
  // 绑定导航点击事件
  document.querySelectorAll('.crm-nav-item').forEach(item => {
    item.addEventListener('click', () => {
      const view = item.dataset.view;
      console.log('📌 Nav item clicked:', view);
      if (view) switchView(view);
    });
  });

  // 绑定单据类型 tab 点击事件
  document.querySelectorAll('.doc-type-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const type = tab.dataset.type;
      console.log('📋 Doc type tab clicked:', type);
      if (type) filterDocuments(type);
    });
  });

  // 默认显示单据中心（列表模式）- 但不关闭已打开的编辑器
  if (!isEditorVisible) {
    switchView('documents');
  }
  
  // 绑定顶部工具栏按钮事件
  initEditorToolbar();
  
  console.log('✅ CRM Nav initialized');
}

/**
 * 初始化编辑器顶部工具栏
 */
function initEditorToolbar() {
  // 模式切换按钮
  document.querySelectorAll('#header-mode-tabs .mode-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const mode = btn.dataset.mode;
      if (mode && typeof window.switchMode === 'function') {
        // 更新按钮状态
        document.querySelectorAll('#header-mode-tabs .mode-btn').forEach(b => {
          b.classList.toggle('active', b.dataset.mode === mode);
        });
        // 同步更新 currentDocType
        currentDocType = mode;
        // 切换模式
        window.switchMode(mode);
      }
    });
  });
  
  // 重置按钮
  const btnReset = document.getElementById('header-btn-reset');
  if (btnReset) {
    btnReset.addEventListener('click', () => {
      if (typeof window.resetForm === 'function') {
        window.resetForm();
      }
    });
  }
  
  // 保存按钮
  const btnSave = document.getElementById('header-btn-save');
  if (btnSave) {
    btnSave.addEventListener('click', () => {
      if (typeof window.saveBillToDatabase === 'function') {
        window.saveBillToDatabase();
      }
    });
  }
  
  // 打印按钮
  const btnPrint = document.getElementById('header-btn-print');
  if (btnPrint) {
    btnPrint.addEventListener('click', () => {
      window.print();
    });
  }
}

/**
 * 切换视图
 */
function switchView(viewName) {
  console.log('🔄 Switching view to:', viewName);
  
  if (!views[viewName]) {
    console.warn('⚠️ Unknown view:', viewName);
    return;
  }

  currentView = viewName;

  // 更新导航高亮
  document.querySelectorAll('.crm-nav-item').forEach(item => {
    item.classList.toggle('active', item.dataset.view === viewName);
  });

  // 更新页面标题
  const titleEl = document.querySelector('.crm-page-title');
  const subtitleEl = document.querySelector('.crm-page-subtitle');
  if (titleEl) titleEl.textContent = views[viewName].title;
  if (subtitleEl) subtitleEl.textContent = views[viewName].subtitle;

  // 切换视图显示
  document.querySelectorAll('.crm-view').forEach(view => {
    view.classList.toggle('active', view.id === `view-${viewName}`);
  });

  // 非单据中心视图时，关闭编辑器
  if (viewName !== 'documents' && isEditorVisible) {
    hideDocumentEditor();
  }

  // 更新 URL hash
  history.replaceState(null, '', `#${viewName}`);
  
  // 加载视图数据
  if (viewName === 'dashboard') {
    loadDashboardData();
  } else if (viewName === 'customers') {
    loadCustomersList();
  } else if (viewName === 'documents') {
    loadDocumentsList(currentDocType);
    updateDocTypeCounts();
  }
}

/**
 * 筛选单据类型
 */
function filterDocuments(type) {
  console.log('📋 Filtering documents by type:', type);
  
  currentDocType = type;
  
  // 更新 tab 高亮
  document.querySelectorAll('.doc-type-tab').forEach(tab => {
    tab.classList.toggle('active', tab.dataset.type === type);
  });
  
  // 如果编辑器正在显示，切换到对应模式
  if (isEditorVisible && docTypeToMode[type]) {
    const mode = docTypeToMode[type];
    console.log('🔀 Editor is active, switching to mode:', mode);
    if (typeof window.switchMode === 'function') {
      window.switchMode(mode);
    }
  }
  
  // 重新加载并筛选列表
  loadDocumentsList(type);
}

/**
 * 创建新单据
 * 跳转到独立编辑器页面
 */
function createNewDocument() {
  console.log('📝 Creating new document, current type:', currentDocType);
  
  const mode = docTypeToMode[currentDocType] || 'bill';
  console.log('🎯 Target mode:', mode);
  
  // 跳转到独立编辑器页面
  showDocumentEditor(mode, null, 'create');
}

/**
 * 显示单据编辑器（跳转到独立编辑器页面）
 * @param {string} type - 单据类型 bill/quote/ticket/compare
 * @param {string} id - 单据ID（编辑模式）
 * @param {string} mode - create/edit
 */
function showDocumentEditor(type, id, mode) {
  console.log('📝 showDocumentEditor -> 跳转独立编辑器页面');
  
  const docType = type || docTypeToMode[currentDocType] || 'bill';
  const editorMode = mode || 'create';
  
  // 构建编辑器页面 hash
  let hash = `#editor?type=${docType}&mode=${editorMode}`;
  if (id) {
    hash += `&id=${id}`;
  }
  
  // 跳转到独立编辑器页面
  window.location.hash = hash;
}

/**
 * 隐藏单据编辑器（返回单据中心）
 */
function hideDocumentEditor() {
  console.log('📝 hideDocumentEditor -> 返回单据中心');
  
  isEditorVisible = false;
  
  // 跳转回单据中心
  window.location.hash = '#documents';
}

/**
 * 获取当前视图
 */
function getCurrentView() {
  return currentView;
}

/**
 * 获取当前单据类型
 */
function getCurrentDocType() {
  return currentDocType;
}

/**
 * 更新单据类型计数（使用缓存）
 */
async function updateDocTypeCounts() {
  try {
    const bills = await getCachedBills();
    
    // 统计各类型数量
    const counts = { all: bills.length, bill: 0, quote: 0, ticket: 0, compare: 0 };
    
    bills.forEach(b => {
      const mode = b.mode || 'bill';
      if (counts.hasOwnProperty(mode)) {
        counts[mode]++;
      }
    });
    
    // 更新 UI
    Object.keys(counts).forEach(type => {
      const el = document.getElementById(`doc-count-${type}`);
      if (el) el.textContent = counts[type];
    });
  } catch (err) {
    console.error('更新单据计数失败:', err);
  }
}

/**
 * 加载仪表盘数据（使用缓存）
 */
async function loadDashboardData() {
  try {
    // 并行获取数据（使用缓存）
    const [customers, bills] = await Promise.all([
      getCachedCustomers(),
      getCachedBills()
    ]);
    
    // 更新客户数量
    const customerCountEl = document.getElementById('stat-customers');
    if (customerCountEl) customerCountEl.textContent = customers.length;

    // 更新账单数量
    const billCountEl = document.getElementById('stat-bills');
    if (billCountEl) billCountEl.textContent = bills.length;

    // 计算本月账单
    const now = new Date();
    const thisMonth = bills.filter(b => {
      const date = new Date(b.created_at);
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    });
    const monthBillsEl = document.getElementById('stat-month-bills');
    if (monthBillsEl) monthBillsEl.textContent = thisMonth.length;

    // 计算总金额
    const totalAmount = bills.reduce((sum, b) => sum + (parseFloat(b.total_amount) || 0), 0);
    const totalAmountEl = document.getElementById('stat-total-amount');
    if (totalAmountEl) totalAmountEl.textContent = `€${totalAmount.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;

    // 加载最近账单
    loadRecentBills(bills.slice(0, 5));
  } catch (err) {
    console.error('加载仪表盘数据失败:', err);
  }
}

/**
 * 加载最近账单到仪表盘
 */
function loadRecentBills(bills) {
  const tbody = document.getElementById('dashboard-recent-bills');
  if (!tbody) return;
  
  if (bills.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:40px;color:#9ca3af;">暂无数据</td></tr>';
    return;
  }
  
  tbody.innerHTML = bills.map((b, i) => {
    const modeMap = { bill: '账单', quote: '报价', ticket: '票据', compare: '对比' };
    const statusMap = { draft: { text: '草稿', class: 'gray' }, confirmed: { text: '已确认', class: 'green' }, cancelled: { text: '已取消', class: 'orange' } };
    const status = statusMap[b.status] || statusMap.draft;
    
    return `
      <tr onclick="window.openBillInEditor?.('${b.id}')">
        <td>${i + 1}</td>
        <td>${b.created_at ? new Date(b.created_at).toLocaleDateString() : '-'}</td>
        <td style="color:#2563eb;font-weight:500;">${b.customer_name || '-'}</td>
        <td>#${b.bill_no || '-'}</td>
        <td>${modeMap[b.mode] || b.mode || '账单'}</td>
        <td style="font-weight:600;">€${(b.total_amount || 0).toFixed(2)}</td>
        <td><span class="crm-tag ${status.class}">${status.text}</span></td>
      </tr>
    `;
  }).join('');
}

/**
 * 加载客户列表（使用缓存）
 */
async function loadCustomersList() {
  const listEl = document.getElementById('customers-table-body');
  if (!listEl) return;

  listEl.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:40px;color:#9ca3af;">加载中...</td></tr>';

  try {
    const customers = await getCachedCustomers();
    
    if (customers.length === 0) {
      listEl.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:40px;color:#9ca3af;">暂无客户数据</td></tr>';
      return;
    }

    listEl.innerHTML = customers.map(c => {
      const typeIcons = { personal: '👤', company: '🏢', distributor: '🤝' };
      const icon = typeIcons[c.customer_type] || '👤';
      const initial = (c.name || c.trade_name || 'U')[0].toUpperCase();
      
      return `
        <tr onclick="openCustomerDetail?.('${c.id}')">
          <td>
            <div style="display:flex;align-items:center;gap:12px;">
              <div style="width:36px;height:36px;border-radius:50%;background:#dbeafe;color:#2563eb;display:flex;align-items:center;justify-content:center;font-weight:600;">${initial}</div>
              <div>
                <div style="font-weight:500;">${c.name || c.trade_name || '-'}</div>
                <div style="font-size:12px;color:#6b7280;">${c.address || '-'}</div>
              </div>
            </div>
          </td>
          <td>
            <div>${c.contact || '-'}</div>
          </td>
          <td>0</td>
          <td>€0</td>
          <td><span class="crm-tag green">活跃</span></td>
          <td>-</td>
        </tr>
      `;
    }).join('');
  } catch (err) {
    console.error('加载客户列表失败:', err);
    listEl.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:40px;color:#dc2626;">加载失败</td></tr>';
  }
}

/**
 * 加载单据列表（使用缓存）
 */
async function loadDocumentsList(filterType = 'all') {
  const listEl = document.getElementById('documents-table-body');
  if (!listEl) return;

  listEl.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:40px;color:#9ca3af;">加载中...</td></tr>';

  try {
    const bills = await getCachedBills();
    
    // 筛选
    let filtered = bills;
    if (filterType && filterType !== 'all') {
      filtered = bills.filter(b => (b.mode || 'bill') === filterType);
    }
    
    if (filtered.length === 0) {
      listEl.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:40px;color:#9ca3af;">暂无单据</td></tr>';
      return;
    }

    listEl.innerHTML = filtered.map((b, i) => {
      const modeMap = { bill: '🧾 账单', quote: '📝 报价', ticket: '🎫 票据', compare: '📊 对比' };
      const statusMap = { draft: { text: '草稿', class: 'gray' }, confirmed: { text: '已确认', class: 'green' }, cancelled: { text: '已取消', class: 'orange' } };
      const status = statusMap[b.status] || statusMap.draft;
      
      return `
        <tr onclick="window.openBillInEditor?.('${b.id}')">
          <td>${i + 1}</td>
          <td>${b.created_at ? new Date(b.created_at).toLocaleDateString() : '-'}</td>
          <td style="color:#2563eb;font-weight:500;">${b.customer_name || '-'}</td>
          <td>#${b.bill_no || '-'}</td>
          <td>${modeMap[b.mode] || modeMap.bill}</td>
          <td>${b.route || '-'}</td>
          <td style="font-weight:600;">€${(b.total_amount || 0).toFixed(2)}</td>
          <td><span class="crm-tag ${status.class}">${status.text}</span></td>
        </tr>
      `;
    }).join('');
  } catch (err) {
    console.error('加载单据列表失败:', err);
    listEl.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:40px;color:#dc2626;">加载失败</td></tr>';
  }
}

/**
 * 打开账单到编辑器（查看/编辑已有单据）
 * @param {string} billId - 单据ID
 * @param {string} docType - 单据类型（可选，默认根据单据数据判断）
 */
async function openBillInEditor(billId, docType) {
  console.log('📂 Opening bill in editor:', billId);
  
  // 如果没有指定类型，尝试从缓存获取
  let type = docType;
  if (!type && dataCache.bills) {
    const bill = dataCache.bills.find(b => b.id === billId);
    if (bill) {
      type = bill.mode || 'bill';
    }
  }
  type = type || 'bill';
  
  // 跳转到独立编辑器页面
  showDocumentEditor(type, billId, 'edit');
}

// 导出到 window
window.initCRMNav = initCRMNav;
window.switchView = switchView;
window.getCurrentView = getCurrentView;
window.getCurrentDocType = getCurrentDocType;
window.filterDocuments = filterDocuments;
window.createNewDocument = createNewDocument;
window.showDocumentEditor = showDocumentEditor;
window.hideDocumentEditor = hideDocumentEditor;
window.loadDashboardData = loadDashboardData;
window.loadCustomersList = loadCustomersList;
window.loadDocumentsList = loadDocumentsList;
window.updateDocTypeCounts = updateDocTypeCounts;
window.openBillInEditor = openBillInEditor;
window.clearDataCache = clearDataCache;  // 保存后清除缓存用

// 路由状态防重入
let lastProcessedHash = '';
let isNavigating = false;
let editorInitialized = false;
let userTriggeredExit = false;  // 用户触发的退出标志
let exitWarningShown = false;   // 防止刷屏警告

/**
 * 解析 hash 参数
 */
function parseHashParams(hash) {
  const params = {};
  const queryStart = hash.indexOf('?');
  if (queryStart === -1) return params;
  
  const queryString = hash.substring(queryStart + 1);
  queryString.split('&').forEach(pair => {
    const [key, value] = pair.split('=');
    if (key) params[decodeURIComponent(key)] = decodeURIComponent(value || '');
  });
  return params;
}

/**
 * 处理 hash 路由变化
 */
function handleHashChange() {
  const hash = window.location.hash || '#documents';
  
  // 防重入：如果正在处理或 hash 未变化，跳过
  if (isNavigating || hash === lastProcessedHash) {
    return;
  }
  
  isNavigating = true;
  lastProcessedHash = hash;
  
  console.log('🔀 Route:', hash);
  
  try {
    // 编辑器页面
    if (hash.startsWith('#editor')) {
      const params = parseHashParams(hash);
      const type = params.type || 'bill';
      const id = params.id || null;
      const mode = params.mode || (id ? 'edit' : 'create');
      
      console.log('📝 Enter editor:', { type, id, mode });
      enterEditorPage(type, id, mode);
    } else {
      // CRM 视图 - hash 已变化，强制退出编辑器
      const viewName = hash.substring(1).split('?')[0] || 'documents';
      
      console.log('📋 Enter CRM view:', viewName);
      exitEditorPage(true);  // force=true 因为 hash 已经变化
      
      if (views[viewName]) {
        switchView(viewName);
      } else {
        switchView('documents');
      }
    }
  } finally {
    isNavigating = false;
  }
}

/**
 * 进入独立编辑器页面
 */
async function enterEditorPage(type, id, mode) {
  isEditorVisible = true;
  editorInitialized = false;
  
  // 1. 切换 body class
  document.body.classList.remove('crm-layout');
  document.body.classList.add('editor-page');
  
  // 2. 隐藏 CRM 容器，显示编辑器容器
  const crmApp = document.querySelector('.crm-app');
  const appContainer = document.querySelector('.app-container');
  
  if (crmApp) crmApp.style.display = 'none';
  if (appContainer) appContainer.style.display = 'flex';
  
  // 3. 初始化编辑器（只执行一次）
  if (!editorInitialized) {
    editorInitialized = true;
    
    if (window.Editor && typeof window.Editor.init === 'function') {
      await window.Editor.init({ 
        docType: type, 
        docId: id, 
        mode: mode 
      });
    } else {
      // 回退到旧逻辑
      if (typeof window.switchMode === 'function') {
        await window.switchMode(type);
      }
      
      if (id && typeof window.openBill === 'function') {
        await window.openBill(id);
      } else if (typeof window.prepareNewDocument === 'function') {
        window.prepareNewDocument();
      }
    }
  }
}

/**
 * 退出编辑器页面，返回 CRM
 * @param {boolean} force - 是否强制退出（用于路由变化时）
 */
function exitEditorPage(force = false) {
  if (!document.body.classList.contains('editor-page')) return;
  
  // 检查是否是用户触发的退出（仅当 hash 仍是 #editor 时需要检查）
  if (!force && window.location.hash.startsWith('#editor')) {
    if (!userTriggeredExit) {
      if (!exitWarningShown) {
        console.warn('⚠️ exitEditorPage blocked: non-user triggered exit while in #editor');
        exitWarningShown = true;
      }
      return;
    }
  }
  
  isEditorVisible = false;
  editorInitialized = false;
  userTriggeredExit = false;
  exitWarningShown = false;
  
  // 1. 切换 body class
  document.body.classList.remove('editor-page');
  document.body.classList.add('crm-layout');
  
  // 2. 显示 CRM 容器，隐藏编辑器容器
  const crmApp = document.querySelector('.crm-app');
  const appContainer = document.querySelector('.app-container');
  
  if (crmApp) crmApp.style.display = '';
  if (appContainer) appContainer.style.display = 'none';
  
  // 3. 清除缓存以刷新列表
  clearDataCache();
}

/**
 * 返回单据列表（供编辑器内按钮调用 - 用户触发）
 */
function backToDocuments() {
  userTriggeredExit = true;  // 标记为用户触发
  const targetHash = '#documents';
  if (window.location.hash !== targetHash) {
    window.location.hash = targetHash;
  }
}

// 导出返回函数
window.backToDocuments = backToDocuments;

// DOM 加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
  console.log('📌 DOM loaded, waiting for user login...');
  
  // 监听 hash 变化
  window.addEventListener('hashchange', handleHashChange);
  
  // 监听用户登录事件
  window.addEventListener('userRoleLoaded', () => {
    console.log('👤 User logged in, initializing CRM nav...');
    
    // 延迟初始化确保其他模块已就绪
    setTimeout(async () => {
      initCRMNav();
      
      // 并行加载所有数据（使用缓存，只会请求一次）
      console.log('🔄 开始加载数据...');
      const startTime = Date.now();
      
      await Promise.all([
        loadDashboardData(),
        loadCustomersList(),
        loadDocumentsList(),
        updateDocTypeCounts()
      ]);
      
      console.log(`✅ 数据加载完成，耗时 ${Date.now() - startTime}ms`);
      
      // 处理初始 hash（重置状态避免跳过）
      lastProcessedHash = '';
      handleHashChange();
    }, 100);
  });
});


