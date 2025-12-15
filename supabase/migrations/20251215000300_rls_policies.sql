-- ============================================
-- Migration: 重写 RLS 策略
-- 规则：
-- - SELECT: 所有工作空间成员可读
-- - INSERT: 任何成员可插入（created_by = auth.uid()）
-- - UPDATE: admin/owner 可改所有，member 只能改自己的
-- - DELETE: 仅 admin/owner
-- ============================================

-- ============================================
-- 1. Workspaces 表
-- ============================================
DROP POLICY IF EXISTS "workspaces_select" ON workspaces;
DROP POLICY IF EXISTS "workspaces_insert" ON workspaces;
DROP POLICY IF EXISTS "workspaces_update" ON workspaces;
DROP POLICY IF EXISTS "workspaces_delete" ON workspaces;

-- 只能看到自己所属的工作空间
CREATE POLICY "workspaces_select" ON workspaces
    FOR SELECT USING (is_workspace_member(id));

-- 任何登录用户可以创建工作空间（第一次使用时）
CREATE POLICY "workspaces_insert" ON workspaces
    FOR INSERT WITH CHECK (auth.uid() = created_by);

-- 仅 owner 可以修改工作空间
CREATE POLICY "workspaces_update" ON workspaces
    FOR UPDATE USING (is_workspace_owner(id));

-- 仅 owner 可以删除工作空间
CREATE POLICY "workspaces_delete" ON workspaces
    FOR DELETE USING (is_workspace_owner(id));

-- ============================================
-- 2. Workspace Members 表
-- ============================================
DROP POLICY IF EXISTS "workspace_members_select" ON workspace_members;
DROP POLICY IF EXISTS "workspace_members_insert" ON workspace_members;
DROP POLICY IF EXISTS "workspace_members_update" ON workspace_members;
DROP POLICY IF EXISTS "workspace_members_delete" ON workspace_members;

-- 所有成员可以看到同工作空间的成员列表
CREATE POLICY "workspace_members_select" ON workspace_members
    FOR SELECT USING (is_workspace_member(workspace_id));

-- ❌ 禁止客户端直接插入成员（必须通过 RPC 或 Edge Function）
CREATE POLICY "workspace_members_insert" ON workspace_members
    FOR INSERT WITH CHECK (false);

-- ❌ 禁止客户端直接更新成员（必须通过 RPC）
CREATE POLICY "workspace_members_update" ON workspace_members
    FOR UPDATE USING (false);

-- ❌ 禁止客户端直接删除成员
CREATE POLICY "workspace_members_delete" ON workspace_members
    FOR DELETE USING (false);

-- ============================================
-- 3. Bills 表 - 核心权限逻辑
-- ============================================
DROP POLICY IF EXISTS "bills_select" ON bills;
DROP POLICY IF EXISTS "bills_insert" ON bills;
DROP POLICY IF EXISTS "bills_update" ON bills;
DROP POLICY IF EXISTS "bills_delete" ON bills;
-- 删除可能存在的旧策略
DROP POLICY IF EXISTS "bills_select_policy" ON bills;
DROP POLICY IF EXISTS "bills_insert_policy" ON bills;
DROP POLICY IF EXISTS "bills_update_policy" ON bills;
DROP POLICY IF EXISTS "bills_delete_policy" ON bills;

-- SELECT: 所有工作空间成员可读
CREATE POLICY "bills_select" ON bills
    FOR SELECT USING (is_workspace_member(workspace_id));

-- INSERT: 任何成员可插入，但 created_by 必须是自己
CREATE POLICY "bills_insert" ON bills
    FOR INSERT WITH CHECK (
        auth.uid() = created_by 
        AND is_workspace_member(workspace_id)
    );

-- UPDATE: admin/owner 可改所有，member 只能改自己创建的
CREATE POLICY "bills_update" ON bills
    FOR UPDATE USING (
        -- admin/owner 可以修改所有
        is_workspace_admin(workspace_id)
        OR
        -- member 只能修改自己创建的
        (created_by = auth.uid() AND is_workspace_member(workspace_id))
    );

-- DELETE: 仅 admin/owner 可删除
CREATE POLICY "bills_delete" ON bills
    FOR DELETE USING (is_workspace_admin(workspace_id));

