import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/components/auth/AuthProvider';
import { WorkspaceProvider } from '@/components/auth/WorkspaceProvider';
import { AppShell } from '@/components/layout/AppShell';

export const metadata: Metadata = {
  title: 'FH Global OMS',
  description: 'Order Management System',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body className="bg-gray-50">
        <AuthProvider>
          <WorkspaceProvider>
            <AppShell>
              {children}
            </AppShell>
          </WorkspaceProvider>
        </AuthProvider>
      </body>
    </html>
  );
}


