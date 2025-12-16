'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from './AuthProvider';
import { useWorkspace } from './WorkspaceProvider';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading: authLoading } = useAuth();
  const { currentWorkspace, loading: wsLoading } = useWorkspace();
  const router = useRouter();
  const pathname = usePathname();
  const [isReady, setIsReady] = useState(false);

  const loading = authLoading || wsLoading;

  useEffect(() => {
    // 等待加载完成
    if (loading) return;

    // 未登录则跳转到登录页
    if (!user) {
      const returnUrl = encodeURIComponent(pathname);
      router.replace(`/login?returnUrl=${returnUrl}`);
      return;
    }

    // 已登录则准备就绪
    setIsReady(true);
  }, [user, loading, router, pathname]);

  // 加载中
  if (loading || !isReady) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
          <p className="text-gray-500 text-sm">加载中...</p>
        </div>
      </div>
    );
  }

  // 未登录（跳转中）- 显示跳转提示而非空白
  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
          <p className="text-gray-500 text-sm">正在跳转到登录页...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}



