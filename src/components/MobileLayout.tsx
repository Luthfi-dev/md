
'use client';

import BottomNavBar from './BottomNavBar';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import React from 'react';

export function MobileLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  const noNavPages = ['/login', '/account', '/messages'];
  const showBottomNav = !noNavPages.some(page => pathname.startsWith(page)) && !pathname.startsWith('/admin') && !pathname.startsWith('/surat/share-fallback');

  return (
    <div className="flex flex-col flex-1 min-h-screen">
      <main className={cn("flex-1", showBottomNav ? "pb-20" : "")}>{children}</main>
      {showBottomNav && <BottomNavBar />}
    </div>
  );
}
