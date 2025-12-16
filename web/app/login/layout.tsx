// 登录页面使用独立布局，不显示侧边栏和顶部栏
export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}


