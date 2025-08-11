
'use client';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowUp, ArrowDown, Search, Filter } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';

// Placeholder data
const transactions = [
  { id: 1, type: 'expense', category: 'Makanan', description: 'Makan Siang', amount: 50000, date: '2024-05-23' },
  { id: 2, type: 'income', category: 'Gaji', description: 'Gaji Bulan Mei', amount: 8000000, date: '2024-05-22' },
  { id: 3, type: 'expense', category: 'Transportasi', description: 'Bensin Motor', amount: 30000, date: '2024-05-22' },
  { id: 4, type: 'expense', category: 'Hiburan', description: 'Tiket Bioskop', amount: 100000, date: '2024-05-21' },
];

export default function WalletTransactionsPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredTransactions = transactions.filter(t => 
    t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-secondary/30">
      <div className="container mx-auto max-w-4xl px-4 py-8 pb-24">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <Button variant="ghost" onClick={() => router.push('/wallet')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Kembali ke Dompet
          </Button>
        </div>
        <h1 className="text-3xl font-bold font-headline mb-2">Riwayat Transaksi</h1>
        <p className="text-muted-foreground mb-6">Lihat dan kelola semua catatan keuangan Anda.</p>
        
        {/* Search and Filter */}
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
            <Button variant="outline" size="icon">
                <Filter className="w-5 h-5"/>
            </Button>
        </div>

        {/* Transactions List */}
        <div className="space-y-4">
          {filteredTransactions.map(t => (
            <Card key={t.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4 flex items-center gap-4">
                 <div className={`p-3 rounded-full ${t.type === 'income' ? 'bg-green-100 dark:bg-green-900/50' : 'bg-red-100 dark:bg-red-900/50'}`}>
                    {t.type === 'income' ? <ArrowDown className="w-5 h-5 text-green-500" /> : <ArrowUp className="w-5 h-5 text-red-500" />}
                 </div>
                 <div className="flex-grow">
                  <p className="font-semibold">{t.description}</p>
                  <p className="text-sm text-muted-foreground">{t.category}</p>
                </div>
                <div className="text-right">
                  <p className={`font-bold ${t.type === 'income' ? 'text-green-500' : 'text-red-500'}`}>
                    {t.type === 'expense' && '-'}{t.amount.toLocaleString('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 })}
                  </p>
                  <p className="text-xs text-muted-foreground">{new Date(t.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long' })}</p>
                </div>
              </CardContent>
            </Card>
          ))}
          {filteredTransactions.length === 0 && (
             <div className="text-center py-16 text-muted-foreground border-2 border-dashed rounded-lg">
                <p>Tidak ada transaksi yang cocok.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
