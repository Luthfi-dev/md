'use client';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Download, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import { useAuth } from '@/hooks/use-auth';
import { LoadingOverlay } from '@/components/ui/loading-overlay';
import { saveAs } from 'file-saver';
import { useToast } from '@/hooks/use-toast';

interface Transaction {
  id: number;
  amount: number;
  type: 'income' | 'expense';
  category_name: string;
  description: string | null;
  transaction_date: string;
}


export default function WalletReportPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: isAuthLoading, fetchWithAuth } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [reports, setReports] = useState<any>({});
  const [availableMonths, setAvailableMonths] = useState<string[]>([]);
  const [selectedMonth, setSelectedMonth] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      router.push('/account');
      return;
    }
    if (isAuthenticated) {
      const fetchReportData = async () => {
        setIsLoading(true);
        try {
          const { data } = await fetchWithAuth('/api/wallet/transactions');
          if (!data.success) throw new Error(data.message);
          
          setAllTransactions(data.transactions);

          const monthlyData: any = {};
          data.transactions.forEach((t: any) => {
            const month = t.transaction_date.substring(0, 7); // YYYY-MM
            if (!monthlyData[month]) {
              monthlyData[month] = { income: 0, expense: 0 };
            }
            if (t.type === 'income') monthlyData[month].income += parseFloat(t.amount);
            if (t.type === 'expense') monthlyData[month].expense += parseFloat(t.amount);
          });
          
          const months = Object.keys(monthlyData).sort().reverse();
          setAvailableMonths(months);
          setReports(monthlyData);
          if (months.length > 0) {
            setSelectedMonth(months[0]);
          }

        } catch (error) {
          console.error(error);
        } finally {
          setIsLoading(false);
        }
      };
      fetchReportData();
    }
  }, [isAuthLoading, isAuthenticated, fetchWithAuth, router]);

  const handleDownload = () => {
    if (!selectedMonth || allTransactions.length === 0) {
        toast({
            variant: "destructive",
            title: "Tidak Ada Data",
            description: "Tidak ada data transaksi untuk diunduh pada bulan yang dipilih.",
        });
        return;
    }

    const monthTransactions = allTransactions.filter(t => t.transaction_date.startsWith(selectedMonth));
    if (monthTransactions.length === 0) {
        toast({ variant: "destructive", title: "Tidak Ada Data", description: "Tidak ada transaksi pada bulan ini." });
        return;
    }
    
    // Convert to CSV
    const headers = ['Tanggal', 'Tipe', 'Kategori', 'Deskripsi', 'Jumlah'];
    const csvRows = [headers.join(',')];
    
    for (const t of monthTransactions) {
        const row = [
            t.transaction_date,
            t.type === 'income' ? 'Pemasukan' : 'Pengeluaran',
            t.category_name,
            `"${t.description || ''}"`,
            t.amount
        ];
        csvRows.push(row.join(','));
    }

    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    
    const monthName = new Date(selectedMonth + '-02').toLocaleString('id-ID', { month: 'long', year: 'numeric' });
    saveAs(blob, `Laporan Keuangan - ${monthName}.csv`);
  }

  const currentData = reports[selectedMonth] || { income: 0, expense: 0 };
  const balance = currentData.income - currentData.expense;
  
  if (isAuthLoading || isLoading) {
      return <LoadingOverlay isLoading={true} message="Membuat laporan..." />;
  }

  return (
    <div className="min-h-screen bg-secondary/30">
      <div className="container mx-auto max-w-4xl px-4 py-8 pb-24">
        <div className="flex justify-between items-center mb-6">
          <Button variant="ghost" onClick={() => router.push('/wallet')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Kembali
          </Button>
          <Button variant="outline" onClick={handleDownload} disabled={availableMonths.length === 0}>
            <Download className="mr-2 h-4 w-4" />
            Unduh Laporan
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Laporan Keuangan</CardTitle>
            <div className="flex items-center justify-between pt-2">
                <CardDescription>Ringkasan pemasukan dan pengeluaran Anda.</CardDescription>
                <Select value={selectedMonth} onValueChange={setSelectedMonth} disabled={availableMonths.length === 0}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Pilih Bulan" />
                    </SelectTrigger>
                    <SelectContent>
                        {availableMonths.map(month => (
                            <SelectItem key={month} value={month}>{new Date(month + '-02').toLocaleString('id-ID', { month: 'long', year: 'numeric' })}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
          </CardHeader>
          <CardContent>
             {availableMonths.length > 0 ? (
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Deskripsi</TableHead>
                            <TableHead className="text-right">Jumlah</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        <TableRow>
                            <TableCell className="font-medium">Total Pemasukan</TableCell>
                            <TableCell className="text-right text-green-500 font-semibold">
                                {currentData.income.toLocaleString('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 })}
                            </TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell className="font-medium">Total Pengeluaran</TableCell>
                            <TableCell className="text-right text-red-500 font-semibold">
                            - {currentData.expense.toLocaleString('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 })}
                            </TableCell>
                        </TableRow>
                    </TableBody>
                    <TableFooter>
                        <TableRow>
                            <TableCell className="font-bold text-lg">Sisa Saldo</TableCell>
                            <TableCell className={`text-right font-bold text-lg ${balance >= 0 ? 'text-foreground' : 'text-red-500'}`}>
                                {balance.toLocaleString('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 })}
                            </TableCell>
                        </TableRow>
                    </TableFooter>
                </Table>
             ) : (
                <p className="text-center text-muted-foreground py-8">Tidak ada data laporan untuk ditampilkan.</p>
             )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
