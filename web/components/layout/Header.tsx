'use client';

import { usePathname, useRouter } from 'next/navigation';
import { Bell, Search, User, LogOut, ChevronDown, Building2, Users } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { useWorkspace } from '@/components/auth/WorkspaceProvider';

const pageTitles: Record<string, string> = {
  '/dashboard': '数据概览',
  '/customers': '客户管理',
  '/documents': '单据中心',
  '/orders': '邮件订单跟踪',
  '/finance': '财务管理',
  '/settings': '系统设置',
  '/team': '团队成员',
  '/org': '工作空间',
};

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { currentWorkspace, workspaces } = useWorkspace();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showOrgMenu, setShowOrgMenu] = useState(false);

  // 不需要显示 header 的页面
  if (pathname.startsWith('/editor') || pathname.startsWith('/login')) {
    return null;
  }

  const currentTitle = pageTitles[pathname] || 'FH Global OMS';

  const handleSignOut = async () => {
    setShowUserMenu(false);
    await signOut();
    router.replace('/login');
  };

  // 用户显示信息
  const displayEmail = user?.email || '';
  const displayName = displayEmail ? displayEmail.split('@')[0] : '用户';

  return (
    <header className="flex items-center justify-between h-14 px-6 bg-white border-b border-gray-200 shrink-0">
      {/* Left: Page Title */}
      <div className="flex items-center gap-4">
        <h1 className="text-lg font-semibold text-gray-900">{currentTitle}</h1>
      </div>

      {/* Right Side */}
      <div className="flex items-center gap-3">
        {/* Global Search */}
        <div className="relative hidden lg:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="全局搜索..."
            className="w-48 pl-10 pr-4 py-1.5 bg-gray-100 border border-transparent rounded-lg text-sm focus:outline-none focus:bg-white focus:border-primary-300 focus:ring-2 focus:ring-primary-100"
          />
        </div>

        {/* Workspace Selector */}
        {currentWorkspace && (
          <div className="relative">
            <button
              onClick={() => setShowOrgMenu(!showOrgMenu)}
              className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Building2 className="w-4 h-4 text-gray-500" />
              <span className="max-w-[120px] truncate hidden sm:block">{currentWorkspace.name}</span>
              <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
            </button>

            {showOrgMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowOrgMenu(false)} />
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-20 py-1">
                  <div className="px-4 py-2 border-b border-gray-100">
                    <p className="text-xs text-gray-500">当前工作空间</p>
                    <p className="text-sm font-medium text-gray-900 truncate">{currentWorkspace.name}</p>
                  </div>
                  
                  <button
                    onClick={() => { setShowOrgMenu(false); router.push('/org'); }}
                    className="w-full flex items-center gap-2 px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <Building2 className="w-4 h-4" /> 切换工作空间
                    {workspaces.length > 1 && (
                      <span className="ml-auto text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">
                        {workspaces.length}
                      </span>
                    )}
                  </button>
                  
                  <button
                    onClick={() => { setShowOrgMenu(false); router.push('/team'); }}
                    className="w-full flex items-center gap-2 px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <Users className="w-4 h-4" /> 团队成员
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* Notifications */}
        <button className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
        </button>

        {/* User Menu */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <div className="w-8 h-8 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center">
              <User className="w-4 h-4" />
            </div>
            <span className="text-sm font-medium text-gray-700 hidden sm:block max-w-[100px] truncate">
              {displayName}
            </span>
            <ChevronDown className="w-4 h-4 text-gray-400" />
          </button>

          {showUserMenu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowUserMenu(false)} />
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-20 py-1">
                <div className="px-4 py-2 border-b border-gray-100">
                  <p className="text-sm font-medium text-gray-900 truncate">{displayName}</p>
                  <p className="text-xs text-gray-500 truncate">{displayEmail}</p>
                </div>
                <button 
                  onClick={() => setShowUserMenu(false)}
                  className="w-full flex items-center gap-2 px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                >
                  <User className="w-4 h-4" /> 个人设置
                </button>
                <hr className="my-1 border-gray-100" />
                <button 
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-2 px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                >
                  <LogOut className="w-4 h-4" /> 退出登录
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
