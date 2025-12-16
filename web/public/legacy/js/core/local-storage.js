/**
 * 本地存储模块 - 用于草稿数据的临时存储
 * 注意：认证功能已迁移到 Supabase Auth (auth.js)
 */

console.log('📦 本地存储模块已加载（仅用于草稿数据）');

const LOCAL_STORAGE_PREFIX = 'viajes_fh_';

// 模拟的数据库对象（兼容旧代码）
const db = { _type: 'local-storage-db' };

// 模拟的 ref 函数
function ref(database, path) {
    return {
        _path: path || '',
        _fullKey: LOCAL_STORAGE_PREFIX + (path || 'root'),
        toString() { return `local://${this._path}`; }
    };
}

// set 函数 - 保存到 localStorage
function set(dbRef, data) {
    return new Promise((resolve) => {
        try {
            const key = dbRef._fullKey;
            if (data === null) {
                localStorage.removeItem(key);
                console.log(`🗑️ [LocalStorage] 删除: ${dbRef._path}`);
            } else {
                localStorage.setItem(key, JSON.stringify(data));
                console.log(`💾 [LocalStorage] 保存: ${dbRef._path}`);
            }
            notifyListeners(key);
            resolve();
        } catch (err) {
            console.error(`❌ [LocalStorage] 保存失败:`, err);
            resolve();
        }
    });
}

// get 函数 - 从 localStorage 读取
function get(dbRef) {
    return new Promise((resolve) => {
        try {
            const key = dbRef._fullKey;
            const data = localStorage.getItem(key);
            const parsed = data ? JSON.parse(data) : null;
            resolve({
                exists: () => parsed !== null,
                val: () => parsed
            });
        } catch (err) {
            resolve({ exists: () => false, val: () => null });
        }
    });
}

// 监听器
const listeners = new Map();

// onValue 函数 - 监听数据变化
function onValue(dbRef, callback) {
    const key = dbRef._fullKey;
    const listenerId = Date.now() + Math.random();
    
    get(dbRef).then(snapshot => callback(snapshot));
    listeners.set(listenerId, { key, callback, dbRef });
    
    return () => { listeners.delete(listenerId); };
}

// 通知监听器
function notifyListeners(key) {
    listeners.forEach(({ key: k, callback, dbRef }) => {
        if (k === key) get(dbRef).then(snapshot => callback(snapshot));
    });
}

function remove(dbRef) { 
    return set(dbRef, null); 
}

// 导出（仅数据存储相关）
export { 
    db, 
    ref, 
    set, 
    onValue, 
    get, 
    remove
};
