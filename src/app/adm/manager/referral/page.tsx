
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Save, Loader2, Gift } from "lucide-react";
import { Switch } from '@/components/ui/switch';

// This would typically be defined in a shared types folder
export interface ReferralSettings {
    isEnabled: boolean;
    rewardPoints: number;
}

const LOCAL_STORAGE_KEY_REFERRAL = 'referral_settings_v1';

const getReferralSettings = (): ReferralSettings => {
    if (typeof window === 'undefined') {
        return { isEnabled: true, rewardPoints: 200 };
    }
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY_REFERRAL);
    if (stored) {
        return JSON.parse(stored);
    }
    return { isEnabled: true, rewardPoints: 200 };
}

const saveReferralSettings = (settings: ReferralSettings) => {
    if (typeof window !== 'undefined') {
        localStorage.setItem(LOCAL_STORAGE_KEY_REFERRAL, JSON.stringify(settings));
    }
}

export default function ManageReferralPage() {
  const [settings, setSettings] = useState<ReferralSettings>({ isEnabled: true, rewardPoints: 200 });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const currentSettings = getReferralSettings();
    setSettings(currentSettings);
    setIsLoading(false);
  }, []);

  const handleSave = () => {
    setIsSaving(true);
    try {
        saveReferralSettings(settings);
        toast({
            title: "Pengaturan Disimpan!",
            description: "Pengaturan sistem referral telah berhasil diperbarui.",
        });
    } catch (error) {
       toast({
        variant: "destructive",
        title: "Gagal Menyimpan",
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
            <Gift /> Kelola Referral
        </CardTitle>
        <CardDescription>
          Atur sistem referral untuk pengguna. Aktifkan atau nonaktifkan dan tentukan jumlah hadiah poin.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center space-x-2 p-4 border rounded-lg">
            <Switch 
                id="referral-enabled" 
                checked={settings.isEnabled}
                onCheckedChange={(checked) => setSettings(s => ({...s, isEnabled: checked}))}
            />
            <Label htmlFor="referral-enabled">Aktifkan Sistem Referral</Label>
        </div>

        <div className="space-y-2">
          <Label htmlFor="reward-points">Poin Hadiah per Referral</Label>
          <Input
            id="reward-points"
            type="number"
            value={settings.rewardPoints}
            onChange={(e) => setSettings(s => ({...s, rewardPoints: parseInt(e.target.value, 10) || 0 }))}
            min="0"
            disabled={!settings.isEnabled}
          />
          <p className="text-xs text-muted-foreground">
            Jumlah poin yang diterima oleh pengundang dan yang diundang.
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
