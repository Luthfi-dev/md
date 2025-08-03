'use client';

import BottomNavBar from './BottomNavBar';
import React from 'react';
import { usePathname } from 'next/navigation';

export function MobileLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  const noNavPages = ['/login', '/account', '/messages', '/surat/share', '/surat/share-fallback'];
  const showBottomNav = !noNavPages.some(page => pathname.startsWith(page)) && !pathname.startsWith('/admin');

  return (
    // 'md:hidden' will hide this component on medium screens and up.
    <div className="flex flex-col flex-1 min-h-screen md:hidden">
      <main className="flex-1 pb-20">{children}</main>
      {showBottomNav && <BottomNavBar />}
    </div>
  );
}