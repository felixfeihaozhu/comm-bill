'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  FileText, 
  Receipt, 
  Ticket, 
  GitCompare,
  MoreHorizontal,
  Eye,
  Edit,
  Copy,
  Trash2,
  Loader2
} from 'lucide-react';
import type { DocumentRow, DocType } from '@/lib/supabase';
import { DOC_TYPE_CONFIG, DOC_STATUS_CONFIG, formatCurrency, formatDate } from '@/lib/helpers';

const typeIcons: Record<DocType, React.ComponentType<{ className?: string }>> = {
  bill: Receipt,
  quote: FileText,
  ticket: Ticket,
  compare: GitCompare,
};

interface DocumentsTableProps {
  documents: DocumentRow[];
  loading?: boolean;
  onDelete?: (id: string) => Promise<void>;
  onRefresh?: () => void;
}

export function DocumentsTable({ documents, loading, onDelete, onRefresh }: DocumentsTableProps) {
  const router = useRouter();
  const [actionMenuId, setActionMenuId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleEdit = (doc: DocumentRow) => {
    setActionMenuId(null);
    router.push(`/editor?type=${doc.mode}&mode=edit&id=${doc.id}`);
  };

  const handleView = (doc: DocumentRow) => {
    setActionMenuId(null);
    router.push(`/editor?type=${doc.mode}&mode=view&id=${doc.id}`);
  };

  const handleDelete = async (doc: DocumentRow) => {
    if (!onDelete) return;
    if (!confirm(`确定要删除单据 #${doc.bill_no} 吗？此操作不可撤销。`)) return;
    
    setDeletingId(doc.id);
    setActionMenuId(null);
    
    try {
      await onDelete(doc.id);
      onRefresh?.();
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-12">
        <div className="flex flex-col items-center justify-center text-gray-400">
          <Loader2 className="w-8 h-8 animate-spin mb-3" />
          <p>加载中...</p>
        </div>
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-12">
        <div className="flex flex-col items-center justify-center text-gray-400">
          <FileText className="w-12 h-12 mb-3 opacity-50" />
          <p>没有找到符合条件的单据</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200">
            <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">单据号</th>
            <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">类型</th>
            <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">客户</th>
            <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">航线</th>
            <th className="text-right px-4 py-3 text-sm font-medium text-gray-600">金额</th>
            <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">状态</th>
            <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">日期</th>
            <th className="text-right px-4 py-3 text-sm font-medium text-gray-600">操作</th>
          </tr>
        </thead>
        <tbody>
          {documents.map((doc) => {
            const TypeIcon = typeIcons[doc.mode] || FileText;
            const typeConfig = DOC_TYPE_CONFIG[doc.mode];
            const statusConfig = DOC_STATUS_CONFIG[doc.status];
            const isDeleting = deletingId === doc.id;

            return (
              <tr 
                key={doc.id} 
                className={`border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer ${
                  isDeleting ? 'opacity-50' : ''
                }`}
                onClick={() => !isDeleting && handleEdit(doc)}
              >
                <td className="px-4 py-3">
                  <span className="font-medium text-gray-900">{doc.bill_no}</span>
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${typeConfig.color}`}>
                    <TypeIcon className="w-3.5 h-3.5" />
                    {typeConfig.label}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-700">
                  {doc.customer_name || <span className="text-gray-400">-</span>}
                </td>
                <td className="px-4 py-3 text-gray-500 text-sm">
                  {doc.ship && doc.route ? `${doc.ship} · ${doc.route}` : doc.ship || doc.route || '-'}
                </td>
                <td className="px-4 py-3 text-right font-medium text-gray-900">
                  {formatCurrency(doc.total_amount)}
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${statusConfig.color}`}>
                    {statusConfig.label}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-500 text-sm">
                  {formatDate(doc.bill_date)}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="relative inline-block">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!isDeleting) {
                          setActionMenuId(actionMenuId === doc.id ? null : doc.id);
                        }
                      }}
                      className="p-1.5 rounded-md hover:bg-gray-100 transition-colors"
                      disabled={isDeleting}
                    >
                      {isDeleting ? (
                        <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
                      ) : (
                        <MoreHorizontal className="w-4 h-4 text-gray-500" />
                      )}
                    </button>
                    
                    {actionMenuId === doc.id && !isDeleting && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setActionMenuId(null)} />
                        <div className="absolute right-0 mt-1 w-36 bg-white rounded-lg shadow-lg border border-gray-200 z-20 py-1">
                          <button
                            onClick={(e) => { e.stopPropagation(); handleView(doc); }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                          >
                            <Eye className="w-4 h-4" /> 查看
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleEdit(doc); }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                          >
                            <Edit className="w-4 h-4" /> 编辑
                          </button>
                          <button
                            onClick={(e) => e.stopPropagation()}
                            className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                          >
                            <Copy className="w-4 h-4" /> 复制
                          </button>
                          {onDelete && (
                            <>
                              <hr className="my-1 border-gray-100" />
                              <button
                                onClick={(e) => { e.stopPropagation(); handleDelete(doc); }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                              >
                                <Trash2 className="w-4 h-4" /> 删除
                              </button>
                            </>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}


