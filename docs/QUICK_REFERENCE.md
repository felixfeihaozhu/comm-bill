# 🚀 配置文件快速参考

## 📍 文件位置
```
/data/config.json
```

## ⚡ 快速修改步骤
1. 打开 `data/config.json`
2. 修改相应数据
3. 保存文件 (UTF-8 编码)
4. 刷新浏览器 (Cmd+R / Ctrl+R)

## 📋 常用操作

### ➕ 添加新客户
```json
{
  "tradeName": "商用名称",
  "company": "公司法定名称",
  "taxId": "税号",
  "address": "地址",
  "rate": 10,
  "addonRate": 3
}
```

### 🚢 添加新船只
```json
"MSC 新船号 MSC New Ship"
```

### 🗺️ 添加新航线
```json
"新航线名称 (Route Name)"
```

### 💰 修改默认支付信息
```json
"defaults": {
  "payment": "Bank: XXX\nName: YYY\nAccount: ZZZ"
}
```
**注意：** 用 `\n` 表示换行

### 🔐 修改管理员密码
```json
"defaults": {
  "adminPassword": "new_password"
}
```

## ⚠️ JSON 格式要点

✅ **正确**
```json
{
  "name": "value",
  "list": ["item1", "item2"]
}
```

❌ **错误**
```json
{
  "name": "value",
  "list": ["item1", "item2",]  ← 多余的逗号
}
```

## 🛠️ 格式验证工具
- https://jsonlint.com/

## 🔍 调试技巧
1. 打开浏览器控制台 (F12)
2. 查看是否显示：`✅ 配置文件加载成功`
3. 如有错误，检查 JSON 格式

## 📦 备份命令
```bash
cp data/config.json data/config.backup.json
```

## 🔄 恢复备份
```bash
cp data/config.backup.json data/config.json
```

---
**提示：** 修改前先备份！
