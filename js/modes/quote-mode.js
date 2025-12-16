/**
 * 报价模式 - B2C客户报价
 * 功能：隐藏敏感信息、客户友好展示
 */

(function() {
  'use strict';

  const QuoteMode = {
    name: 'quote',
    data: null,

    async init() {
      // 配置数据已迁移至 Firebase，无需加载本地 JSON
      console.log('✅ Quote mode initialized');
    },

    activate() {
      document.querySelectorAll('.bill-only').forEach(el => {
        el.style.display = 'none';
      });
      document.querySelectorAll('.quote-only').forEach(el => {
        el.style.display = 'block';
      });
    },

    deactivate() {
      document.querySelectorAll('.quote-only').forEach(el => {
        el.style.display = 'none';
      });
    }
  };

  window.QuoteMode = QuoteMode;
  console.log('✅ Quote mode module loaded');
})();
