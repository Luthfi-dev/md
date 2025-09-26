'use client';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import type { Category } from './AddTransactionSheet';

interface AddCategoryDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onCategoryAdded: (newCategory: Category) => void;
  categoryType: 'income' | 'expense';
}

export function AddCategoryDialog({ isOpen, onOpenChange, onCategoryAdded, categoryType }: AddCategoryDialogProps) {
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { fetchWithAuth } = useAuth();
  const { toast } = useToast();

  const handleSave = async () => {
    if (!name.trim()) {
      toast({ variant: 'destructive', title: 'Nama Kategori Wajib Diisi' });
      return;
    }
    setIsLoading(true);
    try {
      const payload = { name, type: categoryType };
      const { data } = await fetchWithAuth('/api/wallet/categories', {
        method: 'POST',
        data: payload,
      });
      if (!data.success) throw new Error(data.message || 'Gagal menyimpan kategori');

      toast({ title: 'Kategori Ditambahkan!' });
      onCategoryAdded({ ...payload, id: data.categoryId, icon: 'Package' });
      onOpenChange(false);
      setName('');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Terjadi kesalahan';
      toast({ variant: 'destructive', title: 'Gagal Menyimpan', description: message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Buat Kategori {categoryType === 'income' ? 'Pemasukan' : 'Pengeluaran'} Baru</DialogTitle>
          <DialogDescription>
            Kategori ini akan tersedia untuk transaksi Anda di masa depan.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="category-name">Nama Kategori</Label>
            <Input id="category-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Contoh: Transportasi" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>Batal</Button>
          <Button onClick={handleSave} disabled={isLoading || !name.trim()}>
            {isLoading && <Loader2 className="mr-2 animate-spin"/>}
            Simpan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
