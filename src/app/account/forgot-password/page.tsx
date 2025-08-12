
'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Mail, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: 'Email Terkirim!',
          description: 'Jika email terdaftar, Anda akan menerima link untuk reset kata sandi.',
        });
      } else {
        toast({
          variant: 'destructive',
          title: 'Gagal',
          description: result.message || 'Terjadi kesalahan.',
        });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Tidak dapat terhubung ke server.';
      toast({ variant: 'destructive', title: 'Error', description: message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/5 via-background to-background p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-xl rounded-2xl">
          <CardHeader>
            <CardTitle>Lupa Kata Sandi</CardTitle>
            <CardDescription>Masukkan email Anda. Kami akan mengirimkan link untuk mengatur ulang kata sandi Anda.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email">Alamat Email</Label>
                 <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                        id="email"
                        type="email"
                        placeholder="m@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="pl-10 h-12"
                    />
                </div>
              </div>
              <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading ? <Loader2 className="mr-2 animate-spin" /> : null}
                Kirim Link Reset
              </Button>
            </form>
          </CardContent>
        </Card>
        <div className="mt-4 text-center">
            <Button variant="ghost" asChild>
                <Link href="/account">
                    <ArrowLeft className="mr-2"/> Kembali ke Halaman Login
                </Link>
            </Button>
        </div>
      </div>
    </div>
  );
}
