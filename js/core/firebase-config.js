/**
 * Firebase 统一配置模块
 * 所有 Firebase 相关的初始化都在这里完成，其他模块从这里导入
 */
import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js";
import { getDatabase, ref, set as firebaseSet, onValue, get, remove } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-database.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js";

// Firebase 配置 - 唯一定义
const firebaseConfig = {
  apiKey: "AIzaSyCqPv-u0OJtysiCYSQjcdMb6zJHTrBA6bc",
  authDomain: "viajes-fh.firebaseapp.com",
  databaseURL: "https://viajes-fh-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "viajes-fh",
  storageBucket: "viajes-fh.firebasestorage.app",
  messagingSenderId: "572278294722",
  appId: "1:572278294722:web:09c67b95790dc47b52135b"
};

// 避免重复初始化
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getDatabase(app);
const auth = getAuth(app);

// 废弃路径列表 - 不允许写入这些路径
const DEPRECATED_PATHS = ['draft', 'draft_compare', 'draft_quote', 'settings', 'settings_bill', 'settings_quote', 'database'];

// 安全的 set 函数 - 阻止写入废弃路径，并自动清理
function set(dbRef, data) {
    // 从 ref 对象中提取路径 - 多种方式尝试
    let path = '';
    try {
        const refStr = dbRef.toString();
        // Firebase URL 格式: https://xxx.firebasedatabase.app/path/to/data
        const match = refStr.match(/firebasedatabase\.app\/(.+)$/);
        if (match) {
            path = match[1];
        } else if (dbRef._path?.pieces_) {
            path = dbRef._path.pieces_.join('/');
        }
    } catch (e) {
        console.warn('⚠️ 无法提取路径，跳过检查');
    }
    
    // 检查是否是废弃路径（根级别的废弃节点）
    if (path) {
        const rootPath = path.split('/')[0];
        if (DEPRECATED_PATHS.includes(rootPath) && !path.startsWith('modes/')) {
            console.error(`🚫 阻止写入废弃路径: /${path}`);
            console.error('正确的路径应该是: modes/${mode}/...');
            // 自动清理废弃路径
            remove(dbRef).then(() => {
                console.log(`🧹 已自动清理废弃路径: /${rootPath}`);
            }).catch(() => {});
            return Promise.reject(new Error(`禁止写入废弃路径: ${path}`));
        }
    }
    
    return firebaseSet(dbRef, data);
}

// 导出所有需要的对象和函数
export { 
  db, 
  auth, 
  ref, 
  set, 
  onValue, 
  get, 
  remove, 
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut
};