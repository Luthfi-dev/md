
'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { type NotebookGroup } from '@/types/notebook';
import { v4 as uuidv4 } from 'uuid';

interface CreateGroupDialogProps {
  onGroupCreated: (newGroup: NotebookGroup) => void;
}

export function CreateGroupDialog({ onGroupCreated }: CreateGroupDialogProps) {
    const [groupName, setGroupName] = useState('');
    const [open, setOpen] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const { toast } = useToast();
    const { user, fetchWithAuth } = useAuth();

    const handleCreateGroup = async () => {
        if (!groupName.trim() || !user) {
            toast({ variant: 'destructive', title: 'Nama Grup Wajib Diisi' });
            return;
        }
        setIsCreating(true);
        try {
            const groupData = { uuid: uuidv4(), title: groupName, description: '' };
            const { data: result } = await fetchWithAuth('/api/notebook/group', {
                method: 'POST',
                data: groupData,
            });
            
            if (!result.success) {
                throw new Error(result.message || 'Gagal membuat grup di server');
            }
            
            toast({ title: 'Grup Berhasil Dibuat!', description: `Anda sekarang dapat mulai berkolaborasi di "${groupName}".`});
            onGroupCreated(result.group);
            setOpen(false); // Close dialog on success
        } catch (error) {
            toast({ variant: 'destructive', title: 'Gagal Membuat Grup', description: (error as Error).message });
        } finally {
            setIsCreating(false);
            setGroupName(''); // Reset field
        }
    };

    return (
        <Dialog open={open} onOpenChange={(isOpen) => { if (!isCreating) setOpen(isOpen); }}>
            <DialogTrigger asChild>
                <Button className="w-full sm:w-auto"><Plus className="mr-2" /> Buat Grup</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Buat Grup Catatan Baru</DialogTitle>
                    <DialogDescription>Mulai kolaborasi dengan membuat grup baru.</DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="group-name">Nama Grup</Label>
                        <Input 
                          id="group-name" 
                          placeholder="Contoh: Proyek Desain Ulang Web" 
                          value={groupName} 
                          onChange={(e) => setGroupName(e.target.value)}
                          disabled={isCreating}
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)} disabled={isCreating}>Batal</Button>
                    <Button onClick={handleCreateGroup} disabled={isCreating || !groupName.trim()}>
                        {isCreating && <Loader2 className="mr-2 animate-spin" />}
                        Buat Grup
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
