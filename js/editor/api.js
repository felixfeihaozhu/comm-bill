/**
 * 编辑器数据API模块
 * 封装编辑器涉及的数据读写与保存
 * 复用现有 Firebase/Supabase 同步逻辑
 */

import * as EditorState from './state.js';

// Firebase 相关引用（从 main.js 继承的逻辑）
let db = null;
let ref = null;
let set = null;
let onValue = null;
let get = null;

// 当前的 draft 监听取消函数
let draftUnsubscribe = null;

// 防抖保存定时器
let saveTimeout = null;

/**
 * 初始化 API 模块（需要在 main.js 初始化后调用）
 * @param {Object} firebaseRefs - { db, ref, set, onValue, get }
 */
function initAPI(firebaseRefs) {
    db = firebaseRefs.db;
    ref = firebaseRefs.ref;
    set = firebaseRefs.set;
    onValue = firebaseRefs.onValue;
    get = firebaseRefs.get;
    console.log('📡 Editor API initialized with Firebase refs');
}

/**
 * 获取当前模式的 Firebase 路径
 * @param {string} subPath - 子路径
 * @returns {string}
 */
function getModePath(subPath = '') {
    const docType = EditorState.getDocType();
    const basePath = `modes/${docType}`;
    return subPath ? `${basePath}/${subPath}` : basePath;
}

/**
 * 从 Firebase 加载配置
 * @param {string} mode - 模式名称
 * @returns {Promise<Object>}
 */
async function loadConfig(mode = 'bill') {
    console.log(`📡 Loading config for mode: ${mode}`);
    
    // 检查缓存
    const cached = EditorState.getConfigCache(mode);
    if (cached) {
        EditorState.setConfig(cached);
        console.log(`✅ 从缓存加载配置: ${mode}`);
        return cached;
    }
    
    try {
        const settingsPath = `modes/${mode}/settings`;
        const settingsRef = ref(db, settingsPath);
        const snapshot = await get(settingsRef);
        
        let config;
        if (snapshot.exists()) {
            config = snapshot.val();
            console.log(`✅ 从Firebase加载配置成功: ${mode}`);
        } else {
            // 使用默认配置
            config = getDefaultConfig();
            console.log(`📝 Firebase无配置，使用默认值: ${mode}`);
            
            // 初始化 Firebase 配置
            await set(settingsRef, config);
            console.log(`✅ 已初始化Firebase配置: ${mode}`);
        }
        
        // 缓存配置
        EditorState.setConfigCache(mode, config);
        EditorState.setConfig(config);
        
        return config;
    } catch (error) {
        console.error(`❌ 加载配置失败: ${mode}`, error);
        const defaultConfig = getDefaultConfig();
        EditorState.setConfig(defaultConfig);
        return defaultConfig;
    }
}

/**
 * 获取默认配置
 */
function getDefaultConfig() {
    return {
        clients: [],
        ships: [],
        routes: [],
        cabinTypes: [],
        experienceTypes: [],
        priceTypes: [],
        addonProducts: [],
        defaults: {
            payment: 'Bank: CAIXABANK\nName: FH GLOBAL, S.L.\nSWIFT: CAIXESBBXXX\nAccount: ES4521003304042200150167',
            remarks: '',
            termsConditions: {
                zh: '邮轮预订需支付15%的订金以确认预订，全款需在出发前至少40个自然日内支付完毕。',
                es: 'En las reservas de viajes combinados (cruceros) se requiere un depósito del 15% para formalizar el contrato.',
                en: 'For cruise bookings, a 15% deposit is required to confirm the reservation.'
            },
            cancellationPolicy: {
                zh: '所有取消和修改均需支付手续费。',
                es: 'Todas las cancelaciones y modificaciones conllevan costes de gestión.',
                en: 'All cancellations and modifications incur processing fees.'
            },
            adminPassword: '0901'
        }
    };
}

/**
 * 保存配置到 Firebase
 * @param {string} mode - 模式名称
 * @param {Object} config - 配置数据
 */
async function saveConfig(mode, config) {
    const settingsPath = `modes/${mode}/settings`;
    await set(ref(db, settingsPath), config);
    EditorState.setConfigCache(mode, config);
    EditorState.setConfig(config);
    console.log(`✅ 配置已保存: ${mode}`);
}

/**
 * 订阅当前模式的 draft 数据
 * @param {Function} onDataReceived - 数据接收回调
 */
function subscribeToDraft(onDataReceived) {
    const docType = EditorState.getDocType();
    console.log('🔔 subscribeToDraft called for mode:', docType);
    
    // 取消之前的监听
    if (draftUnsubscribe) {
        console.log('🚫 Unsubscribing from previous draft');
        draftUnsubscribe();
        draftUnsubscribe = null;
    }
    
    // 订阅当前模式的 draft
    const draftPath = getModePath('draft');
    console.log('📡 Subscribing to:', draftPath);
    const draftRef = ref(db, draftPath);
    
    draftUnsubscribe = onValue(draftRef, (snapshot) => {
        console.log('📥 Draft data received:', snapshot.exists());
        
        // 跳过正在保存的更新
        if (EditorState.isSaving()) {
            console.log('⏭️ Skipping - currently saving');
            return;
        }
        
        EditorState.setLoading(true);
        const data = snapshot.val();
        
        if (onDataReceived) {
            onDataReceived(data);
        }
        
        EditorState.setLoading(false);
        console.log('✅ Finished loading from Firebase');
    });
}

/**
 * 取消订阅 draft 数据
 */
function unsubscribeFromDraft() {
    if (draftUnsubscribe) {
        draftUnsubscribe();
        draftUnsubscribe = null;
    }
}

