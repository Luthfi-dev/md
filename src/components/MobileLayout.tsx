
'use client';

import BottomNavBar from './BottomNavBar';
import React from 'react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

export function MobileLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  // Hide nav bar only on the exact login page and admin pages.
  // The nav bar should now appear on `/account/profile`, `/account/edit-profile` etc.
  const showBottomNav = pathname !== '/account' && !pathname.startsWith('/admin');

  return (
    <div className="flex flex-col flex-1 min-h-screen">
      <main className={cn("flex-1", showBottomNav ? "pb-20" : "")}>{children}</main>
      {showBottomNav && <BottomNavBar />}
    </div>
  );
}
