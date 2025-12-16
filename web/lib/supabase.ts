import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// 延迟初始化 Supabase client，避免静态生成时报错
let _supabase: SupabaseClient | null = null

function getSupabaseClient(): SupabaseClient {
  if (_supabase) return _supabase

  if (!supabaseUrl || !supabaseAnonKey) {
    // 在构建时提供一个 placeholder URL，运行时会被实际环境变量替换
    const placeholderUrl = supabaseUrl || 'https://placeholder.supabase.co'
    const placeholderKey = supabaseAnonKey || 'placeholder-key'
    
    _supabase = createClient(placeholderUrl, placeholderKey, {
      auth: {
        persistSession: typeof window !== 'undefined',
        autoRefreshToken: true,
        detectSessionInUrl: typeof window !== 'undefined',
        storageKey: 'fh-oms-auth',
      },
    })
    return _supabase
  }

  _supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storageKey: 'fh-oms-auth',
    },
  })
  return _supabase
}

// 导出一个 getter 代理，确保每次访问时都检查初始化状态
export const supabase = new Proxy({} as SupabaseClient, {
  get(_, prop) {
    const client = getSupabaseClient()
    const value = (client as any)[prop]
    if (typeof value === 'function') {
      return value.bind(client)
    }
    return value
  },
})

// 单据类型
export type DocType = 'bill' | 'quote' | 'ticket' | 'compare'
export type DocStatus = 'draft' | 'confirmed' | 'cancelled'

// 单据查询结果
export interface DocumentRow {
  id: string
  bill_no: string
  bill_date: string
  customer_name: string | null
  total_amount: number | null
  ship: string | null
  route: string | null
  mode: DocType
  status: DocStatus
  created_at: string
  updated_at?: string
  workspace_id?: string
  created_by?: string
}

// 客户类型
export interface Customer {
  id: string
  name: string
  trade_name: string | null
  customer_type: string | null
  contact: string | null
  company: string | null
  tax_id: string | null
  address: string | null
  default_rate: number | null
  addon_rate: number | null
  notes: string | null
  created_at: string
}

// 检查是否有有效的 Supabase 配置
export function hasValidSupabaseConfig(): boolean {
  return Boolean(supabaseUrl && supabaseAnonKey)
}

// 获取单据列表
export async function getDocuments(options: {
  mode?: DocType
  search?: string
  limit?: number
} = {}): Promise<DocumentRow[]> {
  if (!hasValidSupabaseConfig()) {
    console.warn('Supabase not configured, returning empty array')
    return []
  }

  const { mode, search, limit = 50 } = options

  try {
    let query = supabase
      .from('bills')
      .select('id, bill_no, bill_date, customer_name, total_amount, ship, route, mode, status, created_at, workspace_id, created_by')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (mode) {
      query = query.eq('mode', mode)
    }

    if (search && search.trim()) {
      const term = search.trim()
      query = query.or(`bill_no.ilike.%${term}%,customer_name.ilike.%${term}%`)
    }

    const { data, error } = await query

    if (error) {
      console.error('获取单据列表失败:', error)
      throw error
    }

    return (data || []) as DocumentRow[]
  } catch (error) {
    console.error('getDocuments error:', error)
    throw error
  }
}

// 获取单个单据
export async function getDocument(id: string): Promise<DocumentRow | null> {
  if (!hasValidSupabaseConfig()) {
    return null
  }

  try {
    const { data, error } = await supabase
      .from('bills')
      .select('id, bill_no, bill_date, customer_name, total_amount, ship, route, mode, status, created_at, workspace_id, created_by')
      .eq('id', id)
      .single()

    if (error) {
      console.error('获取单据失败:', error)
      return null
    }

    return data as DocumentRow
  } catch (error) {
    console.error('getDocument error:', error)
    return null
  }
}

// 删除单据
export async function deleteDocument(id: string): Promise<boolean> {
  if (!hasValidSupabaseConfig()) {
    return false
  }

  try {
    const { error } = await supabase
      .from('bills')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('删除单据失败:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('deleteDocument error:', error)
    return false
  }
}

// 获取客户列表
export async function getCustomers(options: {
  search?: string
  limit?: number
} = {}): Promise<Customer[]> {
  if (!hasValidSupabaseConfig()) {
    return []
  }

  const { search, limit = 100 } = options

  try {
    let query = supabase
      .from('customers')
      .select('id, name, trade_name, customer_type, contact, company, tax_id, address, default_rate, addon_rate, notes, created_at')
      .order('name')
      .limit(limit)

    if (search && search.trim()) {
      const term = search.trim()
      query = query.or(`name.ilike.%${term}%,contact.ilike.%${term}%,company.ilike.%${term}%`)
    }

    const { data, error } = await query

    if (error) {
      console.error('获取客户列表失败:', error)
      throw error
    }

    return (data || []) as Customer[]
  } catch (error) {
    console.error('getCustomers error:', error)
    throw error
  }
}
