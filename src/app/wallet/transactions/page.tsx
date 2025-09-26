
'use client';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowUp, ArrowDown, Search, Filter, Trash2, MoreVertical } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/use-auth';
import { LoadingOverlay } from '@/components/ui/loading-overlay';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuLabel, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';

export default function WalletTransactionsPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: isAuthLoading, fetchWithAuth } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState<number | null>(null);
  const [filterType, setFilterType] = useState('all'); // 'all', 'income', 'expense'
  const { toast } = useToast();

  const fetchTransactions = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data } = await fetchWithAuth('/api/wallet/transactions');
      if (!data.success) throw new Error(data.message);
      setTransactions(data.transactions);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, [fetchWithAuth]);

  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      router.push('/account');
      return;
    }
    if (isAuthenticated) {
      fetchTransactions();
    }
  }, [isAuthLoading, isAuthenticated, router, fetchTransactions]);

  const handleDelete = async () => {
    if (isDeleting === null) return;

    try {
      const { data } = await fetchWithAuth(`/api/wallet/transactions/${isDeleting}`, {
        method: 'DELETE',
      });
      if (!data.success) throw new Error(data.message);

      toast({ title: 'Sukses!', description: 'Transaksi telah berhasil dihapus.' });
      setTransactions(prev => prev.filter(t => t.id !== isDeleting));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Gagal menghapus transaksi.';
      toast({ variant: 'destructive', title: 'Gagal', description: message });
    } finally {
      setIsDeleting(null);
    }
  };

  const filteredTransactions = useMemo(() => {
    return transactions
      .filter((t: any) => {
        if (filterType === 'all') return true;
        return t.type === filterType;
      })
      .filter((t: any) => 
        t.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.category_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
  }, [transactions, searchTerm, filterType]);
  
  if (isAuthLoading || isLoading) {
    return <LoadingOverlay isLoading={true} message="Memuat transaksi..." />;
  }

  return (
    <>
      <AlertDialog open={isDeleting !== null} onOpenChange={(open) => !open && setIsDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Anda Yakin?</AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini tidak dapat dibatalkan. Ini akan menghapus data transaksi Anda secara permanen.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Hapus</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="min-h-screen bg-secondary/30">
        <div className="container mx-auto max-w-4xl px-4 py-8 pb-24">
          <div className="flex justify-between items-center mb-4">
            <Button variant="ghost" onClick={() => router.push('/wallet')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Kembali
            </Button>
          </div>
          <h1 className="text-3xl font-bold font-headline mb-2">Riwayat Transaksi</h1>
          <p className="text-muted-foreground mb-6">Lihat dan kelola semua catatan keuangan Anda.</p>
          
          <div className="flex gap-2 mb-6">
              <div className="relative flex-grow">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input 
                      placeholder="Cari transaksi..."
                      className="pl-10"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                  />
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon">
                      <Filter className="w-5 h-5"/>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Filter Tipe Transaksi</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuRadioGroup value={filterType} onValueChange={setFilterType}>
                    <DropdownMenuRadioItem value="all">Semua</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="income">Pemasukan</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="expense">Pengeluaran</DropdownMenuRadioItem>
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
              </DropdownMenu>
          </div>

          <div className="space-y-4">
            {filteredTransactions.length > 0 ? filteredTransactions.map((t: any) => (
              <Card key={t.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4 flex items-center gap-4">
                   <div className={`p-3 rounded-full ${t.type === 'income' ? 'bg-green-100 dark:bg-green-900/50' : 'bg-red-100 dark:bg-red-900/50'}`}>
                      {t.type === 'income' ? <ArrowDown className="w-5 h-5 text-green-500" /> : <ArrowUp className="w-5 h-5 text-red-500" />}
                   </div>
                   <div className="flex-grow">
                    <p className="font-semibold">{t.description || t.category_name}</p>
                    <p className="text-sm text-muted-foreground">{t.category_name}</p>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold ${t.type === 'income' ? 'text-green-500' : 'text-red-500'}`}>
                      {t.type === 'expense' && '-'}{parseFloat(t.amount).toLocaleString('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 })}
                    </p>
                    <p className="text-xs text-muted-foreground">{new Date(t.transaction_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                  </div>
                   <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2"><MoreVertical/></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                           <DropdownMenuItem className="text-destructive" onClick={() => setIsDeleting(t.id)}>
                              <Trash2 className="mr-2 h-4 w-4"/> Hapus
                           </DropdownMenuItem>
                      </DropdownMenuContent>
                  </DropdownMenu>
                </CardContent>
              </Card>
            )) : (
               <div className="text-center py-16 text-muted-foreground border-2 border-dashed rounded-lg">
                  <p>Tidak ada transaksi yang cocok.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
