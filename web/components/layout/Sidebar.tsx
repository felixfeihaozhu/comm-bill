'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  FileText,
  Mail,
  DollarSign,
  Settings,
  ChevronLeft,
  ChevronRight,
  UserCircle,
} from 'lucide-react';
import { useState } from 'react';

const menuItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: '数据概览' },
  { href: '/customers', icon: UserCircle, label: '客户管理' },
  { href: '/documents', icon: FileText, label: '单据中心' },
  { href: '/orders', icon: Mail, label: '邮件订单跟踪' },
  { href: '/finance', icon: DollarSign, label: '财务管理' },
  { href: '/team', icon: Users, label: '团队成员' },
  { href: '/settings', icon: Settings, label: '系统设置' },
];

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  // 不显示侧边栏的页面
  if (pathname.startsWith('/editor') || pathname.startsWith('/login')) {
    return null;
  }

  return (
    <aside
      className={`flex flex-col bg-sidebar-bg text-white transition-all duration-300 ${
        collapsed ? 'w-16' : 'w-60'
      }`}
    >
      {/* Logo */}
      <div className="flex items-center h-14 px-4 border-b border-slate-700">
        {!collapsed && (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center font-bold">
              FH
            </div>
            <span className="font-semibold text-lg">FH Global</span>
          </div>
        )}
        {collapsed && (
          <div className="w-8 h-8 mx-auto bg-primary-500 rounded-lg flex items-center justify-center font-bold">
            FH
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 overflow-y-auto">
        <ul className="space-y-1 px-2">
          {menuItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-primary-600 text-white'
                      : 'text-slate-300 hover:bg-sidebar-hover hover:text-white'
                  }`}
                  title={collapsed ? item.label : undefined}
                >
                  <item.icon className="w-5 h-5 flex-shrink-0" />
                  {!collapsed && <span className="text-sm">{item.label}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Collapse Toggle */}
      <div className="p-2 border-t border-slate-700">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 text-slate-400 hover:text-white hover:bg-sidebar-hover rounded-lg transition-colors"
        >
          {collapsed ? (
            <ChevronRight className="w-5 h-5" />
          ) : (
            <>
              <ChevronLeft className="w-5 h-5" />
              <span className="text-sm">收起菜单</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}


