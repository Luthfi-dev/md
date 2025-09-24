
'use client';
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShieldCheck, DatabaseZap, LockKeyhole, FileLock2, ArrowLeft, Loader2, Save } from "lucide-react";
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';

const securityPoints = [
    {
        icon: LockKeyhole,
        title: "Enkripsi Kata Sandi",
        description: "Kata sandi Anda di-hash menggunakan algoritma bcrypt yang kuat. Kami tidak pernah menyimpan kata sandi Anda dalam bentuk teks biasa, bahkan kami pun tidak dapat melihatnya."
    },
    {
        icon: DatabaseZap,
        title: "Koneksi Aman",
        description: "Seluruh komunikasi antara aplikasi dan server kami dienkripsi menggunakan protokol HTTPS (TLS), standar keamanan yang sama seperti yang digunakan oleh perbankan online."
    },
    {
        icon: FileLock2,
        title: "Perlindungan Data",
        description: "Kami menerapkan praktik terbaik dalam pengembangan perangkat lunak untuk melindungi data Anda dari akses tidak sah, modifikasi, atau penghapusan."
    }
];

export default function SecurityPage() {
    const router = useRouter();
    const { fetchWithAuth } = useAuth();
    const { toast } = useToast();
    const [open, setOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    
    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        if (newPassword !== confirmPassword) {
            toast({ variant: 'destructive', title: 'Gagal', description: 'Kata sandi baru tidak cocok.' });
            setIsLoading(false);
            return;
        }

        try {
            const { data: result } = await fetchWithAuth('/api/user/change-password', {
                method: 'POST',
                data: { oldPassword, newPassword, confirmPassword }
            });

            if (result.success) {
                toast({ title: 'Berhasil!', description: 'Kata sandi Anda telah berhasil diperbarui.' });
                setOpen(false);
                setOldPassword('');
                setNewPassword('');
                setConfirmPassword('');
            } else {
                toast({ variant: 'destructive', title: 'Gagal', description: result.message || 'Terjadi kesalahan.' });
            }
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Tidak dapat terhubung ke server.';
            toast({ variant: 'destructive', title: 'Error', description: message });
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <div className="min-h-screen bg-secondary/30">
            <div className="container mx-auto max-w-2xl px-4 py-8 pb-24">
                <Button variant="ghost" onClick={() => router.back()} className="mb-4">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Kembali
                </Button>
                <div className="text-center mb-8">
                     <ShieldCheck className="mx-auto h-16 w-16 text-primary" />
                     <h1 className="text-3xl font-bold mt-4">Keamanan & Privasi Anda Prioritas Kami</h1>
                     <p className="mt-2 text-muted-foreground max-w-lg mx-auto">
                        Kami berkomitmen untuk melindungi data Anda dengan standar keamanan tertinggi.
                     </p>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Pusat Keamanan</CardTitle>
                        <CardDescription>Pelajari bagaimana kami menjaga keamanan akun dan data Anda.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {securityPoints.map((point, index) => (
                             <div key={index} className="flex items-start gap-4 p-4 rounded-lg bg-secondary/50">
                                <point.icon className="h-8 w-8 text-primary mt-1 shrink-0"/>
                                <div>
                                    <h3 className="font-semibold">{point.title}</h3>
                                    <p className="text-sm text-muted-foreground">{point.description}</p>
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>
                 <Card className="mt-8">
                    <CardHeader>
                        <CardTitle>Ubah Kata Sandi</CardTitle>
                         <CardDescription>Untuk keamanan, ubah kata sandi Anda secara berkala.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Dialog open={open} onOpenChange={setOpen}>
                            <DialogTrigger asChild>
                                <Button className="w-full">Ubah Kata Sandi</Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Ubah Kata Sandi Anda</DialogTitle>
                                    <DialogDescription>
                                        Masukkan kata sandi lama Anda dan kata sandi baru yang kuat.
                                    </DialogDescription>
                                </DialogHeader>
                                <form onSubmit={handleChangePassword}>
                                    <div className="grid gap-4 py-4">
                                        <div className="grid grid-cols-4 items-center gap-4">
                                            <Label htmlFor="old-password" >
                                                Kata Sandi Lama
                                            </Label>
                                            <Input id="old-password" type="password" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} required className="col-span-3"/>
                                        </div>
                                        <div className="grid grid-cols-4 items-center gap-4">
                                            <Label htmlFor="new-password">
                                                Kata Sandi Baru
                                            </Label>
                                            <Input id="new-password" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required className="col-span-3"/>
                                        </div>
                                        <div className="grid grid-cols-4 items-center gap-4">
                                            <Label htmlFor="confirm-password">
                                                Ulangi Sandi Baru
                                            </Label>
                                            <Input id="confirm-password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required className="col-span-3"/>
                                        </div>
                                    </div>
                                    <DialogFooter>
                                        <Button type="submit" disabled={isLoading}>
                                            {isLoading ? <Loader2 className="mr-2 animate-spin"/> : <Save className="mr-2"/>}
                                            Simpan Perubahan
                                        </Button>
                                    </DialogFooter>
                                </form>
                            </DialogContent>
                        </Dialog>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
