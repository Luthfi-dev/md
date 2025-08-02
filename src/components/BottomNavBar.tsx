
'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Compass, User, Notebook } from "lucide-react";
import { cn } from "@/lib/utils";
import React from "react";

const navItems = [
  { href: "/", label: "Beranda", icon: Home },
  { href: "/explore", label: "Jelajah", icon: Compass },
  { href: "/notebook", label: "Catatan", icon: Notebook, isCenter: true },
  { href: "/account", label: "Akun", icon: User },
];

const BottomNavBar = () => {
  const pathname = usePathname();

  return (
    <div className="fixed bottom-0 left-0 right-0 h-16 bg-card z-50 shadow-[0_-8px_32px_0_rgba(0,0,0,0.05)] border-t">
      <div className="flex justify-around items-center h-full">
        {navItems.map(({ href, label, icon: Icon, isCenter }, index) => {
          const isActive = (pathname === href) || (href !== '/' && pathname.startsWith(href));
          
          if (isCenter) {
            return (
               <div key={label} className="w-1/4 h-full flex justify-center items-center">
                  <Link href={href} className="flex flex-col items-center justify-center -mt-6">
                    <div className={cn(
                      "w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg",
                      isActive ? "bg-primary" : "bg-primary/80"
                    )}>
                      <Icon className="h-7 w-7 text-primary-foreground" />
                    </div>
                  </Link>
              </div>
            );
          }
          
          // Add invisible spacer for the center button
          const spacer = index === 2 ? <div className="w-1/4 h-full"></div> : null;

          return (
            <React.Fragment key={label}>
              <div className="w-1/4 h-full">
                <Link href={href} className="flex flex-col items-center justify-center w-full h-full transition-colors duration-300">
                  <div className={cn(
                    "flex flex-col items-center gap-1 text-center w-full transition-all duration-300 relative pt-1", 
                    isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                  )}>
                    <Icon className="h-6 w-6" />
                    <span className={cn("text-xs transition-all", isActive ? 'font-bold' : 'font-medium')}>
                      {label}
                    </span>
                  </div>
                </Link>
              </div>
              {spacer}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

export default BottomNavBar;
