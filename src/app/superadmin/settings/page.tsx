
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Save, Bot, KeyRound, Mail, Plus, Trash2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";

// Placeholder data - in a real app, this would come from an API call
const placeholderApiKeys = [
    { id: 1, key: 'AIzaSy...A1b2c3', status: 'active', failures: 0 },
    { id: 2, key: 'AIzaSy...X4y5z6', status: 'active', failures: 1 },
];

const placeholderSmtp = [
    { id: 1, host: 'smtp.gmail.com', user: 'user1@gmail.com', status: 'active' },
];

export default function SuperAdminSettingsPage() {
  const { toast } = useToast();

  // In a real app, you would have state management (useState, useEffect) here
  // to fetch and update these settings.

  const handleSave = () => {
    toast({
      title: "Pengaturan Disimpan!",
      description: "Perubahan telah berhasil disimpan (simulasi).",
    });
  };

  return (
    <div className="space-y-8">
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><KeyRound/> Kelola Kunci API Gemini</CardTitle>
                <CardDescription>
                    Tambah, lihat, atau nonaktifkan kunci API untuk layanan AI generatif.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    {placeholderApiKeys.map(key => (
                        <div key={key.id} className="flex items-center gap-4 p-3 border rounded-lg">
                            <div className="flex-1">
                                <p className="font-mono text-sm truncate">...{key.key.slice(-6)}</p>
                                <p className="text-xs text-muted-foreground">Status: <span className="font-semibold text-green-500">{key.status}</span>, Gagal: {key.failures}</p>
                            </div>
                            <Button variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-destructive"/></Button>
                        </div>
                    ))}
                </div>
                 <Button variant="outline"><Plus className="mr-2"/> Tambah Kunci API Baru</Button>
            </CardContent>
        </Card>

         <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Mail/> Kelola Konfigurasi SMTP</CardTitle>
                <CardDescription>
                    Atur server email yang digunakan untuk mengirim email transaksional seperti reset kata sandi.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                 <div className="space-y-2">
                    {placeholderSmtp.map(smtp => (
                        <div key={smtp.id} className="flex items-center gap-4 p-3 border rounded-lg">
                            <div className="flex-1">
                                <p className="font-semibold">{smtp.host}</p>
                                <p className="text-xs text-muted-foreground">User: {smtp.user}, Status: <span className="font-semibold text-green-500">{smtp.status}</span></p>
                            </div>
                            <Switch defaultChecked={smtp.status === 'active'}/>
                            <Button variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-destructive"/></Button>
                        </div>
                    ))}
                </div>
                <Button variant="outline"><Plus className="mr-2"/> Tambah Konfigurasi SMTP</Button>
            </CardContent>
        </Card>
    </div>
  );
}
