'use client';

import BottomNavBar from './BottomNavBar';
import React from 'react';
import { usePathname } from 'next/navigation';

export function MobileLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  const noLayoutPages = ['/admin', '/login', '/account', '/messages', '/surat/share', '/surat/share-fallback'];
  if (noLayoutPages.some(page => pathname.startsWith(page))) {
    return <>{children}</>;
  }

  return (
    // 'md:hidden' will hide this component on medium screens and up.
    <div className="flex flex-col flex-1 min-h-screen md:hidden">
      <main className="flex-1 pb-20">{children}</main>
      <BottomNavBar />
    </div>
  );
}