
'use client';
import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowUp, ArrowDown, History, BarChart, Wallet as WalletIcon, MoreVertical, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { LoadingOverlay } from '@/components/ui/loading-overlay';
import { CountUp } from '@/components/CountUp';
import { AddTransactionSheet } from '@/components/wallet/AddTransactionSheet';
import * as LucideIcons from 'lucide-react';
import { Badge } from '@/components/ui/badge';


export default function WalletDashboardPage() {
  const { isAuthenticated, isLoading: isAuthLoading, fetchWithAuth } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [stats, setStats] = useState({ balance: 0, income: 0, expense: 0 });
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const getIcon = (iconName: string | null): React.ReactNode => {
    if (!iconName) return <WalletIcon className="w-5 h-5 text-muted-foreground" />;
    const IconComponent = (LucideIcons as any)[iconName];
    if (IconComponent) {
        return <IconComponent className="w-5 h-5" />;
    }
    return <WalletIcon className="w-5 h-5 text-muted-foreground" />;
  };

  const fetchWalletData = useCallback(async () => {
    if (!isAuthenticated) return;
    setIsLoading(true);
    try {
      const res = await fetchWithAuth('/api/wallet/transactions');
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      
      const now = new Date();
      const currentMonthTxs = data.transactions.filter((t: any) => {
        const txDate = new Date(t.transaction_date);
        return txDate.getMonth() === now.getMonth() && txDate.getFullYear() === now.getFullYear();
      });

      let income = 0;
      let expense = 0;
      currentMonthTxs.forEach((t: any) => {
        if (t.type === 'income') income += parseFloat(t.amount);
        if (t.type === 'expense') expense += parseFloat(t.amount);
      });
      
      setTransactions(data.transactions.slice(0, 5));
      setStats({ balance: income - expense, income, expense });

    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, fetchWithAuth]);

  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      router.push('/account');
    } else if (isAuthenticated) {
      fetchWalletData();
    }
  }, [isAuthLoading, isAuthenticated, router, fetchWalletData]);

  const handleTransactionAdded = () => {
    fetchWalletData();
  };
  
  if (isAuthLoading || (isAuthenticated === undefined)) {
      return <LoadingOverlay isLoading={true} message="Mempersiapkan Dompet Anda..." />;
  }

  return (
    <>
    <AddTransactionSheet isOpen={isSheetOpen} onOpenChange={setIsSheetOpen} onTransactionAdded={handleTransactionAdded} />
    <div className="min-h-screen bg-card">
      <div className="px-4 py-8 pb-24">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold font-headline">DompetKu</h1>
            <p className="text-muted-foreground">Arus kas Anda dalam satu genggaman.</p>
          </div>
           <Button size="icon" className="rounded-full h-12 w-12 shadow-lg" onClick={() => setIsSheetOpen(true)}>
             <WalletIcon className="w-6 h-6" />
           </Button>
        </div>

        {/* Balance Card */}
        <Card className="w-full bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-2xl mb-8">
          <CardHeader>
            <CardDescription className="text-primary-foreground/80">Saldo Bulan Ini</CardDescription>
            <CardTitle className="text-4xl">
              Rp <CountUp end={stats.balance} />
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-white/20 rounded-full">
                <ArrowDown className="text-green-300 w-5 h-5" />
              </div>
              <div>
                <p className="opacity-80">Pemasukan</p>
                <p className="font-bold">Rp <CountUp end={stats.income} /></p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="p-2 bg-white/20 rounded-full">
                <ArrowUp className="text-red-300 w-5 h-5" />
              </div>
              <div>
                <p className="opacity-80">Pengeluaran</p>
                <p className="font-bold">Rp <CountUp end={stats.expense} /></p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Quick Actions */}
        <div className="grid grid-cols-3 gap-4 mb-8">
            <Button variant="outline" className="h-auto flex-col py-3 gap-2 bg-background" onClick={() => router.push('/wallet/transactions')}>
                <History className="w-6 h-6 text-primary"/>
                <span className="text-xs">Riwayat</span>
            </Button>
             <Button variant="outline" className="h-auto flex-col py-3 gap-2 bg-background" onClick={() => router.push('/wallet/report')}>
                <BarChart className="w-6 h-6 text-primary"/>
                 <span className="text-xs">Laporan</span>
            </Button>
             <Button variant="outline" className="h-auto flex-col py-3 gap-2 bg-background" onClick={() => router.push('/wallet/budget')}>
                <WalletIcon className="w-6 h-6 text-primary"/>
                 <span className="text-xs">Anggaran</span>
            </Button>
        </div>

        {/* Recent Transactions */}
        <div className="space-y-3">
          <div className="flex justify-between items-center px-2">
            <h2 className="font-bold text-lg">Transaksi Terakhir</h2>
            <Button variant="ghost" size="sm" onClick={() => router.push('/wallet/transactions')}>Lihat Semua</Button>
          </div>
          {isLoading ? (
             <div className="flex justify-center p-8"><Loader2 className="animate-spin text-primary"/></div>
          ) : transactions.length > 0 ? transactions.map((t: any) => (
              <div className="flex items-center p-3 rounded-lg bg-background" key={t.id}>
                <div className={`p-3 rounded-full mr-4 ${t.type === 'income' ? 'bg-green-100 dark:bg-green-900/50 text-green-600' : 'bg-red-100 dark:bg-red-900/50 text-red-500'}`}>
                    {getIcon(t.category_icon)}
                </div>
                <div className="flex-grow">
                  <p className="font-semibold">{t.description || t.category_name}</p>
                  <p className="text-sm text-muted-foreground">{t.category_name}</p>
                </div>
                <div className="text-right">
                  <p className={`font-bold ${t.type === 'income' ? 'text-green-600' : 'text-red-500'}`}>
                    {t.type === 'expense' && '-'}Rp{parseFloat(t.amount).toLocaleString('id-ID')}
                  </p>
                  <p className="text-xs text-muted-foreground">{new Date(t.transaction_date).toLocaleDateString('id-ID', {day: 'numeric', month: 'short'})}</p>
                </div>
              </div>
          )) : (
            <div className="text-center text-muted-foreground py-8 bg-background rounded-lg">
                <p>Belum ada transaksi.</p>
                <Button variant="link" onClick={() => setIsSheetOpen(true)}>Tambah sekarang</Button>
            </div>
          )}
        </div>
      </div>
    </div>
    </>
  );
}
