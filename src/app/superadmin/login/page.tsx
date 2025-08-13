
'use client';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight, Lock, Mail, ShieldAlert } from "lucide-react";
import React, { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { LoadingOverlay } from "@/components/ui/loading-overlay";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

export default function SuperAdminLoginPage() {
  const { login, isAuthenticated, user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    // If user is already logged in and is a superadmin, redirect to dashboard
    if (isAuthenticated && user?.role === 1) {
      router.replace('/superadmin');
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
                router.push('/superadmin');
            } else {
                 toast({ variant: 'destructive', title: 'Akses Ditolak', description: 'Anda bukan Super Admin.' });
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

  return (
    <>
      <LoadingOverlay isLoading={isLoading} message="Mengecek kredensial..." />
      <div className="flex flex-col min-h-screen items-center justify-center bg-destructive/10 p-4">
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
      </div>
    </>
  );
}
