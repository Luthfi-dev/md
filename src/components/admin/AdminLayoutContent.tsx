
'use client';

import { SidebarProvider, Sidebar, SidebarTrigger, SidebarContent, SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarInset, useSidebar, SidebarGroup, SidebarGroupLabel, SidebarGroupContent } from '@/components/ui/sidebar';
import { LayoutDashboard, Settings, Bot, LogOut, AppWindow, ChevronsLeftRight, Gem, FolderGit2, User } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';

export function AdminLayoutContent({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const { setOpenMobile } = useSidebar();
  const { logout, user } = useAuth();
  const router = useRouter();

  const handleLinkClick = () => {
    setOpenMobile(false);
  };
  
  const handleLogout = async () => {
    await logout();
    router.push('/');
  }

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <div className="flex items-center gap-2">
             <div className="w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center">
                <User/>
            </div>
            <div>
                 <p className="font-semibold text-lg truncate">{user?.name || 'Admin'}</p>
                 <p className="text-xs text-muted-foreground">{user?.email}</p>
            </div>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={pathname === '/adm'}>
                <Link href="/adm" onClick={handleLinkClick}>
                  <LayoutDashboard />
                  Dashboard
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={pathname.startsWith('/adm/apps')}>
                <Link href="/adm/apps" onClick={handleLinkClick}>
                  <AppWindow />
                  Kelola Aplikasi
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
             <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={pathname.startsWith('/adm/assistant')}>
                <Link href="/adm/assistant" onClick={handleLinkClick}>
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
                      <SidebarMenuButton asChild isActive={pathname.startsWith('/adm/manager/referral')}>
                        <Link href="/adm/manager/referral" onClick={handleLinkClick}>
                          Referral
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  </SidebarMenu>
                </SidebarGroupContent>
             </SidebarGroup>

            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={pathname.startsWith('/adm/pricing')}>
                <Link href="/adm/pricing" onClick={handleLinkClick}>
                  <Gem />
                  Kelola Harga
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
             <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={pathname.startsWith('/adm/pagination')}>
                <Link href="/adm/pagination" onClick={handleLinkClick}>
                  <ChevronsLeftRight />
                  Paginasi
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={pathname.startsWith('/adm/seo')}>
                <Link href="/adm/seo" onClick={handleLinkClick}>
                  <Settings />
                  Pengaturan SEO
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarContent>
        <SidebarHeader className='border-t'>
           <SidebarMenu>
             <SidebarMenuItem>
              <SidebarMenuButton onClick={handleLogout}>
                <LogOut />
                Keluar
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
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
    </SidebarProvider>
  )
}
