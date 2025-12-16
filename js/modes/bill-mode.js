/**
 * 账单模式 - B2B内部账单
 * 功能：完整账单信息、佣金计算、净价结算
 */

(function() {
  'use strict';

  const BillMode = {
    name: 'bill',
    data: null,

    async init() {
      // 配置数据已迁移至 Firebase，无需加载本地 JSON
      console.log('✅ Bill mode initialized');
    },

    activate() {
      document.querySelectorAll('.bill-only').forEach(el => {
        el.style.display = 'table-cell';
      });
      document.getElementById('invoice-title')?.setAttribute('data-i18n', 'invoiceTitle');
      if (window.t) {
        document.getElementById('invoice-title').textContent = window.t('invoiceTitle');
      }
    },

    deactivate() {
      // Bill mode是默认模式，无需特殊停用逻辑
    }
  };

  window.BillMode = BillMode;
  console.log('✅ Bill mode module loaded');
})();
