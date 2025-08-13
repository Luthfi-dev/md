
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Save, Loader2, ChevronsLeftRight } from "lucide-react";
import { getPaginationSettings, savePaginationSettings, PaginationSettings } from '@/data/app-settings';

export default function PaginationSettingsPage() {
  const [settings, setSettings] = useState<PaginationSettings>({ itemsPerPage: 15 });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const currentSettings = getPaginationSettings();
    setSettings(currentSettings);
    setIsLoading(false);
  }, []);

  const handleSave = () => {
    setIsSaving(true);
    try {
      savePaginationSettings(settings);
      toast({
        title: "Pengaturan Disimpan!",
        description: "Pengaturan paginasi telah berhasil diperbarui.",
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Terjadi kesalahan yang tidak diketahui.";
      toast({
        variant: "destructive",
        title: "Gagal Menyimpan",
        description: message,
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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
            <ChevronsLeftRight /> Pengaturan Paginasi
        </CardTitle>
        <CardDescription>
          Atur jumlah data yang ditampilkan per halaman pada semua daftar di panel admin.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="items-per-page">Item per Halaman</Label>
          <Input
            id="items-per-page"
            type="number"
            value={settings.itemsPerPage}
            onChange={(e) => setSettings({ itemsPerPage: parseInt(e.target.value, 10) || 1 })}
            min="1"
            max="100"
          />
          <p className="text-xs text-muted-foreground">
            Jumlah item yang akan ditampilkan di setiap halaman. Default adalah 15.
          </p>
        </div>
        
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Simpan Pengaturan
        </Button>
      </CardContent>
    </Card>
  );
}
