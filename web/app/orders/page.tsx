'use client';

import { Mail, Search, Filter } from 'lucide-react';

export default function OrdersPage() {
  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">邮件订单跟踪</h1>
        <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 bg-white text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
          <Filter className="w-4 h-4" />
          <span>筛选</span>
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="搜索订单..."
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>

        <div className="text-center py-16 text-gray-400">
          <Mail className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p className="text-lg">邮件订单列表将在此显示</p>
          <p className="text-sm mt-1">功能开发中...</p>
        </div>
      </div>
    </div>
  );
}


