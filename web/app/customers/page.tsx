'use client';

import { useState, useEffect, useCallback } from 'react';
import { UserCircle, Plus, Search, Loader2, Building2, Phone, Mail } from 'lucide-react';
import { getCustomers, Customer } from '@/lib/supabase';
import { useWorkspace } from '@/components/auth/WorkspaceProvider';
import { useToast } from '@/components/ui/Toast';

export default function CustomersPage() {
  const { currentWorkspace, loading: wsLoading } = useWorkspace();
  const { showToast, ToastContainer } = useToast();
  
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // 加载客户列表
  const loadCustomers = useCallback(async () => {
    if (!currentWorkspace) return;
    
    setLoading(true);
    try {
      const data = await getCustomers({ search: searchTerm, limit: 100 });
      setCustomers(data);
    } catch (err: any) {
      showToast('加载客户列表失败', 'error');
    } finally {
      setLoading(false);
    }
  }, [currentWorkspace, searchTerm, showToast]);

  useEffect(() => {
    if (currentWorkspace) {
      loadCustomers();
    }
  }, [currentWorkspace, loadCustomers]);

  if (wsLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (!currentWorkspace) {
    return (
      <div className="p-6">
        <div className="text-center py-16 text-gray-400">
          <Building2 className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p className="text-lg">请先选择工作空间</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <ToastContainer />
      
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">客户管理</h1>
        <button className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
          <Plus className="w-5 h-5" />
          <span>添加客户</span>
        </button>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="搜索客户名称、联系人或公司..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>
      </div>

      {/* Customers List */}
      {loading ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12">
          <div className="flex flex-col items-center justify-center text-gray-400">
            <Loader2 className="w-8 h-8 animate-spin mb-3" />
            <p>加载中...</p>
          </div>
        </div>
      ) : customers.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12">
          <div className="flex flex-col items-center justify-center text-gray-400">
            <UserCircle className="w-16 h-16 mb-4 opacity-50" />
            <p className="text-lg">暂无客户数据</p>
            <p className="text-sm mt-1">点击"添加客户"创建第一个客户</p>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">客户名称</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">联系人</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">公司</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">税号</th>
                <th className="text-right px-4 py-3 text-sm font-medium text-gray-600">佣金率</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((customer) => (
                <tr 
                  key={customer.id} 
                  className="border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center">
                        <UserCircle className="w-4 h-4" />
                      </div>
                      <span className="font-medium text-gray-900">{customer.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {customer.contact || <span className="text-gray-400">-</span>}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {customer.company || <span className="text-gray-400">-</span>}
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-sm font-mono">
                    {customer.tax_id || <span className="text-gray-400">-</span>}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {customer.default_rate ? (
                      <span className="text-green-600 font-medium">
                        {customer.default_rate}%
                      </span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between mt-4 text-sm text-gray-600">
        <span>共 {customers.length} 个客户</span>
      </div>
    </div>
  );
}
