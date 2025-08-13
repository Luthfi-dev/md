
'use client';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight, Lock, Mail, ShieldAlert, TriangleAlert } from "lucide-react";
import React, { useState, useEffect, Suspense } from "react";
import { useToast } from "@/hooks/use-toast";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { LoadingOverlay } from "@/components/ui/loading-overlay";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";


function SuperAdminLoginContent() {
  const { login, isAuthenticated, user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const lock = searchParams.get('lock');

  useEffect(() => {
    if (isAuthenticated && user?.role === 1) {
      router.replace('/spa');
    }
  }, [isAuthenticated, user, router]);

  const handleFormSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);

    const formData = new FormData(event.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    
    try {
        const result = await login(email, password);
        if (result.success && result.user) {
            if (result.user.role === 1) {
                router.push('/spa');
            } else {
                 toast({ variant: 'destructive', title: 'Akses Ditolak', description: 'Anda bukan Super Admin.' });
                 await login('', ''); // Effectively logs out by failing
            }
        } else {
            toast({ variant: 'destructive', title: 'Login Gagal', description: result.message || 'Terjadi kesalahan.' });
        }
    } catch(error) {
         toast({
          variant: 'destructive',
          title: 'Error',
          description: error instanceof Error ? error.message : 'Tidak dapat terhubung ke server.',
        });
    } finally {
        setIsLoading(false);
    }
  };
  
  if (lock !== '0') {
    return (
         <div className="flex flex-col items-center justify-center text-center text-muted-foreground p-8">
            <TriangleAlert className="w-16 h-16 text-yellow-500 mb-4" />
            <h1 className="text-2xl font-bold text-foreground">Halaman Tidak Tersedia</h1>
            <p className="mt-2">Halaman yang Anda cari mungkin telah dipindahkan atau tidak ada.</p>
        </div>
    );
  }

  return (
    <>
      <LoadingOverlay isLoading={isLoading} message="Mengecek kredensial..." />
      <Card className="w-full max-w-md shadow-2xl border-destructive">
          <CardHeader className="text-center">
              <ShieldAlert className="mx-auto h-12 w-12 text-destructive" />
              <CardTitle className="text-2xl text-destructive">Super Admin Login</CardTitle>
              <CardDescription>Area terbatas. Hanya untuk Super Admin.</CardDescription>
          </CardHeader>
          <CardContent>
              <form onSubmit={handleFormSubmit} className="space-y-6">
                  <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <Input id="email" name="email" type="email" placeholder="superadmin@example.com" required className="pl-10 h-12" />
                  </div>
                  <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <Input id="password" name="password" type="password" required placeholder="Kata Sandi" className="pl-10 h-12" />
                  </div>
                  <Button type="submit" variant="destructive" className="w-full h-12" disabled={isLoading}>
                      Masuk <ArrowRight className="ml-2" />
                  </Button>
              </form>
          </CardContent>
      </Card>
    </>
  );
}

export default function SpaLoginPage() {
    return (
        <div className="flex flex-col min-h-screen items-center justify-center bg-destructive/10 p-4">
             <Suspense fallback={<LoadingOverlay isLoading={true} />}>
                <SuperAdminLoginContent />
            </Suspense>
        </div>
    )
}
