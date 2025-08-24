
'use client';

import React from 'react';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarContent,
  SidebarInset,
} from '@/components/ui/sidebar';
import { Home, Compass, MessageSquare, Notebook, User, BrainCircuit, Sparkles, Lightbulb } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Button } from './ui/button';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';

const navItems = [
  { href: '/', label: 'Beranda', icon: Home },
  { href: '/explore', label: 'Jelajah', icon: Compass },
  { href: '/messages', label: 'Asisten AI', icon: MessageSquare },
  { href: '/content-creator', label: 'AI Kreator Konten', icon: Sparkles },
  { href: '/recommender', label: 'Rekomendasi AI', icon: Lightbulb },
  { href: '/notebook', label: 'Catatan', icon: Notebook },
  { href: '/project-calculator', label: 'Kalkulator Proyek', icon: BrainCircuit },
];

function DesktopLayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, isAuthenticated } = useAuth();

  const getInitials = (name: string) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };
  
  const avatarUrl = user?.avatar ? `/api/images/${user.avatar}` : undefined;

  return (
    <>
      <Sidebar>
        <SidebarHeader className='p-4'>
           <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10 text-lg">
                  <AvatarImage src={avatarUrl} />
                  <AvatarFallback>{getInitials(user?.name || '')}</AvatarFallback>
              </Avatar>
              <div>
                  <p className="font-semibold text-base">{isAuthenticated && user ? user.name : 'Tamu'}</p>
                  <p className="text-xs text-muted-foreground">{isAuthenticated && user ? user.email : 'Silakan login'}</p>
              </div>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {navItems.map(item => {
              const isActive = (pathname === item.href) || (item.href !== '/' && pathname.startsWith(item.href));
              return (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton asChild isActive={isActive}>
                    <Link href={item.href}>
                      <item.icon />
                      {item.label}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarContent>
         <SidebarHeader className='p-4 border-t'>
           <Popover>
              <PopoverTrigger asChild>
                 <Button variant="ghost" className='w-full justify-start'>
                    <User className='mr-2'/>
                    Akun Saya
                  </Button>
              </PopoverTrigger>
              <PopoverContent className='w-56 p-2' side='top' align='start'>
                 <div className='flex flex-col gap-1'>
                    <Button variant='ghost' className='w-full justify-start' asChild><Link href="/account/profile">Profil</Link></Button>
                    <Button variant='ghost' className='w-full justify-start' asChild><Link href="/account/settings">Pengaturan</Link></Button>
                 </div>
              </PopoverContent>
           </Popover>
        </SidebarHeader>
      </Sidebar>
      <SidebarInset>
        <main className="flex-1">
          {children}
        </main>
      </SidebarInset>
    </>
  );
}

export function DesktopLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <DesktopLayoutContent>{children}</DesktopLayoutContent>
    </SidebarProvider>
  );
}
