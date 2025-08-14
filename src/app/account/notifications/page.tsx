'use client';
import { Button } from "@/components/ui/button";
import { Bell, ArrowLeft, BellRing } from "lucide-react";
import { useRouter } from 'next/navigation';
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

// Placeholder data for notifications
const notifications = [
    { id: 1, title: "Selamat datang di Maudigi!", description: "Jelajahi semua fitur canggih yang kami sediakan untuk Anda.", time: "2 jam yang lalu", read: false },
    { id: 2, title: "Hadiah Harian Tersedia", description: "Jangan lupa klaim 50 Poin Coin gratis Anda hari ini!", time: "1 hari yang lalu", read: false },
    { id: 3, title: "Profil Anda Diperbarui", description: "Informasi profil Anda telah berhasil disimpan.", time: "3 hari yang lalu", read: true },
];

export default function NotificationsPage() {
    const router = useRouter();
    
    return (
        <div className="min-h-screen bg-card">
            <div className="px-4 py-8 pb-24">
                <Button variant="ghost" onClick={() => router.back()} className="mb-4 -ml-4">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Kembali
                </Button>

                <h1 className="text-2xl font-bold flex items-center gap-2"><BellRing /> Notifikasi</h1>
                <p className="text-muted-foreground mb-8">Daftar pemberitahuan dan pembaruan terbaru dari aplikasi.</p>

                <div className="space-y-4">
                    {notifications.map(notif => (
                        <div key={notif.id} className={`p-4 rounded-lg flex items-start gap-4 ${!notif.read ? 'bg-primary/5' : 'bg-background'}`}>
                            <div className={`mt-1 h-2.5 w-2.5 rounded-full ${!notif.read ? 'bg-primary' : 'bg-transparent'}`}></div>
                            <div className="flex-1">
                                <p className="font-semibold">{notif.title}</p>
                                <p className="text-sm text-muted-foreground">{notif.description}</p>
                                <p className="text-xs text-muted-foreground mt-1">{notif.time}</p>
                            </div>
                        </div>
                    ))}
                    {notifications.length === 0 && (
                        <div className="text-center py-8 text-muted-foreground bg-background rounded-lg">
                            <Bell className="mx-auto h-12 w-12 mb-4" />
                            <p>Tidak ada notifikasi baru.</p>
                        </div>
                    )}
                </div>
                
                <h2 className="text-xl font-bold mt-12 mb-4">Pengaturan Notifikasi</h2>
                <div className="space-y-4 p-4 rounded-lg bg-background">
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
                </div>
            </div>
        </div>
    );
}
