
'use client';

import { useState, useEffect, type FormEvent } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2, Save, Flame, Star, ThumbsUp, Loader2, Settings } from "lucide-react";
import { Switch } from '@/components/ui/switch';
import { AppSettingsDialog } from '@/components/admin/AppSettingsDialog';

// Simulate fetching and saving data
import appsData from '@/data/apps.json';
import { AppSettings, loadAppSettings, saveAppSettings } from '@/data/app-settings';

export interface AppDefinition {
  id: string;
  title: string;
  description: string;
  href: string;
  icon: string;
  isPopular: boolean;
  isNew: boolean;
  order: number;
}

export default function ManageAppsPage() {
  const [apps, setApps] = useState<AppDefinition[]>([]);
  const [settings, setSettings] = useState<{ [key: string]: AppSettings }>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [editingApp, setEditingApp] = useState<AppDefinition | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Simulate fetching data
    const sortedApps = [...appsData].sort((a, b) => a.order - b.order);
    setApps(sortedApps);
    setSettings(loadAppSettings());
    setIsLoading(false);
  }, []);

  const handleInputChange = (id: string, field: keyof AppDefinition, value: string | boolean | number) => {
    setApps(currentApps =>
      currentApps.map(app => (app.id === id ? { ...app, [field]: value } : app))
    );
  };
  
  const handleAddNewApp = () => {
    const newApp: AppDefinition = {
      id: `app_${Date.now()}`,
      title: 'Aplikasi Baru',
      description: 'Deskripsi singkat aplikasi baru.',
      href: '/new-app',
      icon: 'Package',
      isPopular: false,
      isNew: true,
      order: apps.length,
    };
    setApps(currentApps => [...currentApps, newApp]);
  };

  const handleDeleteApp = (id: string) => {
    setApps(currentApps => currentApps.filter(app => app.id !== id));
  };
  
  const handleSave = async () => {
    setIsSaving(true);
    console.log("Saving data:", JSON.stringify(apps, null, 2));
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    toast({
      title: "Pengaturan Disimpan!",
      description: "Daftar aplikasi telah berhasil diperbarui.",
    });
    setIsSaving(false);
  };
  
  const handleSaveSettings = (appId: string, newSettings: AppSettings) => {
    saveAppSettings(appId, newSettings);
    setSettings(loadAppSettings());
    toast({ title: 'Pengaturan Disimpan', description: `Pengaturan untuk ${appId} telah diperbarui.` });
  };


  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AppSettingsDialog 
        app={editingApp}
        settings={editingApp ? settings[editingApp.id] : undefined}
        isOpen={!!editingApp}
        onClose={() => setEditingApp(null)}
        onSave={handleSaveSettings}
      />
      <Card>
        <CardHeader>
          <CardTitle>Kelola Aplikasi</CardTitle>
          <CardDescription>
            Atur aplikasi yang ditampilkan di halaman depan dan halaman jelajah. Urutkan, edit, atau tambahkan aplikasi baru.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center">
            <Button onClick={handleAddNewApp}>
              <Plus className="mr-2 h-4 w-4" /> Tambah
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Update
            </Button>
          </div>

          <div className="space-y-4">
            {apps.map((app, index) => (
              <Card key={app.id} className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor={`title-${app.id}`}>Judul Aplikasi</Label>
                    <Input id={`title-${app.id}`} value={app.title} onChange={e => handleInputChange(app.id, 'title', e.target.value)} />
                  </div>
                   <div className="space-y-2">
                    <Label htmlFor={`href-${app.id}`}>URL / Endpoint</Label>
                    <Input id={`href-${app.id}`} value={app.href} onChange={e => handleInputChange(app.id, 'href', e.target.value)} />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor={`description-${app.id}`}>Deskripsi</Label>
                    <Textarea id={`description-${app.id}`} value={app.description} onChange={e => handleInputChange(app.id, 'description', e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`icon-${app.id}`}>Nama Ikon (Lucide)</Label>
                    <Input id={`icon-${app.id}`} value={app.icon} onChange={e => handleInputChange(app.id, 'icon', e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`order-${app.id}`}>Urutan</Label>
                    <Input id={`order-${app.id}`} type="number" value={app.order} onChange={e => handleInputChange(app.id, 'order', parseInt(e.target.value, 10) || 0)} />
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-6 mt-4 pt-4 border-t">
                  <div className="flex items-center space-x-2">
                    <Switch id={`popular-${app.id}`} checked={app.isPopular} onCheckedChange={checked => handleInputChange(app.id, 'isPopular', checked)} />
                    <Label htmlFor={`popular-${app.id}`} className="flex items-center gap-1"><Flame className="w-4 h-4 text-orange-500"/> Populer</Label>
                  </div>
                   <div className="flex items-center space-x-2">
                    <Switch id={`new-${app.id}`} checked={app.isNew} onCheckedChange={checked => handleInputChange(app.id, 'isNew', checked)} />
                    <Label htmlFor={`new-${app.id}`} className="flex items-center gap-1"><ThumbsUp className="w-4 h-4 text-green-500"/> Baru</Label>
                  </div>
                  <div className="ml-auto flex items-center gap-2">
                    <Button variant="outline" size="icon" onClick={() => setEditingApp(app)}>
                      <Settings className="h-4 w-4" />
                    </Button>
                    <Button variant="destructive" size="icon" onClick={() => handleDeleteApp(app.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
