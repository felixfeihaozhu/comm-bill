import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '编辑器 - FH Global OMS',
};

export default function EditorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Editor 页面使用独立布局，不继承主布局的 sidebar 和 header
  // 因为父 layout 中的 Sidebar 和 Header 组件会检测 pathname 并返回 null
  return <>{children}</>;
}


