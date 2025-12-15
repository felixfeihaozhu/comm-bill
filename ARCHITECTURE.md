# 项目架构说明

## 双前端架构

本项目采用渐进式迁移架构，两套前端并存运行：

### 1. Legacy 前端（根目录）
- 位置：`/index.html`, `/js/`, `/css/`
- 功能：编辑器（账单、报价单、机票单、比价单）
- 部署：`https://oms.fhglobal.es/`
- 特点：独立可运行，支持 iframe 嵌入模式

### 2. Next.js CRM（/web 目录）
- 位置：`/web/`
- 功能：CRM 管理界面（单据中心、客户管理等）
- 部署：`https://app.oms.fhglobal.es/` 或 `https://oms.fhglobal.es/app/`
- 特点：通过 iframe 集成 legacy 编辑器

## 运行命令

### Legacy 编辑器
```bash
# 使用任意静态服务器，例如：
npx serve .
# 或
python -m http.server 5500
```

### Next.js CRM
```bash
cd web
npm install
npm run dev      # 开发
npm run build    # 构建
npm run start    # 生产
```

## URL 路由

### Legacy
- `/#editor?type=bill&mode=create` - 创建账单
- `/#editor?type=quote&mode=edit&id=xxx` - 编辑报价单
- `/#editor?type=ticket&mode=view&id=xxx` - 查看机票单

### Next.js
- `/documents` - 单据中心
- `/editor?type=bill&mode=create` - 编辑器容器（iframe 包裹 legacy）
- `/dashboard` - 数据概览
- `/customers` - 客户管理

## iframe 通信协议

Legacy 编辑器 → Next.js CRM：
```javascript
// 保存成功
window.parent.postMessage({ type: 'editor:saved', id: 'xxx', docType: 'bill' }, '*')

// 正在保存
window.parent.postMessage({ type: 'editor:saving' }, '*')

// 请求关闭
window.parent.postMessage({ type: 'editor:close' }, '*')
```

## 目录结构

```
viajes-fh/
├── index.html          # Legacy 入口
├── js/
│   ├── core/
│   │   ├── iframe-bridge.js  # iframe 通信模块
│   │   └── ...
│   ├── editor/
│   ├── modes/
│   └── main.js
├── css/
├── web/                # Next.js CRM
│   ├── app/
│   │   ├── documents/
│   │   ├── editor/
│   │   ├── dashboard/
│   │   └── ...
│   ├── components/
│   └── package.json
└── supabase/
```
