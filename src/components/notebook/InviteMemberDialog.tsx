
'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UserPlus, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import type { NotebookGroup } from '@/types/notebook';

interface InviteMemberDialogProps {
  group: NotebookGroup;
  onMemberInvited: () => void;
}

export function InviteMemberDialog({ group, onMemberInvited }: InviteMemberDialogProps) {
  const [email, setEmail] = useState('');
  const [open, setOpen] = useState(false);
  const [isInviting, setIsInviting] = useState(false);
  const { toast } = useToast();
  const { fetchWithAuth } = useAuth();

  const handleInvite = async () => {
    if (!email.trim()) {
      toast({ variant: 'destructive', title: 'Email tidak boleh kosong' });
      return;
    }
    setIsInviting(true);
    try {
      const res = await fetchWithAuth(`/api/notebook/group/${group.uuid}/member`, {
        method: 'POST',
        body: JSON.stringify({ email }),
      });
      const result = await res.json();
      if (!result.success) {
        throw new Error(result.message || 'Gagal mengundang anggota.');
      }
      toast({ title: 'Undangan Terkirim!', description: `${email} telah ditambahkan ke grup.` });
      onMemberInvited();
      setOpen(false);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Gagal Mengundang', description: (error as Error).message });
    } finally {
      setIsInviting(false);
      setEmail('');
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <UserPlus />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Undang Anggota ke "{group.title}"</DialogTitle>
          <DialogDescription>
            Masukkan alamat email pengguna yang ingin Anda undang. Mereka akan mendapatkan akses ke grup ini.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Label htmlFor="email-invite">Email Pengguna</Label>
          <Input
            id="email-invite"
            type="email"
            placeholder="m@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isInviting}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isInviting}>
            Batal
          </Button>
          <Button onClick={handleInvite} disabled={isInviting || !email.trim()}>
            {isInviting && <Loader2 className="mr-2 animate-spin" />}
            Kirim Undangan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
