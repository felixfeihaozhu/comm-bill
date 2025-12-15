'use client';

import { DollarSign, Download, Calendar } from 'lucide-react';

export default function FinancePage() {
  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">财务管理</h1>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 bg-white text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
            <Calendar className="w-4 h-4" />
            <span>选择日期</span>
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
            <Download className="w-4 h-4" />
            <span>导出报表</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="text-center py-16 text-gray-400">
          <DollarSign className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p className="text-lg">财务数据将在此显示</p>
          <p className="text-sm mt-1">功能开发中...</p>
        </div>
      </div>
    </div>
  );
}
