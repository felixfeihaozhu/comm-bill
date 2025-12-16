/**
 * 编辑器入口模块
 * 负责初始化、事件绑定、调用 state/view/api
 */

import * as EditorState from './state.js';
import * as EditorAPI from './api.js';
import * as EditorView from './view.js';

// 是否已初始化
let isInitialized = false;

// 默认项目模板
const defaultItem = {
    name: "",
    ref: "",
    type: "",
    exp: "",
    price: "",
    qty: "",
    base: "",
    tax: "",
    hsc: "",
    rate: "",
    extra: "",
    descuento: "",
    descuentoPercent: "",
    addons: []
};

/**
 * 初始化编辑器
 * @param {Object} options - { docType, docId, mode }
 */
async function initEditor(options = {}) {
    console.log('🚀 initEditor called with:', options);
    
    // 初始化视图
    EditorView.initView();
    
    const docType = options.docType || 'bill';
    const docId = options.docId || null;
    const editMode = options.mode || (docId ? 'edit' : 'create');
    
    // 设置初始状态
    EditorState.initState({
        docType: docType,
        docId: docId,
        mode: editMode
    });
    
    // 如果有 docId，加载已有文档
    if (docId) {
        // 使用现有的 openBill 函数（它会自动切换模式）
        if (typeof window.openBill === 'function') {
            await window.openBill(docId);
        } else {
            await loadDocument(docId);
        }
    } else {
        // 新建模式：切换到指定模式并重置表单
        if (typeof window.switchMode === 'function') {
            await window.switchMode(docType);
        }
        
        // 静默重置表单（不显示确认框）
        if (typeof window.prepareNewDocument === 'function') {
            window.prepareNewDocument();
        }
    }
    
    // 更新模式 UI
    EditorView.updateModeUI(EditorState.getDocType());
    EditorView.updateDocumentTitle();
    
    console.log('✅ Editor initialized');
}

/**
 * 初始化编辑器核心逻辑（在用户登录后调用）
 * @param {Object} storageRefs - 存储引用 { db, ref, set, onValue, get }
 */
function initEditorCore(storageRefs) {
    if (isInitialized) {
        console.log('⚠️ Editor already initialized');
        return;
    }
    
    // 初始化 API
    EditorAPI.initAPI(storageRefs);
    
    // 初始化视图
    EditorView.initView();
    
    // 绑定事件
    bindEditorEvents();
    
    isInitialized = true;
    console.log('✅ Editor core initialized');
}

/**
 * 绑定编辑器事件
 */
function bindEditorEvents() {
    // 面板切换按钮事件已在 HTML 中通过 onclick 绑定
    // 这里可以添加其他需要动态绑定的事件
    
    // 订阅状态变化
    EditorState.subscribe((state, changedKeys) => {
        // 根据变化的键做出响应
        if (changedKeys.includes('docType')) {
            EditorView.updateModeUI(state.docType);
            EditorView.updateDocumentTitle();
        }
        
        if (changedKeys.includes('isLoading') || changedKeys.includes('isSaving')) {
            updateStatusIndicator(state);
        }
    });
}

/**
 * 更新状态指示器
 */
function updateStatusIndicator(state) {
    if (state.isLoading) {
        EditorView.setStatus('connecting', '加载中...');
    } else if (state.isSaving) {
        EditorView.setStatus('connecting', '保存中...');
    } else if (state.isUserLoggedIn) {
        EditorView.setStatus('connected', '已同步');
    } else {
        EditorView.setStatus('offline', '未连接');
    }
}

/**
 * 切换文档类型/模式
 * 注意：这个函数主要用于编辑器内部调用
 * 外部应该使用 window.switchMode（main.js 中定义的）
 * @param {string} mode - 'bill' | 'quote' | 'ticket' | 'compare'
 */
async function switchMode(mode) {
    console.log('🔄 Editor.switchMode:', mode);
    
    // 更新编辑器状态
    EditorState.setDocType(mode);
    
    // 调用 main.js 中的 switchMode（它会处理配置加载、UI更新等）
    if (typeof window.switchMode === 'function') {
        await window.switchMode(mode);
    } else {
        // 如果 main.js 的 switchMode 不可用，使用编辑器自己的逻辑
        const config = await EditorAPI.loadConfig(mode);
        
        if (config) {
            window.clients = config.clients || [];
            window.ships = config.ships || [];
            window.routes = config.routes || [];
            window.dbTypes = config.cabinTypes || [];
            window.dbExps = config.experienceTypes || [];
            window.dbPrices = config.priceTypes || [];
            window.dbAddons = config.addonProducts || [];
            
            EditorView.renderClientSelect(window.clients);
            EditorView.renderAllDatalists({
                ships: window.ships,
                routes: window.routes,
                dbTypes: window.dbTypes,
                dbExps: window.dbExps,
                dbPrices: window.dbPrices,
                dbAddons: window.dbAddons
            });
        }
        
        EditorView.updateModeUI(mode);
        EditorView.updateDocumentTitle();
        localStorage.setItem('viewMode', mode);
    }
}

/**
 * 加载文档
 * @param {string} docId - 文档UUID
 */
