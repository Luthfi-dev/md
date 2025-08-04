
'use client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Moon, Sun, Palette } from "lucide-react";
import { useRouter } from 'next/navigation';
import { useTheme } from "next-themes";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export default function SettingsPage() {
    const router = useRouter();
    const { theme, setTheme } = useTheme();

    return (
        <div className="min-h-screen bg-secondary/30">
            <div className="container mx-auto max-w-2xl px-4 py-8 pb-24">
                <Button variant="ghost" onClick={() => router.back()} className="mb-4">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Kembali
                </Button>

                <Card>
                    <CardHeader>
                        <CardTitle>Pengaturan</CardTitle>
                        <CardDescription>Kelola preferensi aplikasi dan tampilan Anda.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="p-4 rounded-lg bg-secondary/50 space-y-4">
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
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
