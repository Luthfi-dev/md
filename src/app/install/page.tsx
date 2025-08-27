
'use client';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { usePWAInstall } from "@/hooks/use-pwa-install";
import { CheckCircle, Download, Monitor, Smartphone } from "lucide-react";

export default function InstallPage() {
    const { canInstall, isInstalled, promptInstall } = usePWAInstall();

    const getButtonState = () => {
        if (isInstalled) {
            return {
                disabled: true,
                text: "Aplikasi Sudah Terinstal",
                icon: <CheckCircle />
            };
        }
        if (canInstall) {
             return {
                disabled: false,
                text: "Instal Aplikasi Sekarang",
                icon: <Download />
            };
        }
        return {
            disabled: true,
            text: "Browser Tidak Mendukung",
            icon: <Download />
        };
    };
    
    const { disabled, text, icon } = getButtonState();

    return (
        <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-background flex items-center justify-center p-4">
            <Card className="max-w-md w-full shadow-2xl rounded-2xl">
                <CardHeader className="text-center">
                    <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center border-4 border-primary/20">
                        <Download className="w-10 h-10 text-primary" />
                    </div>
                    <CardTitle className="text-3xl font-headline">Instal Aplikasi Maudigi</CardTitle>
                    <CardDescription>
                        Dapatkan akses lebih cepat dan pengalaman terbaik dengan menginstal aplikasi kami di perangkat Anda.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-4 text-sm text-muted-foreground">
                        <div className="flex items-start gap-3">
                            <Smartphone className="w-8 h-8 text-primary shrink-0"/>
                            <div>
                                <h4 className="font-semibold text-foreground">Pengalaman Terbaik</h4>
                                <p>Jalankan aplikasi langsung dari layar utama Anda, sama seperti aplikasi native lainnya.</p>
                            </div>
                        </div>
                         <div className="flex items-start gap-3">
                            <Monitor className="w-8 h-8 text-primary shrink-0"/>
                            <div>
                                <h4 className="font-semibold text-foreground">Akses Offline</h4>
                                <p>Beberapa fitur mungkin tetap dapat digunakan meskipun Anda sedang offline.</p>
                            </div>
                        </div>
                    </div>
                    <Button 
                        size="lg" 
                        className="w-full text-lg h-12"
                        onClick={promptInstall}
                        disabled={disabled}
                    >
                       {icon}
                       {text}
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