-- ============================================
-- 4. Bill Items 表
-- ============================================
DROP POLICY IF EXISTS "bill_items_select" ON bill_items;
DROP POLICY IF EXISTS "bill_items_insert" ON bill_items;
DROP POLICY IF EXISTS "bill_items_update" ON bill_items;
DROP POLICY IF EXISTS "bill_items_delete" ON bill_items;
DROP POLICY IF EXISTS "bill_items_select_policy" ON bill_items;
DROP POLICY IF EXISTS "bill_items_insert_policy" ON bill_items;
DROP POLICY IF EXISTS "bill_items_update_policy" ON bill_items;
DROP POLICY IF EXISTS "bill_items_delete_policy" ON bill_items;

-- SELECT: 所有成员可读（通过 bill 的 workspace_id）
CREATE POLICY "bill_items_select" ON bill_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM bills b 
            WHERE b.id = bill_items.bill_id 
              AND is_workspace_member(b.workspace_id)
        )
    );

-- INSERT: 只能为自己能编辑的账单添加明细
CREATE POLICY "bill_items_insert" ON bill_items
    FOR INSERT WITH CHECK (
        auth.uid() = created_by
        AND can_edit_bill(bill_id)
    );

-- UPDATE: 只能修改自己能编辑的账单的明细
CREATE POLICY "bill_items_update" ON bill_items
    FOR UPDATE USING (can_edit_bill(bill_id));

-- DELETE: 只能删除自己能编辑的账单的明细
CREATE POLICY "bill_items_delete" ON bill_items
    FOR DELETE USING (can_edit_bill(bill_id));

-- ============================================
-- 5. Bill Item Addons 表
-- ============================================
DROP POLICY IF EXISTS "bill_item_addons_select" ON bill_item_addons;
DROP POLICY IF EXISTS "bill_item_addons_insert" ON bill_item_addons;
DROP POLICY IF EXISTS "bill_item_addons_update" ON bill_item_addons;
DROP POLICY IF EXISTS "bill_item_addons_delete" ON bill_item_addons;
DROP POLICY IF EXISTS "bill_item_addons_select_policy" ON bill_item_addons;
DROP POLICY IF EXISTS "bill_item_addons_insert_policy" ON bill_item_addons;
DROP POLICY IF EXISTS "bill_item_addons_update_policy" ON bill_item_addons;
DROP POLICY IF EXISTS "bill_item_addons_delete_policy" ON bill_item_addons;

-- SELECT: 所有成员可读
CREATE POLICY "bill_item_addons_select" ON bill_item_addons
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM bill_items bi
            JOIN bills b ON b.id = bi.bill_id
            WHERE bi.id = bill_item_addons.bill_item_id
              AND is_workspace_member(b.workspace_id)
        )
    );

-- INSERT: 只能为自己能编辑的账单添加附加产品
CREATE POLICY "bill_item_addons_insert" ON bill_item_addons
    FOR INSERT WITH CHECK (
        auth.uid() = created_by
        AND can_edit_bill_item(bill_item_id)
    );

-- UPDATE: 只能修改自己能编辑的
CREATE POLICY "bill_item_addons_update" ON bill_item_addons
    FOR UPDATE USING (can_edit_bill_item(bill_item_id));

-- DELETE: 只能删除自己能编辑的
CREATE POLICY "bill_item_addons_delete" ON bill_item_addons
    FOR DELETE USING (can_edit_bill_item(bill_item_id));

-- ============================================
-- 6. Customers 表
-- ============================================
DROP POLICY IF EXISTS "customers_select" ON customers;
DROP POLICY IF EXISTS "customers_insert" ON customers;
DROP POLICY IF EXISTS "customers_update" ON customers;
DROP POLICY IF EXISTS "customers_delete" ON customers;
DROP POLICY IF EXISTS "customers_select_policy" ON customers;
DROP POLICY IF EXISTS "customers_insert_policy" ON customers;
DROP POLICY IF EXISTS "customers_update_policy" ON customers;
DROP POLICY IF EXISTS "customers_delete_policy" ON customers;

-- SELECT: 所有成员可读
CREATE POLICY "customers_select" ON customers
    FOR SELECT USING (is_workspace_member(workspace_id));

-- INSERT: 所有成员可添加客户
CREATE POLICY "customers_insert" ON customers
    FOR INSERT WITH CHECK (
        auth.uid() = created_by 
        AND is_workspace_member(workspace_id)
    );

-- UPDATE: 所有成员可修改客户（共享数据）
CREATE POLICY "customers_update" ON customers
    FOR UPDATE USING (is_workspace_member(workspace_id));

