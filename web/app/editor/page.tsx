'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Loader2, ExternalLink, AlertCircle } from 'lucide-react';
import type { DocType } from '@/lib/supabase';

const DOC_TYPE_LABELS: Record<DocType, string> = {
  bill: '账单',
  quote: '报价单',
  ticket: '机票单',
  compare: '比价单',
};

function EditorContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const type = (searchParams.get('type') as DocType) || 'bill';
  const mode = searchParams.get('mode') || 'create';
  const id = searchParams.get('id') || '';

  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [iframeError, setIframeError] = useState(false);

  // 构建 legacy 编辑器 URL
  const legacyUrl = process.env.NEXT_PUBLIC_LEGACY_URL || 'https://oms.fhglobal.es';
  const editorUrl = `${legacyUrl}/#editor?type=${type}&mode=${mode}${id ? `&id=${id}` : ''}&embed=1`;

  // 监听来自 iframe 的消息
  const handleMessage = useCallback((event: MessageEvent) => {
    // 只处理来自 legacy 域的消息
    if (!legacyUrl.includes(event.origin.replace(/^https?:\/\//, ''))) {
      return;
    }

    const { type: msgType, id: docId, docType } = event.data || {};

    switch (msgType) {
      case 'editor:saved':
        // 保存成功，返回单据列表并刷新
        router.push(`/documents?refresh=1&tab=${docType || type}`);
        break;
      case 'editor:close':
        // 关闭编辑器
        router.push('/documents');
        break;
      case 'editor:error':
        // 显示错误（可以用 toast）
        break;
    }
  }, [router, type, legacyUrl]);

  useEffect(() => {
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [handleMessage]);

  // 返回单据列表
  const handleBack = () => {
    router.push('/documents');
  };

  // 在新窗口打开
  const handleOpenExternal = () => {
    window.open(editorUrl.replace('&embed=1', ''), '_blank');
  };

  const title = mode === 'create' 
    ? `创建${DOC_TYPE_LABELS[type]}`
    : mode === 'edit'
    ? `编辑${DOC_TYPE_LABELS[type]}`
    : `查看${DOC_TYPE_LABELS[type]}`;

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200 shrink-0">
        <div className="flex items-center gap-4">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 px-3 py-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>返回</span>
          </button>
          <div className="h-6 w-px bg-gray-200" />
          <h1 className="text-lg font-medium text-gray-900">{title}</h1>
          {id && (
            <span className="text-sm text-gray-500 font-mono">#{id.slice(0, 8)}</span>
          )}
        </div>

        <button
          onClick={handleOpenExternal}
          className="flex items-center gap-2 px-3 py-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          title="在新窗口打开"
        >
          <ExternalLink className="w-4 h-4" />
        </button>
      </header>

      {/* iframe Container */}
      <div className="flex-1 relative">
        {/* Loading */}
        {!iframeLoaded && !iframeError && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-50 z-10">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
              <p className="text-gray-500 text-sm">加载编辑器...</p>
            </div>
          </div>
        )}

        {/* Error */}
        {iframeError && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-50 z-10">
            <div className="flex flex-col items-center gap-3 text-center">
              <AlertCircle className="w-12 h-12 text-red-400" />
              <p className="text-gray-700">编辑器加载失败</p>
              <p className="text-gray-500 text-sm">请检查网络连接或稍后重试</p>
              <button
                onClick={() => {
                  setIframeError(false);
                  setIframeLoaded(false);
                }}
                className="mt-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                重试
              </button>
            </div>
          </div>
        )}

        {/* iframe */}
        <iframe
          src={editorUrl}
          className="w-full h-full border-none"
          onLoad={() => setIframeLoaded(true)}
          onError={() => setIframeError(true)}
          allow="clipboard-write"
          title={title}
        />
      </div>
    </div>
  );
}

export default function EditorPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
          <p className="text-gray-500 text-sm">加载中...</p>
        </div>
      </div>
    }>
      <EditorContent />
    </Suspense>
  );
}

