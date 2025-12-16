/**
 * iframe-bridge.js
 * 用于 legacy 编辑器与 Next.js CRM 之间的通信
 */

// 检测是否在 iframe 中运行
export function isEmbedded() {
    try {
        return window.self !== window.top;
    } catch (e) {
        return true; // 跨域情况下也认为是嵌入的
    }
}

// 检测 URL 中是否有 embedded 参数
export function isEmbeddedMode() {
    const urlParams = new URLSearchParams(window.location.search || window.location.hash.split('?')[1] || '');
    return urlParams.get('embedded') === 'true' || isEmbedded();
}

// 向父窗口发送消息
export function postToParent(type, data = {}) {
    if (!isEmbedded()) return;
    
    try {
        window.parent.postMessage({
            type,
            ...data,
            timestamp: Date.now()
        }, '*');
    } catch (e) {
        console.warn('postMessage failed:', e);
    }
}

// 通知保存成功
export function notifySaved(id, docType) {
    postToParent('editor:saved', { id, docType });
}

// 通知正在保存
export function notifySaving() {
    postToParent('editor:saving');
}

// 通知关闭编辑器
export function notifyClose() {
    postToParent('editor:close');
}

// 通知错误
export function notifyError(message) {
    postToParent('editor:error', { message });
}

// 隐藏 legacy 的导航元素（当嵌入时）
export function hideNavigationIfEmbedded() {
    if (!isEmbeddedMode()) return;
    
    console.log('🔧 嵌入模式：配置编辑器专用视图');
    
    // 添加 embedded 类到 body 和 html
    document.documentElement.classList.add('embedded-mode');
    document.body.classList.add('embedded-mode');
    
    // 隐藏所有非编辑器元素
    const elementsToHide = [
        '#login-screen',
        '.login-screen',
        '.crm-app',
        '.crm-sidebar',
        '.crm-header',
        '#crm-nav',
        '.main-nav'
    ];
    
    elementsToHide.forEach(selector => {
        const el = document.querySelector(selector);
        if (el) el.style.display = 'none';
    });
    
    // 显示编辑器容器
    const appContainer = document.querySelector('.app-container');
    if (appContainer) {
        appContainer.style.display = 'flex';
        appContainer.classList.add('embedded-mode');
    }
}

// 初始化 iframe bridge
export function initIframeBridge() {
    if (!isEmbeddedMode()) return;
    
    hideNavigationIfEmbedded();
    
    // 监听来自父窗口的消息
    window.addEventListener('message', (event) => {
        const { type, data } = event.data || {};
        
        switch (type) {
            case 'parent:requestStatus':
                // 父窗口请求状态
                postToParent('editor:status', {
                    ready: true,
                    hasChanges: window.hasUnsavedChanges || false
                });
                break;
            case 'parent:save':
                // 父窗口请求保存
                if (typeof window.saveBillToDatabase === 'function') {
                    window.saveBillToDatabase();
                }
                break;
        }
    });
    
    console.log('📡 iframe bridge initialized');
}

// 默认导出
export default {
    isEmbedded,
    isEmbeddedMode,
    postToParent,
    notifySaved,
    notifySaving,
    notifyClose,
    notifyError,
    hideNavigationIfEmbedded,
    initIframeBridge
};



