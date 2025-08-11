
'use client';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Download } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';

// Placeholder data
const reportData = {
  '2024-05': {
    income: 8000000,
    expense: 2570000,
  },
  '2024-04': {
    income: 7800000,
    expense: 3120000,
  },
  '2024-03': {
    income: 7950000,
    expense: 2800000,
  },
};


export default function WalletReportPage() {
  const router = useRouter();
  const [selectedMonth, setSelectedMonth] = useState('2024-05');
  
  const currentData = reportData[selectedMonth as keyof typeof reportData] || { income: 0, expense: 0 };
  const balance = currentData.income - currentData.expense;

  return (
    <div className="min-h-screen bg-secondary/30">
      <div className="container mx-auto max-w-4xl px-4 py-8 pb-24">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <Button variant="ghost" onClick={() => router.push('/wallet')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Kembali ke Dompet
          </Button>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Unduh Laporan
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Laporan Keuangan</CardTitle>
            <div className="flex items-center justify-between pt-2">
                <CardDescription>Ringkasan pemasukan dan pengeluaran Anda.</CardDescription>
                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Pilih Bulan" />
                    </SelectTrigger>
                    <SelectContent>
                        {Object.keys(reportData).map(month => (
                            <SelectItem key={month} value={month}>{new Date(month + '-02').toLocaleString('id-ID', { month: 'long', year: 'numeric' })}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
          </CardHeader>
          <CardContent>
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
