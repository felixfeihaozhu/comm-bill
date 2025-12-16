'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, RefreshCw, Loader2, Building2, AlertCircle } from 'lucide-react';
import { getDocuments, deleteDocument, type DocumentRow, type DocType } from '@/lib/supabase';
import { DocumentTabs } from '@/components/documents/DocumentTabs';
import { DocumentsTable } from '@/components/documents/DocumentsTable';
import { CreateDocumentButton } from '@/components/documents/CreateDocumentButton';
import { useToast } from '@/components/ui/Toast';
import { useWorkspace } from '@/components/auth/WorkspaceProvider';

function DocumentsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast, ToastContainer } = useToast();
  const { currentWorkspace, loading: wsLoading, error: wsError } = useWorkspace();
  
  // 从 URL 读取初始状态
  const initialTab = (searchParams.get('tab') as DocType | 'all') || 'all';
  const initialSearch = searchParams.get('q') || '';
  const refreshFlag = searchParams.get('refresh');
  
  const [activeTab, setActiveTab] = useState<DocType | 'all'>(initialTab);
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [documents, setDocuments] = useState<DocumentRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [initialLoadDone, setInitialLoadDone] = useState(false);

  // 加载数据（RLS 自动按 workspace 过滤）
  const loadDocuments = useCallback(async (showRefreshing = false) => {
    if (!currentWorkspace) {
      setDocuments([]);
      setLoading(false);
      setInitialLoadDone(true);
      return;
    }
    
    if (showRefreshing) setRefreshing(true);
    else setLoading(true);
    setLoadError(null);
    
    try {
      const mode = activeTab === 'all' ? undefined : activeTab;
      const data = await getDocuments({ mode, search: searchTerm, limit: 100 });
      setDocuments(data || []);
    } catch (error) {
      console.error('加载单据失败:', error);
      setLoadError(error instanceof Error ? error.message : '加载单据失败');
      showToast('加载单据失败', 'error');
      setDocuments([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setInitialLoadDone(true);
    }
  }, [activeTab, searchTerm, showToast, currentWorkspace]);

  // 初始加载和 tab/search/workspace 变化时重新加载
  useEffect(() => {
    if (!wsLoading && currentWorkspace) {
      loadDocuments();
    } else if (!wsLoading && !currentWorkspace) {
      setInitialLoadDone(true);
    }
  }, [loadDocuments, currentWorkspace, wsLoading]);

  // 监听 refresh 参数变化（从编辑器返回时）
  useEffect(() => {
    if (refreshFlag && currentWorkspace && !wsLoading) {
      loadDocuments(true);
      showToast('单据已保存', 'success');
      // 清除 refresh 参数
      const params = new URLSearchParams(searchParams.toString());
      params.delete('refresh');
      const newUrl = params.toString() ? `/documents?${params.toString()}` : '/documents';
      router.replace(newUrl);
    }
  }, [refreshFlag, loadDocuments, router, searchParams, showToast, currentWorkspace, wsLoading]);

  // 切换 tab
  const handleTabChange = (tab: DocType | 'all') => {
    setActiveTab(tab);
    const params = new URLSearchParams();
    if (tab !== 'all') params.set('tab', tab);
    if (searchTerm) params.set('q', searchTerm);
    const newUrl = params.toString() ? `/documents?${params.toString()}` : '/documents';
    router.push(newUrl);
  };

  // 搜索
  const handleSearch = (value: string) => {
    setSearchTerm(value);
  };

  // 删除
  const handleDelete = async (id: string) => {
    try {
      const success = await deleteDocument(id);
      if (success) {
        showToast('单据已删除', 'success');
        loadDocuments(true);
      } else {
        showToast('删除失败', 'error');
      }
    } catch (error) {
      console.error('删除单据失败:', error);
      showToast('删除失败', 'error');
    }
  };

  // 工作空间加载中
  if (wsLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
          <p className="text-gray-500 text-sm">加载工作空间...</p>
        </div>
      </div>
    );
  }

  // 工作空间加载错误
  if (wsError) {
    return (
      <div className="p-6">
        <div className="text-center py-16">
          <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-400" />
          <p className="text-lg text-gray-700">加载工作空间失败</p>
          <p className="text-gray-500 mt-2">{wsError}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            刷新页面
          </button>
        </div>
      </div>
    );
  }

  // 未选择工作空间
  if (!currentWorkspace) {
    return (
      <div className="p-6">
        <div className="text-center py-16 text-gray-400">
          <Building2 className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p className="text-lg">请先选择工作空间</p>
          <button
            onClick={() => router.push('/org')}
            className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            选择工作空间
          </button>
        </div>
      </div>
    );
  }

  // 加载数据错误
  if (loadError && initialLoadDone && documents.length === 0) {
    return (
      <div className="p-6">
        <ToastContainer />
        <div className="text-center py-16">
          <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-400" />
          <p className="text-lg text-gray-700">加载单据失败</p>
          <p className="text-gray-500 mt-2">{loadError}</p>
          <button
            onClick={() => loadDocuments()}
            className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            重试
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <ToastContainer />
      
      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">单据中心</h1>
        <CreateDocumentButton />
      </div>

      {/* Tabs & Search */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-4">
        <DocumentTabs 
          activeTab={activeTab} 
          onTabChange={handleTabChange}
        />

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="搜索单据号或客户..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-64 pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          
          <button
            onClick={() => loadDocuments(true)}
            disabled={refreshing || loading}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
            title="刷新"
          >
            <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Documents Table */}
      <DocumentsTable 
        documents={documents}
        loading={loading && !initialLoadDone}
        onDelete={handleDelete}
        onRefresh={() => loadDocuments(true)}
      />

      {/* Footer */}
      <div className="flex items-center justify-between mt-4 text-sm text-gray-600">
        <span>共 {documents.length} 条记录</span>
      </div>
    </div>
  );
}

export default function DocumentsPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-full p-12">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
          <p className="text-gray-500 text-sm">加载中...</p>
        </div>
      </div>
    }>
      <DocumentsContent />
    </Suspense>
  );
}



