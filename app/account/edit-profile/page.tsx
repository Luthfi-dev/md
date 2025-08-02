
'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Camera, Loader2, Mail, Save, User, Phone } from "lucide-react";
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/use-auth';

export default function EditProfilePage() {
    const router = useRouter();
    const { toast } = useToast();
    const { user, isAuthenticated, isLoading: isAuthLoading, fetchWithAuth, updateUser } = useAuth();
    
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [avatarUrl, setAvatarUrl] = useState<string | undefined>(undefined);
    const [avatarPath, setAvatarPath] = useState<string | null | undefined>(undefined);
    const [isSaving, setIsSaving] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (!isAuthLoading && !isAuthenticated) {
            router.push('/account');
        }
        if (user) {
            setName(user.name || '');
            setPhone(user.phone || '');
            setAvatarPath(user.avatar);
            if(user.avatar) {
                 setAvatarUrl(`/api/images/${user.avatar}`);
            } else {
                 setAvatarUrl(undefined);
            }
        }
    }, [user, isAuthenticated, isAuthLoading, router]);
    
    const getInitials = (nameStr: string) => {
        if(!nameStr) return '';
        return nameStr.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    }
    
    const uploadAvatar = async (file: File): Promise<string | null> => {
        setIsUploading(true);
        const formData = new FormData();
        formData.append('file', file);
        formData.append('subfolder', 'avatars');

        try {
            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            });
            const result = await response.json();
            if (result.success) {
                return result.filePath;
            } else {
                toast({ variant: 'destructive', title: 'Gagal Mengunggah', description: result.message });
                return null;
            }
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Tidak dapat terhubung ke server.';
            toast({ variant: 'destructive', title: 'Error Unggah', description: message });
            return null;
        } finally {
            setIsUploading(false);
        }
    };

    const handleImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const newAvatarPath = await uploadAvatar(file);
            if(newAvatarPath) {
                // Update preview URL with a timestamp to break browser cache
                setAvatarUrl(`/api/images/${newAvatarPath}?t=${new Date().getTime()}`);
                // Set the path to be saved later when the user clicks "Simpan"
                setAvatarPath(newAvatarPath);
            }
        }
    };
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const payload: { name: string; phone: string; avatar_url?: string | null } = {
                name,
                phone,
            };

            // Only include avatar_url in payload if it has been changed.
            // `user.avatar` is the original value, `avatarPath` is the new one.
            if (avatarPath !== user?.avatar) {
                payload.avatar_url = avatarPath;
            }

            const response = await fetchWithAuth('/api/user/update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const result = await response.json();

            if (result.success && result.user) {
                updateUser(result.user);
                toast({
                    title: "Profil Diperbarui!",
                    description: "Perubahan pada profil Anda telah berhasil disimpan."
                });
                router.push('/account/profile');
            } else {
                toast({
                    variant: 'destructive',
                    title: 'Gagal Menyimpan',
                    description: result.message || 'Terjadi kesalahan saat menyimpan profil.'
                });
            }
        } catch (error) {
             const message = error instanceof Error ? error.message : 'Tidak dapat terhubung ke server.';
             toast({ variant: 'destructive', title: 'Error', description: message });
        } finally {
            setIsSaving(false);
        }
    };
    
    if (isAuthLoading || !user) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-secondary/30">
             <div className="container mx-auto max-w-2xl px-4 py-8 pb-24">
                <Button variant="ghost" onClick={() => router.back()} className="mb-4">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Kembali
                </Button>
                <Card>
                    <CardHeader>
                        <CardTitle>Edit Profil</CardTitle>
                        <CardDescription>Perbarui informasi pribadi dan foto profil Anda.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-8">
                             <div className="flex flex-col items-center gap-4">
                                <div className="relative">
                                    <Avatar className="w-32 h-32 text-5xl">
                                        <AvatarImage src={avatarUrl} data-ai-hint="profile picture" />
                                        <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                                    </Avatar>
                                     <Button 
                                        type="button" 
                                        variant="outline" 
                                        size="icon" 
                                        className="absolute bottom-1 right-1 rounded-full h-10 w-10 bg-background"
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={isUploading || isSaving}
                                    >
                                        {isUploading ? <Loader2 className="animate-spin"/> : <Camera className="w-5 h-5" />}
                                    </Button>
                                    <Input 
                                        type="file" 
                                        className="hidden" 
                                        ref={fileInputRef} 
                                        onChange={handleImageChange} 
                                        accept="image/png, image/jpeg, image/webp"
                                    />
                                </div>
                            </div>
                            
                            <div className="space-y-2">
                                <Label htmlFor="name">Nama Lengkap</Label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                    <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="pl-10"/>
                                </div>
                            </div>

                             <div className="space-y-2">
                                <Label htmlFor="email">Alamat Email</Label>
                                 <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                    <Input id="email" value={user.email} disabled className="pl-10"/>
                                </div>
                                <p className="text-xs text-muted-foreground">Email tidak dapat diubah.</p>
                            </div>

                             <div className="space-y-2">
                                <Label htmlFor="phone">Nomor Telepon (Opsional)</Label>
                                 <div className="relative">
                                     <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                     <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Contoh: 08123456789" className="pl-10"/>
                                 </div>
                            </div>

                            <Button type="submit" disabled={isSaving || isUploading} className="w-full">
                                {isSaving ? <Loader2 className="mr-2 animate-spin"/> : <Save className="mr-2" />}
                                Simpan Perubahan
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
