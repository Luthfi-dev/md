
'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Compass, User, Notebook, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import React from "react";
import { useAuth } from "@/hooks/use-auth";


const navItems = [
  { href: "/", label: "Beranda", icon: Home },
  { href: "/explore", label: "Jelajah", icon: Compass },
  { href: "/messages", label: "Asisten", icon: MessageSquare, isCenter: true },
  { href: "/notebook", label: "Catatan", icon: Notebook },
  { href: "/account/profile", label: "Akun", icon: User },
];

const BottomNavBar = () => {
  const pathname = usePathname();
  const { isAuthenticated } = useAuth();
  
  // This component now assumes middleware will handle the redirection for unauthenticated users.
  // It always points to the intended destination for an authenticated user.
  const getHref = (href: string) => {
      // The middleware will catch the unauthenticated user and redirect to /login.
      return href;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 h-16 bg-card z-50 shadow-[0_-8px_32px_0_rgba(0,0,0,0.05)] border-t">
      <div className="flex justify-around items-center h-full max-w-lg mx-auto">
        {navItems.map((item) => {
          const href = getHref(item.href);
          // Simplified active check. /account/* should highlight the Akun tab.
          const isActive = pathname.startsWith(href) && href !== '/';
          const isHomeActive = pathname === '/';

          if (item.isCenter) {
            return (
               <div key={item.label} className="w-1/5 h-full flex justify-center items-center">
                  <Link href={href} className="flex flex-col items-center justify-center">
                    <div className={cn(
                      "w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg",
                      isActive ? "bg-primary" : "bg-primary/80"
                    )}>
                      <item.icon className="h-7 w-7 text-primary-foreground" />
                    </div>
                  </Link>
              </div>
            );
          }
          
          return (
             <Link key={item.label} href={href} className="flex flex-col items-center justify-center w-1/5 h-full transition-colors duration-300">
                <div className={cn(
                  "flex flex-col items-center gap-1 text-center w-full transition-all duration-300 relative pt-1", 
                  (item.href === '/' ? isHomeActive : isActive) ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                )}>
                  <item.icon className="h-6 w-6" />
                  <span className={cn("text-xs transition-all", (item.href === '/' ? isHomeActive : isActive) ? 'font-bold' : 'font-medium')}>
                    {item.label}
                  </span>
                </div>
              </Link>
          );
        })}
      </div>
    </div>
  );
};

export default BottomNavBar;
