# 快速开始指南

## 项目简介

这是一个邮轮账单管理系统，支持四种模式：
- **账单模式**：B2B内部账单，显示完整佣金和成本信息
- **报价模式**：B2C客户报价，隐藏敏感信息
- **票据模式**：支付凭证，跟踪已付/待付金额
- **对比模式**：西区/德区价格对比，计算利润

## 本地开发

### 1. 启动本地服务器

```bash
cd /path/to/viajes-fh-main
python3 -m http.server 8000
```

### 2. 访问应用

在浏览器中打开：http://localhost:8000

## 文件结构概览

```
viajes-fh-main/
├── js/
│   ├── core/          # 核心功能模块
│   ├── modes/         # 四个模式模块
│   └── main.js        # 主程序
├── data/              # 配置文件
├── docs/              # 文档
├── css/               # 样式
└── index.html         # 入口文件
```

## 如何修改配置

### 修改客户列表

编辑 `data/config.json` 中的 `clients` 数组：

```json
{
  "clients": [
    {
      "tradeName": "环球之旅",
      "company": "DYNASTY TICKETING Kft.",
      "taxId": "26542003242",
      "address": "地址信息",
      "rate": 5,
      "addonRate": 5
    }
  ]
}
```

### 修改船只/航线

同样在 `data/config.json` 中修改 `ships` 和 `routes` 数组。

### 修改默认付款信息

修改 `data/config.json` 中的 `defaults.payment` 字段。

## 如何添加新功能

### 1. 为现有模式添加功能

编辑对应的模式文件：
- `js/modes/bill-mode.js` - 账单模式
- `js/modes/quote-mode.js` - 报价模式
- `js/modes/ticket-mode.js` - 票据模式
- `js/modes/compare-mode.js` - 对比模式

### 2. 添加新的通用函数

在 `js/core/utils.js` 中添加：

```javascript
window.myNewFunction = function() {
  // 新功能代码
}
```

### 3. 添加新的模式

参考 `docs/REFACTORING_SUMMARY.md` 中的"如何添加新模式"章节。

## 常见问题

### Q: 数据不同步怎么办？
A: 检查Firebase配置是否正确，打开浏览器控制台查看连接状态。

### Q: 模式切换后显示不正常？
A: 确保在对应模式的activate()方法中正确设置了显示/隐藏逻辑。

### Q: 如何备份数据？
A: 点击工具栏的"备份"按钮，会下载JSON格式的备份文件。

### Q: 如何恢复数据？
A: 点击工具栏的"恢复"按钮，选择之前备份的JSON文件。

## 开发者工具

### 查看模块加载状态

打开浏览器控制台（F12），可以看到：

```
✅ Utils loaded
✅ Firebase config loaded
✅ i18n loaded
✅ Bill mode module loaded
✅ Quote mode module loaded
✅ Ticket mode module loaded
✅ Compare mode module loaded
✅ Bill mode initialized
✅ Quote mode initialized
✅ Ticket mode initialized
✅ Compare mode initialized
```

### 调试模式计算

在控制台中可以手动调用模式函数：

```javascript
// 对比模式计算
const result = window.CompareMode.calculate();
console.log(result);

// 清除对比输入
window.clearCompareInputs();
```

## 更多文档

详细的技术文档请查看：
- `docs/REFACTORING_SUMMARY.md` - 重构总结
- `docs/FILE_STRUCTURE.md` - 文件结构说明

## 技术支持

如有问题，请查看浏览器控制台的错误信息，或联系开发团队。