/**
 * 保存 draft 数据到 Firebase（防抖）
 * @param {Object} draftData - { items, fields }
 */
function saveDraftDebounced(draftData) {
    if (!EditorState.isUserLoggedIn()) {
        console.warn('❗ No user authenticated');
        return;
    }
    
    if (EditorState.isLoading()) {
        console.log('🔄 Skipping save - loading from Firebase');
        return;
    }
    
    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => {
        EditorState.setSaving(true);
        
        const path = getModePath('draft');
        const dataToSave = {
            ...draftData,
            _updated: Date.now()
        };
        
        console.log('💾 Saving to Firebase:', path);
        
        set(ref(db, path), dataToSave)
            .then(() => {
                EditorState.setSaving(false);
                EditorState.setDirty(false);
                console.log('✅ Save successful');
            })
            .catch(err => {
                EditorState.setSaving(false);
                console.error('❌ Save failed:', err);
            });
    }, 500);
}

/**
 * 清除 draft 数据
 */
async function clearDraft() {
    const path = getModePath('draft');
    await set(ref(db, path), null);
    console.log('🗑️ Draft cleared');
}

/**
 * 保存账单到 Supabase 数据库
 * @param {Object} billData - 账单主表数据
 * @param {Array} items - 明细行数组
 * @returns {Promise<Object>} - { bill_id, bill_no }
 */
async function saveBillToDatabase(billData, items) {
    if (!window.SupabaseAPI?.bills?.save) {
        throw new Error('SupabaseAPI.bills.save 未初始化');
    }
    
    const docId = EditorState.getDocId();
    const result = await window.SupabaseAPI.bills.save(billData, items, docId);
    
    // 更新状态
    EditorState.setDocId(result.bill_id);
    EditorState.setMode('edit');
    EditorState.setDirty(false);
    
    console.log(`✅ 账单保存成功: #${result.bill_no}`);
    return result;
}

/**
 * 从 Supabase 加载账单完整数据
 * @param {string} billId - 账单UUID
 * @returns {Promise<Object>} - { bill, items }
 */
async function loadBillFromDatabase(billId) {
    if (!window.SupabaseAPI?.bills?.getFull) {
        throw new Error('SupabaseAPI.bills.getFull 未初始化');
    }
    
    EditorState.setLoading(true);
    
    try {
        const { bill, items } = await window.SupabaseAPI.bills.getFull(billId);
        
        // 更新状态
        EditorState.setDocId(billId);
        EditorState.setMode('edit');
        EditorState.setDocType(bill.mode || 'bill');
        EditorState.setItems(items);
        
        console.log(`✅ 账单加载成功: #${bill.bill_no}`);
        return { bill, items };
    } finally {
        EditorState.setLoading(false);
    }
}

/**
 * 获取账单列表
 * @param {Object} options - { q, limit, mode }
 * @returns {Promise<Array>}
 */
async function getBillsList(options = {}) {
    if (!window.SupabaseAPI?.bills?.list) {
        return [];
    }
    return await window.SupabaseAPI.bills.list(options);
}

/**
 * 删除账单
 * @param {string} billId
 */
async function deleteBill(billId) {
    if (!window.SupabaseAPI?.bills?.delete) {
        throw new Error('SupabaseAPI.bills.delete 未初始化');
    }
    await window.SupabaseAPI.bills.delete(billId);
    console.log(`✅ 账单删除成功: ${billId}`);
}

/**
 * 从 Supabase 加载客户列表
 * @returns {Promise<Array>}
 */
async function loadCustomers() {
    if (!window.SupabaseAPI?.customers?.list) {
        console.warn('SupabaseAPI.customers.list 未定义');
        return [];
    }
    
    const customers = await window.SupabaseAPI.customers.list();
    console.log(`📋 从 Supabase 加载了 ${customers.length} 个客户`);
    
    // 转换为前端格式
    return customers.map(c => ({
        id: c.id,
        tradeName: c.name || c.trade_name || '',
        customerType: c.customer_type || 'personal',
        contact: c.contact || '',
        company: c.company || '',
        taxId: c.tax_id || '',
        address: c.address || '',
        rate: c.default_rate || 0,
        addonRate: c.addon_rate || 0,
        notes: c.notes || ''
    }));
}

/**
 * 保存客户到 Supabase
 * @param {Object} customerData
 * @param {string|null} customerId - 如果有则更新
 */
async function saveCustomer(customerData, customerId = null) {
    if (customerId) {
        await window.SupabaseAPI.customers.update(customerId, customerData);
        console.log('✅ 客户更新成功');
    } else {
        await window.SupabaseAPI.customers.create(customerData);
        console.log('✅ 客户创建成功');
    }
}

/**
 * 删除客户
 * @param {string} customerId
 */
async function deleteCustomer(customerId) {
    await window.SupabaseAPI.customers.delete(customerId);
    console.log('✅ 客户删除成功');
}

// 导出
export {
    initAPI,
    getModePath,
    loadConfig,
    saveConfig,
    getDefaultConfig,
    subscribeToDraft,
    unsubscribeFromDraft,
    saveDraftDebounced,
    clearDraft,
    saveBillToDatabase,
    loadBillFromDatabase,
    getBillsList,
    deleteBill,
    loadCustomers,
    saveCustomer,
    deleteCustomer
};

// 挂载到 window 供调试
window.EditorAPI = {
    initAPI,
    getModePath,
    loadConfig,
    saveConfig,
    subscribeToDraft,
    unsubscribeFromDraft,
    saveDraftDebounced,
    clearDraft,
    saveBillToDatabase,
    loadBillFromDatabase,
    getBillsList,
    deleteBill,
    loadCustomers,
    saveCustomer,
    deleteCustomer
};

console.log('📦 Editor API 模块已加载');
