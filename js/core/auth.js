/**
 * 认证模块 - 邮箱密码登录验证（Supabase 版本）
 */

import { getSupabase, initWorkspace } from './supabase-config.js';

/**
 * 本地存储键名
 */
const STORAGE_KEY = 'viajes_fh_user_role';

/**
 * 获取存储的角色
 */
function getStoredRole() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'owner' || stored === 'admin' || stored === 'member') {
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
 * 使用邮箱和密码登录
 * @param {string} email 用户邮箱
 * @param {string} password 用户密码
 * @returns {Promise<{uid: string, email: string, role: string}>}
 */
async function loginWithEmailPassword(email, password) {
  const client = getSupabase();
  
  const { data, error } = await client.auth.signInWithPassword({
    email: email,
    password: password
  });
  
  if (error) {
    console.error('❌ 登录失败:', error.message);
    throw new Error(error.message === 'Invalid login credentials' ? '邮箱或密码错误' : error.message);
  }
  
  // 不在这里调用 initWorkspace，由 onAuthChange 统一处理
  // 先使用缓存的角色，后续由 onAuthChange 更新
  const cachedRole = getStoredRole() || 'member';
  
  console.log(`✅ 登录成功: ${email} (待获取角色)`);
  return {
    uid: data.user.id,
    email: data.user.email,
    role: cachedRole
  };
}

/**
 * 仅使用密码登录（尝试多个预设账号）
 * 兼容原有的密码登录方式
 */
async function loginWithPassword(password) {
  // 预设的候选账号
  const ACCOUNTS = [
    { email: 'fei.zhu@fhglobal.es' },
    { email: 'fhglobal@fhglobal.es' }
  ];
  
  let lastError = null;
  
  for (const account of ACCOUNTS) {
    try {
      return await loginWithEmailPassword(account.email, password);
    } catch (err) {
      lastError = err;
      continue;
    }
  }
  
  console.error('❌ 所有账号登录失败');
  throw new Error('密码错误，请重试');
}

/**
 * 退出登录
 */
async function logout() {
  try {
    const client = getSupabase();
    await client.auth.signOut();
    clearStoredRole();
    console.log('✅ 已退出登录');
  } catch (err) {
    console.error('❌ 退出登录失败:', err);
  }
}

/**
 * 获取当前用户信息
 */
function getCurrentUser() {
  const client = getSupabase();
  if (!client) return null;
  
  // 同步获取 - 使用缓存的 session
  const session = client.auth.session?.();
  if (!session?.user) return null;
  
  const storedRole = getStoredRole();
  
  return {
    uid: session.user.id,
    email: session.user.email,
    role: storedRole || 'member'
  };
}

/**
 * 检查是否是管理员
 */
function isAdmin() {
  const storedRole = getStoredRole();
  return storedRole === 'owner' || storedRole === 'admin';
}

/**
 * 监听认证状态变化
 */
function onAuthChange(callback) {
  const client = getSupabase();
  if (!client) {
    console.error('Supabase 客户端未初始化');
    return () => {};
  }
  
  const { data: { subscription } } = client.auth.onAuthStateChange(async (event, session) => {
    console.log('🔐 认证状态变化:', event);
    
    if (session?.user) {
      let role = getStoredRole() || 'member';
      
      // 如果是新登录，尝试获取工作空间角色（带超时）
      if (event === 'SIGNED_IN') {
        console.log('📡 开始初始化工作空间...');
        try {
          // 添加 5 秒超时
          const wsPromise = initWorkspace('Viajes FH');
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('工作空间初始化超时')), 5000)
          );
          
          const ws = await Promise.race([wsPromise, timeoutPromise]);
          role = ws.role || 'member';
          storeRole(role);
          console.log('✅ 工作空间初始化完成，角色:', role);
        } catch (err) {
          console.warn('⚠️ 获取工作空间角色失败:', err.message);
          // 使用缓存的角色或默认角色
        }
      }
      
      console.log('📤 触发用户状态回调...');
      callback({
        uid: session.user.id,
        email: session.user.email,
        role
      });
    } else {
      clearStoredRole();
      callback(null);
    }
  });
  
  return () => subscription?.unsubscribe();
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
  const emailInput = document.getElementById('login-email');
  const passwordInput = document.getElementById('login-password');
  const logoutBtn = document.getElementById('logout-btn');

  if (!loginScreen || !appContainer) {
    console.error('登录界面元素未找到');
    return;
  }

  // 防止重复处理
  let hasHandledUser = false;
  
  // 处理用户状态的函数
  const handleUserState = async (user) => {
    const crmApp = document.querySelector('.crm-app');
    
    if (user) {
      // 已登录 - 显示应用，隐藏登录界面
      loginScreen.style.display = 'none';
      
      // 显示 CRM 布局
      if (crmApp) {
        crmApp.style.display = 'flex';
      }
      
      // 只在首次登录时隐藏 appContainer，后续认证刷新不影响
      // 检查编辑器是否正在显示（有 editor-visible 类）
      const isEditorActive = appContainer?.classList.contains('editor-visible');
      if (appContainer && !isEditorActive && !hasHandledUser) {
        appContainer.style.display = 'none';
      }
      
      // 更新用户信息显示（原有）
      const userInfoEl = document.getElementById('current-user-info');
      if (userInfoEl) {
        const roleMap = { 'owner': '所有者', 'admin': '管理员', 'member': '成员' };
        userInfoEl.innerHTML = `
          <span class="user-role ${user.role}">${roleMap[user.role] || '用户'}</span>
        `;
      }
      
      // 更新 CRM 侧边栏用户信息
      const crmUserName = document.getElementById('crm-user-name');
      const crmUserRole = document.getElementById('crm-user-role');
      const crmUserAvatar = document.getElementById('crm-user-avatar');
      const roleMap = { 'owner': '所有者', 'admin': '管理员', 'member': '成员' };
      
      if (crmUserName) crmUserName.textContent = user.email?.split('@')[0] || '用户';
      if (crmUserRole) crmUserRole.textContent = roleMap[user.role] || '成员';
      if (crmUserAvatar) crmUserAvatar.textContent = (user.email?.[0] || 'U').toUpperCase();
      
      // 显示退出按钮
      if (logoutBtn) {
        logoutBtn.style.display = 'flex';
      }
      
      // 只在首次登录时触发角色加载事件
      if (!hasHandledUser) {
        hasHandledUser = true;
        window.dispatchEvent(new CustomEvent('userRoleLoaded', { 
          detail: { role: user.role, userId: user.uid }
        }));
      }
    } else {
      // 未登录 - 显示登录界面，隐藏应用
      loginScreen.style.display = 'flex';
      
      // 隐藏 CRM 布局
      if (crmApp) {
        crmApp.style.display = 'none';
      }
      if (appContainer) {
        appContainer.style.display = 'none';
      }
      
      if (logoutBtn) {
        logoutBtn.style.display = 'none';
      }
      
      if (emailInput) {
        emailInput.value = '';
      }
      if (passwordInput) {
        passwordInput.value = '';
      }
      
      // 触发用户登出事件
      window.dispatchEvent(new CustomEvent('userLoggedOut'));
    }
  };

  // 监听认证状态变化
  onAuthChange(handleUserState);

  // 立即检查现有会话（解决刷新后卡在登录中的问题）
  const client = getSupabase();
  if (client) {
    console.log('🔍 检查现有会话...');
    
    // 设置整体超时，防止永久卡住
    const sessionCheckTimeout = setTimeout(() => {
      console.warn('⏰ 会话检查超时，显示登录界面');
      handleUserState(null);
    }, 8000);
    
    client.auth.getSession().then(async ({ data: { session }, error }) => {
      clearTimeout(sessionCheckTimeout);
      
      if (error) {
        console.error('❌ 获取会话失败:', error);
        handleUserState(null);
        return;
      }
      
      if (session?.user) {
        console.log('✅ 发现现有会话:', session.user.email);
        let role = getStoredRole() || 'member';
        
        // 尝试获取/刷新工作空间角色（带超时）
        try {
          console.log('📡 初始化工作空间...');
          const wsPromise = initWorkspace('Viajes FH');
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('超时')), 5000)
          );
          
          const ws = await Promise.race([wsPromise, timeoutPromise]);
          role = ws.role || role;
          storeRole(role);
          console.log('✅ 工作空间角色:', role);
        } catch (wsErr) {
          console.warn('⚠️ 工作空间初始化失败，使用缓存角色:', role);
        }
        
        handleUserState({
          uid: session.user.id,
          email: session.user.email,
          role
        });
      } else {
        console.log('📭 没有现有会话');
        handleUserState(null);
      }
    }).catch(err => {
      clearTimeout(sessionCheckTimeout);
      console.error('❌ 会话检查异常:', err);
      handleUserState(null);
    });
  }

  // 登录表单提交
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const email = emailInput?.value?.trim();
      const password = passwordInput?.value?.trim();
      
      if (!email || !password) {
        if (loginError) {
          loginError.textContent = '请输入邮箱和密码';
          loginError.style.display = 'block';
        }
        return;
      }

      if (loginBtn) {
        loginBtn.disabled = true;
        loginBtn.innerHTML = '<span class="login-spinner"></span> 登录中...';
      }
      
      if (loginError) {
        loginError.style.display = 'none';
      }

      try {
        await loginWithEmailPassword(email, password);
      } catch (err) {
        if (loginError) {
          loginError.textContent = err.message || '登录失败，请重试';
          loginError.style.display = 'block';
        }
      } finally {
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
  loginWithPassword,
  loginWithEmailPassword,
  logout, 
  getCurrentUser, 
  isAdmin, 
  onAuthChange, 
  initLoginUI 
};
