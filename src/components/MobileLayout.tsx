
'use client';

import BottomNavBar from './BottomNavBar';
import React from 'react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

export function MobileLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  // Only hide nav bar on very specific pages now
  const noNavPages = ['/login'];
  const showBottomNav = !noNavPages.some(page => pathname.startsWith(page)) && !pathname.startsWith('/admin') && !pathname.startsWith('/surat/');

  return (
    <div className="flex flex-col flex-1 min-h-screen">
      <main className={cn("flex-1", showBottomNav ? "pb-20" : "")}>{children}</main>
      {showBottomNav && <BottomNavBar />}
    </div>
  );
}
