/**
 * Supabase 配置和数据库操作模块
 * 项目: Travel Agency CRM System
 */

const SUPABASE_URL = 'https://dszqampcpmvoywjqbfyj.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRzenFhbXBjcG12b3l3anFiZnlqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU1NTczMzgsImV4cCI6MjA4MTEzMzMzOH0.UMeV0gO9jY7g4vUM2DHbzY_YAXQy5ckTbKP8ElfBMxg';

// 统一的 storageKey - 必须与 Next.js 端一致才能共享 session
const AUTH_STORAGE_KEY = 'fh-oms-auth';

let supabaseClient = null;
let currentWorkspaceId = null; // 缓存当前工作空间 ID
let currentUserRole = null; // 缓存当前用户角色: 'owner' | 'admin' | 'member'
let currentUserId = null; // 缓存当前用户 ID

function getSupabase() {
    if (!supabaseClient && typeof supabase !== 'undefined') {
        supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
            auth: {
                persistSession: true,
                autoRefreshToken: true,
                detectSessionInUrl: true,
                storageKey: AUTH_STORAGE_KEY  // 与 Next.js 共享 session
            }
        });
        console.log('✅ Supabase 客户端初始化成功 (storageKey:', AUTH_STORAGE_KEY, ')');
    }
    return supabaseClient;
}

function initSupabase() {
    return getSupabase();
}

async function testSupabaseConnection() {
    const client = getSupabase();
    if (!client) return false;
    try {
        const { data, error } = await client.auth.getSession();
        if (error) return false;
        console.log('✅ Supabase 连接成功！');
        console.log('📊 当前会话:', data.session ? '已登录' : '未登录');
        return true;
    } catch (err) {
        return false;
    }
}

// ============================================
// Workspace - 工作空间管理
// ============================================

/**
 * 初始化/获取当前工作空间
 * 首次调用会自动创建工作空间（如果不存在）
 */
async function initWorkspace(name = 'Viajes FH') {
    const client = getSupabase();
    const { data: { user } } = await client.auth.getUser();
    if (!user) throw new Error('用户未登录');

    // 调用存储过程初始化工作空间
    const { data, error } = await client.rpc('init_workspace', { ws_name: name });
    if (error) throw error;
    
    // RPC 返回的是数组，取第一个元素
    const wsData = Array.isArray(data) ? data[0] : data;
    
    if (!wsData) {
        throw new Error('工作空间初始化失败：未返回数据');
    }
    
    currentWorkspaceId = wsData.workspace_id;
    currentUserRole = wsData.role;
    currentUserId = user.id;

    console.log(`✅ 工作空间: ${wsData.name} (角色: ${wsData.role})`);

    // 注意：不在这里触发 userRoleLoaded 事件，由 auth.js 统一触发
    return wsData;
}

// ============================================
// 权限管理 - Role & Permissions
// ============================================

/**
 * 获取当前用户角色
 * @returns {'owner' | 'admin' | 'member' | null}
 */
function getCurrentUserRole() {
    return currentUserRole;
}

/**
 * 获取当前用户 ID
 */
function getCurrentUserId() {
    return currentUserId;
}

/**
 * 检查当前用户是否是管理员 (owner/admin)
 */
function isAdmin() {
    return currentUserRole === 'owner' || currentUserRole === 'admin';
}

/**
 * 检查当前用户是否可以编辑指定账单
 * @param {string} createdBy - 账单创建者 ID
 */
function canEditBill(createdBy) {
    // admin/owner 可以编辑所有账单
    if (isAdmin()) return true;
    // member 只能编辑自己创建的账单
    return createdBy === currentUserId;
}

/**
 * 检查当前用户是否可以删除账单
 * 只有 admin/owner 可以删除
 */
function canDeleteBill() {
    return isAdmin();
}

/**
 * 刷新用户角色（从服务器重新获取）
 */
