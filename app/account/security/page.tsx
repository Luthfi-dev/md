
'use client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShieldCheck, DatabaseZap, LockKeyhole, FileLock2, ArrowLeft } from "lucide-react";
import { useRouter } from 'next/navigation';

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
                        <Button className="w-full">Ubah Kata Sandi</Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
