# 🎨 预览区优化更新

## ✅ 更新内容

### 1. **编号为空时自动隐藏** 📝
- 当编号输入框为空时，预览区不显示编号行
- 输入编号后自动显示
- 视觉更简洁，避免空白信息

### 2. **报价模式标题优化** 💼
- 账单模式：显示"账单 BILL"
- 报价模式：显示"报价 QUOTATION"
- 根据当前模式自动切换

### 3. **公司名称多语言支持** 🌐
- 中文：**符号旅游**
- 西班牙语：**VIAJES FH**
- 英语：**FH GLOBAL**
- 切换语言时公司名称自动更新

---

## 📊 详细说明

### 1️⃣ 编号显示逻辑

#### 优化前
```
┌─────────────────────────────┐
│ 编号 Exp #:                  │  ← 空值也显示，不美观
│ 日期 Date: 06/12/2025       │
└─────────────────────────────┘
```

#### 优化后
```
当编号为空时：
┌─────────────────────────────┐
│ 日期 Date: 06/12/2025       │  ← 自动隐藏编号行
└─────────────────────────────┘

当输入编号后：
┌─────────────────────────────┐
│ 编号 Exp #: 25 0001         │  ← 自动显示
│ 日期 Date: 06/12/2025       │
└─────────────────────────────┘
```

---

### 2️⃣ 预览区标题切换

#### 账单模式
```
┌────────────────────────────────┐
│                  账单 BILL      │
│                                │
│ 编号 Exp #: 25 0001            │
│ 日期 Date: 06/12/2025          │
└────────────────────────────────┘
```

#### 报价模式
```
┌────────────────────────────────┐
│             报价 QUOTATION      │
│                                │
│ 编号 Exp #: 25 0001            │
│ 日期 Date: 06/12/2025          │
└────────────────────────────────┘
```

**多语言支持：**
- 中文：账单 BILL / 报价 QUOTATION
- 西语：FACTURA BILL / COTIZACIÓN QUOTATION
- 英语：BILL / QUOTATION

---

### 3️⃣ 公司名称多语言

#### 中文模式
```
┌────────────────────────────────┐
│ 符号旅游                        │
│ Paseo Quince De Mayo 3         │
│ 28019 Madrid                   │
└────────────────────────────────┘
```

#### 西班牙语模式
```
┌────────────────────────────────┐
│ VIAJES FH                      │
│ Paseo Quince De Mayo 3         │
│ 28019 Madrid                   │
└────────────────────────────────┘
```

#### 英语模式
```
┌────────────────────────────────┐
│ FH GLOBAL                      │
│ Paseo Quince De Mayo 3         │
│ 28019 Madrid                   │
└────────────────────────────────┘
```

---

## 💻 技术实现

### 1. 编号显示控制

**HTML 结构：**
```html
<div id="meta-invno" class="meta-group" style="display: none;">
  <div class="meta-label" data-i18n="labelInvNoMeta">编号 Exp #</div>
  <div class="meta-val" data-bind="invNo"></div>
</div>
```

**JavaScript 逻辑：**
```javascript
if(el.id === 'invNo') {
    const metaInvNo = document.getElementById('meta-invno');
    if(el.value && el.value.trim() !== '') {
        metaInvNo.style.display = '';  // 显示
        if(target) target.textContent = el.value;
    } else {
        metaInvNo.style.display = 'none';  // 隐藏
    }
}
```

---

### 2. 标题模式切换

**HTML 结构：**
```html
<div id="invoice-title" class="inv-title" data-i18n="invoiceTitle">
  账单 BILL
</div>
```

**JavaScript 逻辑：**
```javascript
const invoiceTitle = document.getElementById('invoice-title');
if (mode === 'quote') {
    invoiceTitle.setAttribute('data-i18n', 'invoiceTitleQuote');
    invoiceTitle.textContent = t('invoiceTitleQuote');
} else {
    invoiceTitle.setAttribute('data-i18n', 'invoiceTitle');
    invoiceTitle.textContent = t('invoiceTitle');
}
```

---

### 3. 公司名称多语言

**HTML 结构：**
```html
<span id="agency-name" data-i18n="agencyName">符号旅游</span>
```

**多语言配置：**
```javascript
// 中文
agencyName: "符号旅游"

// 西班牙语
agencyName: "VIAJES FH"

// 英语
agencyName: "FH GLOBAL"
```

---

## 🎯 使用场景

### 场景 1：草稿阶段（无编号）

```
1. 创建新账单
2. 暂不输入编号
3. 预览区自动隐藏编号行 ✅
4. 布局更简洁
```

