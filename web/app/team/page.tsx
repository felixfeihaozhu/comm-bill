'use client';

import { useState, useEffect, useCallback } from 'react';
import { Users, UserPlus, Shield, Crown, Trash2, Loader2, AlertCircle } from 'lucide-react';
import { useWorkspace } from '@/components/auth/WorkspaceProvider';
import { getWorkspaceMembers, addWorkspaceMember, WorkspaceMember } from '@/lib/workspace';
import { useToast } from '@/components/ui/Toast';

const roleConfig = {
  owner: { label: '所有者', icon: Crown, color: 'text-yellow-600 bg-yellow-50' },
  admin: { label: '管理员', icon: Shield, color: 'text-blue-600 bg-blue-50' },
  member: { label: '成员', icon: Users, color: 'text-gray-600 bg-gray-50' },
};

export default function TeamPage() {
  const { currentWorkspace, currentWorkspaceId, role, isAdmin, loading: wsLoading } = useWorkspace();
  const { showToast, ToastContainer } = useToast();
  
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'admin' | 'member'>('member');
  const [inviting, setInviting] = useState(false);
  const [error, setError] = useState('');

  // 加载成员列表
  const loadMembers = useCallback(async () => {
    if (!currentWorkspaceId) return;
    
    setLoading(true);
    try {
      const data = await getWorkspaceMembers(currentWorkspaceId);
      setMembers(data);
    } catch (err: any) {
      showToast('加载成员列表失败', 'error');
    } finally {
      setLoading(false);
    }
  }, [currentWorkspaceId, showToast]);

  useEffect(() => {
    if (currentWorkspaceId) {
      loadMembers();
    }
  }, [currentWorkspaceId, loadMembers]);

  // 邀请成员
  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inviteEmail.trim()) {
      setError('请输入邮箱地址');
      return;
    }

    if (!currentWorkspaceId) {
      setError('未选择工作空间');
      return;
    }

    setError('');
    setInviting(true);

    try {
      const result = await addWorkspaceMember(currentWorkspaceId, inviteEmail.trim(), inviteRole);
      showToast(
        result.action === 'added' ? '成员邀请成功！' : '成员角色已更新',
        'success'
      );
      setInviteEmail('');
      loadMembers();
    } catch (err: any) {
      const msg = err.message || '邀请失败';
      if (msg.includes('not found')) {
        setError('该邮箱用户不存在，请确认用户已注册');
      } else if (msg.includes('permission')) {
        setError('您没有权限执行此操作');
      } else {
        setError(msg);
      }
    } finally {
      setInviting(false);
    }
  };

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
          <Users className="w-16 h-16 mx-auto mb-4 opacity-50" />
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
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">团队成员</h1>
          <p className="text-gray-500 text-sm mt-1">
            {currentWorkspace.name} · 您的角色：{roleConfig[role || 'member']?.label}
          </p>
        </div>
      </div>

      {/* Invite Form - 仅管理员可见 */}
      {isAdmin && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
            <UserPlus className="w-5 h-5" />
            邀请成员
          </h2>
          
          <form onSubmit={handleInvite} className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[240px]">
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="输入成员邮箱..."
                disabled={inviting}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-50"
              />
            </div>
            
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value as 'admin' | 'member')}
              disabled={inviting}
              className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-50"
            >
              <option value="member">成员</option>
              <option value="admin">管理员</option>
            </select>
            
            <button
              type="submit"
              disabled={inviting}
              className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {inviting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  邀请中...
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  邀请
                </>
              )}
            </button>
          </form>

          {error && (
            <div className="flex items-center gap-2 mt-3 text-red-600 text-sm">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          <p className="text-gray-400 text-sm mt-3">
            注意：被邀请用户需要先在系统中注册账号
          </p>
        </div>
      )}

      {/* Members List */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-medium text-gray-900">
            成员列表 ({members.length})
          </h2>
        </div>

        {loading ? (
          <div className="p-12 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400 mx-auto" />
          </div>
        ) : members.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>暂无成员</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-600">用户 ID</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-600">角色</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-600">加入时间</th>
                {isAdmin && (
                  <th className="text-right px-6 py-3 text-sm font-medium text-gray-600">操作</th>
                )}
              </tr>
            </thead>
            <tbody>
              {members.map((member) => {
                const config = roleConfig[member.role] || roleConfig.member;
                const RoleIcon = config.icon;
                
                return (
                  <tr key={member.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <span className="font-mono text-sm text-gray-600">
                        {member.user_id.slice(0, 8)}...
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.color}`}>
                        <RoleIcon className="w-3.5 h-3.5" />
                        {config.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(member.created_at).toLocaleDateString('zh-CN')}
                    </td>
                    {isAdmin && (
                      <td className="px-6 py-4 text-right">
                        {member.role !== 'owner' && (
                          <button
                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                            title="移除成员"
                            disabled
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Permission Notice */}
      {!isAdmin && (
        <div className="mt-6 p-4 bg-blue-50 border border-blue-100 rounded-lg text-blue-700 text-sm">
          <p>您是普通成员，只能查看团队成员列表。如需邀请新成员，请联系管理员。</p>
        </div>
      )}
    </div>
  );
}
