
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Save, Bot, KeyRound, Mail, Plus, Trash2, Loader2, RefreshCw } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useAuth } from '@/hooks/use-auth';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

interface ApiKey {
    id: number;
    service: string;
    key_preview: string;
    status: 'active' | 'inactive';
    failure_count: number;
    last_used_at: string | null;
}

interface SmtpConfig {
    id: number;
    host: string;
    user: string;
    status: 'active' | 'inactive';
}

export default function SuperAdminSettingsPage() {
  const { toast } = useToast();
  const { fetchWithAuth } = useAuth();
  
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [smtpConfigs, setSmtpConfigs] = useState<SmtpConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // State for new items
  const [newApiKey, setNewApiKey] = useState('');
  const [newSmtp, setNewSmtp] = useState({ host: '', port: '587', secure: true, user: '', pass: '' });

  const fetchData = async () => {
    setIsLoading(true);
    try {
        const [keysRes, smtpRes] = await Promise.all([
            fetchWithAuth('/api/superadmin/apikeys'),
            fetchWithAuth('/api/superadmin/smtp')
        ]);
        if (!keysRes.ok || !smtpRes.ok) throw new Error("Gagal mengambil data pengaturan.");
        
        const keysData = await keysRes.json();
        const smtpData = await smtpRes.json();

        if (!keysData.success || !smtpData.success) throw new Error("Gagal memuat data dari server.");

        setApiKeys(keysData.keys);
        setSmtpConfigs(smtpData.configs);
    } catch (error) {
        toast({ variant: 'destructive', title: "Gagal Memuat", description: (error as Error).message });
    } finally {
        setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddApiKey = async () => {
    if (!newApiKey.trim()) {
        toast({variant: 'destructive', title: 'Kunci API tidak boleh kosong'});
        return;
    }
    setIsSaving(true);
    try {
        const res = await fetchWithAuth('/api/superadmin/apikeys', {
            method: 'POST',
            body: JSON.stringify({ service: 'gemini', key: newApiKey })
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.message);
        toast({ title: "Kunci API Ditambahkan!" });
        setNewApiKey('');
        fetchData();
    } catch (error) {
        toast({ variant: 'destructive', title: "Gagal Menambah", description: (error as Error).message });
    } finally {
        setIsSaving(false);
    }
  };
  
  const handleDeleteApiKey = async (id: number) => {
    setIsSaving(true);
     try {
        const res = await fetchWithAuth(`/api/superadmin/apikeys?id=${id}`, { method: 'DELETE' });
        const data = await res.json();
        if (!data.success) throw new Error(data.message);
        toast({ title: "Kunci API Dihapus!" });
        fetchData();
    } catch (error) {
        toast({ variant: 'destructive', title: "Gagal Menghapus", description: (error as Error).message });
    } finally {
        setIsSaving(false);
    }
  }
  
  const handleResetFailures = async (id: number) => {
      setIsSaving(true);
      try {
        const res = await fetchWithAuth(`/api/superadmin/apikeys/reset?id=${id}`, { method: 'POST' });
        const data = await res.json();
        if(!data.success) throw new Error(data.message);
        toast({title: "Counter Direset!"});
        fetchData();
      } catch (e) {
         toast({ variant: 'destructive', title: "Gagal Mereset", description: (e as Error).message });
      } finally {
        setIsSaving(false);
      }
  }

  const handleAddSmtp = async () => {
    // Basic validation
    if (!newSmtp.host || !newSmtp.user || !newSmtp.pass) {
        toast({variant: 'destructive', title: 'Data SMTP tidak lengkap'});
        return;
    }
    setIsSaving(true);
     try {
        const payload = { ...newSmtp, port: parseInt(newSmtp.port, 10) };
        const res = await fetchWithAuth('/api/superadmin/smtp', {
            method: 'POST',
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.message);
        toast({ title: "Konfigurasi SMTP Ditambahkan!" });
        setNewSmtp({ host: '', port: '587', secure: true, user: '', pass: '' });
        fetchData();
    } catch (error) {
        toast({ variant: 'destructive', title: "Gagal Menambah", description: (error as Error).message });
    } finally {
        setIsSaving(false);
    }
  }
  
  const handleDeleteSmtp = async (id: number) => {
      setIsSaving(true);
      try {
          const res = await fetchWithAuth(`/api/superadmin/smtp?id=${id}`, { method: 'DELETE' });
          const data = await res.json();
          if(!data.success) throw new Error(data.message);
          toast({title: "Konfigurasi SMTP Dihapus!"});
          fetchData();
      } catch(e) {
           toast({ variant: 'destructive', title: "Gagal Menghapus", description: (e as Error).message });
      } finally {
          setIsSaving(false);
      }
  }

  if (isLoading) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-8">
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><KeyRound/> Kelola Kunci API Gemini</CardTitle>
                <CardDescription>
                    Tambah atau hapus kunci API untuk layanan AI generatif. Sistem akan merotasi kunci secara otomatis.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    {apiKeys.map(key => (
                        <div key={key.id} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 p-3 border rounded-lg">
                            <div className="flex-1">
                                <p className="font-mono text-sm truncate">ID: {key.id} | Kunci: ...{key.key_preview}</p>
                                <p className="text-xs text-muted-foreground">
                                    Status: <span className={key.status === 'active' ? 'font-semibold text-green-500' : 'font-semibold text-destructive'}>{key.status}</span>, 
                                    Gagal: {key.failure_count}
                                </p>
                            </div>
                            <div className='flex gap-2 items-center'>
                               <Button variant="ghost" size="icon" onClick={() => handleResetFailures(key.id)} disabled={isSaving}><RefreshCw className="h-4 w-4" /></Button>
                               <AlertDialog>
                                 <AlertDialogTrigger asChild>
                                    <Button variant="ghost" size="icon" disabled={isSaving}><Trash2 className="h-4 w-4 text-destructive"/></Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader><AlertDialogTitle>Hapus Kunci API ini?</AlertDialogTitle></AlertDialogHeader>
                                    <AlertDialogFooter><AlertDialogCancel>Batal</AlertDialogCancel><AlertDialogAction onClick={() => handleDeleteApiKey(key.id)}>Hapus</AlertDialogAction></AlertDialogFooter>
                                  </AlertDialogContent>
                               </AlertDialog>
                            </div>
                        </div>
                    ))}
                </div>
                 <div className="flex gap-2">
                    <Input placeholder="Masukkan kunci API baru..." value={newApiKey} onChange={(e) => setNewApiKey(e.target.value)} disabled={isSaving}/>
                    <Button onClick={handleAddApiKey} disabled={isSaving || !newApiKey.trim()}><Plus /></Button>
                 </div>
            </CardContent>
        </Card>

         <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Mail/> Kelola Konfigurasi SMTP</CardTitle>
                <CardDescription>
                    Atur server email untuk mengirim email transaksional. Sistem akan merotasi secara otomatis.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                 <div className="space-y-2">
                    {smtpConfigs.map(smtp => (
                        <div key={smtp.id} className="flex items-center gap-4 p-3 border rounded-lg">
                            <div className="flex-1">
                                <p className="font-semibold">{smtp.host}</p>
                                <p className="text-xs text-muted-foreground">User: {smtp.user}, Status: <span className="font-semibold text-green-500">{smtp.status}</span></p>
                            </div>
                             <AlertDialog>
                                 <AlertDialogTrigger asChild>
                                     <Button variant="ghost" size="icon" disabled={isSaving}><Trash2 className="h-4 w-4 text-destructive"/></Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader><AlertDialogTitle>Hapus Konfigurasi SMTP ini?</AlertDialogTitle></AlertDialogHeader>
                                    <AlertDialogFooter><AlertDialogCancel>Batal</AlertDialogCancel><AlertDialogAction onClick={() => handleDeleteSmtp(smtp.id)}>Hapus</AlertDialogAction></AlertDialogFooter>
                                </AlertDialogContent>
                             </AlertDialog>
                        </div>
                    ))}
                </div>
                <div className='p-4 border rounded-lg space-y-3'>
                    <h4 className='font-semibold'>Tambah Konfigurasi Baru</h4>
                    <div className='grid grid-cols-2 gap-4'>
                        <div className="space-y-1"><Label>Host</Label><Input value={newSmtp.host} onChange={e => setNewSmtp(s=>({...s, host: e.target.value}))}/></div>
                        <div className="space-y-1"><Label>Port</Label><Input value={newSmtp.port} onChange={e => setNewSmtp(s=>({...s, port: e.target.value}))}/></div>
                    </div>
                     <div className="space-y-1"><Label>User</Label><Input value={newSmtp.user} onChange={e => setNewSmtp(s=>({...s, user: e.target.value}))}/></div>
                     <div className="space-y-1"><Label>Password</Label><Input type="password" value={newSmtp.pass} onChange={e => setNewSmtp(s=>({...s, pass: e.target.value}))}/></div>
                     <div className="flex items-center space-x-2"><Switch checked={newSmtp.secure} onCheckedChange={c=>setNewSmtp(s=>({...s, secure:c}))} id="smtp-secure"/><Label htmlFor="smtp-secure">Gunakan SSL/TLS (Secure)</Label></div>
                     <Button onClick={handleAddSmtp} disabled={isSaving}>Tambah</Button>
                </div>
            </CardContent>
        </Card>
    </div>
  );
}
