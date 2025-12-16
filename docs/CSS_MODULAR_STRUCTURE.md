# CSS模块化结构说明

## 概述

为了避免不同模式之间的CSS冲突，我们将每个模式的专属样式分离到独立的CSS文件中。

## 文件结构

```
css/
├── style.css           # 全局基础样式
├── bill-mode.css       # 账单模式专属样式 ✅
├── quote-mode.css      # 报价模式专属样式 ✅
├── ticket-mode.css     # 票据模式专属样式 ✅
└── compare-mode.css    # 对比模式专属样式 ✅
```

## 使用方式

### 1. HTML引入

在`index.html`的`<head>`中按顺序引入：

```html
<link rel="stylesheet" href="css/style.css">
<link rel="stylesheet" href="css/bill-mode.css">
<link rel="stylesheet" href="css/quote-mode.css">
<link rel="stylesheet" href="css/ticket-mode.css">
<link rel="stylesheet" href="css/compare-mode.css">
```

### 2. Body类名

`<body>`标签带有当前模式的类名：

```html
<body class="bill-mode">    <!-- 账单模式 -->
<body class="quote-mode">   <!-- 报价模式 -->
<body class="ticket-mode">  <!-- 票据模式 -->
<body class="compare-mode"> <!-- 对比模式 -->
```

### 3. 模式切换

通过JavaScript切换body的类名：

```javascript
window.switchMode = function(mode) {
    document.body.className = mode + '-mode';
    // ... 其他逻辑
}
```

## CSS命名规范

每个模式的CSS都使用模式类作为前缀，避免冲突：

### 账单模式 (bill-mode.css)

```css
.bill-mode .total-row { }
.bill-mode .total-label { }
.bill-mode .total-amount { }
.bill-mode .net-box { }
```

### 报价模式 (quote-mode.css)

```css
.quote-mode .total-box { }
.quote-mode .total-title { }
.quote-mode .total-value { }
```

## 优势

1. **避免冲突**: 每个模式的样式完全隔离
2. **易于维护**: 修改某个模式样式不影响其他模式
3. **性能优化**: 浏览器只应用当前模式的样式
4. **代码清晰**: 每个文件职责单一

## 账单模式布局说明

### 总价区域结构

```html
<div class="footer-right">
  <div class="total-row">
    <div class="total-label">
      <span>直客总价</span>
      <span class="en">Total Gross Price</span>
    </div>
    <div class="total-amount">0.00</div>
  </div>
  <!-- 更多行 -->
</div>
```

### 关键样式

```css
.bill-mode .total-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;  /* 占满容器宽度 */
}

.bill-mode .total-amount {
  margin-left: 20px;  /* 与标签保持间距 */
  min-width: 100px;   /* 最小宽度保证对齐 */
  text-align: right;
  white-space: nowrap;
}
```

## 调试建议

1. 使用浏览器开发者工具检查元素
2. 确认body的类名是否正确
3. 检查CSS是否正确加载
4. 验证样式优先级是否正确

## 下一步

- [x] 创建 bill-mode.css ✅
- [x] 创建 quote-mode.css ✅
- [x] 创建 ticket-mode.css ✅
- [x] 创建 compare-mode.css ✅
- [ ] 测试所有模式的样式隔离
- [ ] 优化性能，考虑按需加载CSS
- [ ] 清理style.css中的冗余样式
