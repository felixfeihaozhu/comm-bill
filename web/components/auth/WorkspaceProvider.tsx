'use client';

import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { useAuth } from './AuthProvider';
import {
  Workspace,
  getUserWorkspaces,
  initWorkspace,
  getCurrentWorkspaceId,
  setCurrentWorkspaceId,
  clearCurrentWorkspaceId,
  isAdmin as checkIsAdmin,
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
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const initialized = useRef(false);
  const previousUserId = useRef<string | null>(null);
  const loadingRef = useRef(false);

  // 加载工作空间
  const loadWorkspaces = useCallback(async () => {
    if (!user) {
      setWorkspaces([]);
      setCurrentWorkspace(null);
      setLoading(false);
      return;
    }

    // 防止并发加载
    if (loadingRef.current) {
      return;
    }
    loadingRef.current = true;

    try {
      setError(null);
      let wsList: Workspace[] = [];
      
      try {
        wsList = await getUserWorkspaces();
      } catch (err: any) {
        console.error('获取工作空间失败:', err);
        // 如果是权限错误或表不存在，尝试初始化
        if (err.code === '42501' || err.code === '42P01' || err.message?.includes('permission')) {
          // 尝试初始化工作空间
        }
      }

      // 如果没有工作空间，尝试初始化一个
      if (wsList.length === 0) {
        try {
          const newWs = await initWorkspace('Viajes FH');
          wsList = [newWs];
        } catch (initErr: any) {
          console.error('初始化工作空间失败:', initErr);
          // 即使初始化失败也继续，用户可以稍后重试
        }
      }

      setWorkspaces(wsList);

      // 恢复或设置当前工作空间
      if (wsList.length > 0) {
        const savedWsId = getCurrentWorkspaceId();
        let current = wsList.find(ws => ws.id === savedWsId);
        
        if (!current) {
          current = wsList[0];
          setCurrentWorkspaceId(current.id);
        }

        setCurrentWorkspace(current);
      } else {
        setCurrentWorkspace(null);
      }
    } catch (err: any) {
      console.error('加载工作空间失败:', err);
      setError(err.message || '加载工作空间失败');
      setWorkspaces([]);
      setCurrentWorkspace(null);
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }, [user]);

  // 初始化 - 当用户变化时重新加载
  useEffect(() => {
    // 等待 auth 加载完成
    if (authLoading) {
      return;
    }
    
    // 用户登出
    if (!user) {
      setWorkspaces([]);
      setCurrentWorkspace(null);
      setLoading(false);
      setError(null);
      clearCurrentWorkspaceId();
      initialized.current = false;
      previousUserId.current = null;
      return;
    }

    // 用户切换或首次加载
    if (previousUserId.current !== user.id) {
      previousUserId.current = user.id;
      initialized.current = false;
    }

    if (!initialized.current) {
      initialized.current = true;
      loadWorkspaces();
    }
  }, [user, authLoading, loadWorkspaces]);

  // 切换工作空间
  const switchWorkspace = useCallback((workspaceId: string) => {
    const ws = workspaces.find(w => w.id === workspaceId);
    if (ws) {
      setCurrentWorkspace(ws);
      setCurrentWorkspaceId(workspaceId);
    }
  }, [workspaces]);

  // 刷新工作空间列表
  const refreshWorkspaces = useCallback(async () => {
    initialized.current = false;
    loadingRef.current = false;
    await loadWorkspaces();
  }, [loadWorkspaces]);

  const role = currentWorkspace?.role || null;
  const isAdmin = checkIsAdmin(role);

  // 计算实际 loading 状态
  const isLoading = authLoading || (loading && !initialized.current);

  return (
    <WorkspaceContext.Provider
      value={{
        workspaces,
        currentWorkspace,
        currentWorkspaceId: currentWorkspace?.id || null,
        role,
        isAdmin,
        loading: isLoading,
        error,
        switchWorkspace,
        refreshWorkspaces,
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