### 场景 2：正式账单（有编号）

```
1. 输入编号 "25 0001"
2. 预览区自动显示编号 ✅
3. 可以正常打印
```

### 场景 3：给西语客户报价

```
1. 切换到西班牙语
2. 切换到报价模式
3. 预览区显示：
   - 公司名：VIAJES FH ✅
   - 标题：COTIZACIÓN QUOTATION ✅
```

### 场景 4：给英语客户报价

```
1. 切换到英语
2. 切换到报价模式
3. 预览区显示：
   - 公司名：FH GLOBAL ✅
   - 标题：QUOTATION ✅
```

---

## 📋 对比表

| 项目 | 优化前 | 优化后 |
|------|--------|--------|
| **编号为空** | 显示空白 ❌ | 自动隐藏 ✅ |
| **报价模式标题** | 固定"账单" ❌ | 显示"报价" ✅ |
| **公司名称** | 固定中文 ❌ | 多语言切换 ✅ |
| **视觉效果** | 一般 | 专业 ✅ |
| **国际化** | 不完整 | 完整 ✅ |

---

## 🌐 多语言对照表

### 预览区标题

| 模式 | 中文 | 西班牙语 | 英语 |
|------|------|----------|------|
| **账单模式** | 账单 BILL | FACTURA BILL | BILL |
| **报价模式** | 报价 QUOTATION | COTIZACIÓN QUOTATION | QUOTATION |

### 公司名称

| 语言 | 显示 |
|------|------|
| 中文 | 符号旅游 |
| 西班牙语 | VIAJES FH |
| 英语 | FH GLOBAL |

### 编号标签

| 语言 | 显示 |
|------|------|
| 中文 | 编号 Exp # |
| 西班牙语 | Nº Exp # |
| 英语 | Exp # |

### 日期标签

| 语言 | 显示 |
|------|------|
| 中文 | 日期 Date |
| 西班牙语 | Fecha Date |
| 英语 | Date |

---

## 🚀 立即体验

### 测试编号隐藏功能

1. **清空编号输入框**
2. **查看预览区** - 编号行自动隐藏
3. **输入编号 "25 0001"**
4. **查看预览区** - 编号行自动显示

### 测试报价模式标题

1. **切换到报价模式**
2. **查看预览区标题** - 显示"报价 QUOTATION"
3. **切换回账单模式**
4. **查看预览区标题** - 显示"账单 BILL"

### 测试公司名称多语言

1. **选择中文** - 显示"符号旅游"
2. **选择西班牙语** - 显示"VIAJES FH"
3. **选择英语** - 显示"FH GLOBAL"

---

## 📝 修改的文件

### 1. **HTML** (`index.html`)
- ✅ 公司名称添加 `id="agency-name"`
- ✅ 公司名称添加 `data-i18n="agencyName"`
- ✅ 标题添加 `id="invoice-title"`
- ✅ 标题添加 `data-i18n="invoiceTitle"`
- ✅ 编号行添加 `id="meta-invno"`
- ✅ 编号行默认隐藏 `style="display: none;"`

### 2. **JavaScript** (`js/main.js`)
- ✅ `switchMode()` 函数添加标题切换逻辑
- ✅ `updateState()` 函数添加编号显示控制逻辑

### 3. **多语言** (`js/i18n.js`)
- ✅ 添加 `agencyName` 翻译（中英西）
- ✅ 添加 `invoiceTitle` 翻译（账单）
- ✅ 添加 `invoiceTitleQuote` 翻译（报价）
- ✅ 添加 `labelInvNoMeta` 翻译
- ✅ 添加 `labelDateMeta` 翻译

---

## 🎁 额外收益

1. **提升专业度**
   - 不同模式显示不同标题
   - 符合业务场景

2. **国际化完善**
   - 公司名称多语言
   - 标签多语言
   - 适合国际客户

3. **用户体验优化**
   - 自动隐藏空信息
   - 视觉更简洁
   - 减少混乱

4. **打印友好**
   - 无多余空白
   - 标题准确
   - 公司名称正确

---

## 🎉 总结

通过这次优化，预览区现在拥有：

- ✅ **智能编号显示** - 空值自动隐藏
- ✅ **动态模式标题** - 账单/报价自动切换
- ✅ **多语言公司名** - 三语无缝切换
- ✅ **完整国际化** - 所有文本支持多语言

---

**版本：** 7.3.6  
**更新日期：** 2025-12-06  
**开发团队：** FH Global

**🎊 享受更专业的预览效果！**
