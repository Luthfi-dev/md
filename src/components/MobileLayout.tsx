
'use client';

import BottomNavBar from './BottomNavBar';
import React from 'react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';

export function MobileLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  const isLoginPage = pathname === '/login';
  const isAdminRoute = pathname.startsWith('/admin') || pathname.startsWith('/spa');

  // Show bottom nav on all pages except login and admin
  const showBottomNav = !isLoginPage && !isAdminRoute;
  
  // By default, apply padding if the nav is shown.
  // The pb-16 gives space for the h-16 BottomNavBar
  const applyPadding = showBottomNav;

  return (
    <div className="flex flex-col flex-1 h-screen">
      <main className={cn("flex-1 flex flex-col min-h-0", applyPadding ? "pb-16" : "")}>{children}</main>
      {showBottomNav && <BottomNavBar />}
    </div>
  );
}
