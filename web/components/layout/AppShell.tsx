'use client';

import { usePathname } from 'next/navigation';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

// 不需要认证的路由
const publicRoutes = ['/login'];

// 不显示导航的路由
const noNavRoutes = ['/login', '/editor'];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  const isPublicRoute = publicRoutes.some(route => pathname === route || pathname.startsWith(route + '/'));
  const showNav = !noNavRoutes.some(route => pathname === route || pathname.startsWith(route + '/'));

  // 公开路由直接渲染（不需要认证）
  if (isPublicRoute) {
    return <>{children}</>;
  }

  // 受保护路由
  return (
    <ProtectedRoute>
      {showNav ? (
        <div className="flex h-screen overflow-hidden">
          <Sidebar />
          <div className="flex flex-col flex-1 overflow-hidden">
            <Header />
            <main className="flex-1 overflow-auto">
              {children}
            </main>
          </div>
        </div>
      ) : (
        <>{children}</>
      )}
    </ProtectedRoute>
  );
}