async function refreshUserRole() {
    const client = getSupabase();
    const { data: { user } } = await client.auth.getUser();
    if (!user) {
        currentUserRole = null;
        currentUserId = null;
        return null;
    }
    
    currentUserId = user.id;
    
    // 查询用户的工作空间和角色
    const { data, error } = await client
        .from('workspace_members')
        .select('workspace_id, role')
        .eq('user_id', user.id)
        .limit(1)
        .single();
    
    if (error || !data) {
        currentUserRole = null;
        return null;
    }
    
    currentWorkspaceId = data.workspace_id;
    currentUserRole = data.role;
    
    // 触发事件
    window.dispatchEvent(new CustomEvent('userRoleLoaded', { 
        detail: { role: data.role, userId: user.id, workspaceId: data.workspace_id }
    }));
    
    return data.role;
}

/**
 * 通过 Edge Function 复制账单（所有用户都可以调用）
 * @param {string} sourceBillId - 源账单 ID
 */
async function copyBillViaEdgeFunction(sourceBillId) {
    const client = getSupabase();
    const { data: { session } } = await client.auth.getSession();
    
    if (!session) throw new Error('用户未登录');
    
    const response = await fetch(`${SUPABASE_URL}/functions/v1/bills_copy`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ source_bill_id: sourceBillId })
    });
    
    const result = await response.json();
    
    if (!result.success) {
        throw new Error(result.error || '复制账单失败');
    }
    
    console.log(`✅ 账单复制成功: #${result.source_bill_no} -> #${result.new_bill_no}`);
    return result;
}

/**
 * 通过 Edge Function 管理用户（仅管理员可调用）
 * @param {'add' | 'update' | 'remove'} action - 操作类型
 * @param {string} email - 用户邮箱
 * @param {'admin' | 'member'} role - 角色
 */
async function manageUserViaEdgeFunction(action, email, role = 'member') {
    const client = getSupabase();
    const { data: { session } } = await client.auth.getSession();
    
    if (!session) throw new Error('用户未登录');
    
    const response = await fetch(`${SUPABASE_URL}/functions/v1/admin_manage_user`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ action, email, role })
    });
    
    const result = await response.json();
    
    if (!result.success) {
        throw new Error(result.error || '操作失败');
    }
    
    console.log(`✅ 用户操作成功:`, result);
    return result;
}

/**
 * 获取工作空间成员列表（含用户邮箱）
 */
async function getWorkspaceMembersWithEmail() {
    const client = getSupabase();
    const wsId = await getWorkspaceId();
    
    // 获取成员列表
    const { data: members, error: membersError } = await client
        .from('workspace_members')
        .select('id, user_id, role, created_at')
        .eq('workspace_id', wsId)
        .order('created_at');
    
    if (membersError) throw membersError;
    
    // 注意：因为 RLS 限制，我们需要通过 RPC 获取用户邮箱
    // 这里我们返回基本信息，邮箱需要通过其他方式获取
    return members;
}

/**
 * 获取当前工作空间 ID（如果没有则初始化）
 */
async function getWorkspaceId() {
    if (currentWorkspaceId) return currentWorkspaceId;
    
    const client = getSupabase();
    const { data: { user } } = await client.auth.getUser();
    if (!user) return null;

    // 查询用户的工作空间
    const { data, error } = await client
        .from('workspace_members')
        .select('workspace_id, role, workspaces(name)')
        .eq('user_id', user.id)
        .limit(1)
        .single();
    
    if (error || !data) {
        // 没有工作空间，需要初始化
        const ws = await initWorkspace();
        return ws.workspace_id;
    }
    
    currentWorkspaceId = data.workspace_id;
    return currentWorkspaceId;
}

/**
 * 添加成员到工作空间
 */
async function addWorkspaceMember(email, role = 'member') {
    const client = getSupabase();
    const wsId = await getWorkspaceId();
    
    const { data, error } = await client.rpc('add_workspace_member', {
        ws_id: wsId,
        member_email: email,
        member_role: role
    });
    if (error) throw error;
    return data;
}

/**
 * 获取工作空间成员列表
 */
