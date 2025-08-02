
'use client';

import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import type { AppDefinition } from '@/app/admin/apps/page';
import type { AppSettings, AdSetting } from '@/data/app-settings';
import { Loader2, Save, Upload, Settings } from 'lucide-react';
import Image from 'next/image';

interface AppSettingsDialogProps {
  app: AppDefinition | null;
  settings?: AppSettings;
  isOpen: boolean;
  onClose: () => void;
  onSave: (appId: string, settings: AppSettings) => void;
}

const defaultSettings: AppSettings = {
  isPro: false,
  ads: {
    banner: { enabled: false, type: 'manual', value: '' },
    poster: { enabled: false, type: 'manual', value: '' },
  },
};

export function AppSettingsDialog({ app, settings: initialSettings, isOpen, onClose, onSave }: AppSettingsDialogProps) {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [isSaving, setIsSaving] = useState(false);
  const bannerFileInputRef = useRef<HTMLInputElement>(null);
  const posterFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialSettings) {
      setSettings(initialSettings);
    } else {
      setSettings(defaultSettings);
    }
  }, [initialSettings]);

  if (!app) return null;

  const handleSave = () => {
    setIsSaving(true);
    onSave(app.id, settings);
    setIsSaving(false);
    onClose();
  };

  const handleAdChange = (type: 'banner' | 'poster', field: keyof AdSetting, value: any) => {
    setSettings(prev => ({
      ...prev,
      ads: {
        ...prev.ads,
        [type]: {
          ...prev.ads[type],
          [field]: value
        }
      }
    }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'banner' | 'poster') => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
            handleAdChange(type, 'value', reader.result as string);
        };
        reader.readAsDataURL(file);
    }
  };

  const renderAdSettings = (type: 'banner' | 'poster') => (
    <div className='p-4 border rounded-lg space-y-4'>
        <h4 className='font-semibold capitalize'>{type} Ad</h4>
        <div className="flex items-center space-x-2">
            <Switch id={`ad-enabled-${type}`} checked={settings.ads[type].enabled} onCheckedChange={(checked) => handleAdChange(type, 'enabled', checked)} />
            <Label htmlFor={`ad-enabled-${type}`}>Aktifkan Iklan {type}</Label>
        </div>
        {settings.ads[type].enabled && (
            <div className='space-y-4 pl-2'>
                 <RadioGroup value={settings.ads[type].type} onValueChange={(value: 'platform' | 'manual') => handleAdChange(type, 'type', value)}>
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="platform" id={`ad-type-platform-${type}`} />
                        <Label htmlFor={`ad-type-platform-${type}`}>Platform</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="manual" id={`ad-type-manual-${type}`} />
                        <Label htmlFor={`ad-type-manual-${type}`}>Manual Upload</Label>
                    </div>
                </RadioGroup>
                
                {settings.ads[type].type === 'platform' && (
                     <div className="space-y-2">
                        <Label htmlFor={`ad-value-${type}`}>Ad ID / Script URL</Label>
                        <Input id={`ad-value-${type}`} value={settings.ads[type].value} onChange={(e) => handleAdChange(type, 'value', e.target.value)} />
                    </div>
                )}

                {settings.ads[type].type === 'manual' && (
                     <div className="space-y-2">
                        <Label>Gambar Iklan</Label>
                        <div className="p-2 border border-dashed rounded-md flex flex-col items-center gap-2">
                            {settings.ads[type].value ? <Image src={settings.ads[type].value as string} alt="Preview" width={200} height={100} className='rounded-md object-contain' /> : <p className='text-xs text-muted-foreground'>Tidak ada gambar</p>}
                            <Button type="button" variant="outline" size="sm" onClick={() => (type === 'banner' ? bannerFileInputRef : posterFileInputRef).current?.click()}><Upload className='mr-2' /> Unggah</Button>
                            <Input ref={type === 'banner' ? bannerFileInputRef : posterFileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, type)} />
                        </div>
                    </div>
                )}
            </div>
        )}
    </div>
  )

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Settings />Pengaturan untuk: {app.title}</DialogTitle>
          <DialogDescription>
            Kelola fitur premium dan iklan untuk aplikasi ini.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-6 max-h-[70vh] overflow-y-auto pr-2">
          <div className="flex items-center space-x-2 p-4 border rounded-lg">
            <Switch id="is-pro" checked={settings.isPro} onCheckedChange={(checked) => setSettings(s => ({...s, isPro: checked}))} />
            <Label htmlFor="is-pro">Aktifkan Mode Pro</Label>
          </div>
          
          <h3 className="text-lg font-semibold">Pengaturan Iklan</h3>
          {renderAdSettings('banner')}
          {renderAdSettings('poster')}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Batal</Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Simpan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
