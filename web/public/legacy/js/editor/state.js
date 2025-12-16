/**
 * 编辑器状态管理模块
 * 集中管理编辑器状态：当前docType、docId、mode、dirty、panel布局状态等
 */

// 允许关闭编辑器的原因
const ALLOWED_CLOSE_REASONS = ['user_close', 'user_navigate', 'logout'];

// 状态对象
const editorState = {
    // 文档类型: 'bill' | 'quote' | 'ticket' | 'compare'
    docType: 'bill',
    
    // 当前编辑的文档ID（UUID），null 表示新建
    docId: null,
    
    // 编辑模式: 'create' | 'edit' | 'view'
    mode: 'create',
    
    // 是否有未保存的更改
    dirty: false,
    
    // 编辑器是否可见
    visible: false,
    
    // 编辑器会话锁（防止非用户操作关闭编辑器）
    sessionLocked: false,
    
    // 会话ID（用于追踪）
    sessionId: null,
    
    // 右侧输入区是否可见
    inputPaneVisible: true,
    
    // 正在从远程加载数据
    isLoading: false,
    
    // 正在保存数据
    isSaving: false,
    
    // 用户是否已登录
    isUserLoggedIn: false,
    
    // 当前用户角色
    userRole: null,
    
    // 当前用户ID
    userId: null,
    
    // 面板展开状态
    panels: {
        clientDetails: false,
        invoiceInfo: false,
        payment: false,
        terms: false,
        cancellation: false,
        priceIncludes: false,
        remarks: false
    },
    
    // 项目数据（明细行）
    items: [],
    
    // 配置数据
    config: null,
    
    // 配置缓存（按模式）
    configCache: {}
};

// 订阅者列表
const subscribers = [];

/**
 * 订阅状态变化
 * @param {Function} callback - 回调函数，接收 (newState, changedKeys)
 * @returns {Function} - 取消订阅函数
 */
function subscribe(callback) {
    subscribers.push(callback);
    return () => {
        const index = subscribers.indexOf(callback);
        if (index > -1) {
            subscribers.splice(index, 1);
        }
    };
}

/**
 * 通知所有订阅者
 * @param {string[]} changedKeys - 变化的键
 */
function notifySubscribers(changedKeys) {
    subscribers.forEach(callback => {
        try {
            callback(editorState, changedKeys);
        } catch (err) {
            console.error('State subscriber error:', err);
        }
    });
}

/**
 * 获取当前状态
 * @param {string} [key] - 可选，指定获取某个键
 * @returns {*}
 */
function getState(key) {
    if (key) {
        return editorState[key];
    }
    return { ...editorState };
}

/**
 * 设置状态
 * @param {Object} updates - 要更新的状态对象
 */
function setState(updates) {
    const changedKeys = [];
    
    Object.keys(updates).forEach(key => {
        if (editorState.hasOwnProperty(key) && editorState[key] !== updates[key]) {
            editorState[key] = updates[key];
            changedKeys.push(key);
        }
    });
    
    if (changedKeys.length > 0) {
        console.log('📊 Editor state updated:', changedKeys, updates);
        notifySubscribers(changedKeys);
    }
}

/**
 * 获取文档类型
 */
function getDocType() {
    return editorState.docType;
}

/**
 * 设置文档类型
 * @param {string} type - 'bill' | 'quote' | 'ticket' | 'compare'
 */
function setDocType(type) {
    if (['bill', 'quote', 'ticket', 'compare'].includes(type)) {
        setState({ docType: type });
    }
}

/**
 * 获取文档ID
 */
function getDocId() {
    return editorState.docId;
}

/**
 * 设置文档ID
 * @param {string|null} id - 文档UUID或null
 */
function setDocId(id) {
    setState({ docId: id });
}

/**
 * 获取编辑模式
 */
function getMode() {
    return editorState.mode;
}

/**
 * 设置编辑模式
 * @param {string} mode - 'create' | 'edit' | 'view'
 */
function setMode(mode) {
    if (['create', 'edit', 'view'].includes(mode)) {
        setState({ mode });
    }
}

/**
 * 获取脏标记
 */
function isDirty() {
    return editorState.dirty;
}

/**
 * 设置脏标记
 * @param {boolean} dirty
 */
function setDirty(dirty) {
    setState({ dirty: !!dirty });
}

/**
 * 获取可见性
 */
function isVisible() {
    return editorState.visible;
}

/**
 * 设置可见性（内部使用，外部应使用 lockSession/unlockSession）
 * @param {boolean} visible
 */
function setVisible(visible) {
    setState({ visible: !!visible });
}

/**
 * 检查会话是否锁定
 */
function isSessionLocked() {
    return editorState.sessionLocked && editorState.visible;
}

/**
 * 获取当前会话ID
 */
function getSessionId() {
    return editorState.sessionId;
}

/**
 * 锁定编辑器会话（进入编辑器时调用）
 */
function lockSession() {
    const sessionId = Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
    setState({
        sessionLocked: true,
        sessionId: sessionId,
        visible: true
    });
    console.log('🔒 Editor session locked:', sessionId);
    return sessionId;
}

/**
 * 解锁编辑器会话（退出编辑器时调用）
 * @param {string} reason - 关闭原因
 * @returns {boolean} - 是否成功解锁
 */