-- DELETE: 仅 admin/owner 可删除客户
CREATE POLICY "customers_delete" ON customers
    FOR DELETE USING (is_workspace_admin(workspace_id));

-- ============================================
-- 7. Customer Invoices 表
-- ============================================
DROP POLICY IF EXISTS "customer_invoices_select" ON customer_invoices;
DROP POLICY IF EXISTS "customer_invoices_insert" ON customer_invoices;
DROP POLICY IF EXISTS "customer_invoices_update" ON customer_invoices;
DROP POLICY IF EXISTS "customer_invoices_delete" ON customer_invoices;
DROP POLICY IF EXISTS "customer_invoices_select_policy" ON customer_invoices;
DROP POLICY IF EXISTS "customer_invoices_insert_policy" ON customer_invoices;
DROP POLICY IF EXISTS "customer_invoices_update_policy" ON customer_invoices;
DROP POLICY IF EXISTS "customer_invoices_delete_policy" ON customer_invoices;

CREATE POLICY "customer_invoices_select" ON customer_invoices
    FOR SELECT USING (is_workspace_member(workspace_id));

CREATE POLICY "customer_invoices_insert" ON customer_invoices
    FOR INSERT WITH CHECK (
        auth.uid() = created_by 
        AND is_workspace_member(workspace_id)
    );

CREATE POLICY "customer_invoices_update" ON customer_invoices
    FOR UPDATE USING (is_workspace_member(workspace_id));

CREATE POLICY "customer_invoices_delete" ON customer_invoices
    FOR DELETE USING (is_workspace_admin(workspace_id));

-- ============================================
-- 8. Option Lists 表
-- ============================================
DROP POLICY IF EXISTS "option_lists_select" ON option_lists;
DROP POLICY IF EXISTS "option_lists_insert" ON option_lists;
DROP POLICY IF EXISTS "option_lists_update" ON option_lists;
DROP POLICY IF EXISTS "option_lists_delete" ON option_lists;
DROP POLICY IF EXISTS "option_lists_select_policy" ON option_lists;
DROP POLICY IF EXISTS "option_lists_insert_policy" ON option_lists;
DROP POLICY IF EXISTS "option_lists_update_policy" ON option_lists;
DROP POLICY IF EXISTS "option_lists_delete_policy" ON option_lists;

-- 选项列表所有登录用户可读
CREATE POLICY "option_lists_select" ON option_lists
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "option_lists_insert" ON option_lists
    FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "option_lists_update" ON option_lists
    FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "option_lists_delete" ON option_lists
    FOR DELETE USING (auth.uid() IS NOT NULL);

-- ============================================
-- 9. Payments 表
-- ============================================
DROP POLICY IF EXISTS "payments_select" ON payments;
DROP POLICY IF EXISTS "payments_insert" ON payments;
DROP POLICY IF EXISTS "payments_update" ON payments;
DROP POLICY IF EXISTS "payments_delete" ON payments;
DROP POLICY IF EXISTS "payments_select_policy" ON payments;
DROP POLICY IF EXISTS "payments_insert_policy" ON payments;
DROP POLICY IF EXISTS "payments_update_policy" ON payments;
DROP POLICY IF EXISTS "payments_delete_policy" ON payments;

CREATE POLICY "payments_select" ON payments
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "payments_insert" ON payments
    FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "payments_update" ON payments
    FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "payments_delete" ON payments
    FOR DELETE USING (auth.uid() IS NOT NULL);

-- ============================================
-- 10. Orders 表（旧表，保持兼容）
-- ============================================
DROP POLICY IF EXISTS "orders_select" ON orders;
DROP POLICY IF EXISTS "orders_insert" ON orders;
DROP POLICY IF EXISTS "orders_update" ON orders;
DROP POLICY IF EXISTS "orders_delete" ON orders;
DROP POLICY IF EXISTS "orders_select_policy" ON orders;
DROP POLICY IF EXISTS "orders_insert_policy" ON orders;
DROP POLICY IF EXISTS "orders_update_policy" ON orders;
DROP POLICY IF EXISTS "orders_delete_policy" ON orders;

CREATE POLICY "orders_select" ON orders
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "orders_insert" ON orders
    FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "orders_update" ON orders
    FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "orders_delete" ON orders
    FOR DELETE USING (auth.uid() IS NOT NULL);
