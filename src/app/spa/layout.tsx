
'use client';

import { usePathname } from 'next/navigation';
import { SuperAdminLayoutContent } from '@/components/superadmin/SuperAdminLayoutContent';

export default function SpaLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();

  // If it's the login page, don't wrap it with the main super admin layout
  if (pathname === '/spa/login') {
    return <>{children}</>;
  }

  // Otherwise, wrap with the sidebar and header
  return <SuperAdminLayoutContent>{children}</SuperAdminLayoutContent>;
}
