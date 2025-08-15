'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { usePWAInstall } from "@/hooks/use-pwa-install";
import { ArrowLeft, CheckCircle, Download, Smartphone, Star } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

const benefits = [
    { icon: Smartphone, title: "Akses Cepat", description: "Buka Maudigi langsung dari layar utama Anda, sama seperti aplikasi native." },
    { icon: Star, title: "Pengalaman Terbaik", description: "Nikmati antarmuka yang lebih cepat, mulus, dan bebas dari gangguan browser." },
    { icon: Download, title: "Dukungan Offline", description: "Gunakan fitur-fitur penting bahkan saat Anda tidak terhubung ke internet." },
];

export default function InstallPage() {
    const router = useRouter();
    const { canInstall, isInstalled, promptInstall } = usePWAInstall();

    useEffect(() => {
        // Jika sudah diinstal, mungkin arahkan pengguna atau tampilkan pesan berbeda
        if (isInstalled) {
            // Bisa tambahkan toast atau pesan di sini
        }
    }, [isInstalled]);

    return (
        <div className="min-h-screen bg-gradient-to-b from-primary/10 to-background">
            <div className="container mx-auto max-w-2xl px-4 py-8 pb-24">
                <Button variant="ghost" onClick={() => router.back()} className="mb-4 -ml-4">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Kembali
                </Button>

                <div className="text-center mb-10">
                    <Image 
                        data-ai-hint="rocket app logo"
                        src="/logo.jpg" 
                        alt="Maudigi Logo" 
                        width={120} 
                        height={120} 
                        className="mx-auto mb-4 rounded-2xl" 
                    />
                    <h1 className="text-4xl font-bold font-headline">Instal Aplikasi Maudigi</h1>
                    <p className="text-muted-foreground mt-2 text-lg">Dapatkan pengalaman terbaik di perangkat Anda.</p>
                </div>
                
                {isInstalled ? (
                    <Card className="bg-green-500/10 border-green-500/30 text-center shadow-lg">
                        <CardContent className="p-8">
                             <CheckCircle className="mx-auto h-16 w-16 text-green-500 mb-4" />
                             <h2 className="text-2xl font-bold">Aplikasi Terinstal!</h2>
                             <p className="text-muted-foreground mt-2">Anda sudah memiliki versi terbaik dari Maudigi. Cek layar utama perangkat Anda untuk membukanya.</p>
                        </CardContent>
                    </Card>
                ) : (
                    <Card className="shadow-xl">
                        <CardHeader>
                            <CardTitle>Satu Langkah Lagi Menuju Pengalaman Premium</CardTitle>
                            <CardDescription>
                                Dengan menginstal Maudigi, Anda membuka potensi penuh dari semua alat canggih kami, langsung dari genggaman Anda.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-4">
                                {benefits.map(benefit => (
                                    <div key={benefit.title} className="flex items-start gap-4">
                                        <div className="p-2 bg-primary/10 rounded-full mt-1">
                                            <benefit.icon className="w-5 h-5 text-primary" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold">{benefit.title}</h3>
                                            <p className="text-sm text-muted-foreground">{benefit.description}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <Button 
                                size="lg" 
                                className="w-full text-lg" 
                                onClick={promptInstall}
                                disabled={!canInstall}
                            >
                                <Download className="mr-2"/> 
                                {canInstall ? 'Instal Aplikasi Gratis' : 'Instalasi Tidak Didukung'}
                            </Button>
                             {!canInstall && <p className="text-xs text-center text-muted-foreground">Tip: Gunakan browser Chrome atau Safari di perangkat mobile untuk menginstal.</p>}
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}
