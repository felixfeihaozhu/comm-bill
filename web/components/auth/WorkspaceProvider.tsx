'use client';

import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { useAuth } from './AuthProvider';
import {
  getUserWorkspaces,
  initWorkspace,
  getCurrentWorkspaceId,
  setCurrentWorkspaceId,
  clearCurrentWorkspaceId,
  type Workspace,
} from '@/lib/workspace';

interface WorkspaceContextType {
  workspaces: Workspace[];
  currentWorkspace: Workspace | null;
  currentWorkspaceId: string | null;
  role: 'owner' | 'admin' | 'member' | null;
  isAdmin: boolean;
  loading: boolean;
  error: string | null;
  switchWorkspace: (workspaceId: string) => void;
  refreshWorkspaces: () => Promise<void>;
  createWorkspace: (name: string) => Promise<Workspace>;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const initialized = useRef(false);

  // 加载工作空间列表
  const loadWorkspaces = useCallback(async () => {
    if (!user) {
      setWorkspaces([]);
      setCurrentWorkspace(null);
      setLoading(false);
      return;
    }

    try {
      setError(null);
      const list = await getUserWorkspaces();

      if (list.length === 0) {
        // 没有工作空间，自动创建一个
        console.log('没有工作空间，自动创建...');
        const newWs = await initWorkspace('My Workspace');
        setWorkspaces([newWs]);
        setCurrentWorkspace(newWs);
        setCurrentWorkspaceId(newWs.id);
      } else {
        setWorkspaces(list);

        // 尝试恢复上次选择的工作空间
        const savedId = getCurrentWorkspaceId();
        const saved = savedId ? list.find((w) => w.id === savedId) : null;
        const selected = saved || list[0];

        setCurrentWorkspace(selected);
        setCurrentWorkspaceId(selected.id);
      }
    } catch (err) {
      console.error('加载工作空间失败:', err);
      setError(err instanceof Error ? err.message : '加载工作空间失败');
    } finally {
      setLoading(false);
    }
  }, [user]);

  // 初始化和用户变化时加载
  useEffect(() => {
    // 等待 auth 加载完成
    if (authLoading) return;

    if (!user) {
      // 用户未登录时清空
      setWorkspaces([]);
      setCurrentWorkspace(null);
      clearCurrentWorkspaceId();
      setLoading(false);
      initialized.current = false;
      return;
    }

    // 已登录但未初始化，或者 workspaces 为空但有缓存的 ID
    const savedId = getCurrentWorkspaceId();
    const needsLoad = !initialized.current || 
      (workspaces.length === 0 && savedId) ||
      (savedId && !currentWorkspace);

    if (needsLoad) {
      initialized.current = true;
      loadWorkspaces();
    }
  }, [authLoading, user, loadWorkspaces, workspaces.length, currentWorkspace]);

  // 切换工作空间
  const switchWorkspace = useCallback(
    (workspaceId: string) => {
      const ws = workspaces.find((w) => w.id === workspaceId);
      if (ws) {
        setCurrentWorkspace(ws);
        setCurrentWorkspaceId(ws.id);
      }
    },
    [workspaces]
  );

  // 刷新工作空间列表
  const refreshWorkspaces = useCallback(async () => {
    initialized.current = false;
    setLoading(true);
    await loadWorkspaces();
  }, [loadWorkspaces]);

  // 创建新工作空间
  const createWorkspace = useCallback(
    async (name: string): Promise<Workspace> => {
      const newWs = await initWorkspace(name);
      setWorkspaces((prev) => [...prev, newWs]);
      setCurrentWorkspace(newWs);
      setCurrentWorkspaceId(newWs.id);
      return newWs;
    },
    []
  );

  // 计算派生值
  const currentWorkspaceId = currentWorkspace?.id || null;
  const role = currentWorkspace?.role || null;
  const isAdmin = role === 'owner' || role === 'admin';

  return (
    <WorkspaceContext.Provider
      value={{
        workspaces,
        currentWorkspace,
        currentWorkspaceId,
        role,
        isAdmin,
        loading,
        error,
        switchWorkspace,
        refreshWorkspaces,
        createWorkspace,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (context === undefined) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider');
  }
  return context;
}
