/**
 * 票据模式 - 支付凭证
 * 功能：多产品类型支持、支付跟踪、票据风格预览
 */

(function() {
  'use strict';

  // 产品类型配置
  const PRODUCT_TYPES = [
    { id: 'cruise', nameZh: '邮轮', nameEs: 'Crucero', nameEn: 'Cruise' },
    { id: 'flight', nameZh: '机票', nameEs: 'Vuelo', nameEn: 'Flight' },
    { id: 'hotel', nameZh: '酒店', nameEs: 'Hotel', nameEn: 'Hotel' },
    { id: 'tour', nameZh: '旅游套餐', nameEs: 'Paquete', nameEn: 'Tour Package' },
    { id: 'insurance', nameZh: '保险', nameEs: 'Seguro', nameEn: 'Insurance' },
    { id: 'visa', nameZh: '签证', nameEs: 'Visado', nameEn: 'Visa' },
    { id: 'transfer', nameZh: '接送服务', nameEs: 'Transfer', nameEn: 'Transfer' },
    { id: 'activity', nameZh: '活动/门票', nameEs: 'Actividad', nameEn: 'Activity' },
    { id: 'other', nameZh: '其他', nameEs: 'Otro', nameEn: 'Other' }
  ];

  // 默认产品模板
  const defaultProduct = {
    type: 'cruise',
    supplier: '',
    description: '',
    dateStart: '',
    dateEnd: '',
    quantity: 1,
    unitPrice: 0,
    totalPrice: 0,
    confirmNo: '',
    notes: ''
  };

  // 票据产品数据
  let ticketProducts = [];

  const TicketMode = {
    name: 'ticket',
    data: null,

    async init() {
      console.log('✅ Ticket mode initialized with product types:', PRODUCT_TYPES.length);
    },

    activate() {
      console.log('🎫 Activating ticket mode');
      
      // 隐藏账单模式元素
      document.querySelectorAll('.bill-only').forEach(el => {
        el.style.display = 'none';
      });
      document.querySelectorAll('.quote-only').forEach(el => {
        el.style.display = 'none';
      });
      
      // 显示票据模式元素
      document.querySelectorAll('.ticket-only').forEach(el => {
        el.style.display = 'block';
      });
      
      // 显示票据模式输入区
      document.querySelectorAll('.ticket-inputs').forEach(el => {
        el.style.display = 'block';
      });
      
      // 隐藏原有的费用明细输入区和航次信息（票据模式使用自己的产品列表）
      const itemsSection = document.querySelector('.form-group:has(#items-container)');
      if (itemsSection) itemsSection.style.display = 'none';
      
      const cruiseSection = document.querySelector('.form-group:has(#ship)');
      if (cruiseSection) cruiseSection.style.display = 'none';
      
      // 显示票据预览区，隐藏其他预览区
      const ticketPreview = document.querySelector('.ticket-preview');
      if (ticketPreview) ticketPreview.style.display = 'block';
      
      // 隐藏标准表格和footer
      const invTable = document.querySelector('.inv-table');
      if (invTable) invTable.style.display = 'none';
      
      const invFooter = document.querySelector('.inv-footer');
      if (invFooter) invFooter.style.display = 'none';
      
      const boxContainer = document.querySelector('.box-container');
      if (boxContainer) boxContainer.style.display = 'none';
      
      // 初始化产品列表
      if (ticketProducts.length === 0) {
        ticketProducts = [{ ...defaultProduct }];
      }
      this.renderProductInputs();
      this.updatePreview();
    },

    deactivate() {
      console.log('🎫 Deactivating ticket mode');
      
      // 隐藏票据模式专属元素
      document.querySelectorAll('.ticket-only').forEach(el => {
        el.style.display = 'none';
      });
      
      document.querySelectorAll('.ticket-inputs').forEach(el => {
        el.style.display = 'none';
      });
      
      // 隐藏票据预览区
      const ticketPreview = document.querySelector('.ticket-preview');
      if (ticketPreview) ticketPreview.style.display = 'none';
      
      // 恢复标准元素
      const invTable = document.querySelector('.inv-table');
      if (invTable) invTable.style.display = '';
      
      const invFooter = document.querySelector('.inv-footer');
      if (invFooter) invFooter.style.display = '';
      
      const boxContainer = document.querySelector('.box-container');
      if (boxContainer) boxContainer.style.display = '';
      
      // 恢复原有输入区
      const itemsSection = document.querySelector('.form-group:has(#items-container)');
      if (itemsSection) itemsSection.style.display = '';
      
      const cruiseSection = document.querySelector('.form-group:has(#ship)');
      if (cruiseSection) cruiseSection.style.display = '';
    },

    // 获取产品类型配置
    getProductTypes() {
      return PRODUCT_TYPES;
    },

    // 获取产品类型名称（根据当前语言）
    getProductTypeName(typeId) {
      const type = PRODUCT_TYPES.find(t => t.id === typeId);
      if (!type) return typeId;
      
      const lang = window.getCurrentLanguage ? window.getCurrentLanguage() : 'zh';
      if (lang === 'es') return type.nameEs;
      if (lang === 'en') return type.nameEn;
      return type.nameZh;
    },


    // 渲染产品输入表单
    renderProductInputs() {
      const container = document.getElementById('ticket-products-container');
      if (!container) return;
      
      container.innerHTML = '';
      
      ticketProducts.forEach((product, index) => {
        const typeOptions = PRODUCT_TYPES.map(t => 
          `<option value="${t.id}" ${product.type === t.id ? 'selected' : ''}>${this.getProductTypeName(t.id)}</option>`
        ).join('');
        
        const div = document.createElement('div');
        div.className = 'ticket-product-card';
        div.innerHTML = `
          <div class="ticket-product-header">
            <div class="product-type-select">
              <select onchange="updateTicketProduct(${index}, 'type', this.value)">
                ${typeOptions}
              </select>
            </div>
            <div class="product-actions">
              <button class="btn btn-icon" onclick="copyTicketProduct(${index})" title="复制">
                <svg viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
              </button>
              <button class="btn btn-icon" style="color:#dc2626" onclick="deleteTicketProduct(${index})" title="删除">
                <svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>
          </div>
          
          <div class="ticket-product-body">
            <div class="product-row">
              <div class="product-field flex-2">
                <label data-i18n="labelSupplier">供应商</label>
                <div class="input-box">
                  <input type="text" value="${product.supplier || ''}" placeholder="供应商名称" 
                         oninput="updateTicketProduct(${index}, 'supplier', this.value); checkClear(this)">
                  <span class="clear-x" onclick="clearField(this)"><svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></span>
                </div>
              </div>
              <div class="product-field flex-1">
                <label data-i18n="labelConfirmNo">确认号</label>
                <div class="input-box">
                  <input type="text" value="${product.confirmNo || ''}" placeholder="订单号"
                         oninput="updateTicketProduct(${index}, 'confirmNo', this.value); checkClear(this)">
                  <span class="clear-x" onclick="clearField(this)"><svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></span>
                </div>
              </div>
            </div>
            
            <div class="product-row">
              <div class="product-field flex-1">
                <label data-i18n="labelDescription">产品描述</label>
                <div class="input-box">
                  <input type="text" value="${product.description || ''}" placeholder="产品名称或描述"
                         oninput="updateTicketProduct(${index}, 'description', this.value); checkClear(this)">
                  <span class="clear-x" onclick="clearField(this)"><svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></span>
                </div>
              </div>
            </div>
            
            <div class="product-row">
              <div class="product-field">
                <label data-i18n="labelDateStart">开始日期</label>
                <div class="merged-group">
                  <div class="input-box">
                    <input type="text" id="ticketDateStart${index}" value="${product.dateStart || ''}" placeholder="DD/MM/YYYY"
                           onblur="smartDateInput(this); updateTicketProduct(${index}, 'dateStart', this.value)" oninput="checkClear(this)">
                    <span class="clear-x" onclick="clearField(this)"><svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></span>
                  </div>
                  <div class="merged-trigger" onclick="openPicker('pickerTicketStart${index}')">
                    <svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                    <input type="date" id="pickerTicketStart${index}" class="hidden-date-overlay" onchange="pickTicketDate(this, ${index}, 'dateStart')">
                  </div>
                </div>
              </div>
              <div class="product-field">
                <label data-i18n="labelDateEnd">结束日期</label>
                <div class="merged-group">
                  <div class="input-box">
                    <input type="text" id="ticketDateEnd${index}" value="${product.dateEnd || ''}" placeholder="DD/MM/YYYY"
                           onblur="smartDateInput(this); updateTicketProduct(${index}, 'dateEnd', this.value)" oninput="checkClear(this)">
                    <span class="clear-x" onclick="clearField(this)"><svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></span>
                  </div>
                  <div class="merged-trigger" onclick="openPicker('pickerTicketEnd${index}')">
                    <svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                    <input type="date" id="pickerTicketEnd${index}" class="hidden-date-overlay" onchange="pickTicketDate(this, ${index}, 'dateEnd')">
                  </div>
                </div>
              </div>
            </div>
            
            <div class="product-row product-price-row">
              <div class="product-field">
                <label data-i18n="labelQuantity">数量</label>
                <div class="input-box">
                  <input type="number" value="${product.quantity || 1}" min="1"
                         oninput="updateTicketProduct(${index}, 'quantity', this.value); recalcProductTotal(${index})">
                </div>
              </div>
              <div class="product-field">
                <label data-i18n="labelUnitPrice">单价 (EUR)</label>
                <div class="input-box">
                  <input type="number" value="${product.unitPrice || 0}" step="0.01" min="0"
                         oninput="updateTicketProduct(${index}, 'unitPrice', this.value); recalcProductTotal(${index})">
                </div>
              </div>
              <div class="product-field">
                <label data-i18n="labelTotalPrice">总价 (EUR)</label>
                <div class="input-box">
                  <input type="number" id="productTotal${index}" value="${product.totalPrice || 0}" step="0.01" min="0"
                         oninput="updateTicketProduct(${index}, 'totalPrice', this.value)">
                </div>
              </div>
            </div>
            
            <div class="product-row">
              <div class="product-field flex-1">
                <label data-i18n="labelNotes">备注</label>
                <div class="input-box">
                  <input type="text" value="${product.notes || ''}" placeholder="其他信息"
                         oninput="updateTicketProduct(${index}, 'notes', this.value); checkClear(this)">
                  <span class="clear-x" onclick="clearField(this)"><svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></span>
                </div>
              </div>
            </div>
          </div>
        `;
        container.appendChild(div);
        
        // 更新 has-val 状态
        div.querySelectorAll('.input-box input').forEach(inp => {
          if (window.checkClear) window.checkClear(inp);
        });
      });
    },

    // 更新预览区
    updatePreview() {
      // 更新客户名称
      const clientName = document.getElementById('billTradeName')?.value || '';
      const ticketClient = document.getElementById('ticket-preview-client');
      if (ticketClient) ticketClient.textContent = clientName || '-';
      
      // 更新产品列表
      const productsContainer = document.getElementById('ticket-preview-products');
      if (productsContainer) {
        productsContainer.innerHTML = '';
        
        if (ticketProducts.length === 0 || (ticketProducts.length === 1 && !ticketProducts[0].description)) {
          productsContainer.innerHTML = '<div class="ticket-no-products">暂无产品</div>';
        } else {
          ticketProducts.forEach(product => {
            if (!product.description && !product.supplier) return;
            
            const typeName = this.getProductTypeName(product.type);
            
            // 格式化日期显示
            let dateDisplay = '';
            if (product.dateStart) {
              dateDisplay = product.dateStart;
              if (product.dateEnd && product.dateEnd !== product.dateStart) {
                dateDisplay += ` - ${product.dateEnd}`;
              }
            }
            
            const productEl = document.createElement('div');
            productEl.className = 'ticket-product-item';
            productEl.innerHTML = `
              <div class="product-details">
                <div class="product-main-info">
                  <span class="product-type-tag">${typeName}</span>
                  <span class="product-desc">${product.description || product.supplier || '-'}</span>
                </div>
                ${product.supplier && product.description ? `<div class="product-supplier">${product.supplier}</div>` : ''}
                ${dateDisplay ? `<div class="product-dates">${dateDisplay}</div>` : ''}
                ${product.confirmNo ? `<div class="product-confirm">${product.confirmNo}</div>` : ''}
                ${product.notes ? `<div class="product-notes">${product.notes}</div>` : ''}
              </div>
              <div class="product-price">
                ${product.quantity > 1 ? `<div class="price-qty">${product.quantity} x ${this.formatMoney(product.unitPrice)}</div>` : ''}
                <div class="price-total">${this.formatMoney(product.totalPrice || (product.quantity * product.unitPrice))}</div>
              </div>
            `;
            productsContainer.appendChild(productEl);
          });
        }
      }
      
      // 计算总金额
      const totalAmount = ticketProducts.reduce((sum, p) => sum + (Number(p.totalPrice) || (Number(p.quantity) * Number(p.unitPrice)) || 0), 0);
      const paidAmount = Number(document.getElementById('ticketPaidAmount')?.value) || 0;
      const pendingAmount = totalAmount - paidAmount;
      
      // 更新汇总区
      const ticketTotal = document.getElementById('ticket-preview-total');
      const ticketPaid = document.getElementById('ticket-preview-paid');
      const ticketPending = document.getElementById('ticket-preview-pending');
      
      if (ticketTotal) ticketTotal.textContent = this.formatMoney(totalAmount) + ' EUR';
      if (ticketPaid) ticketPaid.textContent = this.formatMoney(paidAmount) + ' EUR';
      if (ticketPending) ticketPending.textContent = this.formatMoney(pendingAmount) + ' EUR';
      
      // 更新支付状态徽章
      const statusBadge = document.getElementById('ticket-status-badge');
      const statusText = document.getElementById('ticket-status-text');
      if (statusBadge && statusText) {
        if (pendingAmount <= 0 && totalAmount > 0) {
          statusBadge.className = 'ticket-status-badge paid';
          statusText.textContent = '已支付';
          statusText.setAttribute('data-i18n', 'statusPaid');
        } else if (paidAmount > 0) {
          statusBadge.className = 'ticket-status-badge partial';
          statusText.textContent = '部分支付';
          statusText.setAttribute('data-i18n', 'statusPartial');
        } else {
          statusBadge.className = 'ticket-status-badge pending';
          statusText.textContent = '待支付';
          statusText.setAttribute('data-i18n', 'statusPending');
        }
      }
      
      // 更新支付详情
      const paymentDate = document.getElementById('ticketPaymentDate')?.value || '';
      const paymentMethod = document.getElementById('ticketPaymentMethod')?.value || '';
      const paymentNote = document.getElementById('ticketPaymentNote')?.value || '';
      
      const previewPaymentDate = document.getElementById('ticket-preview-payment-date');
      const previewPaymentMethod = document.getElementById('ticket-preview-payment-method');
      const previewPaymentNote = document.getElementById('ticket-preview-payment-note');
      const paymentNoteRow = document.getElementById('ticket-payment-note-row');
      
      if (previewPaymentDate) previewPaymentDate.textContent = paymentDate || '-';
      if (previewPaymentMethod) previewPaymentMethod.textContent = paymentMethod || '-';
      if (previewPaymentNote) previewPaymentNote.textContent = paymentNote || '-';
      if (paymentNoteRow) paymentNoteRow.style.display = paymentNote ? 'flex' : 'none';
      
      // 同时更新原有的票据总价显示（兼容性）
      const displayTicketPaid = document.getElementById('display-ticket-paid');
      const displayTicketPending = document.getElementById('display-ticket-pending');
      if (displayTicketPaid) displayTicketPaid.textContent = this.formatMoney(paidAmount);
      if (displayTicketPending) displayTicketPending.textContent = this.formatMoney(pendingAmount);
    },

    // 格式化金额（使用全局函数保持一致性）
    formatMoney(amount) {
      if (window.formatMoney) {
        return window.formatMoney(amount);
      }
      return Number(amount || 0).toFixed(2);
    },

    // 获取产品数据
    getProducts() {
      return ticketProducts;
    },

    // 设置产品数据（从Firebase加载时使用）
    setProducts(products) {
      ticketProducts = products || [{ ...defaultProduct }];
      if (ticketProducts.length === 0) {
        ticketProducts = [{ ...defaultProduct }];
      }
      this.renderProductInputs();
      this.updatePreview();
    },

    // 添加产品
    addProduct() {
      ticketProducts.push({ ...defaultProduct });
      this.renderProductInputs();
      this.updatePreview();
      this.saveDraft();
    },

    // 删除产品
    deleteProduct(index) {
      if (ticketProducts.length <= 1) {
        ticketProducts = [{ ...defaultProduct }];
      } else {
        ticketProducts.splice(index, 1);
      }
      this.renderProductInputs();
      this.updatePreview();
      this.saveDraft();
    },

    // 复制产品
    copyProduct(index) {
      const copy = JSON.parse(JSON.stringify(ticketProducts[index]));
      ticketProducts.splice(index + 1, 0, copy);
      this.renderProductInputs();
      this.updatePreview();
      this.saveDraft();
    },

    // 更新产品字段
    updateProduct(index, field, value) {
      if (ticketProducts[index]) {
        ticketProducts[index][field] = value;
        this.updatePreview();
        this.saveDraft();
      }
    },

    // 重新计算产品总价
    recalcTotal(index) {
      if (ticketProducts[index]) {
        const qty = Number(ticketProducts[index].quantity) || 1;
        const unit = Number(ticketProducts[index].unitPrice) || 0;
        ticketProducts[index].totalPrice = qty * unit;
        
        const totalInput = document.getElementById(`productTotal${index}`);
        if (totalInput) totalInput.value = ticketProducts[index].totalPrice.toFixed(2);
        
        this.updatePreview();
        this.saveDraft();
      }
    },

    // 保存草稿
    saveDraft() {
      // 通过触发 updateState 来保存（会调用 main.js 中的 saveDraftDebounced）
      if (window.updateState) {
        window.updateState();
      }
    },

    // 获取票据模式的表单数据
    getFormData() {
      return {
        ticketProducts: ticketProducts,
        ticketPaidAmount: document.getElementById('ticketPaidAmount')?.value || 0,
        ticketPaymentDate: document.getElementById('ticketPaymentDate')?.value || '',
        ticketPaymentMethod: document.getElementById('ticketPaymentMethod')?.value || '',
        ticketPaymentNote: document.getElementById('ticketPaymentNote')?.value || ''
      };
    },

    // 从草稿加载数据
    loadFromDraft(data) {
      if (data.ticketProducts) {
        ticketProducts = data.ticketProducts;
        this.renderProductInputs();
      }
      
      if (data.ticketPaidAmount !== undefined) {
        const el = document.getElementById('ticketPaidAmount');
        if (el) el.value = data.ticketPaidAmount;
      }
      if (data.ticketPaymentDate) {
        const el = document.getElementById('ticketPaymentDate');
        if (el) el.value = data.ticketPaymentDate;
      }
      if (data.ticketPaymentMethod) {
        const el = document.getElementById('ticketPaymentMethod');
        if (el) el.value = data.ticketPaymentMethod;
      }
      if (data.ticketPaymentNote) {
        const el = document.getElementById('ticketPaymentNote');
        if (el) el.value = data.ticketPaymentNote;
      }
      
      this.updatePreview();
    },

    // 重置表单
    reset() {
      ticketProducts = [{ ...defaultProduct }];
      
      const ticketPaidAmount = document.getElementById('ticketPaidAmount');
      if (ticketPaidAmount) ticketPaidAmount.value = '';
      
      const ticketPaymentDate = document.getElementById('ticketPaymentDate');
      if (ticketPaymentDate) ticketPaymentDate.value = '';
      
      const ticketPaymentMethod = document.getElementById('ticketPaymentMethod');
      if (ticketPaymentMethod) ticketPaymentMethod.value = '';
      
      const ticketPaymentNote = document.getElementById('ticketPaymentNote');
      if (ticketPaymentNote) ticketPaymentNote.value = '';
      
      this.renderProductInputs();
      this.updatePreview();
    }
  };

  // 暴露到全局
  window.TicketMode = TicketMode;
  
  // 暴露产品操作函数到全局
  window.addTicketProduct = function() { TicketMode.addProduct(); };
  window.deleteTicketProduct = function(index) { 
    if (confirm('确定删除此产品？')) {
      TicketMode.deleteProduct(index); 
    }
  };
  window.copyTicketProduct = function(index) { TicketMode.copyProduct(index); };
  window.updateTicketProduct = function(index, field, value) { TicketMode.updateProduct(index, field, value); };
  window.recalcProductTotal = function(index) { TicketMode.recalcTotal(index); };
  window.updateTicketTotals = function() { TicketMode.updatePreview(); TicketMode.saveDraft(); };
  
  // 票据模式日期选择器
  window.pickTicketDate = function(picker, index, field) {
    const val = picker.value;
    if (val) {
      const [y, m, d] = val.split('-');
      const formatted = `${d}/${m}/${y}`;
      const textInput = document.getElementById(`ticketDate${field.charAt(0).toUpperCase() + field.slice(1)}${index}`);
      if (textInput) {
        textInput.value = formatted;
        if (window.checkClear) window.checkClear(textInput);
      }
      TicketMode.updateProduct(index, field, formatted);
    }
  };

  console.log('✅ Ticket mode module loaded');
})();
