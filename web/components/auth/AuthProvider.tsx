'use client';

import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { User, Session, AuthChangeEvent } from '@supabase/supabase-js';
import { supabase, hasValidSupabaseConfig } from '@/lib/supabase';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const initialized = useRef(false);

  useEffect(() => {
    // 防止重复初始化
    if (initialized.current) return;
    initialized.current = true;

    // 如果没有有效的 Supabase 配置，直接停止加载
    if (!hasValidSupabaseConfig()) {
      console.warn('Supabase not configured, skipping auth initialization');
      setLoading(false);
      return;
    }

    // 1. 首先尝试从存储恢复 session
    const initSession = async () => {
      try {
        const { data: { session: currentSession }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('获取 session 失败:', error);
        }
        
        if (currentSession) {
          setSession(currentSession);
          setUser(currentSession.user);
        }
      } catch (err) {
        console.error('初始化 session 失败:', err);
      } finally {
        setLoading(false);
      }
    };

    // 添加超时保护，确保 loading 状态不会永远卡住
    const timeout = setTimeout(() => {
      if (loading) {
        console.warn('Auth initialization timeout, forcing loading to false');
        setLoading(false);
      }
    }, 5000);

    initSession();

    // 2. 监听 auth 状态变化
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event: AuthChangeEvent, currentSession: Session | null) => {
        
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        
        // 仅在非初始化事件时更新 loading
        if (event !== 'INITIAL_SESSION') {
          setLoading(false);
        }
      }
    );

    return () => {
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    if (!hasValidSupabaseConfig()) {
      return { error: new Error('Supabase not configured') };
    }

    setLoading(true);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        setLoading(false);
        return { error: error as Error };
      }
      
      // 登录成功，状态会通过 onAuthStateChange 更新
      return { error: null };
    } catch (err) {
      setLoading(false);
      return { error: err as Error };
    }
  }, []);

  const signOut = useCallback(async () => {
    if (!hasValidSupabaseConfig()) {
      setUser(null);
      setSession(null);
      return;
    }

    setLoading(true);
    
    try {
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, session, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

