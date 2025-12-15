'use client';

import { FileText, Users, DollarSign, TrendingUp, ArrowUpRight, ArrowDownRight } from 'lucide-react';

const stats = [
  { 
    label: '本月单据', 
    value: '128', 
    change: '+12%', 
    trend: 'up',
    icon: FileText,
    color: 'bg-blue-500'
  },
  { 
    label: '活跃客户', 
    value: '45', 
    change: '+5%', 
    trend: 'up',
    icon: Users,
    color: 'bg-green-500'
  },
  { 
    label: '本月收入', 
    value: '€125,430', 
    change: '+18%', 
    trend: 'up',
    icon: DollarSign,
    color: 'bg-purple-500'
  },
  { 
    label: '平均单价', 
    value: '€980', 
    change: '-3%', 
    trend: 'down',
    icon: TrendingUp,
    color: 'bg-orange-500'
  },
];

export default function DashboardPage() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-lg font-medium text-gray-900">欢迎回来 👋</h2>
        <p className="text-gray-500 text-sm">以下是您的业务概览</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white p-5 rounded-xl border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className={`w-10 h-10 ${stat.color} rounded-lg flex items-center justify-center`}>
                <stat.icon className="w-5 h-5 text-white" />
              </div>
              <div className={`flex items-center gap-1 text-sm ${
                stat.trend === 'up' ? 'text-green-600' : 'text-red-500'
              }`}>
                {stat.trend === 'up' ? (
                  <ArrowUpRight className="w-4 h-4" />
                ) : (
                  <ArrowDownRight className="w-4 h-4" />
                )}
                {stat.change}
              </div>
            </div>
            <div>
              <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
              <p className="text-sm text-gray-500">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Placeholder sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-4">最近单据</h3>
          <div className="text-center py-12 text-gray-400">
            <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>数据加载中...</p>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-4">收入趋势</h3>
          <div className="text-center py-12 text-gray-400">
            <TrendingUp className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>图表加载中...</p>
          </div>
        </div>
      </div>
    </div>
  );
}
