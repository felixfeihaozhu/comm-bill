import { supabase, hasValidSupabaseConfig } from './supabase'

export interface Workspace {
  id: string
  name: string
  role: 'owner' | 'admin' | 'member'
  created_at: string
}

export interface WorkspaceMember {
  id: string
  user_id: string
  role: 'owner' | 'admin' | 'member'
  email?: string
  created_at: string
}

const CURRENT_WORKSPACE_KEY = 'fh-oms-current-workspace'

export async function getUserWorkspaces(): Promise<Workspace[]> {
  if (!hasValidSupabaseConfig()) {
    return []
  }

  try {
    const { data, error } = await supabase
      .from('workspace_members')
      .select(`
        workspace_id,
        role,
        created_at,
        workspaces (
          id,
          name,
          created_at
        )
      `)
      .order('created_at')

    if (error) {
      console.error('获取工作空间列表失败:', error)
      throw error
    }

    if (!data) {
      return []
    }

    return data.map((item: any) => ({
      id: item.workspace_id,
      name: item.workspaces?.name || '未命名工作空间',
      role: item.role,
      created_at: item.created_at,
    }))
  } catch (error) {
    console.error('getUserWorkspaces error:', error)
    throw error
  }
}

export async function initWorkspace(name = 'My Workspace'): Promise<Workspace> {
  if (!hasValidSupabaseConfig()) {
    throw new Error('Supabase not configured')
  }

  try {
    const { data, error } = await supabase.rpc('init_workspace', { ws_name: name })

    if (error) {
      console.error('初始化工作空间失败:', error)
      throw error
    }

    const wsData = Array.isArray(data) ? data[0] : data

    if (!wsData) {
      throw new Error('初始化工作空间失败：未返回数据')
    }

    return {
      id: wsData.workspace_id,
      name: wsData.name,
      role: wsData.role,
      created_at: new Date().toISOString(),
    }
  } catch (error) {
    console.error('initWorkspace error:', error)
    throw error
  }
}

export function getCurrentWorkspaceId(): string | null {
  if (typeof window === 'undefined') return null
  try {
    return localStorage.getItem(CURRENT_WORKSPACE_KEY)
  } catch {
    return null
  }
}

export function setCurrentWorkspaceId(workspaceId: string): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(CURRENT_WORKSPACE_KEY, workspaceId)
  } catch (error) {
    console.error('Failed to save workspace ID:', error)
  }
}

export function clearCurrentWorkspaceId(): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.removeItem(CURRENT_WORKSPACE_KEY)
  } catch (error) {
    console.error('Failed to clear workspace ID:', error)
  }
}

export async function getWorkspaceMembers(workspaceId: string): Promise<WorkspaceMember[]> {
  if (!hasValidSupabaseConfig()) {
    return []
  }

  try {
    const { data, error } = await supabase
      .from('workspace_members')
      .select('id, user_id, role, created_at')
      .eq('workspace_id', workspaceId)
      .order('created_at')

    if (error) {
      console.error('获取成员列表失败:', error)
      throw error
    }

    return data || []
  } catch (error) {
    console.error('getWorkspaceMembers error:', error)
    throw error
  }
}

export async function addWorkspaceMember(
  workspaceId: string,
  email: string,
  role: 'admin' | 'member' = 'member'
): Promise<{ action: string; user_id: string; role: string }> {
  if (!hasValidSupabaseConfig()) {
    throw new Error('Supabase not configured')
  }

  try {
    const { data, error } = await supabase.rpc('add_workspace_member', {
      ws_id: workspaceId,
      member_email: email,
      member_role: role,
    })

    if (error) {
      console.error('添加成员失败:', error)
      throw error
    }

    return data
  } catch (error) {
    console.error('addWorkspaceMember error:', error)
    throw error
  }
}

export async function removeWorkspaceMember(memberId: string): Promise<void> {
  if (!hasValidSupabaseConfig()) {
    return
  }

  try {
    const { error } = await supabase
      .from('workspace_members')
      .delete()
      .eq('id', memberId)

    if (error) {
      console.error('移除成员失败:', error)
      throw error
    }
  } catch (error) {
    console.error('removeWorkspaceMember error:', error)
    throw error
  }
}

export function isAdmin(role: string | null): boolean {
  return role === 'owner' || role === 'admin'
}
