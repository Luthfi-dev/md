
'use client';
import { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from '../ui/textarea';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Loader2 } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface AddTransactionSheetProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onTransactionAdded: () => void;
}

export function AddTransactionSheet({ isOpen, onOpenChange, onTransactionAdded }: AddTransactionSheetProps) {
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState<string | undefined>();
  const [description, setDescription] = useState('');
  const [transactionDate, setTransactionDate] = useState<Date | undefined>(new Date());
  
  const [categories, setCategories] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { fetchWithAuth } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      const fetchCategories = async () => {
        try {
          const res = await fetchWithAuth('/api/wallet/categories');
          const data = await res.json();
          if (data.success) {
            setCategories(data.categories);
          }
        } catch (error) {
          console.error("Failed to fetch categories", error);
        }
      };
      fetchCategories();
    }
  }, [isOpen, fetchWithAuth]);
  
  const resetForm = () => {
    setType('expense');
    setAmount('');
    setCategoryId(undefined);
    setDescription('');
    setTransactionDate(new Date());
  }

  const handleSubmit = async () => {
    if (!amount || !categoryId || !transactionDate) {
        toast({ variant: 'destructive', title: 'Data Tidak Lengkap', description: 'Mohon isi jumlah, kategori, dan tanggal.'});
        return;
    }
    setIsLoading(true);
    try {
        const payload = {
            amount: parseFloat(amount),
            type,
            categoryId: parseInt(categoryId, 10),
            description,
            transactionDate: format(transactionDate, 'yyyy-MM-dd')
        };
        const res = await fetchWithAuth('/api/wallet/transactions', {
            method: 'POST',
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        if(!data.success) throw new Error(data.message || 'Gagal menyimpan transaksi');

        toast({ title: 'Sukses!', description: 'Transaksi baru telah berhasil dicatat.'});
        onTransactionAdded();
        onOpenChange(false);
        resetForm();

    } catch (error) {
        const message = error instanceof Error ? error.message : "Terjadi kesalahan";
        toast({ variant: 'destructive', title: 'Gagal Menyimpan', description: message });
    } finally {
        setIsLoading(false);
    }
  };
  
  const filteredCategories = categories.filter(c => c.type === type);

  return (
    <Sheet open={isOpen} onOpenChange={(open) => { if(!open) resetForm(); onOpenChange(open); }}>
      <SheetContent side="bottom" className="rounded-t-2xl">
        <SheetHeader>
          <SheetTitle>Tambah Transaksi Baru</SheetTitle>
          <SheetDescription>Catat pemasukan atau pengeluaran Anda.</SheetDescription>
        </SheetHeader>
        <div className="py-4">
          <Tabs value={type} onValueChange={(value) => setType(value as any)} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="expense">Pengeluaran</TabsTrigger>
              <TabsTrigger value="income">Pemasukan</TabsTrigger>
            </TabsList>
            <TabsContent value={type} className="pt-4 space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="amount">Jumlah</Label>
                    <Input id="amount" type="number" placeholder="0" value={amount} onChange={(e) => setAmount(e.target.value)} />
                </div>
                <div className="space-y-2">
                    <Label>Kategori</Label>
                    <Select value={categoryId} onValueChange={setCategoryId}>
                        <SelectTrigger><SelectValue placeholder="Pilih kategori..." /></SelectTrigger>
                        <SelectContent>
                            {filteredCategories.map(cat => (
                                <SelectItem key={cat.id} value={String(cat.id)}>{cat.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="description">Deskripsi (Opsional)</Label>
                    <Textarea id="description" placeholder="Contoh: Makan siang di kantor" value={description} onChange={(e) => setDescription(e.target.value)}/>
                </div>
                <div className="space-y-2">
                    <Label>Tanggal</Label>
                    <Popover>
                        <PopoverTrigger asChild>
                        <Button
                            variant={"outline"}
                            className={cn("w-full justify-start text-left font-normal", !transactionDate && "text-muted-foreground")}
                        >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {transactionDate ? format(transactionDate, "PPP") : <span>Pilih tanggal</span>}
                        </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                        <Calendar
                            mode="single"
                            selected={transactionDate}
                            onSelect={setTransactionDate}
                            initialFocus
                        />
                        </PopoverContent>
                    </Popover>
                </div>
            </TabsContent>
          </Tabs>
        </div>
        <SheetFooter>
          <Button onClick={handleSubmit} disabled={isLoading} className="w-full">
            {isLoading ? <Loader2 className="mr-2 animate-spin"/> : null}
            Simpan Transaksi
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
