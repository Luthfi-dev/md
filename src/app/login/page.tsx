
'use client';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight, Lock, Mail, User, TriangleAlert } from "lucide-react";
import React, { useState, useEffect, Suspense } from "react";
import { useToast } from "@/hooks/use-toast";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { LoadingOverlay } from "@/components/ui/loading-overlay";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import Link from 'next/link';

// A simple function to generate a browser fingerprint
const getBrowserFingerprint = () => {
  if (typeof window === 'undefined') return 'server-side-render';
  
  const { userAgent, language, platform, hardwareConcurrency, deviceMemory } = navigator;
  const screenResolution = `${window.screen.width}x${window.screen.height}x${window.screen.colorDepth}`;
  const timezone = new Date().getTimezoneOffset();
  
  const data = `${userAgent}|${language}|${platform}|${hardwareConcurrency}|${deviceMemory}|${screenResolution}|${timezone}`;
  
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return hash.toString();
};

function LoginForm() {
  const [isLogin, setIsLogin] = useState(true);
  const { isLoading, login, register, isAuthenticated, user } = useAuth();
  const [loadingMessage, setLoadingMessage] = useState('');
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get('redirect');

  useEffect(() => {
    // Middleware now handles redirecting logged-in users
  }, [isAuthenticated, user, router]);

  const handleFormSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoadingMessage(isLogin ? "Lagi cek data kamu..." : "Lagi daftarin kamu...");
    
    const formData = new FormData(event.currentTarget);
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const repeatPassword = formData.get("repeatPassword") as string;
    
    try {
        if (isLogin) {
            const result = await login(email, password);
            if (result.success) {
                router.push(redirectPath || '/');
            } else {
                toast({ variant: 'destructive', title: 'Login Gagal', description: result.message || 'Terjadi kesalahan.' });
            }
        } else {
            const fingerprint = getBrowserFingerprint();
            const guestData = localStorage.getItem(GUEST_STORAGE_KEY);
            const result = await register({name, email, password, repeatPassword, fingerprint, guestData });

            if (result.success) {
                toast({ title: 'Registrasi Berhasil!', description: 'Silakan masuk dengan akun baru Anda.' });
                setIsLogin(true); 
            } else {
                 toast({ variant: 'destructive', title: 'Registrasi Gagal', description: result.message || 'Terjadi kesalahan.' });
            }
        }
    } catch(error) {
         toast({
          variant: 'destructive',
          title: 'Error',
          description: error instanceof Error ? error.message : 'Tidak dapat terhubung ke server.',
        });
    } finally {
        setLoadingMessage('');
    }
  };
  
  return (
     <>
      <LoadingOverlay isLoading={isLoading} message={loadingMessage} />
      <div className="w-full max-w-md mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold font-headline text-foreground tracking-tight">
            {isLogin ? "Selamat Datang Kembali" : "Buat Akun Baru"}
          </h1>
          <p className="text-muted-foreground mt-2">
            {isLogin ? "Masuk untuk melanjutkan ke Maudigi" : "Mulai perjalanan produktif Anda bersama kami"}
          </p>
        </div>

        <Card className="bg-card p-8 rounded-2xl shadow-xl">
          <form onSubmit={handleFormSubmit} className="space-y-6">
            {!isLogin && (
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input id="name" name="name" type="text" placeholder="Nama Lengkap" className="pl-10 h-12" required />
              </div>
            )}
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input id="email" name="email" type="email" placeholder="m@example.com" required className="pl-10 h-12" />
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input id="password" name="password" type="password" required placeholder="Kata Sandi" className="pl-10 h-12" />
            </div>
            {!isLogin && (
              <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input id="repeatPassword" name="repeatPassword" type="password" required placeholder="Ulangi Kata Sandi" className="pl-10 h-12" />
              </div>
            )}
             <div className="flex items-center justify-end text-sm">
                {isLogin && (
                    <Link href="/account/forgot-password" className="font-semibold text-primary hover:underline">
                        Lupa Kata Sandi?
                    </Link>
                )}
            </div>
            
            <Button type="submit" className="w-full h-12 text-lg font-bold group" disabled={isLoading}>
              {isLogin ? "Masuk" : "Daftar"}
              <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Button>
          </form>
        </Card>

        <div className="text-center mt-8">
          <p className="text-muted-foreground">
            {isLogin ? "Belum punya akun?" : "Sudah punya akun?"}{' '}
            <button onClick={() => setIsLogin(!isLogin)} className="font-semibold text-primary hover:underline" disabled={isLoading}>
              {isLogin ? "Daftar sekarang" : "Masuk"}
            </button>
          </p>
        </div>
      </div>
    </>
  )
}

export default function LoginPage() {
    const { isAuthenticated } = useAuth();
    
    // Show a loading screen while auth is being checked to avoid content flash
    if (isAuthenticated === undefined) {
        return <LoadingOverlay isLoading={true} message="Memeriksa sesi Anda..." />;
    }

    return (
        <div className="flex flex-col min-h-screen bg-gradient-to-br from-primary/5 via-background to-background">
            <div className="flex-grow flex items-center justify-center p-4">
                 <Suspense fallback={<LoadingOverlay isLoading={true} />}>
                    <LoginForm />
                </Suspense>
            </div>
        </div>
    )
}

    