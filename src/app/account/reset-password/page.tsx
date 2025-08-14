
'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Lock } from 'lucide-react';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    if (!token) {
      setError('Token reset tidak valid atau tidak ditemukan. Silakan coba lagi dari email Anda.');
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast({ variant: 'destructive', title: 'Kata Sandi Tidak Cocok' });
      return;
    }
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      const result = await response.json();

      if (result.success) {
        toast({
          title: 'Berhasil!',
          description: 'Kata sandi Anda telah berhasil diatur ulang. Silakan login.',
        });
        router.push('/login');
      } else {
        toast({ variant: 'destructive', title: 'Gagal', description: result.message || 'Token tidak valid atau telah kedaluwarsa.' });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Tidak dapat terhubung ke server.';
      toast({ variant: 'destructive', title: 'Error', description: message });
    } finally {
      setIsLoading(false);
    }
  };

  if (error) {
    return <p className="text-destructive text-center">{error}</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="password">Kata Sandi Baru</Label>
        <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="pl-10 h-12"
            />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="confirm-password">Ulangi Kata Sandi Baru</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="pl-10 h-12"
            />
        </div>
      </div>
      <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading ? <Loader2 className="mr-2 animate-spin" /> : null}
        Atur Ulang Kata Sandi
      </Button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/5 via-background to-background p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-xl rounded-2xl">
          <CardHeader>
            <CardTitle>Atur Ulang Kata Sandi</CardTitle>
            <CardDescription>Masukkan kata sandi baru Anda di bawah ini.</CardDescription>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<Loader2 className="mx-auto h-8 w-8 animate-spin" />}>
              <ResetPasswordForm />
            </Suspense>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
