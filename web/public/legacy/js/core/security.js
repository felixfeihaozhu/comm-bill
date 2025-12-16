/**
 * 安全模块 - 仅在登录页面禁用开发者工具
 */

(function() {
  'use strict';
  
  // 检查是否在登录页面（未登录状态）
  function isLoginScreen() {
    const loginScreen = document.getElementById('login-screen');
    return loginScreen && loginScreen.style.display !== 'none';
  }
  
  // 禁用右键菜单（仅登录页面）
  document.addEventListener('contextmenu', function(e) {
    if (isLoginScreen()) {
      e.preventDefault();
      return false;
    }
  });
  
  // 禁用常用快捷键（仅登录页面）
  document.addEventListener('keydown', function(e) {
    if (!isLoginScreen()) return;
    
    // F12
    if (e.keyCode === 123) {
      e.preventDefault();
      return false;
    }
    // Ctrl+Shift+I (开发者工具)
    if (e.ctrlKey && e.shiftKey && e.keyCode === 73) {
      e.preventDefault();
      return false;
    }
    // Ctrl+Shift+J (控制台)
    if (e.ctrlKey && e.shiftKey && e.keyCode === 74) {
      e.preventDefault();
      return false;
    }
    // Ctrl+Shift+C (元素检查)
    if (e.ctrlKey && e.shiftKey && e.keyCode === 67) {
      e.preventDefault();
      return false;
    }
    // Ctrl+U (查看源代码)
    if (e.ctrlKey && e.keyCode === 85) {
      e.preventDefault();
      return false;
    }
    // Cmd+Option+I (Mac 开发者工具)
    if (e.metaKey && e.altKey && e.keyCode === 73) {
      e.preventDefault();
      return false;
    }
    // Cmd+Option+J (Mac 控制台)
    if (e.metaKey && e.altKey && e.keyCode === 74) {
      e.preventDefault();
      return false;
    }
    // Cmd+Option+U (Mac 查看源代码)
    if (e.metaKey && e.altKey && e.keyCode === 85) {
      e.preventDefault();
      return false;
    }
  });
  
})();
