# 多语言集成完成指南

## ✅ 已完成的部分

1. **创建了多语言配置文件** (`js/i18n.js`)
   - 包含中文 (zh)、西班牙语 (es)、英语 (en) 三种语言
   - 包含所有界面文本的翻译

2. **添加了语言切换功能**
   - 顶部工具栏添加了三个语言切换按钮（中文、ES、EN）
   - 实现了 `switchLanguage()` 函数
   - 语言选择会保存到 localStorage

3. **集成了多语言系统**
   - 在 main.js 中导入了 i18n 模块
   - 更新了状态提示使用多语言
   - 更新了对话框和提示信息使用多语言

4. **添加了 CSS 样式**
   - 语言切换按钮样式
   - Hover 效果

## 📝 需要手动完成的部分

由于 HTML 文件中有大量需要添加 `data-i18n` 属性的元素，以下是具体的修改方法：

### 步骤 1: 为表单标题添加 data-i18n 属性

在 index.html 中找到以下位置并添加 `data-i18n` 属性：

```html
<!-- 表单标题 -->
<div class="form-header"><h2 data-i18n="formTitle">账单录入</h2></div>

<!-- 各个分组标题 -->
<div class="form-title" data-i18n="sectionBasicInfo">基础信息</div>
<div class="form-title" data-i18n="sectionClientInfo">客户信息</div>
<div class="form-title" data-i18n="sectionCruiseInfo">航次信息</div>
<div class="form-title"><span data-i18n="sectionItems">费用明细</span>...
<div class="form-title"><span data-i18n="sectionPayment">支付与备注</span>...
```

### 步骤 2: 为表单标签添加 data-i18n 属性

```html
<!-- 基础信息 -->
<label data-i18n="labelInvNo">编号</label>
<label data-i18n="labelDate">日期</label>

<!-- 客户信息 -->
<select id="clientSelect">
  <option value="" data-i18n="selectClient">-- 选择常用客户 --</option>
</select>
<label data-i18n="labelTradeName">商用名称</label>
<label data-i18n="labelLegalName">公司注册名称</label>
<label data-i18n="labelTaxId">税号</label>
<label data-i18n="labelAddress">地址</label>
<label data-i18n="labelCommRate">佣金%</label>
<label data-i18n="labelAddonRate">附加佣金%</label>

<!-- 航次信息 -->
<label data-i18n="labelShip">船名</label>
<label data-i18n="labelRoute">航线</label>
<label data-i18n="labelSailingStart">出发</label>
<label data-i18n="labelSailingEnd">结束</label>

<!-- 支付与备注 -->
<label data-i18n="labelPayment">支付信息</label>
<label data-i18n="labelRemarks">备注</label>
```

### 步骤 3: 为输入框 placeholder 添加 data-i18n 属性

```html
<input type="text" id="invNo" placeholder="25 0001" data-i18n="placeholderInvNo">
<input type="text" id="billTradeName" placeholder="Ctrip / 携程" data-i18n="placeholderTradeName">
<input type="text" id="billTaxId" placeholder="e.g. ES12345678" data-i18n="placeholderTaxId">
```

### 步骤 4: 为按钮添加 data-i18n 属性

```html
<button class="btn btn-sm btn-save" onclick="saveClient()">
  <svg>...</svg> <span data-i18n="btnSave">保存</span>
</button>
<button class="btn btn-sm btn-outline" onclick="toggleClientDetails()">
  <span data-i18n="btnHide">收起</span>
</button>
<button class="btn btn-primary btn-sm" onclick="addItem()">
  <svg>...</svg> <span data-i18n="btnAddCabin">添加舱房</span>
</button>
```

### 步骤 5: 为 title 属性添加 data-i18n-title

```html
<div class="group-btn" onclick="toggleClientDetails()" 
     data-i18n-title="tooltipEdit" title="编辑/新增">
<div class="group-btn" onclick="deleteClient()" 
     data-i18n-title="tooltipDelete" title="删除客户">
```

### 步骤 6: 为预览区域的表格添加 data-i18n

```html
<!-- 表格表头 -->
<th data-i18n="thCabinDesc">舱房说明 
  <span class="th-sub" data-i18n="thSubCabinDesc">Cabin Description</span>
</th>
<th class="num" data-i18n="thPax">人数/数量 
  <span class="th-sub" data-i18n="thSubPax">PAX</span>
</th>
<!-- 继续为其他表头添加... -->
```

### 步骤 7: 更新 renderItemInputs 函数

在 `main.js` 的 `renderItemInputs` 函数中，将硬编码的文本替换为 `t()` 函数：

```javascript
window.renderItemInputs = function() {
  const container = document.getElementById('items-container');
  container.innerHTML = '';
  window.items.forEach((item, index) => {
    // 使用 t() 函数获取翻译文本
    const div = document.createElement('div');
    div.innerHTML = `
      <input type="text" placeholder="${t('labelPassengerName')}" ...>
      <input type="text" placeholder="${t('labelLocator')}" ...>
      <label>${t('labelPax')}</label>
      <label>${t('labelGross')}</label>
      <!-- 等等... -->
    `;
    container.appendChild(div);
  });
}
```

### 步骤 8: 更新 updateState 函数中的动态内容

在 `updateState` 函数中，将"天"和"晚"也改为多语言：

```javascript
const days = diffDays + 1;
const nights = diffDays;
document.getElementById('pv-sailing-combined').textContent = 
  `${sStart} ~ ${sEnd} (${days}${t('days')} ${nights}${t('nights')})`;
```

## 🎯 测试步骤

1. 打开应用程序
2. 点击顶部工具栏的语言切换按钮（中文、ES、EN）
3. 确认所有文本都正确切换到对应语言
4. 测试所有功能是否正常工作

## 📌 注意事项

1. **保持一致性**：确保所有可见文本都使用 `data-i18n` 或 `t()` 函数
2. **动态内容**：对于 JavaScript 动态生成的内容，使用 `t()` 函数
3. **静态 HTML**：对于静态 HTML 元素，使用 `data-i18n` 属性
4. **Placeholder**：输入框的 placeholder 也需要添加 `data-i18n` 属性
5. **Title/Tooltip**：使用 `data-i18n-title` 属性

## 🔧 快速修复常见问题

如果切换语言后某些文本没有变化：
1. 检查该元素是否添加了 `data-i18n` 属性
2. 检查 `i18n.js` 中是否有对应的翻译 key
3. 确认 `updateUILanguage()` 函数被正确调用
4. 在浏览器控制台查看是否有错误信息