function unlockSession(reason) {
    if (!ALLOWED_CLOSE_REASONS.includes(reason)) {
        console.warn('⚠️ Editor unlock rejected, invalid reason:', reason);
        return false;
    }
    
    const oldSessionId = editorState.sessionId;
    setState({
        sessionLocked: false,
        sessionId: null,
        visible: false
    });
    console.log('🔓 Editor session unlocked:', oldSessionId, 'reason:', reason);
    return true;
}

/**
 * 检查是否允许关闭编辑器
 * @param {string} reason - 关闭原因
 * @returns {boolean}
 */
function canClose(reason) {
    // 如果没有锁定，允许关闭
    if (!editorState.sessionLocked) {
        return true;
    }
    // 只有允许的原因才能关闭
    return ALLOWED_CLOSE_REASONS.includes(reason);
}

/**
 * 获取加载状态
 */
function isLoading() {
    return editorState.isLoading;
}

/**
 * 设置加载状态
 * @param {boolean} loading
 */
function setLoading(loading) {
    setState({ isLoading: !!loading });
}

/**
 * 获取保存状态
 */
function isSaving() {
    return editorState.isSaving;
}

/**
 * 设置保存状态
 * @param {boolean} saving
 */
function setSaving(saving) {
    setState({ isSaving: !!saving });
}

/**
 * 获取用户登录状态
 */
function isUserLoggedIn() {
    return editorState.isUserLoggedIn;
}

/**
 * 设置用户登录状态
 * @param {boolean} loggedIn
 * @param {Object} [userInfo] - 可选的用户信息 { role, userId }
 */
function setUserLoggedIn(loggedIn, userInfo = {}) {
    setState({
        isUserLoggedIn: !!loggedIn,
        userRole: userInfo.role || null,
        userId: userInfo.userId || null
    });
}

/**
 * 获取项目数据
 */
function getItems() {
    return editorState.items;
}

/**
 * 设置项目数据
 * @param {Array} items
 */
function setItems(items) {
    editorState.items = items || [];
    notifySubscribers(['items']);
}

/**
 * 获取配置数据
 */
function getConfig() {
    return editorState.config;
}

/**
 * 设置配置数据
 * @param {Object} config
 */
function setConfig(config) {
    editorState.config = config;
    notifySubscribers(['config']);
}

/**
 * 获取配置缓存
 * @param {string} mode
 */
function getConfigCache(mode) {
    return editorState.configCache[mode] || null;
}

/**
 * 设置配置缓存
 * @param {string} mode
 * @param {Object} config
 */
function setConfigCache(mode, config) {
    editorState.configCache[mode] = config;
}

/**
 * 获取面板状态
 * @param {string} panelName
 */
function isPanelOpen(panelName) {
    return editorState.panels[panelName] || false;
}

/**
 * 设置面板状态
 * @param {string} panelName
 * @param {boolean} open
 */
function setPanelOpen(panelName, open) {
    if (editorState.panels.hasOwnProperty(panelName)) {
        editorState.panels[panelName] = !!open;
        notifySubscribers(['panels']);
    }
}

/**
 * 切换面板状态
 * @param {string} panelName
 */
function togglePanel(panelName) {
    if (editorState.panels.hasOwnProperty(panelName)) {
        editorState.panels[panelName] = !editorState.panels[panelName];
        notifySubscribers(['panels']);
    }
}

/**
 * 重置编辑器状态（用于新建文档）- 不会解锁会话
 */
function resetState() {
    setState({
        docId: null,
        mode: 'create',
        dirty: false,
        isLoading: false,
        isSaving: false
    });
    
    // 重置面板状态
    Object.keys(editorState.panels).forEach(key => {
        editorState.panels[key] = false;
    });
    
    // 清空项目
    editorState.items = [];
    
    notifySubscribers(['panels', 'items']);
}

/**
 * 初始化编辑器状态（用于编辑/查看已有文档）
 * @param {Object} options - { docType, docId, mode }
 */
function initState(options = {}) {
    // 锁定会话
    lockSession();
    
    setState({
        docType: options.docType || 'bill',
        docId: options.docId || null,
        mode: options.mode || (options.docId ? 'edit' : 'create'),
        dirty: false,
        isLoading: !!options.docId
    });
}

// 导出
export {
    ALLOWED_CLOSE_REASONS,
    subscribe,
    getState,
    setState,
    getDocType,
    setDocType,
    getDocId,
    setDocId,
    getMode,
    setMode,
    isDirty,
    setDirty,
    isVisible,
    setVisible,
    isSessionLocked,
    getSessionId,
    lockSession,
    unlockSession,
    canClose,
    isLoading,
    setLoading,
    isSaving,
    setSaving,
    isUserLoggedIn,
    setUserLoggedIn,
    getItems,
    setItems,
    getConfig,
    setConfig,
    getConfigCache,
    setConfigCache,
    isPanelOpen,
    setPanelOpen,
    togglePanel,
    resetState,
    initState
};

// 挂载到 window 供调试
window.EditorState = {
    ALLOWED_CLOSE_REASONS,
    subscribe,
    getState,
    setState,
    getDocType,
    setDocType,
    getDocId,
    setDocId,
    getMode,
    setMode,
    isDirty,
    setDirty,
    isVisible,
    setVisible,
    isSessionLocked,
    getSessionId,
    lockSession,
    unlockSession,
    canClose,
    isLoading,
    setLoading,
    isSaving,
    setSaving,
    isUserLoggedIn,
    setUserLoggedIn,
    getItems,
    setItems,
    getConfig,
    setConfig,
    isPanelOpen,
    setPanelOpen,
    togglePanel,
    resetState,
    initState
};

console.log('📦 Editor State 模块已加载');