async function loadDocument(docId) {
    console.log('📂 loadDocument:', docId);
    
    try {
        EditorState.setLoading(true);
        EditorView.setStatus('connecting', '加载中...');
        
        const { bill, items } = await EditorAPI.loadBillFromDatabase(docId);
        
        // 填充表单数据（调用现有的填充逻辑）
        fillFormWithBillData(bill, items);
        
        // 切换到对应模式
        if (bill.mode && bill.mode !== EditorState.getDocType()) {
            await switchMode(bill.mode);
        }
        
        EditorView.setStatus('connected', '已加载');
        console.log('✅ Document loaded');
    } catch (err) {
        console.error('❌ Failed to load document:', err);
        EditorView.setStatus('offline', '加载失败');
        throw err;
    } finally {
        EditorState.setLoading(false);
    }
}

/**
 * 填充表单数据
 * @param {Object} bill - 账单主表数据
 * @param {Array} items - 明细行数组
 */
function fillFormWithBillData(bill, items) {
    // 填充基础字段
    const fields = {
        invNo: bill.bill_no || '',
        invDate: bill.bill_date || '',
        billTradeName: bill.customer_name || '',
        billContact: bill.customer_contact || '',
        billCompany: bill.customer_company || '',
        billTaxId: bill.customer_tax_id || '',
        billAddress: bill.customer_address || '',
        billDefaultRate: bill.default_rate || 0,
        billAddonRate: bill.addon_rate || 0,
        ship: bill.ship || '',
        route: bill.route || '',
        sailingStart: bill.sailing_start || '',
        sailingEnd: bill.sailing_end || '',
        payment: bill.payment || '',
        remarks: bill.remarks || '',
        termsConditions: bill.terms_conditions || '',
        cancellationPolicy: bill.cancellation_policy || '',
        priceIncludes: bill.price_includes || ''
    };
    
    Object.entries(fields).forEach(([id, value]) => {
        const el = document.getElementById(id);
        if (el) {
            el.value = value;
            EditorView.checkInputHasValue(el);
        }
    });
    
    // 设置项目数据
    window.items = items.length > 0 ? items : [{ ...defaultItem, addons: [] }];
    EditorState.setItems(window.items);
    
    // 渲染项目输入
    if (typeof window.renderItemInputs === 'function') {
        window.renderItemInputs();
    }
    
    // 更新预览
    if (typeof window.updateState === 'function') {
        window.updateState();
    }
}

/**
 * 保存文档
 */
async function saveDocument() {
    console.log('💾 saveDocument called');
    
    if (typeof window.saveBillToDatabase === 'function') {
        await window.saveBillToDatabase();
    }
}

/**
 * 重置编辑器（创建新文档）
 */
function resetEditor() {
    console.log('🔄 resetEditor called');
    
    EditorState.resetState();
    
    // 调用现有的重置逻辑
    if (typeof window.prepareNewDocument === 'function') {
        window.prepareNewDocument();
    }
}

/**
 * 关闭编辑器
 */
function closeEditor() {
    console.log('✖️ closeEditor called');
    
    // 检查是否有未保存的更改
    if (EditorState.isDirty()) {
        const t = window.t || (key => key);
        if (!confirm(t('confirmUnsavedChanges') || '有未保存的更改，确定要关闭吗？')) {
            return false;
        }
    }
    
    EditorView.hideEditor();
    EditorState.setVisible(false);
    
    // 调用 CRM 导航的隐藏函数
    if (typeof window.hideDocumentEditor === 'function') {
        window.hideDocumentEditor();
    }
    
    return true;
}

/**
 * 打印文档
 */
function printDocument() {
    const invNo = document.getElementById('invNo')?.value?.trim();
    const oldTitle = document.title;
    
    if (invNo) {
        document.title = `邮轮账单 ${invNo}`;
    } else {
        document.title = `邮轮账单`;
    }
    
    window.print();
    
    setTimeout(() => {
        document.title = oldTitle;
    }, 500);
}

/**
 * 设置用户登录状态
 * @param {boolean} loggedIn
 * @param {Object} userInfo - { role, userId }
 */
function setUserLoggedIn(loggedIn, userInfo = {}) {
    EditorState.setUserLoggedIn(loggedIn, userInfo);
    
    if (loggedIn) {
        EditorView.setStatus('connected', '已连接');
    } else {
        EditorView.setStatus('offline', '未连接');
    }
}

/**
 * 获取当前模式
 */
function getCurrentMode() {
    return EditorState.getDocType();
}

/**
 * 获取编辑器是否可见
 */
function isEditorVisible() {
    return EditorState.isVisible();
}

// 导出
export {
    initEditor,
    initEditorCore,
    switchMode,
    loadDocument,
    saveDocument,
    resetEditor,
    closeEditor,
    printDocument,
    setUserLoggedIn,
    getCurrentMode,
    isEditorVisible,
    defaultItem
};

// 挂载到 window
window.Editor = {
    init: initEditor,
    initCore: initEditorCore,
    switchMode,
    loadDocument,
    saveDocument,
    reset: resetEditor,
    close: closeEditor,
    print: printDocument,
    setUserLoggedIn,
    getCurrentMode,
    isVisible: isEditorVisible,
    // 子模块
    State: EditorState,
    API: EditorAPI,
    View: EditorView
};

console.log('📦 Editor 入口模块已加载');

