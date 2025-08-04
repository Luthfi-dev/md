
'use client';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ChevronRight, Gem, LogOut, Edit, Shield, Bell, Users, Coins, Star, Settings } from "lucide-react";
import { useRouter } from 'next/navigation';
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { LoadingOverlay } from "@/components/ui/loading-overlay";
import { CountUp } from "@/components/CountUp";

const menuItems = [
    { label: "Edit Profil", icon: Edit, href: "/account/edit-profile" },
    { label: "Keamanan", icon: Shield, href: "/account/security" },
    { label: "Notifikasi", icon: Bell, href: "/account/notifications" },
    { label: "Pengaturan", icon: Settings, href: "/account/settings" },
];

const engagementItems = [
    { label: "Kelola Langganan", icon: Gem, href: "/pricing" },
    { label: "Undang Teman", icon: Users, href: "/account/invite" }
]

export default function ProfilePage() {
    const router = useRouter();
    const { user, logout, isAuthenticated, isLoading } = useAuth();

    if (isLoading || (isAuthenticated && !user)) {
        return <LoadingOverlay isLoading={true} message="Memuat profil Anda..." />;
    }
    
    if (!isAuthenticated) {
        router.push('/account');
        return null;
    }

    const handleLogout = async () => {
        await logout();
        router.push('/');
    };
    
    const getInitials = (name: string) => {
        if(!name) return 'U';
        return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    }
    
    const avatarUrl = user?.avatar ? `/api/images/${user.avatar}` : undefined;

    return (
        <div className="min-h-screen bg-secondary/30">
            <div className="container mx-auto max-w-2xl px-4 py-8 pb-24">
                
                {/* Profile Header */}
                <div className="flex items-center gap-4 mb-8">
                    <Avatar className="w-20 h-20 text-3xl border-4 border-background shadow-md">
                        <AvatarImage src={avatarUrl} data-ai-hint="profile picture" />
                        <AvatarFallback>{getInitials(user?.name || 'U')}</AvatarFallback>
                    </Avatar>
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">{user?.name}</h1>
                        <Badge variant="outline" className="mt-1 border-primary/20 bg-primary/5 text-primary">
                            {user?.email}
                        </Badge>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-3 gap-4 mb-8">
                    <Card>
                        <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                            <Coins className="w-6 h-6 text-primary mb-1" />
                            <p className="text-2xl font-bold"><CountUp end={user?.points || 0} /></p>
                            <p className="text-xs text-muted-foreground">Poin Coin</p>
                        </CardContent>
                    </Card>
                     <Card>
                        <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                            <Gem className="w-6 h-6 text-primary mb-1" />
                            <p className="text-lg font-bold">Gratis</p>
                            <p className="text-xs text-muted-foreground">Langganan</p>
                        </CardContent>
                    </Card>
                     <Card>
                        <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                            <Users className="w-6 h-6 text-primary mb-1" />
                            <p className="text-2xl font-bold">0</p>
                            <p className="text-xs text-muted-foreground">Teman</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Menu List */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <h2 className="font-semibold text-foreground">Akun Saya</h2>
                        </CardHeader>
                        <CardContent className="p-2 pt-0">
                            {menuItems.map((item, index) => (
                                <button key={index} onClick={() => router.push(item.href)} className="w-full text-left p-3 rounded-lg hover:bg-secondary flex items-center justify-between transition-colors">
                                    <div className="flex items-center gap-4">
                                        <item.icon className="w-5 h-5 text-muted-foreground" />
                                        <span className="font-medium text-base text-foreground">{item.label}</span>
                                    </div>
                                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                                </button>
                            ))}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                             <h2 className="font-semibold text-foreground">Engagement</h2>
                        </CardHeader>
                         <CardContent className="p-2 pt-0">
                           {engagementItems.map((item, index) => (
                                <button key={index} onClick={() => router.push(item.href)} className="w-full text-left p-3 rounded-lg hover:bg-secondary flex items-center justify-between transition-colors">
                                    <div className="flex items-center gap-4">
                                        <item.icon className="w-5 h-5 text-muted-foreground" />
                                        <span className="font-medium text-base text-foreground">{item.label}</span>
                                    </div>
                                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                                </button>
                            ))}
                        </CardContent>
                    </Card>

                    <div>
                        <Button onClick={handleLogout} variant="ghost" className="w-full text-destructive hover:text-destructive hover:bg-destructive/10">
                            <LogOut className="mr-2 w-5 h-5" />
                            <span className="font-semibold text-base">Keluar dari Akun</span>
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
