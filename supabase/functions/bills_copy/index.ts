/**
 * Edge Function: bills_copy
 * 用途：所有用户都能复制账单（member 也可以）
 * 
 * 功能：
 * - 读取原账单 + 明细（只读）
 * - 创建新账单：新 bill_no（递增），created_by = 当前用户
 * - 复制 items / addons
 * - 普通用户 ❌ 不允许 UPDATE 原账单，只能通过这个 function 复制
 */

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.47.10";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface CopyBillRequest {
  source_bill_id: string;
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
    
    // 验证用户
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    // 用户客户端（验证身份）
    const userClient = createClient(supabaseUrl, authHeader.replace('Bearer ', ''), {
      auth: { persistSession: false }
    });
    
    // 服务端客户端（执行操作）
    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    // 获取当前用户
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      throw new Error('Unauthorized: Invalid token');
    }

    // 解析请求体
    const body: CopyBillRequest = await req.json();
    const { source_bill_id } = body;

    if (!source_bill_id) {
      throw new Error('source_bill_id is required');
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

    const workspaceId = membership.workspace_id;

    // 1. 获取原账单（验证用户有权限读取）
    const { data: sourceBill, error: sourceBillError } = await adminClient
      .from('bills')
      .select('*')
      .eq('id', source_bill_id)
      .eq('workspace_id', workspaceId)
      .single();

    if (sourceBillError || !sourceBill) {
      throw new Error('Source bill not found or access denied');
    }

    // 2. 获取原账单的明细
    const { data: sourceItems, error: sourceItemsError } = await adminClient
      .from('bill_items')
      .select('*')
      .eq('bill_id', source_bill_id)
      .order('sort_order');

    if (sourceItemsError) {
      throw new Error(`Failed to fetch bill items: ${sourceItemsError.message}`);
    }

    // 3. 获取每个明细的附加产品
    const itemAddonsMap: Map<string, unknown[]> = new Map();
    for (const item of sourceItems || []) {
      const { data: addons, error: addonsError } = await adminClient
        .from('bill_item_addons')
        .select('*')
        .eq('bill_item_id', item.id)
        .order('sort_order');

      if (addonsError) {
        throw new Error(`Failed to fetch addons: ${addonsError.message}`);
      }

      if (addons && addons.length > 0) {
        itemAddonsMap.set(item.id, addons);
      }
    }

    // 4. 创建新账单
    const newBillData = {
      created_by: user.id,
      workspace_id: workspaceId,
      bill_date: new Date().toISOString().split('T')[0], // 今天的日期
      mode: sourceBill.mode,
      status: 'draft', // 新账单始终是草稿状态
      customer_id: sourceBill.customer_id,
      customer_name: sourceBill.customer_name,
      customer_contact: sourceBill.customer_contact,
      customer_company: sourceBill.customer_company,
      customer_tax_id: sourceBill.customer_tax_id,
      customer_address: sourceBill.customer_address,
      default_rate: sourceBill.default_rate,
      addon_rate: sourceBill.addon_rate,
      ship: sourceBill.ship,
      route: sourceBill.route,
      sailing_start: sourceBill.sailing_start,
      sailing_end: sourceBill.sailing_end,
      total_amount: sourceBill.total_amount,
      commission: sourceBill.commission,
      net_amount: sourceBill.net_amount,
      currency: sourceBill.currency,
      payment: sourceBill.payment,
      remarks: sourceBill.remarks,
      terms_conditions: sourceBill.terms_conditions,
      cancellation_policy: sourceBill.cancellation_policy,
      price_includes: sourceBill.price_includes,
    };

    const { data: newBill, error: newBillError } = await adminClient
      .from('bills')
      .insert(newBillData)
      .select('id, bill_no')
      .single();

    if (newBillError || !newBill) {
      throw new Error(`Failed to create new bill: ${newBillError?.message}`);
    }

    // 5. 复制明细行
    const itemIdMapping: Map<string, string> = new Map(); // 旧 ID -> 新 ID

    for (const sourceItem of sourceItems || []) {
      const newItemData = {
        created_by: user.id,
        bill_id: newBill.id,
        sort_order: sourceItem.sort_order,
        passenger_name: sourceItem.passenger_name,
        booking_ref: sourceItem.booking_ref,
        cabin_type: sourceItem.cabin_type,
        cabin_type_option_id: sourceItem.cabin_type_option_id,
        experience_type: sourceItem.experience_type,
        experience_type_option_id: sourceItem.experience_type_option_id,
        price_type: sourceItem.price_type,
        price_type_option_id: sourceItem.price_type_option_id,
        qty: sourceItem.qty,
        base_price: sourceItem.base_price,
        tax: sourceItem.tax,
        hsc: sourceItem.hsc,
        commission_rate: sourceItem.commission_rate,
        extra_commission: sourceItem.extra_commission,
        discount_amount: sourceItem.discount_amount,
        discount_percent: sourceItem.discount_percent,
      };

      const { data: newItem, error: newItemError } = await adminClient
        .from('bill_items')
        .insert(newItemData)
        .select('id')
        .single();

      if (newItemError || !newItem) {
        throw new Error(`Failed to copy bill item: ${newItemError?.message}`);
      }

      itemIdMapping.set(sourceItem.id, newItem.id);
    }

    // 6. 复制附加产品
    for (const [oldItemId, addons] of itemAddonsMap) {
      const newItemId = itemIdMapping.get(oldItemId);
      if (!newItemId) continue;

      for (const addon of addons as Record<string, unknown>[]) {
        const newAddonData = {
          created_by: user.id,
          bill_item_id: newItemId,
          sort_order: addon.sort_order,
          addon_label: addon.addon_label,
          addon_option_id: addon.addon_option_id,
          qty: addon.qty,
          unit_price: addon.unit_price,
          commission_rate: addon.commission_rate,
          discount_amount: addon.discount_amount,
        };

        const { error: addonError } = await adminClient
          .from('bill_item_addons')
          .insert(newAddonData);

        if (addonError) {
          console.error('Failed to copy addon:', addonError.message);
          // 继续处理其他 addon，不中断
        }
      }
    }

    // 返回成功结果
    const result = {
      success: true,
      action: 'copied',
      source_bill_id: source_bill_id,
      source_bill_no: sourceBill.bill_no,
      new_bill_id: newBill.id,
      new_bill_no: newBill.bill_no,
      items_copied: sourceItems?.length || 0,
      addons_copied: Array.from(itemAddonsMap.values()).reduce((sum, arr) => sum + arr.length, 0),
      message: `Bill #${sourceBill.bill_no} copied to new bill #${newBill.bill_no}`
    };

    console.log('bills_copy success:', result);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('bills_copy error:', message);
    
    return new Response(JSON.stringify({ 
      success: false, 
      error: message 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});


