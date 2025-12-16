# 对比模式同行返佣功能实现

## 📋 功能需求

在对比模式中，将实际售价和同行返佣集成在同一个输入区，包含三个并排的输入框：

1. **实际售价 (EUR)** - 卖给客户的总价
2. **同行返佣 %** - 按比例计算的返佣
3. **返佣金额 (EUR)** - 固定金额的返佣

### 计算逻辑

**有同行返佣时**：
```
实际售价 - 税费 - 服务费 = 同行船票价
按比例返佣 = 同行船票价 × 比例%
总返佣 = 按比例返佣 + 固定金额返佣
利润 = 同行船票价 - 总返佣 - 成本价
```

**无同行返佣时**（原有逻辑）：
```
利润 = 实际售价 - 成本价
```

### 关键特点

- **比例和金额可以相加** - 同时输入两者，系统会自动相加，给同行返更多
- **三个框同一行** - 界面紧凑，便于快速输入
- **自动计算** - 输入任何值后自动触发利润重新计算

## ✅ 实现内容

### 1. HTML结构 (index.html)

添加了同行返佣输入区：

```html
<!-- 同行返佣输入区 -->
<div class="peer-commission-box">
  <div class="peer-commission-header">同行返佣 Peer Commission</div>
  <div class="peer-commission-content">
    <div class="peer-commission-row">
      <div class="peer-commission-col">
        <label>按比例 % (Percentage)</label>
        <div class="input-box">
          <input type="number" id="peerCommissionRate" 
                 placeholder="0" min="0" max="100" step="0.1" 
                 oninput="checkClear(this); handlePeerCommissionInput('rate')">
        </div>
      </div>
      <div class="peer-commission-col">
        <label>固定金额 (EUR) (Fixed Amount)</label>
        <div class="input-box">
          <input type="number" id="peerCommissionAmount" 
                 placeholder="0" min="0" step="0.01" 
                 oninput="checkClear(this); handlePeerCommissionInput('amount')">
        </div>
      </div>
    </div>
  </div>
</div>
```

**位置**：在"实际售价 Actual Selling Price"输入区下方

### 2. CSS样式 (compare-mode.css)

添加了柔和的米黄色样式：

```css
/* 同行返佣输入区 */
.compare-mode .peer-commission-box {
  background: #fef3c7;
  border: 2px solid #fde68a;
  border-radius: 6px;
  padding: 16px;
  margin-top: 16px;
}

.compare-mode .peer-commission-header {
  font-weight: 700;
  font-size: 13px;
  color: #92400e;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #fde68a;
}

.compare-mode .peer-commission-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}
```

**设计特点**：
- 米黄色背景（`#fef3c7`），与实际售价的淡蓝色区分
- 两列布局，左右并排显示比例和固定金额
- 与现有输入区风格一致

### 3. JavaScript逻辑 (compare-mode.js)

#### 更新利润计算函数

```javascript
updateProfitComparison(westData, germanData) {
  const fm = window.formatMoney;
  const actualPrice = Number(document.getElementById('compareActualPrice')?.value) || 0;
  
  // 获取同行返佣
  const peerCommRate = Number(document.getElementById('peerCommissionRate')?.value) || 0;
  const peerCommAmount = Number(document.getElementById('peerCommissionAmount')?.value) || 0;
  
  let westProfit, germanProfit;
  
  // 如果有同行返佣，使用新的计算方式
  if (peerCommRate > 0 || peerCommAmount > 0) {
    // 实际售价 - 税 - 服务费 = 同行船票价
    const peerBasePrice = actualPrice - westData.tax - westData.hsc;
    
    // 计算返佣金额
    let peerCommissionWest, peerCommissionGerman;
    if (peerCommRate > 0) {
      // 按比例计算
      peerCommissionWest = peerBasePrice * (peerCommRate / 100);
      peerCommissionGerman = peerBasePrice * (peerCommRate / 100);
    } else {
      // 固定金额
      peerCommissionWest = peerCommAmount;
      peerCommissionGerman = peerCommAmount;
    }
    
    // 同行船票价 - 返佣 - 成本价 = 利润
    westProfit = peerBasePrice - peerCommissionWest - westData.final;
    germanProfit = peerBasePrice - peerCommissionGerman - germanData.final;
  } else {
    // 原有计算方式：实际售价 - 成本价
    westProfit = actualPrice - westData.final;
    germanProfit = actualPrice - germanData.final;
  }
  
  // 更新显示...
}
```

