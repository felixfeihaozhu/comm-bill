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
      // 配置数据使用本地存储
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
