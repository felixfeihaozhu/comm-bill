'use client';

import { useEffect } from 'react';
import { AlertTriangle, ArrowLeft, RefreshCw } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function EditorError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    console.error('Editor error:', error);
  }, [error]);

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* 顶部工具栏 */}
      <div className="flex items-center px-4 py-3 bg-white border-b border-gray-200 shrink-0">
        <button
          onClick={() => router.push('/documents')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>返回列表</span>
        </button>
      </div>

      {/* 错误内容 */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-red-100 flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>

          <h1 className="text-2xl font-semibold text-gray-900 mb-2">
            编辑器加载失败
          </h1>

          <p className="text-gray-500 mb-6">
            {error.message || '发生了一个未知错误，请稍后重试'}
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
              onClick={() => router.push('/documents')}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              返回列表
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

