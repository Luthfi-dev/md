
'use client';

import { useState, useEffect, type FormEvent, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Save, Loader2, Bot, Upload } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { optimizeImage } from '@/lib/utils';
import { saveAssistantSettings, type AssistantSettings } from './actions';

// Simulate fetching data
import assistantData from '@/data/assistant.json';

export default function AssistantSettingsPage() {
  const [settings, setSettings] = useState<AssistantSettings>({ name: '', systemPrompt: '', avatarUrl: '' });
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Simulate fetching data from a file or API
    setSettings(assistantData);
    if (assistantData.avatarUrl) {
      setPreviewImage(assistantData.avatarUrl);
    }
    setIsLoading(false);
  }, []);

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast({
          variant: 'destructive',
          title: 'File Tidak Valid',
          description: 'Hanya file gambar yang diizinkan.'
        });
        return;
      }

      try {
        const optimizedFile = await optimizeImage(file, 800); // Optimize to max 800px width
        const reader = new FileReader();
        reader.onloadend = () => {
          const dataUrl = reader.result as string;
          setPreviewImage(dataUrl);
          // For this simulation, we'll just use the data URL.
          setSettings(s => ({ ...s, avatarUrl: dataUrl }));
        };
        reader.readAsDataURL(optimizedFile);
      } catch (error) {
        console.error("Image optimization failed:", error);
        toast({
          variant: 'destructive',
          title: 'Gagal Mengoptimalkan Gambar',
          description: 'Terjadi kesalahan saat memproses gambar Anda.',
        });
      }
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    try {
      await saveAssistantSettings(settings);
      toast({
        title: "Pengaturan Disimpan!",
        description: "Pengaturan asisten AI telah berhasil diperbarui.",
      });
    } catch (error) {
       toast({
        variant: "destructive",
        title: "Gagal Menyimpan!",
        description: error instanceof Error ? error.message : "Terjadi kesalahan yang tidak diketahui.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot /> Pengaturan Asisten AI
          </CardTitle>
          <CardDescription>
            Kustomisasi nama, foto profil, kepribadian, dan pengetahuan dasar dari asisten AI Anda.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">

          <div className='flex flex-col items-center gap-4'>
            <Avatar className='w-24 h-24 text-4xl'>
              <AvatarImage src={previewImage || settings.avatarUrl} />
              <AvatarFallback><Bot /></AvatarFallback>
            </Avatar>
            <Input 
              type="file" 
              className="hidden" 
              ref={fileInputRef} 
              onChange={handleImageUpload} 
              accept="image/*"
            />
            <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
              <Upload className='mr-2' /> Unggah Gambar
            </Button>
          </div>

          <div className="space-y-2">
            <Label htmlFor="assistant-name">Nama Asisten</Label>
            <Input 
              id="assistant-name" 
              placeholder="Contoh: Asisten Cerdas" 
              value={settings.name}
              onChange={(e) => setSettings(s => ({ ...s, name: e.target.value }))}
            />
            <p className="text-xs text-muted-foreground">Nama ini akan ditampilkan di header halaman chat.</p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="system-prompt">System Prompt (Kepribadian & Pengetahuan Dasar)</Label>
            <Textarea 
              id="system-prompt" 
              placeholder="Deskripsikan kepribadian dan peran asisten..." 
              value={settings.systemPrompt}
              onChange={(e) => setSettings(s => ({ ...s, systemPrompt: e.target.value }))}
              rows={15}
            />
            <p className="text-xs text-muted-foreground">
              Ini adalah instruksi inti untuk AI. Jelaskan perannya, gaya bahasanya (misal: Gen Z, ceria, sopan), dan pengetahuan dasar seperti siapa pembuatnya.
            </p>
          </div>
          
          <Button type="submit" disabled={isSaving}>
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Simpan Pengaturan
          </Button>
        </CardContent>
      </Card>
    </form>
  );
}