async function getWorkspaceMembers() {
    const client = getSupabase();
    const wsId = await getWorkspaceId();
    
    const { data, error } = await client
        .from('workspace_members')
        .select('id, user_id, role, created_at')
        .eq('workspace_id', wsId)
        .order('created_at');
    if (error) throw error;
    return data;
}

// ============================================
// Bills CRUD - 账单完整操作
// ============================================

/**
 * 保存账单（新建或更新）
 * @param {Object} billData - 账单主表数据
 * @param {Array} items - 明细行数组
 * @param {string|null} billId - 如果有值则更新，否则新建
 * @returns {Object} - 包含 bill_id 和 bill_no
 */
async function saveBill(billData, items, billId = null) {
    const client = getSupabase();
    const { data: { user } } = await client.auth.getUser();
    if (!user) throw new Error('用户未登录');

    // 获取工作空间 ID
    const wsId = await getWorkspaceId();

    let bill;

    if (billId) {
        // ========== 更新模式 ==========
        console.log(`📝 更新账单: ${billId}`);
        
        // 1. 更新账单主表
        const { data: updatedBill, error: billError } = await client
            .from('bills')
            .update({
                bill_date: billData.bill_date,
                mode: billData.mode || 'bill',
                status: billData.status || 'draft',
                customer_id: billData.customer_id || null,
                customer_name: billData.customer_name,
                customer_contact: billData.customer_contact,
                customer_company: billData.customer_company,
                customer_tax_id: billData.customer_tax_id,
                customer_address: billData.customer_address,
                default_rate: billData.default_rate || 0,
                addon_rate: billData.addon_rate || 0,
                ship: billData.ship,
                route: billData.route,
                sailing_start: billData.sailing_start,
                sailing_end: billData.sailing_end,
                total_amount: billData.total_amount || 0,
                commission: billData.commission || 0,
                net_amount: billData.net_amount || 0,
                currency: billData.currency || 'EUR',
                payment: billData.payment,
                remarks: billData.remarks,
                terms_conditions: billData.terms_conditions,
                cancellation_policy: billData.cancellation_policy,
                price_includes: billData.price_includes
            })
            .eq('id', billId)
            .select('id, bill_no')
            .single();

        if (billError) throw billError;
        bill = updatedBill;

        // 2. 删除旧的明细行（级联删除 addons）
        const { error: deleteError } = await client
            .from('bill_items')
            .delete()
            .eq('bill_id', billId);
        if (deleteError) throw deleteError;

        console.log(`✅ 账单更新成功: bill_no=${bill.bill_no}`);

    } else {
        // ========== 新建模式 ==========
        console.log('📝 新建账单');
        
        const { data: newBill, error: billError } = await client
            .from('bills')
            .insert({
                created_by: user.id,
                workspace_id: wsId,
                bill_date: billData.bill_date,
                mode: billData.mode || 'bill',
                status: billData.status || 'draft',
                customer_id: billData.customer_id || null,
                customer_name: billData.customer_name,
                customer_contact: billData.customer_contact,
                customer_company: billData.customer_company,
                customer_tax_id: billData.customer_tax_id,
                customer_address: billData.customer_address,
                default_rate: billData.default_rate || 0,
                addon_rate: billData.addon_rate || 0,
                ship: billData.ship,
                route: billData.route,
                sailing_start: billData.sailing_start,
                sailing_end: billData.sailing_end,
                total_amount: billData.total_amount || 0,
                commission: billData.commission || 0,
                net_amount: billData.net_amount || 0,
                currency: billData.currency || 'EUR',
                payment: billData.payment,
                remarks: billData.remarks,
                terms_conditions: billData.terms_conditions,
                cancellation_policy: billData.cancellation_policy,
                price_includes: billData.price_includes
            })
            .select('id, bill_no')
            .single();

        if (billError) throw billError;
        bill = newBill;
        console.log(`✅ 账单创建成功: bill_no=${bill.bill_no}, id=${bill.id}`);
    }

    // 3. 插入新的明细行
    if (items && items.length > 0) {
        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            
            const { data: billItem, error: itemError } = await client
                .from('bill_items')
                .insert({
                    created_by: user.id,
                    bill_id: bill.id,
                    sort_order: i,
                    passenger_name: item.name || '',
                    booking_ref: item.ref || '',
                    cabin_type: item.type || '',
                    experience_type: item.exp || '',
                    price_type: item.price || '',
                    qty: parseInt(item.qty) || 1,
                    base_price: parseFloat(item.base) || 0,
                    tax: parseFloat(item.tax) || 0,
                    hsc: parseFloat(item.hsc) || 0,
                    commission_rate: parseFloat(item.rate) || 0,
                    extra_commission: parseFloat(item.extra) || 0,
                    discount_amount: parseFloat(item.descuento) || 0,
                    discount_percent: parseFloat(item.descuentoPercent) || 0
                })
                .select('id')
                .single();

            if (itemError) throw itemError;

            // 4. 插入附加产品
            if (item.addons && item.addons.length > 0) {
                const addonsToInsert = item.addons.map((addon, j) => ({
                    created_by: user.id,
                    bill_item_id: billItem.id,
                    sort_order: j,
                    addon_label: addon.desc || '',
                    qty: parseInt(addon.qty) || 1,
                    unit_price: parseFloat(addon.amount) || 0,
                    commission_rate: parseFloat(addon.rate) || 0,
                    discount_amount: parseFloat(addon.descuento) || 0
                }));

                const { error: addonError } = await client
                    .from('bill_item_addons')
                    .insert(addonsToInsert);

                if (addonError) throw addonError;
            }
        }
        console.log(`✅ ${items.length} 条明细行保存成功`);
    }

    return { bill_id: bill.id, bill_no: bill.bill_no };
}

