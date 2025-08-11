
'use client';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, ArrowUp, ArrowDown, History, BarChart, MoreHorizontal, Wallet as WalletIcon, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { LoadingOverlay } from '@/components/ui/loading-overlay';

// This is the main dashboard page for the wallet.
export default function WalletDashboardPage() {
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      router.push('/account');
    }
  }, [isAuthLoading, isAuthenticated, router]);
  
  useEffect(() => {
    // Simulate data fetching
    setTimeout(() => setIsLoading(false), 500);
  }, []);

  if (isAuthLoading || isLoading) {
      return <LoadingOverlay isLoading={true} message="Mempersiapkan Dompet Anda..." />;
  }

  return (
    <div className="min-h-screen bg-secondary/30">
      <div className="container mx-auto max-w-4xl px-4 py-8 pb-24">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold font-headline">Dompet Digital</h1>
            <p className="text-muted-foreground">Selamat datang kembali, kelola keuanganmu.</p>
          </div>
          <Button size="icon" className="rounded-full h-12 w-12 shadow-lg">
            <Plus className="w-6 h-6" />
          </Button>
        </div>

        {/* Balance Card */}
        <Card className="w-full bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-2xl mb-8">
          <CardHeader>
            <CardDescription className="text-primary-foreground/80">Total Saldo</CardDescription>
            <CardTitle className="text-4xl">Rp 5.430.000</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-white/20 rounded-full">
                <ArrowDown className="text-green-300 w-5 h-5" />
              </div>
              <div>
                <p className="opacity-80">Pemasukan</p>
                <p className="font-bold">Rp 8.000.000</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="p-2 bg-white/20 rounded-full">
                <ArrowUp className="text-red-300 w-5 h-5" />
              </div>
              <div>
                <p className="opacity-80">Pengeluaran</p>
                <p className="font-bold">Rp 2.570.000</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Quick Actions */}
        <div className="grid grid-cols-3 gap-4 mb-8">
            <Button variant="outline" className="h-auto flex-col py-3 gap-2" onClick={() => router.push('/wallet/transactions')}>
                <History className="w-6 h-6 text-primary"/>
                <span className="text-xs">Riwayat</span>
            </Button>
             <Button variant="outline" className="h-auto flex-col py-3 gap-2" onClick={() => router.push('/wallet/report')}>
                <BarChart className="w-6 h-6 text-primary"/>
                 <span className="text-xs">Laporan</span>
            </Button>
             <Button variant="outline" className="h-auto flex-col py-3 gap-2">
                <WalletIcon className="w-6 h-6 text-primary"/>
                 <span className="text-xs">Anggaran</span>
            </Button>
        </div>

        {/* Recent Transactions */}
        <Card>
          <CardHeader>
            <CardTitle>Transaksi Terakhir</CardTitle>
            <CardDescription>Daftar 5 transaksi terakhir Anda bulan ini.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Placeholder Content */}
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-red-100 dark:bg-red-900/50 mr-4"><ArrowUp className="w-5 h-5 text-red-500" /></div>
                <div className="flex-grow">
                  <p className="font-semibold">Makan Siang</p>
                  <p className="text-sm text-muted-foreground">Makanan</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-red-500">-Rp 50.000</p>
                  <p className="text-xs text-muted-foreground">Hari ini</p>
                </div>
              </div>
               <div className="flex items-center">
                <div className="p-3 rounded-full bg-green-100 dark:bg-green-900/50 mr-4"><ArrowDown className="w-5 h-5 text-green-500" /></div>
                <div className="flex-grow">
                  <p className="font-semibold">Gaji Bulan Mei</p>
                  <p className="text-sm text-muted-foreground">Gaji</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-green-500">+Rp 8.000.000</p>
                  <p className="text-xs text-muted-foreground">Kemarin</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
