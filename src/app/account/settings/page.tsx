
'use client';
import { Button } from "@/components/ui/button";
import { ArrowLeft, Moon, Palette } from "lucide-react";
import { useRouter } from 'next/navigation';
import { useTheme } from "next-themes";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export default function SettingsPage() {
    const router = useRouter();
    const { theme, setTheme } = useTheme();

    return (
        <div className="min-h-screen bg-card">
            <div className="px-4 py-8 pb-24">
                <Button variant="ghost" onClick={() => router.back()} className="mb-4 -ml-4">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Kembali
                </Button>
                
                <h1 className="text-2xl font-bold">Pengaturan</h1>
                <p className="text-muted-foreground mb-8">Kelola preferensi aplikasi dan tampilan Anda.</p>

                <div className="space-y-6">
                    <div className="p-4 rounded-lg bg-background space-y-4">
                        <h3 className="font-semibold flex items-center gap-2"><Palette /> Tampilan</h3>
                        <div className="flex items-center justify-between">
                            <Label htmlFor="dark-mode" className="flex items-center gap-2">
                                <Moon className="w-5 h-5" />
                                Mode Gelap
                            </Label>
                            <Switch
                                id="dark-mode"
                                checked={theme === 'dark'}
                                onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
