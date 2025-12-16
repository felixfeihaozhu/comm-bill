/**
 * 认证模块 - 密码登录验证
 * 只需输入密码，系统自动尝试匹配账号
 */

// 从统一的 Firebase 配置模块导入（避免重复定义）
import { auth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from './firebase-config.js';

/**
 * 候选账号配置
 * 登录时会按顺序尝试这些账号
 */
const ACCOUNTS = [
  { email: 'fei.zhu@fhglobal.es', role: 'admin' },
  { email: 'fhglobal@fhglobal.es', role: 'user' }
];

/**
 * 本地存储键名
 */
const STORAGE_KEY = 'viajes_fh_user_role';

/**
 * 根据邮箱获取角色
 */
function getRoleByEmail(email) {
  if (!email) return 'user';
  const account = ACCOUNTS.find(acc => acc.email === email);
  return account?.role || 'user';
}

/**
 * 获取存储的角色
 */
function getStoredRole() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'admin' || stored === 'user') {
      return stored;
    }
  } catch (e) {
    console.warn('无法读取本地存储');
  }
  return null;
}

/**
 * 保存角色到本地存储
 */
function storeRole(role) {
  try {
    localStorage.setItem(STORAGE_KEY, role);
  } catch (e) {
    console.warn('无法写入本地存储');
  }
}

/**
 * 清除存储的角色
 */
function clearStoredRole() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.warn('无法清除本地存储');
  }
}

/**
 * 使用密码登录
 * 会依次尝试所有候选账号，直到某个成功为止
 * @param {string} password 用户输入的密码
 * @returns {Promise<{uid: string, email: string, role: string}>}
 */
async function loginWithPassword(password) {
  let lastError = null;

  // 遍历所有候选账号
  for (const account of ACCOUNTS) {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, account.email, password);
      
      // 登录成功
      const user = {
        uid: userCredential.user.uid,
        email: account.email,
        role: account.role
      };
      
      // 保存角色到本地存储
      storeRole(account.role);
      
      console.log(`✅ 登录成功: ${account.email} (${account.role})`);
      return user;
    } catch (err) {
      // 记录错误，继续尝试下一个账号
      lastError = err;
      continue;
    }
  }

  // 所有账号都失败了
  console.error('❌ 所有账号登录失败');
  throw new Error('密码错误，请重试');
}

/**
 * 退出登录
 */
async function logout() {
  try {
    await signOut(auth);
    clearStoredRole();
    console.log('✅ 已退出登录');
  } catch (err) {
    console.error('❌ 退出登录失败:', err);
  }
}

/**
 * 获取当前用户信息
 * @returns {{uid: string, email: string, role: string} | null}
 */
function getCurrentUser() {
  const firebaseUser = auth.currentUser;
  if (!firebaseUser) return null;
  
  const storedRole = getStoredRole();
  const role = storedRole || getRoleByEmail(firebaseUser.email);
  
  return {
    uid: firebaseUser.uid,
    email: firebaseUser.email,
    role
  };
}

/**
 * 检查是否是管理员
 */
function isAdmin() {
  const user = getCurrentUser();
  return user?.role === 'admin';
}

/**
 * 监听认证状态变化
 * @param {function} callback 回调函数，参数为用户信息或 null
 */
function onAuthChange(callback) {
  return onAuthStateChanged(auth, async (firebaseUser) => {
    if (firebaseUser) {
      // 检查是否是匿名用户 - 如果是匿名用户，自动登出
      if (firebaseUser.isAnonymous || !firebaseUser.email) {
        console.log('🚫 检测到匿名用户，自动登出...');
        await signOut(auth);
        clearStoredRole();
        callback(null);
        return;
      }
      
      // 检查是否是允许的账号
      const isAllowedAccount = ACCOUNTS.some(acc => acc.email === firebaseUser.email);
      if (!isAllowedAccount) {
        console.log('🚫 非授权账号，自动登出...');
        await signOut(auth);
        clearStoredRole();
        callback(null);
        return;
      }
      
      const storedRole = getStoredRole();
      const role = storedRole || getRoleByEmail(firebaseUser.email);
      callback({
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        role
      });
    } else {
      clearStoredRole();
      callback(null);
    }
  });
}

/**
 * 初始化登录界面
 */
function initLoginUI() {
  const loginScreen = document.getElementById('login-screen');
  const appContainer = document.querySelector('.app-container');
  const loginForm = document.getElementById('login-form');
  const loginError = document.getElementById('login-error');
  const loginBtn = document.getElementById('login-btn');
  const passwordInput = document.getElementById('login-password');
  const logoutBtn = document.getElementById('logout-btn');

  if (!loginScreen || !appContainer) {
    console.error('登录界面元素未找到');
    return;
  }

  // 监听认证状态
  onAuthChange((user) => {
    if (user) {
      // 已登录 - 显示应用，隐藏登录界面
      loginScreen.style.display = 'none';
      appContainer.style.display = 'flex';
      
      // 更新用户信息显示（只显示角色标签）
      const userInfoEl = document.getElementById('current-user-info');
      if (userInfoEl) {
        userInfoEl.innerHTML = `
          <span class="user-role ${user.role}">${user.role === 'admin' ? '管理员' : '用户'}</span>
        `;
      }
      
      // 显示退出按钮
      if (logoutBtn) {
        logoutBtn.style.display = 'flex';
      }
    } else {
      // 未登录 - 显示登录界面，隐藏应用
      loginScreen.style.display = 'flex';
      appContainer.style.display = 'none';
      
      // 隐藏退出按钮
      if (logoutBtn) {
        logoutBtn.style.display = 'none';
      }
      
      // 清空密码输入
      if (passwordInput) {
        passwordInput.value = '';
      }
    }
  });

  // 登录表单提交
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const password = passwordInput?.value?.trim();
      if (!password) return;

      // 显示加载状态
      if (loginBtn) {
        loginBtn.disabled = true;
        loginBtn.innerHTML = '<span class="login-spinner"></span> 登录中...';
      }
      
      // 清除之前的错误
      if (loginError) {
        loginError.style.display = 'none';
      }

      try {
        await loginWithPassword(password);
        // 登录成功，onAuthChange 会处理界面切换
      } catch (err) {
        // 显示错误
        if (loginError) {
          loginError.textContent = err.message || '登录失败，请重试';
          loginError.style.display = 'block';
        }
      } finally {
        // 恢复按钮状态
        if (loginBtn) {
          loginBtn.disabled = false;
          loginBtn.innerHTML = '登录';
        }
      }
    });
  }

  // 退出登录按钮
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      await logout();
    });
  }

  // 密码显示/隐藏切换
  const togglePasswordBtn = document.getElementById('toggle-password');
  if (togglePasswordBtn && passwordInput) {
    togglePasswordBtn.addEventListener('click', () => {
      const isPassword = passwordInput.type === 'password';
      passwordInput.type = isPassword ? 'text' : 'password';
      
      // 切换图标显示
      const eyeOpen = togglePasswordBtn.querySelector('.eye-open');
      const eyeClosed = togglePasswordBtn.querySelector('.eye-closed');
      if (eyeOpen && eyeClosed) {
        eyeOpen.style.display = isPassword ? 'none' : 'block';
        eyeClosed.style.display = isPassword ? 'block' : 'none';
      }
    });
  }
}

// 导出
export { 
  auth, 
  loginWithPassword, 
  logout, 
  getCurrentUser, 
  isAdmin, 
  onAuthChange, 
  initLoginUI 
};

