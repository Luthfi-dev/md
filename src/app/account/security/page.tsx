
'use client';
import { Button } from "@/components/ui/button";
import { ShieldCheck, DatabaseZap, LockKeyhole, FileLock2, ArrowLeft } from "lucide-react";
import { useRouter } from 'next/navigation';

const securityPoints = [
    {
        icon: LockKeyhole,
        title: "Enkripsi Kata Sandi",
        description: "Kata sandi Anda di-hash menggunakan algoritma bcrypt yang kuat. Kami tidak pernah menyimpan kata sandi Anda dalam bentuk teks biasa."
    },
    {
        icon: DatabaseZap,
        title: "Koneksi Aman",
        description: "Seluruh komunikasi antara aplikasi dan server kami dienkripsi menggunakan protokol HTTPS (TLS), standar keamanan yang sama seperti perbankan online."
    },
    {
        icon: FileLock2,
        title: "Perlindungan Data",
        description: "Kami menerapkan praktik terbaik untuk melindungi data Anda dari akses tidak sah, modifikasi, atau penghapusan."
    }
];

export default function SecurityPage() {
    const router = useRouter();
    
    return (
        <div className="min-h-screen bg-card">
            <div className="px-4 py-8 pb-24">
                <Button variant="ghost" onClick={() => router.back()} className="mb-4 -ml-4">
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
                
                <div className="space-y-6">
                    <div className="p-4 rounded-xl bg-background space-y-4">
                        <h2 className="font-bold text-lg">Pusat Keamanan</h2>
                        {securityPoints.map((point, index) => (
                             <div key={index} className="flex items-start gap-4 p-4 rounded-lg bg-secondary/50">
                                <point.icon className="h-8 w-8 text-primary mt-1 shrink-0"/>
                                <div>
                                    <h3 className="font-semibold">{point.title}</h3>
                                    <p className="text-sm text-muted-foreground">{point.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="p-4 rounded-xl bg-background">
                        <h2 className="font-bold text-lg">Ubah Kata Sandi</h2>
                        <p className="text-sm text-muted-foreground mb-4">Untuk keamanan, ubah kata sandi Anda secara berkala.</p>
                        <Button className="w-full">Ubah Kata Sandi</Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