/**
 * 获取账单列表（支持搜索）
 * @param {Object} options - { q: 搜索词, limit: 数量, mode: 模式 }
 */
async function getBills(options = {}) {
    const client = getSupabase();
    const { q, limit = 50, mode } = options;
    
    let query = client
        .from('bills')
        .select('id, bill_no, bill_date, customer_name, total_amount, ship, route, mode, status, created_at')
        .order('created_at', { ascending: false })
        .limit(limit);

    if (mode) query = query.eq('mode', mode);

    // 搜索：编号或客户名
    if (q && q.trim()) {
        const searchTerm = q.trim();
        // 检查是否是纯数字（搜索编号）
        if (/^\d+$/.test(searchTerm)) {
            query = query.eq('bill_no', parseInt(searchTerm));
        } else {
            query = query.ilike('customer_name', `%${searchTerm}%`);
        }
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
}

/**
 * 获取单个账单完整数据（含明细和附加产品）
 * @param {string} billId - 账单 UUID
 */
async function getBillFull(billId) {
    const client = getSupabase();

    // 1. 获取账单主表
    const { data: bill, error: billError } = await client
        .from('bills')
        .select('*')
        .eq('id', billId)
        .single();
    if (billError) throw billError;

    // 2. 获取明细行
    const { data: dbItems, error: itemsError } = await client
        .from('bill_items')
        .select('*')
        .eq('bill_id', billId)
        .order('sort_order');
    if (itemsError) throw itemsError;

    // 3. 获取每个明细的附加产品，并转换为前端格式
    const items = [];
    for (const dbItem of dbItems) {
        const { data: dbAddons, error: addonsError } = await client
            .from('bill_item_addons')
            .select('*')
            .eq('bill_item_id', dbItem.id)
            .order('sort_order');
        if (addonsError) throw addonsError;

        // 转换为前端 item 格式
        items.push({
            name: dbItem.passenger_name || '',
            ref: dbItem.booking_ref || '',
            type: dbItem.cabin_type || '',
            exp: dbItem.experience_type || '',
            price: dbItem.price_type || '',
            qty: dbItem.qty || 1,
            base: dbItem.base_price || 0,
            tax: dbItem.tax || 0,
            hsc: dbItem.hsc || 0,
            rate: dbItem.commission_rate || 0,
            extra: dbItem.extra_commission || 0,
            descuento: dbItem.discount_amount || 0,
            descuentoPercent: dbItem.discount_percent || 0,
            addons: dbAddons.map(a => ({
                desc: a.addon_label || '',
                qty: a.qty || 1,
                amount: a.unit_price || 0,
                rate: a.commission_rate || 0,
                descuento: a.discount_amount || 0
            }))
        });
    }

    return { bill, items };
}

/**
 * 更新账单状态
 */
async function updateBillStatus(billId, status) {
    const client = getSupabase();
    const { data, error } = await client
        .from('bills')
        .update({ status })
        .eq('id', billId)
        .select()
        .single();
    if (error) throw error;
    return data;
}

/**
 * 删除账单（级联删除明细和附加产品）
 */
async function deleteBill(billId) {
    const client = getSupabase();
    const { error } = await client
        .from('bills')
        .delete()
        .eq('id', billId);
    if (error) throw error;
    console.log('✅ 账单删除成功:', billId);
}

// ============================================
// Option Lists - 下拉选项管理
// ============================================

async function getOptionsByCategory(category) {
    const client = getSupabase();
    const { data, error } = await client
        .from('option_lists')
        .select('*')
        .eq('category', category)
        .eq('is_active', true)
        .order('sort_order');
    if (error) throw error;
    return data;
}

async function addOption(category, label) {
    const client = getSupabase();
    const { data: { user } } = await client.auth.getUser();
    if (!user) throw new Error('用户未登录');

    const { data, error } = await client
        .from('option_lists')
        .insert({ created_by: user.id, category, label })
        .select()
        .single();
    if (error) throw error;
    return data;
}

// ============================================
// Payments - 付款记录
// ============================================

async function createPayment(paymentData) {
    const client = getSupabase();
    const { data: { user } } = await client.auth.getUser();
    if (!user) throw new Error('用户未登录');

    const { data, error } = await client
        .from('payments')
        .insert({ ...paymentData, created_by: user.id })
        .select()
        .single();
    if (error) throw error;
    return data;
}

async function getPayments(orderId = null) {
    const client = getSupabase();
    let query = client.from('payments').select('*').order('payment_date', { ascending: false });
    if (orderId) query = query.eq('order_id', orderId);
    const { data, error } = await query;
    if (error) throw error;
    return data;
}

// ============================================
// Customers - 客户管理（工作空间共享）
// ============================================

/**
 * 获取客户列表（当前工作空间，含完整信息）
 */
async function getCustomers(search = '') {
    const client = getSupabase();
    const wsId = await getWorkspaceId();
    
    let query = client
        .from('customers')
        .select('id, name, trade_name, customer_type, contact, company, tax_id, address, default_rate, addon_rate, notes, created_at')
        .eq('workspace_id', wsId)
        .order('name');
    
    if (search && search.trim()) {
        query = query.ilike('name', `%${search.trim()}%`);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return data;
}

/**
 * 获取单个客户详情
 */
async function getCustomer(customerId) {
    const client = getSupabase();
    const { data, error } = await client
        .from('customers')
        .select('*')
        .eq('id', customerId)
        .single();
    if (error) throw error;
    return data;
}

/**
 * 创建客户（含完整信息：开票、佣金等）
 */
async function createCustomer(customerData) {
    const client = getSupabase();
    const { data: { user } } = await client.auth.getUser();
    if (!user) throw new Error('用户未登录');
    
    const wsId = await getWorkspaceId();

    const { data, error } = await client
        .from('customers')
        .insert({ 
            workspace_id: wsId,
            created_by: user.id,
            name: customerData.name,
            trade_name: customerData.name, // 同步到 trade_name
            customer_type: customerData.customer_type || 'personal',
            contact: customerData.contact || '',
            company: customerData.company || '',
            tax_id: customerData.tax_id || '',
            address: customerData.address || '',
            default_rate: parseFloat(customerData.default_rate) || 0,
            addon_rate: parseFloat(customerData.addon_rate) || 0,
            notes: customerData.notes || ''
        })
        .select()
        .single();
    
    if (error) {
        if (error.code === '23505') {
            throw new Error('客户已存在：相同名称和联系方式的客户已存在');
        }
        throw error;
    }
    console.log(`✅ 客户创建成功: ${data.name}`);
    return data;
}

/**
 * 更新客户（含完整信息）
 */
async function updateCustomer(customerId, customerData) {
    const client = getSupabase();
    
    const { data, error } = await client
        .from('customers')
        .update({
            name: customerData.name,
            trade_name: customerData.name, // 同步到 trade_name
            customer_type: customerData.customer_type,
            contact: customerData.contact,
            company: customerData.company || '',
            tax_id: customerData.tax_id || '',
            address: customerData.address || '',
            default_rate: parseFloat(customerData.default_rate) || 0,
            addon_rate: parseFloat(customerData.addon_rate) || 0,
            notes: customerData.notes || ''
        })
        .eq('id', customerId)
        .select()
        .single();
    
    if (error) {
        if (error.code === '23505') {
            throw new Error('客户已存在：相同名称和联系方式的客户已存在');
        }
        throw error;
    }
    console.log(`✅ 客户更新成功: ${data.name}`);
    return data;
}

/**
 * 删除客户
 */
async function deleteCustomer(customerId) {
    const client = getSupabase();
    
    // 先检查是否有关联账单
    const { data: bills, error: billsError } = await client
        .from('bills')
        .select('id, bill_no')
        .eq('customer_id', customerId)
        .limit(1);
    
    if (billsError) throw billsError;
    
    if (bills && bills.length > 0) {
        throw new Error(`无法删除：该客户有关联的账单 (#${bills[0].bill_no})`);
    }
    
    const { error } = await client
        .from('customers')
        .delete()
        .eq('id', customerId);
    
    if (error) throw error;
    console.log(`✅ 客户删除成功`);
}

/**
 * 查找相似客户（重复检测）
 * @returns {Array} - 包含 is_exact_match 字段
 */
async function findSimilarCustomers(name, contact, excludeId = null) {
    const client = getSupabase();
    const wsId = await getWorkspaceId();
    
    const { data, error } = await client.rpc('find_similar_customers', {
        ws_id: wsId,
        search_name: name || '',
        search_contact: contact || '',
        exclude_id: excludeId
    });
    
    if (error) throw error;
    return data || [];
}

// ============================================
// Customer Invoices - 开票抬头管理
// ============================================

/**
 * 获取客户的开票抬头列表
 */
async function getCustomerInvoices(customerId) {
    const client = getSupabase();
    const { data, error } = await client
        .from('customer_invoices')
        .select('*')
        .eq('customer_id', customerId)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
}

/**
 * 创建开票抬头
 */
async function createCustomerInvoice(invoiceData) {
    const client = getSupabase();
    const { data: { user } } = await client.auth.getUser();
    if (!user) throw new Error('用户未登录');
    
    const wsId = await getWorkspaceId();
    
    // 如果设置为默认，先把其他的设为非默认
    if (invoiceData.is_default) {
        await client
            .from('customer_invoices')
            .update({ is_default: false })
            .eq('customer_id', invoiceData.customer_id);
    }

    const { data, error } = await client
        .from('customer_invoices')
        .insert({
            workspace_id: wsId,
            created_by: user.id,
            customer_id: invoiceData.customer_id,
            company_name: invoiceData.company_name,
            tax_id: invoiceData.tax_id || '',
            address: invoiceData.address || '',
            is_default: invoiceData.is_default || false
        })
        .select()
        .single();
    
    if (error) throw error;
    console.log(`✅ 开票抬头创建成功: ${data.company_name}`);
    return data;
}

/**
 * 更新开票抬头
 */
async function updateCustomerInvoice(invoiceId, invoiceData) {
    const client = getSupabase();
    
    // 如果设置为默认，先把同客户的其他抬头设为非默认
    if (invoiceData.is_default) {
        // 先获取当前抬头的 customer_id
        const { data: current } = await client
            .from('customer_invoices')
            .select('customer_id')
            .eq('id', invoiceId)
            .single();
        
        if (current) {
            await client
                .from('customer_invoices')
                .update({ is_default: false })
                .eq('customer_id', current.customer_id)
                .neq('id', invoiceId);
        }
    }

    const { data, error } = await client
        .from('customer_invoices')
        .update({
            company_name: invoiceData.company_name,
            tax_id: invoiceData.tax_id,
            address: invoiceData.address,
            is_default: invoiceData.is_default
        })
        .eq('id', invoiceId)
        .select()
        .single();
    
    if (error) throw error;
    console.log(`✅ 开票抬头更新成功: ${data.company_name}`);
    return data;
}

/**
 * 删除开票抬头
 */
async function deleteCustomerInvoice(invoiceId) {
    const client = getSupabase();
    const { error } = await client
        .from('customer_invoices')
        .delete()
        .eq('id', invoiceId);
    if (error) throw error;
    console.log(`✅ 开票抬头删除成功`);
}

/**
 * 获取客户的默认开票抬头
 */
async function getDefaultInvoice(customerId) {
    const client = getSupabase();
    const { data, error } = await client
        .from('customer_invoices')
        .select('*')
        .eq('customer_id', customerId)
        .eq('is_default', true)
        .single();
    
    if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows
    return data || null;
}

// ============================================
// 暴露到全局
// ============================================

window.SupabaseAPI = {
    client: () => getSupabase(),
    
    // 工作空间
    workspace: {
        init: initWorkspace,
        getId: getWorkspaceId,
        addMember: addWorkspaceMember,
        getMembers: getWorkspaceMembers,
        getMembersWithEmail: getWorkspaceMembersWithEmail
    },
    
    // 权限管理
    permissions: {
        getCurrentRole: getCurrentUserRole,
        getCurrentUserId: getCurrentUserId,
        isAdmin: isAdmin,
        canEditBill: canEditBill,
        canDeleteBill: canDeleteBill,
        refresh: refreshUserRole
    },
    
    // 账单
    bills: {
        save: saveBill,
        list: getBills,
        getFull: getBillFull,
        updateStatus: updateBillStatus,
        delete: deleteBill,
        copy: copyBillViaEdgeFunction
    },
    
    // 用户管理（通过 Edge Function）
    users: {
        manage: manageUserViaEdgeFunction
    },
    
    // 客户（工作空间共享）
    customers: {
        list: getCustomers,
        get: getCustomer,
        create: createCustomer,
        update: updateCustomer,
        delete: deleteCustomer,
        findSimilar: findSimilarCustomers
    },
    
    // 开票抬头
    invoices: {
        list: getCustomerInvoices,
        create: createCustomerInvoice,
        update: updateCustomerInvoice,
        delete: deleteCustomerInvoice,
        getDefault: getDefaultInvoice
    },
    
    // 选项
    options: {
        get: getOptionsByCategory,
        add: addOption
    },
    
    // 付款
    payments: {
        create: createPayment,
        list: getPayments
    }
};

console.log('📦 Supabase API 已挂载到 window.SupabaseAPI');

// 导出
export { 
    SUPABASE_URL, 
    SUPABASE_ANON_KEY, 
    getSupabase,
    initSupabase, 
    testSupabaseConnection,
    // Workspace
    initWorkspace,
    getWorkspaceId,
    addWorkspaceMember,
    getWorkspaceMembers,
    getWorkspaceMembersWithEmail,
    // Permissions
    getCurrentUserRole,
    getCurrentUserId,
    isAdmin,
    canEditBill,
    canDeleteBill,
    refreshUserRole,
    copyBillViaEdgeFunction,
    manageUserViaEdgeFunction,
    // Bills
    saveBill,
    getBills,
    getBillFull,
    updateBillStatus,
    deleteBill,
    // Customers
    getCustomers,
    getCustomer,
    createCustomer,
    updateCustomer,
    deleteCustomer,
    findSimilarCustomers,
    // Invoices
    getCustomerInvoices,
    createCustomerInvoice,
    updateCustomerInvoice,
    deleteCustomerInvoice,
    getDefaultInvoice,
    // Options
    getOptionsByCategory,
    addOption,
    // Payments
    createPayment,
    getPayments
};
