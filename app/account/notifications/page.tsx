
'use client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bell, ArrowLeft, BellRing } from "lucide-react";
import { useRouter } from 'next/navigation';
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

// Placeholder data for notifications
const notifications = [
    { id: 1, title: "Selamat datang di All-in-One Toolkit!", description: "Jelajahi semua fitur canggih yang kami sediakan untuk Anda.", time: "2 jam yang lalu", read: false },
    { id: 2, title: "Hadiah Harian Tersedia", description: "Jangan lupa klaim 50 Poin Coin gratis Anda hari ini!", time: "1 hari yang lalu", read: false },
    { id: 3, title: "Profil Anda Diperbarui", description: "Informasi profil Anda telah berhasil disimpan.", time: "3 hari yang lalu", read: true },
];

export default function NotificationsPage() {
    const router = useRouter();
    
    return (
        <div className="min-h-screen bg-secondary/30">
            <div className="container mx-auto max-w-2xl px-4 py-8 pb-24">
                <Button variant="ghost" onClick={() => router.back()} className="mb-4">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Kembali
                </Button>

                <Card className="mb-8">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><BellRing /> Notifikasi</CardTitle>
                        <CardDescription>Daftar pemberitahuan dan pembaruan terbaru dari aplikasi.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {notifications.map(notif => (
                            <div key={notif.id} className={`p-4 rounded-lg flex items-start gap-4 ${!notif.read ? 'bg-primary/5 border border-primary/20' : 'bg-secondary/50'}`}>
                                <div className={`mt-1 h-2.5 w-2.5 rounded-full ${!notif.read ? 'bg-primary' : 'bg-transparent'}`}></div>
                                <div className="flex-1">
                                    <p className="font-semibold">{notif.title}</p>
                                    <p className="text-sm text-muted-foreground">{notif.description}</p>
                                    <p className="text-xs text-muted-foreground mt-1">{notif.time}</p>
                                </div>
                            </div>
                        ))}
                         {notifications.length === 0 && (
                            <div className="text-center py-8 text-muted-foreground">
                                <Bell className="mx-auto h-12 w-12 mb-4" />
                                <p>Tidak ada notifikasi baru.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
                
                 <Card>
                    <CardHeader>
                        <CardTitle>Pengaturan Notifikasi</CardTitle>
                        <CardDescription>Pilih jenis notifikasi yang ingin Anda terima.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                         <div className="flex items-center justify-between">
                            <Label htmlFor="promo-notif">Promosi & Penawaran</Label>
                            <Switch id="promo-notif" defaultChecked/>
                        </div>
                         <div className="flex items-center justify-between">
                            <Label htmlFor="app-update-notif">Pembaruan Aplikasi</Label>
                             <Switch id="app-update-notif" defaultChecked/>
                        </div>
                        <div className="flex items-center justify-between">
                            <Label htmlFor="reminder-notif">Pengingat Harian</Label>
                             <Switch id="reminder-notif" />
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
