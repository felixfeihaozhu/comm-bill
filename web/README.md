# FH Global OMS - Next.js CRM

基于 Next.js 14 App Router 的旅行社 CRM 系统。

## 功能特性

- ✅ 用户认证（Supabase Auth）
- ✅ 工作空间/组织隔离
- ✅ 角色权限（owner/admin/member）
- ✅ 单据中心（账单/报价单/机票单/比价单）
- ✅ 客户管理
- ✅ 团队成员管理
- ✅ Legacy 编辑器 iframe 集成

## 环境变量

在 Vercel 后台添加：

| Key | Value |
|-----|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://dszqampcpmvoywjqbfyj.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIs...` |
| `NEXT_PUBLIC_LEGACY_URL` | `https://oms.fhglobal.es` |

## 开发

```bash
npm install
npm run dev
```

## 部署

```bash
npm install -g vercel
vercel login
vercel --prod
```

## 目录结构

```
/web
├── app/                    # App Router 页面
│   ├── login/             # 登录页
│   ├── documents/         # 单据中心
│   ├── customers/         # 客户管理
│   ├── team/              # 团队成员
│   ├── org/               # 工作空间选择
│   └── editor/            # Legacy 编辑器 iframe 容器
├── components/
│   ├── auth/              # 认证相关组件
│   ├── layout/            # 布局组件
│   ├── documents/         # 单据相关组件
│   └── ui/                # 通用 UI 组件
└── lib/
    ├── supabase.ts        # Supabase 客户端（唯一）
    ├── workspace.ts       # 工作空间操作
    ├── helpers.ts         # 工具函数
    └── types.ts           # 类型定义
```

## 验证步骤

1. 访问 Vercel URL → 看到登录页
2. 登录后 → 进入 /documents
3. 刷新页面 → 保持登录状态
4. Header 右上角 → 显示工作空间切换
5. 退出登录 → 跳回 /login


