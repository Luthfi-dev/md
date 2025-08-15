
'use client';

import { useState, useEffect, useRef, type FormEvent } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Save, Loader2, AppWindow, Upload } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { optimizeImage } from '@/lib/utils';
import { saveAppSettings, type AppMetadata } from './actions';

// Simulate fetching data from a file
import appMetadata from '@/data/app-metadata.json';

export default function AppSettingsPage() {
  const [settings, setSettings] = useState<AppMetadata>({ name: '', description: '', logoUrl: '' });
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setSettings(appMetadata);
    if (appMetadata.logoUrl) {
      setPreviewImage(appMetadata.logoUrl);
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
        const optimizedFile = await optimizeImage(file, 256); // Optimize for logo size
        const reader = new FileReader();
        reader.onloadend = () => {
          const dataUrl = reader.result as string;
          setPreviewImage(dataUrl);
          setSettings(s => ({ ...s, logoUrl: dataUrl }));
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
      await saveAppSettings(settings);
      toast({
        title: "Pengaturan Disimpan!",
        description: "Pengaturan aplikasi telah berhasil diperbarui.",
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
            <AppWindow /> Pengaturan Aplikasi Global
          </CardTitle>
          <CardDescription>
            Atur nama, deskripsi, dan logo aplikasi yang akan ditampilkan di seluruh platform.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">

          <div className='flex flex-col items-center gap-4'>
            <Avatar className='w-24 h-24 text-4xl ring-2 ring-primary/20 p-1'>
              <AvatarImage src={previewImage || settings.logoUrl} />
              <AvatarFallback>M</AvatarFallback>
            </Avatar>
            <Input 
              type="file" 
              className="hidden" 
              ref={fileInputRef} 
              onChange={handleImageUpload} 
              accept="image/*"
            />
            <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
              <Upload className='mr-2' /> Unggah Logo
            </Button>
          </div>

          <div className="space-y-2">
            <Label htmlFor="app-name">Nama Aplikasi</Label>
            <Input 
              id="app-name" 
              placeholder="Contoh: Maudigi" 
              value={settings.name}
              onChange={(e) => setSettings(s => ({ ...s, name: e.target.value }))}
            />
            <p className="text-xs text-muted-foreground">Nama ini akan ditampilkan sebagai judul halaman dan di dalam aplikasi.</p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="app-description">Deskripsi Aplikasi</Label>
            <Textarea 
              id="app-description" 
              placeholder="Deskripsi singkat tentang aplikasi Anda..." 
              value={settings.description}
              onChange={(e) => setSettings(s => ({ ...s, description: e.target.value }))}
              rows={5}
            />
            <p className="text-xs text-muted-foreground">
              Deskripsi ini digunakan untuk metadata SEO dan di berbagai bagian aplikasi.
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
