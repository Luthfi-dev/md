
'use client';

import { useState, useEffect, useRef, type FormEvent } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast';
import { Save, Loader2, AppWindow, Upload } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { saveAppSettings, type AppMetadata } from './actions';
import { LoadingOverlay } from '@/components/ui/loading-overlay';
import appMetadata from '@/data/app-metadata.json';


export default function AppSettingsPage() {
  const [settings, setSettings] = useState<AppMetadata>({ name: '', description: '', logoUrl: '' });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setSettings(appMetadata);
    setIsLoading(false);
  }, []);

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
        toast({ variant: 'destructive', title: 'File Tidak Valid', description: 'Hanya file gambar yang diizinkan.' });
        return;
    }
    
    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('subfolder', 'app'); // Specify subfolder for app assets

    try {
        const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData,
        });
        const result = await response.json();
        if (result.success) {
            // Update settings state with the new file path
            setSettings(s => ({ ...s, logoUrl: result.filePath }));
            toast({ title: 'Logo Berhasil Diunggah' });
        } else {
            toast({ variant: 'destructive', title: 'Gagal Mengunggah', description: result.message });
        }
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Tidak dapat terhubung ke server.';
        toast({ variant: 'destructive', title: 'Error Unggah', description: message });
    } finally {
        setIsUploading(false);
    }
  };


  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    try {
      await saveAppSettings(settings);
      toast({
        title: "Pengaturan Disimpan!",
        description: "Pengaturan aplikasi telah berhasil diperbarui. Perubahan akan terlihat setelah me-reload halaman.",
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

  // Construct the image URL from the stored path
  const logoDisplayUrl = settings.logoUrl ? `/api/images/${settings.logoUrl}?t=${new Date().getTime()}` : '';

  return (
    <>
    <LoadingOverlay isLoading={isSaving || isUploading} message={isUploading ? 'Mengunggah logo...' : 'Menyimpan pengaturan...'} />
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
              <AvatarImage src={logoDisplayUrl} />
              <AvatarFallback>M</AvatarFallback>
            </Avatar>
            <Input 
              type="file" 
              className="hidden" 
              ref={fileInputRef} 
              onChange={handleImageUpload} 
              accept="image/*"
            />
            <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
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
          
          <Button type="submit" disabled={isSaving || isUploading}>
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Simpan Pengaturan
          </Button>
        </CardContent>
      </Card>
    </form>
    </>
  );
}
