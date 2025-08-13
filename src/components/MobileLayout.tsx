
'use client';

import BottomNavBar from './BottomNavBar';
import React from 'react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';

export function MobileLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  const isLoginPage = pathname === '/login';
  const isAdminRoute = pathname.startsWith('/admin') || pathname.startsWith('/superadmin');

  const showBottomNav = !isLoginPage && !isAdminRoute;
  
  return (
    <div className="flex flex-col flex-1 min-h-screen">
      <main className={cn("flex-1", showBottomNav ? "pb-16" : "")}>{children}</main>
      {showBottomNav && <BottomNavBar />}
    </div>
  );
}
