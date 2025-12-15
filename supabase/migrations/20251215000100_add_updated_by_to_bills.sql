-- ============================================
-- Migration: 添加 updated_by 字段到 bills 表
-- ============================================

-- 添加 updated_by 字段
ALTER TABLE bills ADD COLUMN IF NOT EXISTS updated_by uuid REFERENCES auth.users(id);

-- 创建触发器自动更新 updated_at
CREATE OR REPLACE FUNCTION update_bills_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_bills_updated_at ON bills;
CREATE TRIGGER trigger_bills_updated_at
    BEFORE UPDATE ON bills
    FOR EACH ROW
    EXECUTE FUNCTION update_bills_updated_at();

-- 添加 updated_by 到 bill_items
ALTER TABLE bill_items ADD COLUMN IF NOT EXISTS updated_by uuid REFERENCES auth.users(id);
ALTER TABLE bill_items ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- 添加 updated_by 到 bill_item_addons
ALTER TABLE bill_item_addons ADD COLUMN IF NOT EXISTS updated_by uuid REFERENCES auth.users(id);
ALTER TABLE bill_item_addons ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

COMMENT ON COLUMN bills.updated_by IS '最后修改人 user_id';
COMMENT ON COLUMN bill_items.updated_by IS '最后修改人 user_id';
COMMENT ON COLUMN bill_item_addons.updated_by IS '最后修改人 user_id';
