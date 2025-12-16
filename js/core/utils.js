/**
 * 通用工具函数
 */

// 格式化金额
window.formatMoney = function(amount) {
  return new Intl.NumberFormat('en-US', { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  }).format(amount || 0);
}

// 检查并显示清除按钮
window.checkClear = function(input) {
  const box = input.closest('.input-box');
  if (!box) return;
  if (input.value.trim()) {
    box.classList.add('has-val');
  } else {
    box.classList.remove('has-val');
  }
  if (window.updateState) window.updateState();
}

// 清除单个字段
window.clearField = function(btn) {
  const box = btn.closest('.input-box');
  if (!box) return;
  const input = box.querySelector('input, textarea');
  if (input) {
    input.value = '';
    box.classList.remove('has-val');
    if (window.updateState) window.updateState();
  }
}

// 同步状态到Firebase
window.syncState = function(path, data) {
  if (!window.db || !window.ref || !window.set) return;
  try {
    window.set(window.ref(window.db, path), data);
  } catch (err) {
    console.error('Sync error:', err);
  }
}

// 加载JSON数据
window.loadJSON = async function(path) {
  try {
    const response = await fetch(path);
    return await response.json();
  } catch (err) {
    console.error('Load JSON error:', err);
    return null;
  }
}

// 日期格式化
window.formatDate = function(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

// 多行文本格式化
window.formatMultiline = function(text) {
  if (!text) return '';
  return text.replace(/\n/g, '<br>');
}

console.log('✅ Utils loaded');
