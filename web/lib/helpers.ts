import type { DocType, DocStatus } from './supabase';

// 单据类型配置
export const DOC_TYPE_CONFIG: Record<DocType, { label: string; color: string }> = {
  bill: { label: '账单', color: 'bg-blue-100 text-blue-700' },
  quote: { label: '报价单', color: 'bg-green-100 text-green-700' },
  ticket: { label: '机票单', color: 'bg-purple-100 text-purple-700' },
  compare: { label: '比价单', color: 'bg-orange-100 text-orange-700' },
};

// 状态配置
export const DOC_STATUS_CONFIG: Record<DocStatus, { label: string; color: string }> = {
  draft: { label: '草稿', color: 'bg-gray-100 text-gray-600' },
  confirmed: { label: '已确认', color: 'bg-green-100 text-green-700' },
  cancelled: { label: '已取消', color: 'bg-red-100 text-red-600' },
};

// 格式化货币
export function formatCurrency(amount: number | null, currency = 'EUR'): string {
  if (amount === null || amount === undefined) return '-';
  return new Intl.NumberFormat('zh-CN', { style: 'currency', currency }).format(amount);
}

// 格式化日期
export function formatDate(dateStr: string | null): string {
  if (!dateStr) return '-';
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' });
  } catch {
    return dateStr;
  }
}

// 格式化相对时间
export function formatRelativeTime(dateStr: string | null): string {
  if (!dateStr) return '-';
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return '今天';
    if (diffDays === 1) return '昨天';
    if (diffDays < 7) return `${diffDays}天前`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}周前`;
    return formatDate(dateStr);
  } catch {
    return dateStr;
  }
}


