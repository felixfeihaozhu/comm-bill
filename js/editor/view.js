/**
 * 编辑器视图模块
 * 负责渲染编辑器 DOM 与面板布局
 * 不直接访问网络，不直接改全局路由
 */

import * as EditorState from './state.js';

// DOM 元素引用缓存
let elements = null;

/**
 * 初始化视图模块，缓存 DOM 元素引用
 */
function initView() {
    elements = {
        // 主容器
        appContainer: document.querySelector('.app-container'),
        editorContainer: document.getElementById('document-editor'),
        
        // 预览区
        paper: document.getElementById('invoice-paper'),
        previewItemsBody: document.getElementById('preview-items-body'),
        
        // 表单区
        paneForm: document.querySelector('.pane-form'),
        itemsContainer: document.getElementById('items-container'),
        
        // 同步状态
        syncDot: document.querySelector('.dot'),
        syncText: document.getElementById('sync-text'),
        
        // 标题
        appTitle: document.getElementById('app-title'),
        invoiceTitle: document.getElementById('invoice-title'),
        clientSubLabel: document.getElementById('client-sub-label'),
        
        // 面板切换元素
        clientDetailsWrapper: document.getElementById('client-details-wrapper'),
        invoiceInfoWrapper: document.getElementById('invoice-info-wrapper'),
        invoiceToggleIcon: document.getElementById('invoice-toggle-icon'),
        paymentWrapper: document.getElementById('payment-wrapper'),
        termsWrapper: document.getElementById('terms-wrapper'),
        cancellationWrapper: document.getElementById('cancellation-wrapper'),
        priceIncludesWrapper: document.getElementById('price-includes-wrapper'),
        remarksWrapper: document.getElementById('remarks-wrapper'),
        
        // 客户选择
        clientSelect: document.getElementById('clientSelect'),
        
        // 模式按钮
        btnModeBill: document.getElementById('btn-mode-bill'),
        btnModeQuote: document.getElementById('btn-mode-quote'),
        btnModeTicket: document.getElementById('btn-mode-ticket'),
        btnModeCompare: document.getElementById('btn-mode-compare'),
        
        // 报价模式专属
        quoteTableFooter: document.getElementById('quote-table-footer'),
        showQuoteTotals: document.getElementById('showQuoteTotals')
    };
    
    console.log('🎨 Editor View initialized');
}

/**
 * 获取 DOM 元素引用
 */
function getElements() {
    if (!elements) {
        initView();
    }
    return elements;
}

/**
 * 设置同步状态显示
 * @param {string} status - 'connected' | 'connecting' | 'offline'
 * @param {string} text - 显示文本
 */
function setStatus(status, text) {
    const els = getElements();
    if (els.syncDot) {
        els.syncDot.className = 'dot ' + status;
    }
    if (els.syncText) {
        // 使用多语言或直接设置文本
        if (typeof window.t === 'function') {
            if (status === 'connected') els.syncText.textContent = window.t('syncConnected');
            else if (status === 'connecting') els.syncText.textContent = window.t('syncConnecting');
            else if (status === 'offline') els.syncText.textContent = window.t('syncOffline');
            else els.syncText.textContent = text;
        } else {
            els.syncText.textContent = text;
        }
    }
}

/**
 * 更新模式相关的 UI
 * @param {string} mode - 当前模式
 */
function updateModeUI(mode) {
    const els = getElements();
    const t = window.t || (key => key);
    
    // 更新 body class（保留 crm-layout / editor-active / editor-page）
    const preserveClasses = ['crm-layout', 'editor-active', 'editor-page'];
    const currentClasses = Array.from(document.body.classList).filter(c => preserveClasses.includes(c));
    document.body.className = mode + '-mode';
    currentClasses.forEach(c => document.body.classList.add(c));
    
    // 更新模式按钮状态
    if (els.btnModeBill) els.btnModeBill.classList.toggle('active', mode === 'bill');
    if (els.btnModeQuote) els.btnModeQuote.classList.toggle('active', mode === 'quote');
    if (els.btnModeTicket) els.btnModeTicket.classList.toggle('active', mode === 'ticket');
    if (els.btnModeCompare) els.btnModeCompare.classList.toggle('active', mode === 'compare');
    
    // 更新 paper class
    if (els.paper) {
        els.paper.classList.remove('quote-mode', 'ticket-mode', 'compare-mode');
        if (mode !== 'bill') {
            els.paper.classList.add(mode + '-mode');
        }
    }
    
    // 更新表单区 class（对比模式）
    if (els.paneForm) {
        els.paneForm.classList.remove('compare-mode');
        if (mode === 'compare') els.paneForm.classList.add('compare-mode');
    }
    
    // 更新顶部标题
    if (els.appTitle) {
        const titleKeys = {
            bill: 'appTitle',
            quote: 'appTitleQuote',
            ticket: 'appTitleTicket',
            compare: 'appTitleCompare'
        };
        els.appTitle.setAttribute('data-i18n', titleKeys[mode] || 'appTitle');
        els.appTitle.textContent = t(titleKeys[mode] || 'appTitle');
    }
    
    // 更新预览区标题
    if (els.invoiceTitle) {
        const invoiceTitleKeys = {
            bill: 'invoiceTitle',
            quote: 'invoiceTitleQuote',
            ticket: 'invoiceTitleTicket',
            compare: 'invoiceTitleCompare'
        };
        els.invoiceTitle.setAttribute('data-i18n', invoiceTitleKeys[mode] || 'invoiceTitle');
        els.invoiceTitle.textContent = t(invoiceTitleKeys[mode] || 'invoiceTitle');
    }
    
    // 更新客户信息子标题
    if (els.clientSubLabel) {
        if (mode === 'bill') {
            els.clientSubLabel.setAttribute('data-i18n', 'subBillTo');
            els.clientSubLabel.textContent = t('subBillTo');
        } else {
            els.clientSubLabel.setAttribute('data-i18n', 'subClientTo');
            els.clientSubLabel.textContent = t('subClientTo');
        }
    }
}

