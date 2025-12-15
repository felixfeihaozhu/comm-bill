'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, Check, Crown, Shield, Users, Loader2 } from 'lucide-react';
import { useWorkspace } from '@/components/auth/WorkspaceProvider';

const roleConfig = {
  owner: { label: '所有者', icon: Crown, color: 'text-yellow-600' },
  admin: { label: '管理员', icon: Shield, color: 'text-blue-600' },
  member: { label: '成员', icon: Users, color: 'text-gray-600' },
};

export default function OrgPage() {
  const router = useRouter();
  const { workspaces, currentWorkspace, switchWorkspace, loading } = useWorkspace();
  const [switching, setSwitching] = useState<string | null>(null);

  const handleSelect = async (workspaceId: string) => {
    if (workspaceId === currentWorkspace?.id) return;
    
    setSwitching(workspaceId);
    
    // 模拟切换延迟
    await new Promise(resolve => setTimeout(resolve, 300));
    
    switchWorkspace(workspaceId);
    setSwitching(null);
    
    // 跳转到单据中心
    router.push('/documents');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 text-primary-600 rounded-2xl mb-4">
            <Building2 className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-semibold text-gray-900">选择工作空间</h1>
          <p className="text-gray-500 mt-1">选择要进入的工作空间</p>
        </div>

        {/* Workspace List */}
        <div className="space-y-3">
          {workspaces.map((ws) => {
            const isSelected = ws.id === currentWorkspace?.id;
            const isSwitching = switching === ws.id;
            const config = roleConfig[ws.role] || roleConfig.member;
            const RoleIcon = config.icon;

            return (
              <button
                key={ws.id}
                onClick={() => handleSelect(ws.id)}
                disabled={isSwitching}
                className={`w-full p-4 rounded-xl border-2 transition-all text-left flex items-center gap-4 ${
                  isSelected
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 bg-white hover:border-primary-300 hover:bg-gray-50'
                } ${isSwitching ? 'opacity-70' : ''}`}
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  isSelected ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600'
                }`}>
                  <Building2 className="w-6 h-6" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900 truncate">{ws.name}</span>
                    {isSelected && (
                      <span className="text-xs bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full">
                        当前
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 mt-1">
                    <RoleIcon className={`w-3.5 h-3.5 ${config.color}`} />
                    <span className="text-sm text-gray-500">{config.label}</span>
                  </div>
                </div>

                <div className="flex-shrink-0">
                  {isSwitching ? (
                    <Loader2 className="w-5 h-5 animate-spin text-primary-600" />
                  ) : isSelected ? (
                    <Check className="w-5 h-5 text-primary-600" />
                  ) : (
                    <div className="w-5 h-5" />
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {workspaces.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <Building2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>暂无工作空间</p>
          </div>
        )}
      </div>
    </div>
  );
}
