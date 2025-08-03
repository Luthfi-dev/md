'use client';

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarProvider,
  useSidebar,
} from '@/components/ui/sidebar';
import * as LucideIcons from 'lucide-react';
import { Package, Compass, Notebook, Home } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ReactNode } from 'react';

// Simulate fetching data
import appsData from '@/data/apps.json';

const getIcon = (iconName: string): ReactNode => {
    const IconComponent = (LucideIcons as any)[iconName];
    if (IconComponent) {
        return <IconComponent />;
    }
    return <Package />; // Fallback icon
};


function DesktopSidebar() {
  const pathname = usePathname();
  const { setOpenMobile } = useSidebar();

  const handleLinkClick = () => {
    setOpenMobile(false);
  };

  const menuItems = [
    { href: '/', label: 'Beranda', icon: <Home /> },
    { href: '/explore', label: 'Jelajah', icon: <Compass /> },
    { href: '/notebook', label: 'Catatan', icon: <Notebook /> },
  ];

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-bold">
            A
          </div>
          <p className="font-semibold text-lg">All-in-One</p>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {menuItems.map(item => (
            <SidebarMenuItem key={item.label}>
              <SidebarMenuButton asChild isActive={pathname === item.href}>
                <Link href={item.href} onClick={handleLinkClick}>
                  {item.icon}
                  {item.label}
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
        
        <SidebarMenu className="mt-auto">
          <SidebarMenuItem>
             <SidebarMenuButton asChild>
                <Link href="/account">
                    <LucideIcons.User/>
                    Akun Saya
                </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

      </SidebarContent>
    </Sidebar>
  );
}

export function DesktopLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const noLayoutPages = ['/admin', '/login', '/account', '/messages', '/surat/share', '/surat/share-fallback'];
  if (noLayoutPages.some(page => pathname.startsWith(page))) {
    return <>{children}</>;
  }

  return (
    // 'hidden' by default, 'md:flex' for medium screens and up
    <div className="hidden md:flex min-h-screen w-full">
      <SidebarProvider>
        <DesktopSidebar />
        <main className="flex-1">
          {children}
        </main>
      </SidebarProvider>
    </div>
  );
}