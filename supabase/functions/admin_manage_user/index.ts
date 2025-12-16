/**
 * Edge Function: admin_manage_user
 * 用途：管理员添加/管理同事
 * 
 * 功能：
 * - 检验当前用户是 admin/owner
 * - 如用户不存在 → 创建 auth 用户（通过邀请邮件）
 * - 加入 workspace_members 或更新角色
 * - 使用 service role key
 * - 普通用户调用必须失败
 */

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.47.10";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface ManageUserRequest {
  action: 'add' | 'update' | 'remove';
  email: string;
  role?: 'admin' | 'member';
  workspace_id?: string;
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // 获取环境变量
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // 创建两个客户端：一个用于验证用户，一个用于管理操作
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    // 用户客户端（验证身份）
    const userClient = createClient(supabaseUrl, authHeader.replace('Bearer ', ''), {
      auth: { persistSession: false }
    });
    
    // 服务端客户端（执行管理操作）
    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    // 获取当前用户
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      throw new Error('Unauthorized: Invalid token');
    }

    // 解析请求体
    const body: ManageUserRequest = await req.json();
    const { action, email, role = 'member' } = body;

    if (!email) {
      throw new Error('Email is required');
    }

    // 获取用户所属的工作空间
    const { data: membership, error: membershipError } = await adminClient
      .from('workspace_members')
      .select('workspace_id, role')
      .eq('user_id', user.id)
      .single();

    if (membershipError || !membership) {
      throw new Error('User does not belong to any workspace');
    }

    const workspaceId = body.workspace_id || membership.workspace_id;

    // 检查当前用户是否是 admin/owner
    if (!['admin', 'owner'].includes(membership.role)) {
      throw new Error('Permission denied: Only admin/owner can manage users');
    }

    // 验证角色参数
    if (role && !['admin', 'member'].includes(role)) {
      throw new Error('Invalid role: must be admin or member');
    }

    let result: Record<string, unknown>;

    switch (action) {
      case 'add': {
        // 查找用户是否已存在
        const { data: existingUsers } = await adminClient.auth.admin.listUsers();
        const existingUser = existingUsers?.users?.find(u => u.email === email);

        let targetUserId: string;

        if (existingUser) {
          targetUserId = existingUser.id;
        } else {
          // 创建新用户（发送邀请邮件）
          const { data: newUser, error: createError } = await adminClient.auth.admin.inviteUserByEmail(email, {
            redirectTo: `${supabaseUrl.replace('.supabase.co', '')}/auth/callback`,
          });
          
          if (createError) {
            throw new Error(`Failed to invite user: ${createError.message}`);
          }
          
          targetUserId = newUser.user.id;
        }

        // 检查是否已经是成员
        const { data: existingMember } = await adminClient
          .from('workspace_members')
          .select('id, role')
          .eq('workspace_id', workspaceId)
          .eq('user_id', targetUserId)
          .single();

        if (existingMember) {
          // 更新角色
          const { error: updateError } = await adminClient
            .from('workspace_members')
            .update({ role })
            .eq('id', existingMember.id);

          if (updateError) throw updateError;

          result = { 
            success: true, 
            action: 'updated', 
            user_id: targetUserId, 
            email, 
            role,
            message: `User role updated to ${role}`
          };
        } else {
          // 添加为新成员
          const { error: insertError } = await adminClient
            .from('workspace_members')
            .insert({
              workspace_id: workspaceId,
              user_id: targetUserId,
              role
            });

          if (insertError) throw insertError;

          result = { 
            success: true, 
            action: existingUser ? 'added' : 'invited', 
            user_id: targetUserId, 
            email, 
            role,
            message: existingUser ? 'User added to workspace' : 'Invitation sent to user'
          };
        }
        break;
      }

      case 'update': {
        // 查找用户
        const { data: existingUsers } = await adminClient.auth.admin.listUsers();
        const targetUser = existingUsers?.users?.find(u => u.email === email);

        if (!targetUser) {
          throw new Error(`User not found: ${email}`);
        }

        // 检查是否是成员
        const { data: memberData, error: memberError } = await adminClient
          .from('workspace_members')
          .select('id, role')
          .eq('workspace_id', workspaceId)
          .eq('user_id', targetUser.id)
          .single();

        if (memberError || !memberData) {
          throw new Error(`User is not a member of this workspace`);
        }

        // 不能降级 owner
        if (memberData.role === 'owner') {
          throw new Error('Cannot change owner role');
        }

        // 更新角色
        const { error: updateError } = await adminClient
          .from('workspace_members')
          .update({ role })
          .eq('id', memberData.id);

        if (updateError) throw updateError;

        result = { 
          success: true, 
          action: 'updated', 
          user_id: targetUser.id, 
          email, 
          role,
          previous_role: memberData.role
        };
        break;
      }

      case 'remove': {
        // 查找用户
        const { data: existingUsers } = await adminClient.auth.admin.listUsers();
        const targetUser = existingUsers?.users?.find(u => u.email === email);

        if (!targetUser) {
          throw new Error(`User not found: ${email}`);
        }

        // 检查是否是成员
        const { data: memberData, error: memberError } = await adminClient
          .from('workspace_members')
          .select('id, role')
          .eq('workspace_id', workspaceId)
          .eq('user_id', targetUser.id)
          .single();

        if (memberError || !memberData) {
          throw new Error(`User is not a member of this workspace`);
        }

        // 不能移除 owner
        if (memberData.role === 'owner') {
          throw new Error('Cannot remove workspace owner');
        }

        // 删除成员
        const { error: deleteError } = await adminClient
          .from('workspace_members')
          .delete()
          .eq('id', memberData.id);

        if (deleteError) throw deleteError;

        result = { 
          success: true, 
          action: 'removed', 
          user_id: targetUser.id, 
          email
        };
        break;
      }

      default:
        throw new Error(`Invalid action: ${action}`);
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('admin_manage_user error:', message);
    
    return new Response(JSON.stringify({ 
      success: false, 
      error: message 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});


