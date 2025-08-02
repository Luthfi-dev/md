
'use client';

import BottomNavBar from './BottomNavBar';
import { cn } from '@/lib/utils';
import React from 'react';

export function MobileLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col flex-1 min-h-screen">
      <main className={cn("flex-1", "pb-20")}>{children}</main>
      <BottomNavBar />
    </div>
  );
}
