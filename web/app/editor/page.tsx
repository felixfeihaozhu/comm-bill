'use client';

import { useEffect, useState, useRef, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Loader2, AlertCircle, ExternalLink, RefreshCw } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';
import { useWorkspace } from '@/components/auth/WorkspaceProvider';
import { supabase } from '@/lib/supabase';

// Legacy 编辑器 URL（从环境变量读取，或使用默认值）
const LEGACY_URL = process.env.NEXT_PUBLIC_LEGACY_URL || 'https://viajes-fh.vercel.app';

// 单据类型标签
const docTypeLabels: Record<string, string> = {
  bill: '账单',
  quote: '报价单',
  ticket: '机票单',
  compare: '比价单',
};

function EditorContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, session, loading: authLoading } = useAuth();
  const { currentWorkspace, loading: wsLoading } = useWorkspace();

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [sessionSent, setSessionSent] = useState(false);
  const [iframeError, setIframeError] = useState<string | null>(null);
  const [iframeAck, setIframeAck] = useState(false);

  // 从 URL 获取参数
  const docType = searchParams.get('type') || 'bill';
  const mode = searchParams.get('mode') || 'create';
  const docId = searchParams.get('id');

  // 构建 iframe URL
  const buildIframeUrl = useCallback(() => {
    const params = new URLSearchParams();
    params.set('type', docType);
    params.set('mode', mode);
    params.set('embedded', 'true');
    if (docId) params.set('id', docId);

    return `${LEGACY_URL}/#editor?${params.toString()}`;
  }, [docType, mode, docId]);

  // 发送 session 到 iframe
  const sendSessionToIframe = useCallback(async () => {
    if (!iframeRef.current?.contentWindow || !session) return;

    try {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        iframeRef.current.contentWindow.postMessage(
          {
            type: 'FH_SUPABASE_SESSION',
            access_token: data.session.access_token,
            refresh_token: data.session.refresh_token,
          },
          LEGACY_URL
        );
        setSessionSent(true);
        console.log('📤 Session sent to iframe');
      }
    } catch (err) {
      console.error('Failed to send session to iframe:', err);
      setIframeError('无法同步登录状态到编辑器');
    }
  }, [session]);

  // iframe 加载完成后发送 session
  useEffect(() => {
    if (iframeLoaded && session && !sessionSent) {
      sendSessionToIframe();
    }
  }, [iframeLoaded, session, sessionSent, sendSessionToIframe]);

  // 监听来自 iframe 的消息
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // 验证来源
      if (!event.origin.includes(new URL(LEGACY_URL).hostname)) return;

      const { type, id, docType: savedDocType } = event.data || {};

      switch (type) {
        case 'editor:saved':
          console.log('📥 Editor saved:', { id, docType: savedDocType });
          // 返回单据列表并刷新
          router.push(`/documents?tab=${savedDocType || docType}&refresh=1`);
          break;

        case 'editor:close':
          console.log('📥 Editor close requested');
          router.push('/documents');
          break;

        case 'editor:error':
          console.error('📥 Editor error:', event.data.message);
          setIframeError(event.data.message);
          break;

        case 'editor:ack':
        case 'FH_SESSION_ACK':
          console.log('📥 Session acknowledged by iframe');
          setIframeAck(true);
          break;
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [router, docType]);

  // iframe 加载处理
  const handleIframeLoad = () => {
    console.log('🖼️ iframe loaded');
    setIframeLoaded(true);
  };

  // 返回列表
  const handleBack = () => {
    router.push('/documents');
  };

  // 刷新 iframe
  const handleRefresh = () => {
    setIframeLoaded(false);
    setSessionSent(false);
    setIframeAck(false);
    setIframeError(null);
    if (iframeRef.current) {
      iframeRef.current.src = buildIframeUrl();
    }
  };

  // 在新窗口打开
  const handleOpenExternal = () => {
    window.open(buildIframeUrl(), '_blank');
  };

  const isLoading = authLoading || wsLoading;

  // 加载中状态
  if (isLoading) {
    return (
      <div className="flex flex-col h-screen bg-gray-50">
        <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200">
          <div className="flex items-center gap-4">
            <div className="h-8 w-24 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-6 w-px bg-gray-200"></div>
            <div className="h-6 w-32 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-10 h-10 animate-spin text-primary-600" />
            <p className="text-gray-500">加载中...</p>
          </div>
        </div>
      </div>
    );
  }

  // 未登录状态
  if (!user) {
    return (
      <div className="flex flex-col h-screen bg-gray-50">
        <div className="flex items-center px-4 py-3 bg-white border-b border-gray-200">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>返回</span>
          </button>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4 text-center">
            <AlertCircle className="w-16 h-16 text-amber-500" />
            <h2 className="text-xl font-semibold text-gray-900">请先登录</h2>
            <p className="text-gray-500">您需要登录后才能使用编辑器</p>
            <button
              onClick={() => router.push('/login')}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              前往登录
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 未选择工作空间
  if (!currentWorkspace) {
    return (
      <div className="flex flex-col h-screen bg-gray-50">
        <div className="flex items-center px-4 py-3 bg-white border-b border-gray-200">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>返回</span>
          </button>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4 text-center">
            <AlertCircle className="w-16 h-16 text-amber-500" />
            <h2 className="text-xl font-semibold text-gray-900">请选择工作空间</h2>
            <p className="text-gray-500">您需要先选择一个工作空间才能创建单据</p>
            <button
              onClick={() => router.push('/org')}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              选择工作空间
            </button>
          </div>
        </div>
      </div>
    );
  }

  const title = mode === 'create' 
    ? `创建${docTypeLabels[docType] || '单据'}`
    : mode === 'edit'
    ? `编辑${docTypeLabels[docType] || '单据'}`
    : `查看${docTypeLabels[docType] || '单据'}`;

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* 顶部工具栏 */}
      <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200 shrink-0">
        <div className="flex items-center gap-4">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>返回列表</span>
          </button>
          <div className="h-6 w-px bg-gray-200"></div>
          <h1 className="text-lg font-medium text-gray-900">{title}</h1>
        </div>

        <div className="flex items-center gap-2">
          {/* 会话状态指示 */}
          {sessionSent && !iframeAck && (
            <span className="text-xs text-amber-600 flex items-center gap-1">
              <Loader2 className="w-3 h-3 animate-spin" />
              等待编辑器响应...
            </span>
          )}
          {iframeAck && (
            <span className="text-xs text-green-600">✓ 会话已同步</span>
          )}

          <button
            onClick={handleRefresh}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            title="刷新编辑器"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
          <button
            onClick={handleOpenExternal}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            title="在新窗口打开"
          >
            <ExternalLink className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* iframe 错误提示 */}
      {iframeError && (
        <div className="px-4 py-2 bg-red-50 border-b border-red-200 text-red-700 text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          <span>{iframeError}</span>
          <button
            onClick={handleRefresh}
            className="ml-auto text-red-600 hover:text-red-800 underline"
          >
            重试
          </button>
        </div>
      )}

      {/* iframe 容器 */}
      <div className="flex-1 relative min-h-[calc(100vh-120px)] w-full">
        {/* 加载遮罩 */}
        {!iframeLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-50 z-10">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-10 h-10 animate-spin text-primary-600" />
              <p className="text-gray-500">加载编辑器...</p>
            </div>
          </div>
        )}

        {/* iframe */}
        <iframe
          ref={iframeRef}
          src={buildIframeUrl()}
          onLoad={handleIframeLoad}
          className="w-full h-full border-0"
          title="Document Editor"
          allow="clipboard-write"
        />
      </div>
    </div>
  );
}

export default function EditorPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col h-screen bg-gray-50">
          <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200">
            <div className="flex items-center gap-4">
              <div className="h-8 w-24 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-6 w-px bg-gray-200"></div>
              <div className="h-6 w-32 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>
          <div className="flex-1 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-10 h-10 animate-spin text-primary-600" />
              <p className="text-gray-500">加载中...</p>
            </div>
          </div>
        </div>
      }
    >
      <EditorContent />
    </Suspense>
  );
}
