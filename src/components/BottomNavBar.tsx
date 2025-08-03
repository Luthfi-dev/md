
'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Compass, User, Notebook, Grid3x3 } from "lucide-react";
import { cn } from "@/lib/utils";
import React from "react";

const navItems = [
  { href: "/", label: "Beranda", icon: Home },
  { href: "/explore", label: "Jelajah", icon: Compass },
  { href: "/notebook", label: "Catatan", icon: Notebook, isCenter: true },
  { href: "/messages", label: "Asisten", icon: Grid3x3 },
  { href: "/account", label: "Akun", icon: User },
];

const BottomNavBar = () => {
  const pathname = usePathname();

  const leftItems = navItems.slice(0, 2);
  const rightItems = navItems.slice(3);
  const centerItem = navItems[2];

  const renderNavItem = (item: (typeof navItems)[0]) => {
      const isActive = (pathname === item.href) || (item.href !== '/' && pathname.startsWith(item.href));
      return (
           <Link key={item.label} href={item.href} className="flex flex-col items-center justify-center w-full h-full transition-colors duration-300">
              <div className={cn(
                "flex flex-col items-center gap-1 text-center w-full transition-all duration-300 relative pt-1", 
                isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              )}>
                <item.icon className="h-6 w-6" />
                <span className={cn("text-xs transition-all", isActive ? 'font-bold' : 'font-medium')}>
                  {item.label}
                </span>
              </div>
            </Link>
      )
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 h-16 bg-card z-50 shadow-[0_-8px_32px_0_rgba(0,0,0,0.05)] border-t">
      <div className="flex justify-around items-center h-full">
         <div className="w-2/5 flex justify-around items-center h-full">
            {leftItems.map(renderNavItem)}
         </div>
         <div className="w-1/5 h-full flex justify-center items-center">
             <Link href={centerItem.href} className="flex flex-col items-center justify-center -mt-6">
                <div className={cn(
                    "w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg",
                    pathname.startsWith(centerItem.href) ? "bg-primary" : "bg-primary/80"
                )}>
                    <centerItem.icon className="h-7 w-7 text-primary-foreground" />
                </div>
            </Link>
         </div>
         <div className="w-2/5 flex justify-around items-center h-full">
            {rightItems.map(renderNavItem)}
         </div>
      </div>
    </div>
  );
};

export default BottomNavBar;
