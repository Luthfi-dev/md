
'use client';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, ArrowUp, ArrowDown, History, BarChart, MoreHorizontal, Wallet as WalletIcon, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { LoadingOverlay } from '@/components/ui/loading-overlay';
import { CountUp } from '@/components/CountUp';

// This is the main dashboard page for the wallet.
export default function WalletDashboardPage() {
  const { isAuthenticated, isLoading: isAuthLoading, fetchWithAuth } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [transactions, setTransactions] = useState([]);
  const [stats, setStats] = useState({ balance: 0, income: 0, expense: 0 });

  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      router.push('/account');
      return;
    }
    if (isAuthenticated) {
      const fetchWalletData = async () => {
        setIsLoading(true);
        try {
          const res = await fetchWithAuth('/api/wallet/transactions');
          const data = await res.json();
          if (!data.success) throw new Error(data.message);
          
          const now = new Date();
          const currentMonthTxs = data.transactions.filter((t: any) => new Date(t.transaction_date).getMonth() === now.getMonth() && new Date(t.transaction_date).getFullYear() === now.getFullYear());

          let income = 0;
          let expense = 0;
          currentMonthTxs.forEach((t: any) => {
            if (t.type === 'income') income += parseFloat(t.amount);
            if (t.type === 'expense') expense += parseFloat(t.amount);
          });
          
          // Note: Balance should ideally be calculated from all-time transactions,
          // but for this dashboard, we'll show the monthly net.
          setTransactions(data.transactions.slice(0, 5));
          setStats({ balance: income - expense, income, expense });

        } catch (error) {
          console.error(error);
        } finally {
          setIsLoading(false);
        }
      };
      fetchWalletData();
    }
  }, [isAuthLoading, isAuthenticated, router, fetchWithAuth]);

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
            <p className="text-muted-foreground">Kelola arus kas Anda dengan mudah.</p>
          </div>
          <Button size="icon" className="rounded-full h-12 w-12 shadow-lg">
            <Plus className="w-6 h-6" />
          </Button>
        </div>

        {/* Balance Card */}
        <Card className="w-full bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-2xl mb-8">
          <CardHeader>
            <CardDescription className="text-primary-foreground/80">Sisa Saldo (Bulan Ini)</CardDescription>
            <CardTitle className="text-4xl">
              <CountUp end={stats.balance} />
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-white/20 rounded-full">
                <ArrowDown className="text-green-300 w-5 h-5" />
              </div>
              <div>
                <p className="opacity-80">Pemasukan</p>
                <p className="font-bold"><CountUp end={stats.income} /></p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="p-2 bg-white/20 rounded-full">
                <ArrowUp className="text-red-300 w-5 h-5" />
              </div>
              <div>
                <p className="opacity-80">Pengeluaran</p>
                <p className="font-bold"><CountUp end={stats.expense} /></p>
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
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {transactions.length > 0 ? transactions.map((t: any) => (
                 <div className="flex items-center" key={t.id}>
                    <div className={`p-3 rounded-full mr-4 ${t.type === 'income' ? 'bg-green-100 dark:bg-green-900/50' : 'bg-red-100 dark:bg-red-900/50'}`}>
                        {t.type === 'income' ? <ArrowDown className="w-5 h-5 text-green-500" /> : <ArrowUp className="w-5 h-5 text-red-500" />}
                    </div>
                    <div className="flex-grow">
                      <p className="font-semibold">{t.description || t.category_name}</p>
                      <p className="text-sm text-muted-foreground">{t.category_name}</p>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold ${t.type === 'income' ? 'text-green-500' : 'text-red-500'}`}>
                        {t.type === 'expense' && '-'}Rp {parseFloat(t.amount).toLocaleString('id-ID')}
                      </p>
                      <p className="text-xs text-muted-foreground">{new Date(t.transaction_date).toLocaleDateString('id-ID', {day: 'numeric', month: 'short'})}</p>
                    </div>
                  </div>
              )) : (
                <p className="text-center text-muted-foreground py-4">Belum ada transaksi.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
