
'use client';
import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Copy, Gift, Send, Share2, ArrowLeft, Loader2, Users } from "lucide-react";
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

interface InvitedFriend {
    id: number;
    name: string;
    avatar: string | null;
    status: 'valid' | 'invalid' | 'pending';
}

export default function InvitePage() {
    const { toast } = useToast();
    const router = useRouter();
    const { user, isAuthenticated, isLoading: isAuthLoading, fetchWithAuth } = useAuth();
    const [referralLink, setReferralLink] = useState('');
    const [isApplyingCode, setIsApplyingCode] = useState(false);
    const [invitedFriends, setInvitedFriends] = useState<InvitedFriend[]>([]); // Placeholder

    useEffect(() => {
        if (!isAuthLoading && !isAuthenticated) {
            router.push('/account');
        }
        if (user?.referralCode && typeof window !== 'undefined') {
            const currentDomain = window.location.origin;
            setReferralLink(`${currentDomain}/account?ref=${user.referralCode}`);
        }
        // In a real app, you would fetch the list of invited friends here
        // fetchInvitedFriends(); 
    }, [user, isAuthenticated, isAuthLoading, router]);

    const copyToClipboard = (text: string, type: 'link' | 'code') => {
        navigator.clipboard.writeText(text);
        toast({
            title: `${type === 'link' ? 'Link' : 'Kode'} Referral Disalin!`,
            description: `Ajak temanmu untuk bergabung dan dapatkan hadiahnya.`
        });
    };
    
    const handleShare = () => {
        if (navigator.share) {
            navigator.share({
                title: 'Gabung di Maudigi!',
                text: `Gunakan kode referral saya: ${user?.referralCode} atau klik link untuk mendaftar dan dapatkan bonus!`,
                url: referralLink,
            }).catch((error) => console.log('Error sharing', error));
        } else {
            copyToClipboard(referralLink, 'link');
        }
    };

    const handleApplyCode = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setIsApplyingCode(true);
        const formData = new FormData(event.currentTarget);
        const code = formData.get("referral-code-input") as string;

        if (!code.trim()) {
            toast({ variant: 'destructive', title: 'Kode Kosong', description: 'Silakan masukkan kode referral.' });
            setIsApplyingCode(false);
            return;
        }

        try {
            const { data: result } = await fetchWithAuth('/api/referral', {
                method: 'POST',
                data: { referralCode: code }
            });

            toast({
                variant: result.success ? 'default' : 'destructive',
                title: result.success ? 'Berhasil!' : 'Gagal!',
                description: result.message
            });

        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Tidak dapat terhubung ke server.' });
        } finally {
            setIsApplyingCode(false);
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
        <div className="min-h-screen bg-card">
            <div className="px-4 py-8 pb-24">
                <Button variant="ghost" onClick={() => router.back()} className="mb-4 -ml-4">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Kembali
                </Button>

                <div className="text-center bg-gradient-to-br from-primary/80 to-primary p-8 rounded-2xl shadow-lg text-primary-foreground mb-8">
                     <Gift className="mx-auto h-16 w-16 animate-pulse" />
                     <h1 className="text-3xl font-bold">Undang Teman, Dapatkan Hadiah!</h1>
                     <p className="mt-2 opacity-90 max-w-md mx-auto">
                        Bagikan kode referral Anda. Untuk setiap teman yang bergabung, Anda berdua akan mendapatkan 200 Poin Coin gratis!
                    </p>
                </div>
                
                <div className="space-y-8">
                    <div className="p-4 rounded-xl bg-background">
                        <h2 className="font-bold text-lg">Bagikan Undangan Anda</h2>
                        <p className="text-sm text-muted-foreground mb-4">Salin link atau kode di bawah ini dan bagikan.</p>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="referral-link">Link Referral Anda</Label>
                                <div className="flex gap-2">
                                    <Input id="referral-link" value={referralLink} readOnly />
                                    <Button size="icon" variant="outline" onClick={() => copyToClipboard(referralLink, 'link')}><Copy/></Button>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="referral-code">Atau Gunakan Kode</Label>
                                <div className="flex gap-2">
                                    <Input id="referral-code" value={user.referralCode} readOnly className="text-center font-bold tracking-widest uppercase" />
                                    <Button size="icon" variant="outline" onClick={() => copyToClipboard(user.referralCode || '', 'code')}><Copy/></Button>
                                </div>
                            </div>
                            <Button className="w-full" onClick={handleShare}>
                                <Share2 className="mr-2" /> Bagikan Sekarang
                            </Button>
                        </div>
                    </div>
                
                    <div className="p-4 rounded-xl bg-background">
                         <h2 className="font-bold text-lg">Punya Kode Referral?</h2>
                         <p className="text-sm text-muted-foreground mb-4">Masukkan kode dari teman untuk mengklaim bonus.</p>
                         <form onSubmit={handleApplyCode} className="space-y-2">
                            <Label htmlFor="enter-code">Masukkan Kode Referral</Label>
                             <div className="flex gap-2">
                                <Input id="enter-code" name="referral-code-input" placeholder="Ketik kode disini..." disabled={isApplyingCode}/>
                                <Button type="submit" disabled={isApplyingCode}>
                                    {isApplyingCode ? <Loader2 className="animate-spin"/> : <Send/>}
                                </Button>
                            </div>
                         </form>
                    </div>

                    <div className="p-4 rounded-xl bg-background">
                        <h2 className="font-bold text-lg">Teman yang Diundang</h2>
                        <p className="text-sm text-muted-foreground mb-4">Daftar teman yang menggunakan kode Anda.</p>
                        {invitedFriends.length > 0 ? (
                             <div className="space-y-3">
                                {invitedFriends.map(friend => (
                                    <div key={friend.id} className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
                                        <div className='flex items-center gap-3'>
                                            <Avatar>
                                                <AvatarImage src={friend.avatar || undefined}/>
                                                <AvatarFallback>{friend.name.charAt(0)}</AvatarFallback>
                                            </Avatar>
                                            <p className="font-semibold">{friend.name}</p>
                                        </div>
                                         <Badge variant={friend.status === 'valid' ? 'default' : 'secondary'}>{friend.status}</Badge>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-muted-foreground">
                                <Users className="mx-auto h-12 w-12 mb-4" />
                                <p>Belum ada teman yang Anda undang.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
