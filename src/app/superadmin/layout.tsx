
'use client';

import { SidebarProvider, Sidebar, SidebarTrigger, SidebarContent, SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarInset, useSidebar } from '@/components/ui/sidebar';
import { LayoutDashboard, Settings, LogOut, KeyRound, Mail } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

function SuperAdminLayoutContent({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const { setOpenMobile } = useSidebar();

  const handleLinkClick = () => {
    setOpenMobile(false);
  };
  
  return (
    <>
      <Sidebar>
        <SidebarHeader>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-destructive text-destructive-foreground flex items-center justify-center font-bold">
              SA
            </div>
            <p className="font-semibold text-lg">Super Admin</p>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={pathname === '/superadmin'}>
                <Link href="/superadmin" onClick={handleLinkClick}>
                  <LayoutDashboard />
                  Dashboard
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={pathname.startsWith('/superadmin/settings')}>
                <Link href="/superadmin/settings" onClick={handleLinkClick}>
                  <Settings />
                  Kelola API & SMTP
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
             <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <Link href="/" onClick={handleLinkClick}>
                  <LogOut />
                  Exit Super Admin
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarContent>
      </Sidebar>
      <SidebarInset>
        <header className="flex items-center justify-between p-4 border-b bg-card md:bg-transparent">
           <SidebarTrigger className="md:hidden" />
           <h1 className="text-xl font-semibold">Super Admin Dashboard</h1>
        </header>
        <main className="p-4 bg-secondary/40 flex-1">
          {children}
        </main>
      </SidebarInset>
    </>
  )
}


export default function SuperAdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <SidebarProvider>
      <SuperAdminLayoutContent>{children}</SuperAdminLayoutContent>
    </SidebarProvider>
  );
}
