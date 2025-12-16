-- ============================================
-- Migration: 创建 SECURITY DEFINER 函数
-- 这些函数用于 RLS 策略，避免 infinite recursion
-- ============================================

-- 先删除旧函数（如果存在）
DROP FUNCTION IF EXISTS init_workspace(text);
DROP FUNCTION IF EXISTS add_workspace_member(uuid, text, text);
DROP FUNCTION IF EXISTS find_similar_customers(uuid, text, text, uuid);
DROP FUNCTION IF EXISTS get_user_workspace_role(uuid);
DROP FUNCTION IF EXISTS is_workspace_admin(uuid);
DROP FUNCTION IF EXISTS is_workspace_owner(uuid);
DROP FUNCTION IF EXISTS is_workspace_member(uuid);
DROP FUNCTION IF EXISTS get_current_workspace_id();
DROP FUNCTION IF EXISTS get_user_by_email(text);
DROP FUNCTION IF EXISTS can_edit_bill(uuid);
DROP FUNCTION IF EXISTS can_edit_bill_item(uuid);

-- 获取当前用户在指定工作空间的角色
-- 返回: 'owner' | 'admin' | 'member' | null
CREATE OR REPLACE FUNCTION get_user_workspace_role(ws_id uuid)
RETURNS text
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
    SELECT role 
    FROM workspace_members 
    WHERE workspace_id = ws_id 
      AND user_id = auth.uid()
    LIMIT 1;
$$;

-- 检查当前用户是否是指定工作空间的管理员（admin 或 owner）
CREATE OR REPLACE FUNCTION is_workspace_admin(ws_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 
        FROM workspace_members 
        WHERE workspace_id = ws_id 
          AND user_id = auth.uid()
          AND role IN ('owner', 'admin')
    );
$$;

-- 检查当前用户是否是指定工作空间的 owner
CREATE OR REPLACE FUNCTION is_workspace_owner(ws_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 
        FROM workspace_members 
        WHERE workspace_id = ws_id 
          AND user_id = auth.uid()
          AND role = 'owner'
    );
$$;

-- 检查当前用户是否是指定工作空间的成员（任意角色）
CREATE OR REPLACE FUNCTION is_workspace_member(ws_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 
        FROM workspace_members 
        WHERE workspace_id = ws_id 
          AND user_id = auth.uid()
    );
$$;

-- 获取当前用户所属的工作空间 ID（第一个）
CREATE OR REPLACE FUNCTION get_current_workspace_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
    SELECT workspace_id 
    FROM workspace_members 
    WHERE user_id = auth.uid()
    LIMIT 1;
$$;

-- 获取用户详情（通过 email）
-- 用于 Edge Function 查找用户
CREATE OR REPLACE FUNCTION get_user_by_email(user_email text)
RETURNS TABLE(id uuid, email text)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
    SELECT id, email::text
    FROM auth.users
    WHERE email = user_email;
$$;

-- 检查用户是否可以编辑指定账单
-- owner/admin 可以编辑所有，member 只能编辑自己创建的
CREATE OR REPLACE FUNCTION can_edit_bill(bill_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 
        FROM bills b
        WHERE b.id = bill_id
          AND (
              -- admin/owner 可以编辑所有
              is_workspace_admin(b.workspace_id)
              OR
              -- member 只能编辑自己的
              (b.created_by = auth.uid() AND is_workspace_member(b.workspace_id))
          )
    );
$$;

-- 检查用户是否可以编辑指定账单明细（通过 bill_item_id）
CREATE OR REPLACE FUNCTION can_edit_bill_item(item_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 
        FROM bill_items bi
        JOIN bills b ON b.id = bi.bill_id
        WHERE bi.id = item_id
          AND (
              is_workspace_admin(b.workspace_id)
              OR
              (b.created_by = auth.uid() AND is_workspace_member(b.workspace_id))
          )
    );
$$;

