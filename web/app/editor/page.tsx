'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useState, useEffect, useCallback, Suspense } from 'react';
import { ArrowLeft, ExternalLink, Check, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';

// Legacy editor base URL
const LEGACY_EDITOR_BASE_URL = process.env.NEXT_PUBLIC_LEGACY_URL || 'https://oms.fhglobal.es';

function EditorContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { showToast, ToastContainer } = useToast();
  
  const type = searchParams.get('type') || 'bill';
  const mode = searchParams.get('mode') || 'create';
  const id = searchParams.get('id') || '';
  
  const [iframeSrc, setIframeSrc] = useState('');
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [iframeError, setIframeError] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved' | 'saving'>('idle');
  const [savedDocId, setSavedDocId] = useState<string | null>(null);

  const typeLabels: Record<string, string> = {
    bill: '账单',
    quote: '报价单',
    ticket: '机票单',
    compare: '比价单',
  };

  const modeLabels: Record<string, string> = {
    create: '创建',
    edit: '编辑',
    view: '查看',
  };

  // handleBack needs to be defined before handleMessage since it's used there
  const handleBack = useCallback(() => {
    // 如果有保存过，带上 refresh 参数
    if (savedDocId || saveStatus === 'saved') {
      router.push('/documents?refresh=1');
    } else {
      router.push('/documents');
    }
  }, [router, savedDocId, saveStatus]);

  // Build iframe URL
  useEffect(() => {
    const params = new URLSearchParams();
    params.set('type', type);
    params.set('mode', mode);
    if (id) params.set('id', id);
    params.set('embedded', 'true');
    
    const url = `${LEGACY_EDITOR_BASE_URL}/#editor?${params.toString()}`;
    setIframeSrc(url);
    setIframeLoaded(false);
    setIframeError(false);
  }, [type, mode, id]);

  // Listen for postMessage from legacy editor
  const handleMessage = useCallback((event: MessageEvent) => {
    const { type: msgType, id: docId } = event.data || {};
    
    if (msgType === 'editor:saved') {
      setSaveStatus('saved');
      setSavedDocId(docId);
      showToast('单据保存成功！', 'success');
      
      // Reset status after 3 seconds
      setTimeout(() => setSaveStatus('idle'), 3000);
    } else if (msgType === 'editor:saving') {
      setSaveStatus('saving');
    } else if (msgType === 'editor:close') {
      handleBack();
    } else if (msgType === 'editor:error') {
      showToast(event.data.message || '保存失败', 'error');
    }
  }, [showToast, handleBack]);

  useEffect(() => {
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [handleMessage]);

  const handleIframeLoad = useCallback(() => {
    setIframeLoaded(true);
    setIframeError(false);
  }, []);

  const handleIframeError = useCallback(() => {
    setIframeError(true);
    setIframeLoaded(true);
  }, []);

  const handleOpenInNewTab = useCallback(() => {
    window.open(iframeSrc.replace('&embedded=true', ''), '_blank');
  }, [iframeSrc]);

  return (
    <div className="flex flex-col h-full bg-gray-50">
      <ToastContainer />
      
      {/* Editor Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200 shrink-0">
        <div className="flex items-center gap-4">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 px-3 py-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>返回列表</span>
          </button>
          
          <div className="h-6 w-px bg-gray-200" />
          
          <div className="flex items-center gap-2">
            <span className="text-gray-500">{modeLabels[mode] || mode}</span>
            <span className="font-medium text-gray-900">{typeLabels[type] || type}</span>
            {id && <span className="text-gray-400 text-sm">ID: {id.slice(0, 8)}...</span>}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Save status indicator */}
          {saveStatus === 'saving' && (
            <div className="flex items-center gap-2 text-gray-500">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">保存中...</span>
            </div>
          )}
          {saveStatus === 'saved' && (
            <div className="flex items-center gap-2 text-green-600">
              <Check className="w-4 h-4" />
              <span className="text-sm">已保存</span>
            </div>
          )}
          
          <button
            onClick={handleOpenInNewTab}
            className="flex items-center gap-2 px-3 py-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
            title="在新标签页打开"
          >
            <ExternalLink className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Iframe Container */}
      <div className="flex-1 relative overflow-hidden">
        {/* Loading state */}
        {!iframeLoaded && !iframeError && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-50 z-10">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
              <p className="text-gray-500 text-sm">加载编辑器...</p>
            </div>
          </div>
        )}

        {/* Error state */}
        {iframeError && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-50 z-10">
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
                <span className="text-red-500 text-2xl">!</span>
              </div>
              <div>
                <p className="text-gray-700 font-medium">编辑器加载失败</p>
                <p className="text-gray-500 text-sm mt-1">请检查网络连接后重试</p>
              </div>
              <button
                onClick={() => {
                  setIframeError(false);
                  setIframeLoaded(false);
                  setIframeSrc(prev => prev + '&retry=' + Date.now());
                }}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                重新加载
              </button>
            </div>
          </div>
        )}

        {iframeSrc && (
          <iframe
            src={iframeSrc}
            title="Editor"
            className="absolute inset-0 w-full h-full border-0"
            allow="clipboard-write"
            onLoad={handleIframeLoad}
            onError={handleIframeError}
          />
        )}
      </div>
    </div>
  );
}

export default function EditorPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-full bg-gray-50">
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