### 4. 输入互斥逻辑 (main.js)

添加了互斥处理函数，确保只能使用一种返佣方式：

```javascript
// 同行返佣输入处理（互斥）
window.handlePeerCommissionInput = function(type) {
    if (type === 'rate') {
        // 当输入比例时，清空固定金额
        const rateInput = document.getElementById('peerCommissionRate');
        const amountInput = document.getElementById('peerCommissionAmount');
        if (rateInput && rateInput.value && parseFloat(rateInput.value) > 0) {
            if (amountInput) amountInput.value = '';
        }
    } else if (type === 'amount') {
        // 当输入固定金额时，清空比例
        const rateInput = document.getElementById('peerCommissionRate');
        const amountInput = document.getElementById('peerCommissionAmount');
        if (amountInput && amountInput.value && parseFloat(amountInput.value) > 0) {
            if (rateInput) rateInput.value = '';
        }
    }
    // 触发重新计算
    if (window.updateState) {
        window.updateState();
    }
};
```

## 🎯 使用流程

### 场景1：按比例返佣

1. 用户输入**实际售价**：1000 EUR
2. 用户输入**按比例**：10%
3. 系统自动清空"固定金额"
4. 计算过程：
   - 同行船票价 = 1000 - 50 (税) - 30 (服务费) = 920 EUR
   - 返佣 = 920 × 10% = 92 EUR
   - 利润 = 920 - 92 - 成本价

### 场景2：固定金额返佣

1. 用户输入**实际售价**：1000 EUR
2. 用户输入**固定金额**：100 EUR
3. 系统自动清空"按比例"
4. 计算过程：
   - 同行船票价 = 1000 - 50 (税) - 30 (服务费) = 920 EUR
   - 返佣 = 100 EUR（固定）
   - 利润 = 920 - 100 - 成本价

### 场景3：无同行返佣（原有逻辑）

1. 用户输入**实际售价**：1000 EUR
2. 不输入返佣（或输入0）
3. 计算过程：
   - 利润 = 1000 - 成本价

## 📊 计算公式对比

| 模式 | 计算公式 |
|------|----------|
| **有同行返佣（按比例）** | `(实际售价 - 税 - 服务费) × (1 - 比例%) - 成本价` |
| **有同行返佣（固定金额）** | `(实际售价 - 税 - 服务费) - 固定返佣 - 成本价` |
| **无同行返佣** | `实际售价 - 成本价` |

## 🎨 UI设计

### 颜色方案

- **实际售价区域**：淡蓝色（`#f0f9ff`），表示主要输入
- **同行返佣区域**：米黄色（`#fef3c7`），表示辅助输入

### 布局特点

- 两列布局，方便左右对比
- 输入框带清除按钮（×）
- 标签双语显示（中英文）
- 响应式设计，自适应宽度

## ✅ 测试要点

1. **互斥测试**
   - 输入比例后，固定金额应自动清空
   - 输入固定金额后，比例应自动清空

2. **计算测试**
   - 比例返佣计算正确
   - 固定金额返佣计算正确
   - 无返佣时使用原有逻辑

3. **边界测试**
   - 比例为0或空时，应使用原有逻辑
   - 固定金额为0或空时，应使用原有逻辑
   - 实际售价为0时，利润应为负值

4. **UI测试**
   - 清除按钮功能正常
   - 输入框样式正确
   - 双语标签显示正确

## 📝 注意事项

1. **税费和服务费统一**：目前使用西区的税和服务费计算同行船票价（假设西区和德区税费相同）
2. **返佣互斥**：同一时间只能使用一种返佣方式
3. **自动触发**：输入返佣后自动触发利润重新计算
4. **向后兼容**：不输入返佣时，保持原有计算逻辑不变

## 🔜 未来优化

- [ ] 在利润对比预览区显示返佣金额明细
- [ ] 支持西区和德区使用不同的返佣比例/金额
- [ ] 添加返佣计算说明提示
- [ ] 支持保存常用返佣比例

---

**实现完成时间**：2024年12月7日  
**功能状态**：✅ 已完成  
**测试状态**：⏳ 待测试
