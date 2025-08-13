
'use client';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight, Lock, Mail, User } from "lucide-react";
import React, { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { LoadingOverlay } from "@/components/ui/loading-overlay";

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


export default function LoginPage() {
  const [isLoginView, setIsLoginView] = useState(true);
  const { isLoading, login, register, isAuthenticated } = useAuth();
  const [loadingMessage, setLoadingMessage] = useState('');
  const { toast } = useToast();
  const router = useRouter();

  // Middleware now handles redirecting logged-in users away from this page
  // This effect is a safeguard for client-side navigation.
  useEffect(() => {
    if (isAuthenticated) {
        router.replace('/');
    }
  }, [isAuthenticated, router]);

  const handleFormSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoadingMessage(isLoginView ? "Mengecek kredensial Anda..." : "Mendaftarkan akun baru...");
    
    const formData = new FormData(event.currentTarget);
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const repeatPassword = formData.get("repeatPassword") as string;
    
    try {
        if (isLoginView) {
            const result = await login(email, password);
            if (result.success) {
                // On successful login, ALWAYS redirect to the homepage.
                // The middleware will handle role-based redirects.
                router.push('/');
            } else {
                toast({ variant: 'destructive', title: 'Login Gagal', description: result.message || 'Terjadi kesalahan.' });
            }
        } else {
            const fingerprint = getBrowserFingerprint();
            const guestData = localStorage.getItem('guestRewardState_v3');
            const result = await register({name, email, password, repeatPassword, fingerprint, guestData});

            if (result.success) {
                toast({ title: 'Registrasi Berhasil!', description: 'Silakan masuk dengan akun baru Anda.' });
                setIsLoginView(true); // Switch to login view after successful registration
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
  
  if (isAuthenticated === undefined || isAuthenticated === true) {
     return <LoadingOverlay isLoading={true} message="Memeriksa sesi Anda..." />;
  }

  return (
    <>
      <LoadingOverlay isLoading={isLoading} message={loadingMessage} />
      <div className="flex flex-col min-h-screen bg-gradient-to-br from-primary/5 via-background to-background">
        <div className="flex-grow flex items-center justify-center p-4">
          <div className="w-full max-w-md mx-auto">
            <div className="text-center mb-10">
              <h1 className="text-4xl font-bold font-headline text-foreground tracking-tight">
                {isLoginView ? "Selamat Datang" : "Buat Akun"}
              </h1>
              <p className="text-muted-foreground mt-2">
                {isLoginView ? "Masuk untuk melanjutkan" : "Mulai perjalananmu bersama kami"}
              </p>
            </div>

            <div className="bg-card p-8 rounded-2xl shadow-xl">
              <form onSubmit={handleFormSubmit} className="space-y-6">
                {!isLoginView && (
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input id="name" name="name" type="text" placeholder="Nama Lengkap" className="pl-10 h-12 rounded-full" required />
                  </div>
                )}
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input id="email" name="email" type="email" placeholder="m@example.com" required className="pl-10 h-12 rounded-full" />
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input id="password" name="password" type="password" required placeholder="Kata Sandi" className="pl-10 h-12 rounded-full" />
                </div>
                {!isLoginView && (
                  <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <Input id="repeatPassword" name="repeatPassword" type="password" required placeholder="Ulangi Kata Sandi" className="pl-10 h-12 rounded-full" />
                  </div>
                )}
                
                <Button type="submit" className="w-full h-12 rounded-full bg-primary hover:bg-primary/90 text-lg font-bold group" disabled={isLoading}>
                  {isLoginView ? "Masuk" : "Daftar"}
                  <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Button>
              </form>
            </div>

            <div className="text-center mt-8">
              <p className="text-muted-foreground">
                {isLoginView ? "Belum punya akun?" : "Sudah punya akun?"}{' '}
                <button onClick={() => setIsLoginView(!isLoginView)} className="font-semibold text-primary hover:underline" disabled={isLoading}>
                  {isLoginView ? "Daftar sekarang" : "Masuk"}
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