/**
 * 更新浏览器标签页标题
 */
function updateDocumentTitle() {
    const mode = EditorState.getDocType();
    const t = window.t || (key => key);
    
    const titleKeys = {
        bill: 'appTitle',
        quote: 'appTitleQuote',
        ticket: 'appTitleTicket',
        compare: 'appTitleCompare'
    };
    
    document.title = t(titleKeys[mode] || 'appTitle');
}

/**
 * 渲染客户下拉列表
 * @param {Array} clients - 客户数组
 */
function renderClientSelect(clients) {
    const els = getElements();
    if (!els.clientSelect) return;
    
    const t = window.t || (key => key);
    
    els.clientSelect.innerHTML = `<option value="" data-i18n="selectClient">${t('selectClient')}</option>`;
    
    (clients || []).forEach((c, i) => {
        const typeIcons = { personal: '👤', company: '🏢', distributor: '🤝' };
        const typeIcon = typeIcons[c.customerType] || '👤';
        
        let label = c.tradeName || c.company || '未命名客户';
        if (c.company && c.tradeName && c.company !== c.tradeName) {
            label = `${c.tradeName} (${c.company})`;
        }
        label = `${typeIcon} ${label}`;
        
        const opt = document.createElement('option');
        opt.value = i;
        opt.text = label;
        els.clientSelect.appendChild(opt);
    });
}

/**
 * 渲染所有 datalist
 * @param {Object} data - { ships, routes, dbTypes, dbExps, dbPrices, dbAddons }
 */
function renderAllDatalists(data) {
    renderDatalist('shipList', data.ships);
    renderDatalist('routeList', data.routes);
    renderDatalist('dl-types', data.dbTypes);
    renderDatalist('dl-exps', data.dbExps);
    renderDatalist('dl-prices', data.dbPrices);
    renderDatalist('dl-addons', data.dbAddons);
}

/**
 * 渲染单个 datalist
 * @param {string} id - datalist ID
 * @param {Array} arr - 选项数组
 */
function renderDatalist(id, arr) {
    const dl = document.getElementById(id);
    if (!dl) return;
    
    dl.innerHTML = '';
    (arr || []).forEach(val => {
        const opt = document.createElement('option');
        opt.value = val;
        dl.appendChild(opt);
    });
}

/**
 * 切换面板显示状态
 * @param {string} panelName - 面板名称
 */
function togglePanel(panelName) {
    const els = getElements();
    
    const panelMap = {
        clientDetails: els.clientDetailsWrapper,
        invoiceInfo: els.invoiceInfoWrapper,
        payment: els.paymentWrapper,
        terms: els.termsWrapper,
        cancellation: els.cancellationWrapper,
        priceIncludes: els.priceIncludesWrapper,
        remarks: els.remarksWrapper
    };
    
    const wrapper = panelMap[panelName];
    if (!wrapper) return;
    
    const isOpen = wrapper.style.display !== 'none' && wrapper.style.display !== '';
    wrapper.style.display = isOpen ? 'none' : 'block';
    
    // 更新开票信息的图标
    if (panelName === 'invoiceInfo' && els.invoiceToggleIcon) {
        els.invoiceToggleIcon.textContent = isOpen ? '▶' : '▼';
    }
    
    // 更新状态
    EditorState.setPanelOpen(panelName, !isOpen);
}

/**
 * 设置面板显示状态
 * @param {string} panelName - 面板名称
 * @param {boolean} open - 是否打开
 */
