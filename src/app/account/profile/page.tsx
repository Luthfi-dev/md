'use client';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ChevronRight, Gem, LogOut, Edit, Shield, Bell, Users, Settings, Download } from "lucide-react";
import { useRouter } from 'next/navigation';
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { LoadingOverlay } from "@/components/ui/loading-overlay";
import { CountUp } from "@/components/CountUp";
import { Coins } from "lucide-react";
import React, { useEffect } from "react";

const menuItems = [
    { label: "Edit Profil", icon: Edit, href: "/account/edit-profile" },
    { label: "Keamanan", icon: Shield, href: "/account/security" },
    { label: "Notifikasi", icon: Bell, href: "/account/notifications" },
    { label: "Pengaturan", icon: Settings, href: "/account/settings" },
];

const engagementItems = [
    { label: "Kelola Langganan", icon: Gem, href: "/pricing" },
    { label: "Undang Teman", icon: Users, href: "/account/invite" },
    { label: "Instal Aplikasi", icon: Download, href: "/account/install" },
]

export default function ProfilePage() {
    const router = useRouter();
    const { user, logout, isAuthenticated, isLoading } = useAuth();

    // Middleware menangani sebagian besar perlindungan rute.
    // Efek ini adalah pengaman tambahan untuk navigasi sisi klien jika diperlukan.
    useEffect(() => {
        if (isAuthenticated === false) {
            router.push('/login');
        }
    }, [isAuthenticated, router]);

    if (isLoading || isAuthenticated === undefined || (isAuthenticated && !user)) {
        return <LoadingOverlay isLoading={true} message="Memuat profil Anda..." />;
    }
    
    // Jika middleware karena suatu alasan gagal dan komponen ini dirender,
    // kembalikan null agar tidak terjadi render singkat konten yang tidak seharusnya.
    if (!isAuthenticated) {
        return null;
    }

    const handleLogout = async () => {
        await logout();
        // Arahkan ke halaman utama setelah logout, middleware akan menghalangi akses jika diperlukan.
        router.push('/');
    };
    
    const getInitials = (name: string) => {
        if(!name) return 'U';
        return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    }
    
    const avatarUrl = user?.avatar ? `/api/images/${user.avatar}` : undefined;

    return (
        <div className="min-h-screen bg-card">
            <div className="px-4 py-8 pb-24">
                
                {/* Profile Header */}
                <div className="flex flex-col items-center pt-8 text-center">
                    <Avatar className="w-24 h-24 text-4xl mb-4 border-4 border-background shadow-lg">
                        <AvatarImage src={avatarUrl} data-ai-hint="profile picture" />
                        <AvatarFallback>{getInitials(user?.name || 'U')}</AvatarFallback>
                    </Avatar>
                    <h1 className="text-3xl font-bold text-foreground">{user?.name}</h1>
                    <Badge variant="outline" className="mt-2 text-muted-foreground bg-background border-border/50 shadow-inner px-4 py-1.5">
                        {user?.email}
                    </Badge>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 my-8">
                    <div className="flex flex-col items-center p-3 rounded-lg bg-background/50">
                        <Coins className="w-6 h-6 text-primary mb-1" />
                        <p className="text-xl font-bold"><CountUp end={user?.points ?? 0} /></p>
                        <p className="text-xs text-muted-foreground">Poin</p>
                    </div>
                     <div className="flex flex-col items-center p-3 rounded-lg bg-background/50">
                        <Gem className="w-6 h-6 text-primary mb-1" />
                        <p className="text-lg font-bold">Gratis</p>
                        <p className="text-xs text-muted-foreground">Langganan</p>
                    </div>
                     <div className="flex flex-col items-center p-3 rounded-lg bg-background/50">
                        <Users className="w-6 h-6 text-primary mb-1" />
                        <p className="text-xl font-bold">0</p>
                        <p className="text-xs text-muted-foreground">Teman</p>
                    </div>
                </div>

                {/* Menu List */}
                <div className="bg-background/50 rounded-2xl p-2">
                    <div className="space-y-1">
                       {menuItems.map((item) => (
                            <button key={item.label} onClick={() => router.push(item.href)} className="w-full text-left p-4 rounded-lg hover:bg-secondary flex items-center justify-between transition-colors">
                                <div className="flex items-center gap-4">
                                    <item.icon className="w-6 h-6 text-muted-foreground" />
                                    <span className="font-semibold text-base text-foreground">{item.label}</span>
                                </div>
                                <ChevronRight className="w-5 h-5 text-muted-foreground" />
                            </button>
                       ))}
                    </div>
                    <Separator className="my-2" />
                     <div className="space-y-1">
                         {engagementItems.map((item) => (
                            <button key={item.label} onClick={() => router.push(item.href)} className="w-full text-left p-4 rounded-lg hover:bg-secondary flex items-center justify-between transition-colors">
                                <div className="flex items-center gap-4">
                                    <item.icon className="w-6 h-6 text-muted-foreground" />
                                    <span className="font-semibold text-base text-foreground">{item.label}</span>
                                </div>
                                <ChevronRight className="w-5 h-5 text-muted-foreground" />
                            </button>
                       ))}
                    </div>
                    <Separator className="my-2" />
                    <button onClick={handleLogout} className="w-full text-left p-4 rounded-lg hover:bg-destructive/10 flex items-center transition-colors text-destructive">
                        <div className="flex items-center gap-4">
                            <LogOut className="w-6 h-6" />
                            <span className="font-semibold text-base">Keluar dari Akun</span>
                        </div>
                    </button>
                </div>
            </div>
        </div>
    );
}
