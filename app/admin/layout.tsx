
'use client';

import { SidebarProvider, Sidebar, SidebarTrigger, SidebarContent, SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarInset, useSidebar, SidebarGroup, SidebarGroupLabel, SidebarGroupContent } from '@/components/ui/sidebar';
import { LayoutDashboard, Settings, Bot, LogOut, AppWindow, ChevronsLeftRight, Gem, FolderGit2 } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

function AdminLayoutContent({
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
            <div className="w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-bold">
              A
            </div>
            <p className="font-semibold text-lg">Admin Panel</p>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={pathname === '/admin'}>
                <Link href="/admin" onClick={handleLinkClick}>
                  <LayoutDashboard />
                  Dashboard
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={pathname.startsWith('/admin/apps')}>
                <Link href="/admin/apps" onClick={handleLinkClick}>
                  <AppWindow />
                  Kelola Aplikasi
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
             <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={pathname.startsWith('/admin/assistant')}>
                <Link href="/admin/assistant" onClick={handleLinkClick}>
                  <Bot />
                  Asisten AI
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>

             <SidebarGroup>
                <SidebarGroupLabel className='flex items-center gap-2'><FolderGit2 /> Manajemen</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    <SidebarMenuItem>
                      <SidebarMenuButton asChild isActive={pathname.startsWith('/admin/manager/referral')}>
                        <Link href="/admin/manager/referral" onClick={handleLinkClick}>
                          Referral
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  </SidebarMenu>
                </SidebarGroupContent>
             </SidebarGroup>

            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={pathname.startsWith('/admin/pricing')}>
                <Link href="/admin/pricing" onClick={handleLinkClick}>
                  <Gem />
                  Kelola Harga
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
             <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={pathname.startsWith('/admin/pagination')}>
                <Link href="/admin/pagination" onClick={handleLinkClick}>
                  <ChevronsLeftRight />
                  Paginasi
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={pathname.startsWith('/admin/seo')}>
                <Link href="/admin/seo" onClick={handleLinkClick}>
                  <Settings />
                  Pengaturan SEO
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
             <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <Link href="/" onClick={handleLinkClick}>
                  <LogOut />
                  Exit Admin
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarContent>
      </Sidebar>
      <SidebarInset>
        <header className="flex items-center justify-between p-4 border-b bg-card md:bg-transparent">
           <SidebarTrigger className="md:hidden" />
           <h1 className="text-xl font-semibold">Admin Dashboard</h1>
        </header>
        <main className="p-4 bg-secondary/40 flex-1">
          {children}
        </main>
      </SidebarInset>
    </>
  )
}


export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <SidebarProvider>
      <AdminLayoutContent>{children}</AdminLayoutContent>
    </SidebarProvider>
  );
}