function setPanelVisibility(panelName, open) {
    const els = getElements();
    
    const panelMap = {
        clientDetails: els.clientDetailsWrapper,
        invoiceInfo: els.invoiceInfoWrapper,
        payment: els.paymentWrapper,
        terms: els.termsWrapper,
        cancellation: els.cancellationWrapper,
        priceIncludes: els.priceIncludesWrapper,
        remarks: els.remarksWrapper
    };
    
    const wrapper = panelMap[panelName];
    if (!wrapper) return;
    
    wrapper.style.display = open ? 'block' : 'none';
    
    // 更新开票信息的图标
    if (panelName === 'invoiceInfo' && els.invoiceToggleIcon) {
        els.invoiceToggleIcon.textContent = open ? '▼' : '▶';
    }
    
    EditorState.setPanelOpen(panelName, open);
}

/**
 * 显示编辑器
 */
function showEditor() {
    const els = getElements();
    
    document.body.classList.add('editor-active');
    
    if (els.editorContainer && els.appContainer) {
        if (!els.editorContainer.contains(els.appContainer)) {
            els.editorContainer.appendChild(els.appContainer);
        }
        
        els.editorContainer.classList.add('active');
        els.editorContainer.style.display = 'block';
        els.appContainer.classList.add('editor-visible');
        els.appContainer.style.display = 'flex';
    }
    
    EditorState.setVisible(true);
    console.log('✅ Editor shown');
}

/**
 * 隐藏编辑器
 */
function hideEditor() {
    const els = getElements();
    
    document.body.classList.remove('editor-active');
    
    if (els.editorContainer) {
        els.editorContainer.classList.remove('active');
        els.editorContainer.style.display = 'none';
    }
    
    if (els.appContainer) {
        els.appContainer.classList.remove('editor-visible');
        els.appContainer.style.display = 'none';
    }
    
    EditorState.setVisible(false);
    console.log('✅ Editor hidden');
}

/**
 * 检查输入框是否有值并更新样式
 * @param {HTMLInputElement|HTMLTextAreaElement} input
 */
function checkInputHasValue(input) {
    const box = input.closest('.input-box');
    if (!box) return;
    
    if (input.value && input.value.trim() !== '') {
        box.classList.add('has-val');
    } else {
        box.classList.remove('has-val');
    }
}

/**
 * 更新表单区所有输入框的样式状态
 */
function updateAllInputStyles() {
    document.querySelectorAll('.pane-form .input-box input, .pane-form .input-box textarea').forEach(input => {
        checkInputHasValue(input);
    });
}

/**
 * 重置表单输入框样式
 */
function resetFormStyles() {
    document.querySelectorAll('.pane-form .input-box').forEach(box => {
        box.classList.remove('has-val');
    });
}

/**
 * 设置报价模式的折扣列显示状态
 * @param {boolean} hasDescuento - 是否有折扣
 */
function setDescuentoVisible(hasDescuento) {
    const els = getElements();
    if (els.paper) {
        if (hasDescuento) {
            els.paper.classList.add('has-descuento');
        } else {
            els.paper.classList.remove('has-descuento');
        }
    }
}

/**
 * 设置报价模式总价区域显示状态
 * @param {boolean} show - 是否显示
 */
function setQuoteTotalsVisible(show) {
    const els = getElements();
    if (els.quoteTableFooter) {
        if (show) {
            els.quoteTableFooter.classList.remove('hidden');
        } else {
            els.quoteTableFooter.classList.add('hidden');
        }
    }
}

/**
 * 格式化金额显示
 * @param {number} amount
 * @returns {string}
 */
function formatMoney(amount) {
    if (typeof window.formatMoney === 'function') {
        return window.formatMoney(amount);
    }
    return (amount || 0).toFixed(2);
}

// 导出
export {
    initView,
    getElements,
    setStatus,
    updateModeUI,
    updateDocumentTitle,
    renderClientSelect,
    renderAllDatalists,
    renderDatalist,
    togglePanel,
    setPanelVisibility,
    showEditor,
    hideEditor,
    checkInputHasValue,
    updateAllInputStyles,
    resetFormStyles,
    setDescuentoVisible,
    setQuoteTotalsVisible,
    formatMoney
};

// 挂载到 window 供调试
window.EditorView = {
    initView,
    getElements,
    setStatus,
    updateModeUI,
    updateDocumentTitle,
    renderClientSelect,
    renderAllDatalists,
    togglePanel,
    setPanelVisibility,
    showEditor,
    hideEditor,
    checkInputHasValue,
    updateAllInputStyles,
    resetFormStyles,
    setDescuentoVisible,
    setQuoteTotalsVisible,
    formatMoney
};

console.log('📦 Editor View 模块已加载');
