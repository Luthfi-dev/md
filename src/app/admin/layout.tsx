
'use client';

import { usePathname } from 'next/navigation';
import { AdminLayoutContent } from '@/components/admin/AdminLayoutContent';
import { SidebarProvider } from '@/components/ui/sidebar';

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();

  // If it's the login page, don't wrap it with the main admin layout
  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  // Otherwise, wrap with the sidebar and header
  return (
    <SidebarProvider>
      <AdminLayoutContent>{children}</AdminLayoutContent>
    </SidebarProvider>
  );
}
