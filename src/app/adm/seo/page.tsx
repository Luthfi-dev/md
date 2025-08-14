
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Save } from "lucide-react";

export default function SeoSettingsPage() {
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    toast({
      title: "Pengaturan Disimpan!",
      description: "Pengaturan SEO telah berhasil diperbarui.",
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>Pengaturan SEO</CardTitle>
          <CardDescription>
            Kelola metadata aplikasi Anda untuk meningkatkan visibilitas di mesin pencari.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="site-title">Judul Situs Global</Label>
            <Input id="site-title" placeholder="Contoh: Maudigi" defaultValue="Maudigi: Uplevel Your Life" />
            <p className="text-xs text-muted-foreground">Judul utama yang muncul di tab browser dan hasil pencarian.</p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="meta-description">Deskripsi Meta Global</Label>
            <Textarea id="meta-description" placeholder="Deskripsi singkat tentang aplikasi Anda..." defaultValue="Satu aplikasi untuk semua kebutuhan Anda: konverter file, scanner, kalkulator, dan banyak lagi. Alat canggih yang dirancang untuk produktivitas maksimal."/>
            <p className="text-xs text-muted-foreground">Deskripsi (sekitar 160 karakter) yang muncul di bawah judul pada hasil pencarian.</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="meta-keywords">Kata Kunci Meta</Label>
            <Input id="meta-keywords" placeholder="toolkit, converter, scanner, calculator" defaultValue="maudigi, toolkit, produktivitas, converter, scanner, calculator, alat produktivitas, aplikasi all-in-one" />
            <p className="text-xs text-muted-foreground">Pisahkan kata kunci dengan koma.</p>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Pratinjau Media Sosial (Open Graph)</CardTitle>
              <CardDescription>Bagaimana tampilan link Anda saat dibagikan di Facebook, Twitter, dll.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="og-title">Judul Open Graph</Label>
                <Input id="og-title" placeholder="Judul saat dibagikan" defaultValue="Maudigi: Uplevel Your Life" />
              </div>
               <div className="space-y-2">
                <Label htmlFor="og-description">Deskripsi Open Graph</Label>
                <Textarea id="og-description" placeholder="Deskripsi saat dibagikan" defaultValue="Satu aplikasi untuk semua kebutuhan Anda: konverter file, scanner, kalkulator, dan banyak lagi." />
              </div>
               <div className="space-y-2">
                <Label htmlFor="og-image-url">URL Gambar Open Graph</Label>
                <Input id="og-image-url" placeholder="https://example.com/image.png" defaultValue="/og-image.png" />
                <p className="text-xs text-muted-foreground">Gunakan gambar dengan rasio 1.91:1 (misalnya 1200x630 piksel).</p>
              </div>
            </CardContent>
          </Card>
          
          <Button type="submit">
            <Save className="mr-2 h-4 w-4" />
            Simpan Pengaturan
          </Button>
        </CardContent>
      </Card>
    </form>
  );
}