-- 用于 init_workspace 存储过程（初始化工作空间）
CREATE OR REPLACE FUNCTION init_workspace(ws_name text DEFAULT 'My Workspace')
RETURNS TABLE(workspace_id uuid, name text, role text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_workspace_id uuid;
    v_role text;
BEGIN
    -- 检查用户是否已有工作空间
    SELECT wm.workspace_id, wm.role INTO v_workspace_id, v_role
    FROM workspace_members wm
    WHERE wm.user_id = auth.uid()
    LIMIT 1;

    IF v_workspace_id IS NOT NULL THEN
        -- 已有工作空间，返回信息
        RETURN QUERY
        SELECT w.id, w.name, v_role
        FROM workspaces w
        WHERE w.id = v_workspace_id;
    ELSE
        -- 创建新工作空间
        INSERT INTO workspaces (name, created_by)
        VALUES (ws_name, auth.uid())
        RETURNING id INTO v_workspace_id;

        -- 将创建者设为 owner
        INSERT INTO workspace_members (workspace_id, user_id, role)
        VALUES (v_workspace_id, auth.uid(), 'owner');

        RETURN QUERY
        SELECT v_workspace_id, ws_name, 'owner'::text;
    END IF;
END;
$$;

-- 添加成员到工作空间（仅 owner/admin 可调用）
CREATE OR REPLACE FUNCTION add_workspace_member(
    ws_id uuid,
    member_email text,
    member_role text DEFAULT 'member'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id uuid;
    v_member_id uuid;
BEGIN
    -- 检查调用者是否是 admin/owner
    IF NOT is_workspace_admin(ws_id) THEN
        RAISE EXCEPTION 'Permission denied: only admin/owner can add members';
    END IF;

    -- 检查角色是否有效
    IF member_role NOT IN ('admin', 'member') THEN
        RAISE EXCEPTION 'Invalid role: must be admin or member';
    END IF;

    -- 查找用户
    SELECT id INTO v_user_id
    FROM auth.users
    WHERE email = member_email;

    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'User not found: %', member_email;
    END IF;

    -- 检查是否已经是成员
    SELECT id INTO v_member_id
    FROM workspace_members
    WHERE workspace_id = ws_id AND user_id = v_user_id;

    IF v_member_id IS NOT NULL THEN
        -- 更新角色
        UPDATE workspace_members
        SET role = member_role
        WHERE id = v_member_id;
        
        RETURN jsonb_build_object('action', 'updated', 'user_id', v_user_id, 'role', member_role);
    ELSE
        -- 添加新成员
        INSERT INTO workspace_members (workspace_id, user_id, role)
        VALUES (ws_id, v_user_id, member_role);
        
        RETURN jsonb_build_object('action', 'added', 'user_id', v_user_id, 'role', member_role);
    END IF;
END;
$$;

-- 查找相似客户（用于重复检测）
CREATE OR REPLACE FUNCTION find_similar_customers(
    ws_id uuid,
    search_name text,
    search_contact text,
    exclude_id uuid DEFAULT NULL
)
RETURNS TABLE(
    id uuid,
    name text,
    contact text,
    is_exact_match boolean
)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
    SELECT 
        c.id,
        c.name,
        c.contact,
        (c.name_normalized = lower(trim(search_name)) 
         AND c.contact_normalized = lower(trim(search_contact))) AS is_exact_match
    FROM customers c
    WHERE c.workspace_id = ws_id
      AND (exclude_id IS NULL OR c.id != exclude_id)
      AND (
          c.name_normalized = lower(trim(search_name))
          OR c.contact_normalized = lower(trim(search_contact))
          OR c.name ILIKE '%' || search_name || '%'
      )
    ORDER BY is_exact_match DESC, c.name
    LIMIT 10;
$$;

COMMENT ON FUNCTION get_user_workspace_role IS '获取当前用户在指定工作空间的角色';
COMMENT ON FUNCTION is_workspace_admin IS '检查当前用户是否是工作空间管理员';
COMMENT ON FUNCTION is_workspace_member IS '检查当前用户是否是工作空间成员';
COMMENT ON FUNCTION can_edit_bill IS '检查用户是否可以编辑指定账单';
COMMENT ON FUNCTION init_workspace IS '初始化/获取用户工作空间';
COMMENT ON FUNCTION add_workspace_member IS '添加成员到工作空间';


