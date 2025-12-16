'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function DocumentsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    console.error('Documents error:', error);
  }, [error]);

  return (
    <div className="p-6">
      <div className="max-w-md mx-auto mt-16 bg-white rounded-xl shadow-lg p-8 text-center">
        <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-red-100 flex items-center justify-center">
          <AlertTriangle className="w-8 h-8 text-red-600" />
        </div>

        <h1 className="text-2xl font-semibold text-gray-900 mb-2">
          加载失败
        </h1>

        <p className="text-gray-500 mb-6">
          {error.message || '单据中心加载时发生错误'}
        </p>

        {error.digest && (
          <p className="text-xs text-gray-400 mb-6 font-mono">
            错误代码: {error.digest}
          </p>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={reset}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            重试
          </button>

          <button
            onClick={() => router.push('/dashboard')}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Home className="w-4 h-4" />
            返回首页
          </button>
        </div>
      </div>
    </div>
  );
}

