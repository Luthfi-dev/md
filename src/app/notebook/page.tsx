'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Notebook, Trash2, Edit, Users, MessageSquare, Phone, UserPlus, Lock, Cloud, CloudOff, Loader2, X } from 'lucide-react';
import { type Note, type NotebookGroup } from '@/types/notebook';
import { Progress } from '@/components/ui/progress';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/use-auth';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { v4 as uuidv4 } from 'uuid';
import { useToast } from '@/hooks/use-toast';
import { LoadingOverlay } from '@/components/ui/loading-overlay';


const LOCAL_STORAGE_KEY_NOTES = 'notebook_notes_v1';
const LOCAL_STORAGE_KEY_SYNC = 'notebook_sync_enabled';

const useCloudSync = (isAuthenticated: boolean | undefined) => {
    const [isSyncEnabled, setIsSyncEnabled] = useState(false);
    const [isMigrating, setIsMigrating] = useState(false);
    const { fetchWithAuth } = useAuth();
    const { toast } = useToast();

    useEffect(() => {
        if (!isAuthenticated) return;
        try {
            const storedValue = localStorage.getItem(LOCAL_STORAGE_KEY_SYNC);
            setIsSyncEnabled(storedValue === 'true');
        } catch (error) {
            console.error("Gagal membaca pengaturan sinkronisasi dari localStorage", error);
        }
    }, [isAuthenticated]);

    const handleSyncToggle = async (enabled: boolean) => {
        if (enabled) {
            setIsMigrating(true);
            try {
                const localNotesRaw = localStorage.getItem(LOCAL_STORAGE_KEY_NOTES);
                const localNotes = localNotesRaw ? JSON.parse(localNotesRaw) : [];

                if (localNotes.length > 0) {
                    const res = await fetchWithAuth('/api/notebook/personal/sync', {
                        method: 'POST',
                        body: JSON.stringify({ notes: localNotes })
                    });
                    if (!res.ok) {
                        throw new Error('Gagal memindahkan catatan ke cloud.');
                    }
                }
                
                setIsSyncEnabled(true);
                localStorage.setItem(LOCAL_STORAGE_KEY_SYNC, 'true');
                toast({ title: "Sinkronisasi Diaktifkan", description: "Catatan lokal Anda telah dipindahkan ke cloud." });

            } catch (error) {
                 toast({ variant: 'destructive', title: 'Gagal Sinkronisasi', description: (error as Error).message });
            } finally {
                setIsMigrating(false);
            }
        } else {
            setIsSyncEnabled(false);
            localStorage.setItem(LOCAL_STORAGE_KEY_SYNC, 'false');
            toast({ title: "Sinkronisasi Dinonaktifkan", description: "Catatan baru akan disimpan di perangkat ini." });
        }
    };

    return { isSyncEnabled, handleSyncToggle, isMigrating };
};

const TagInput = ({ onTagsChange }: { onTagsChange: (tags: string[]) => void }) => {
    const [inputValue, setInputValue] = useState('');
    const [tags, setTags] = useState<string[]>([]);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && inputValue.trim()) {
            e.preventDefault();
            const newTag = inputValue.trim();
            if (!tags.includes(newTag)) {
                const newTags = [...tags, newTag];
                setTags(newTags);
                onTagsChange(newTags);
            }
            setInputValue('');
        }
    };

    const removeTag = (tagToRemove: string) => {
        const newTags = tags.filter(tag => tag !== tagToRemove);
        setTags(newTags);
        onTagsChange(newTags);
    };

    return (
        <div className="p-2 border rounded-lg flex flex-wrap gap-2 items-center">
            {tags.map(tag => (
                <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                    {tag}
                    <button onClick={() => removeTag(tag)} className="rounded-full hover:bg-destructive/20 p-0.5">
                        <X className="w-3 h-3" />
                    </button>
                </Badge>
            ))}
            <Input
                type="text"
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ketik email, username, atau no. HP..."
                className="flex-1 border-0 shadow-none focus-visible:ring-0 p-0 h-auto"
            />
        </div>
    );
};

const CreateGroupDialog = ({ onGroupCreated }: { onGroupCreated: (newGroup: NotebookGroup) => void }) => {
    const [groupName, setGroupName] = useState('');
    const [invitees, setInvitees] = useState<string[]>([]);
    const { toast } = useToast();
    const { user } = useAuth();
    const [isCreating, setIsCreating] = useState(false);

    const handleSelectContacts = async () => {
        if (!('contacts' in navigator && 'select' in (navigator as any).contacts)) {
            toast({ variant: 'destructive', title: 'API Kontak Tidak Didukung', description: 'Browser Anda tidak mendukung fitur ini.' });
            return;
        }
        try {
            const contacts = await (navigator as any).contacts.select(['name', 'email', 'tel'], { multiple: true });
            if (contacts.length > 0) {
                const newInvitees = contacts.map((c: any) => c.tel?.[0] || c.email?.[0] || c.name?.[0]).filter(Boolean);
                const updatedInvitees = [...new Set([...invitees, ...newInvitees])];
                setInvitees(updatedInvitees);
            }
        } catch (error) {
            console.error("Error selecting contacts:", error);
            if ((error as DOMException).name !== 'AbortError') {
              toast({ variant: 'destructive', title: 'Gagal Membaca Kontak' });
            }
        }
    };

    const handleCreateGroup = async () => {
        if (!groupName.trim()) {
            toast({ variant: 'destructive', title: 'Nama Grup Wajib Diisi' });
            return;
        }
        
        setIsCreating(true);

        const newGroup: NotebookGroup = {
            id: `group_${Date.now()}`,
            uuid: uuidv4(),
            title: groupName,
            members: [
                { id: user!.id, name: "Anda", avatarUrl: user!.avatar || `https://placehold.co/40x40/3B82F6/FFFFFF.png?text=${user!.name.charAt(0)}` }
            ],
            tasks: [],
            createdAt: new Date().toISOString(),
            createdBy: user!.id,
            description: ""
        };
        onGroupCreated(newGroup);
        
        toast({ title: "Grup Dibuat!", description: `Grup "${groupName}" berhasil dibuat.`});

        // Reset state for next use
        setGroupName('');
        setInvitees([]);
        setIsCreating(false);
        return true; // Indicate success for closing dialog
    };

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button className="w-full md:w-auto">
                    <UserPlus className="mr-2" /> Buat Grup Baru
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Buat Grup Catatan Baru</DialogTitle>
                    <DialogDescription>
                        Mulai kolaborasi dengan membuat grup baru. Anda akan otomatis menjadi admin.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="group-name">Nama Grup</Label>
                        <Input id="group-name" placeholder="Contoh: Proyek Desain Ulang Web" value={groupName} onChange={(e) => setGroupName(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label>Undang Anggota</Label>
                        <TagInput onTagsChange={setInvitees} />
                        <p className="text-xs text-muted-foreground">Tekan Enter setelah mengetik untuk menambahkan.</p>
                         <div className='flex flex-col sm:flex-row gap-2 justify-center'>
                            <Button variant="outline" size="sm" className="w-full" onClick={handleSelectContacts}><Phone className="mr-2"/> Undang dari Kontak</Button>
                            <Button variant="outline" size="sm" className="w-full"><MessageSquare className="mr-2"/> Undang via WhatsApp</Button>
                         </div>
                    </div>
                </div>
                <DialogFooter>
                    <DialogClose asChild><Button variant="outline">Batal</Button></DialogClose>
                     <DialogClose asChild>
                        <Button onClick={handleCreateGroup} disabled={isCreating}>
                            {isCreating ? <Loader2 className="animate-spin" /> : "Buat Grup"}
                        </Button>
                    </DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};


export default function NotebookListPage() {
  const [personalNotes, setPersonalNotes] = useState<Note[]>([]);
  const [groupNotes, setGroupNotes] = useState<NotebookGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();
  const { isAuthenticated, user, fetchWithAuth } = useAuth();
  const { isSyncEnabled, handleSyncToggle, isMigrating } = useCloudSync(isAuthenticated);


  const fetchNotes = useCallback(async () => {
    setIsLoading(true);
    if (isAuthenticated) {
        if (isSyncEnabled) {
            try {
                const res = await fetchWithAuth('/api/notebook/personal');
                if (res.ok) {
                    const data = await res.json();
                    setPersonalNotes(data.notes || []);
                }
            } catch (e) {
                console.error("Gagal mengambil catatan dari cloud", e);
            }
        } else {
            try {
                const storedNotes = localStorage.getItem(LOCAL_STORAGE_KEY_NOTES);
                setPersonalNotes(storedNotes ? JSON.parse(storedNotes) : []);
            } catch (error) {
                console.error("Gagal memuat catatan lokal", error);
            }
        }
        setGroupNotes([]); 
    } else {
        try {
            const storedNotes = localStorage.getItem(LOCAL_STORAGE_KEY_NOTES);
            setPersonalNotes(storedNotes ? JSON.parse(storedNotes) : []);
        } catch (error) {
            console.error("Gagal memuat catatan tamu", error);
        }
        setGroupNotes([]);
    }
    setIsLoading(false);
  }, [isAuthenticated, isSyncEnabled, fetchWithAuth]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes, isSyncEnabled]); // Re-fetch when sync status changes

  const handleCreateNewPersonalNote = async () => {
    const newNote: Note = {
      id: `local_${Date.now()}`,
      uuid: uuidv4(),
      title: 'Catatan Baru Tanpa Judul',
      items: [],
      createdAt: new Date().toISOString(),
      userId: user?.id
    };
    
    // Optimistic UI update
    setPersonalNotes(prev => [newNote, ...prev]);

    if (isSyncEnabled) {
        try {
            const res = await fetchWithAuth('/api/notebook/personal', {
                method: 'POST',
                body: JSON.stringify(newNote),
            });
            if (!res.ok) throw new Error("Gagal menyimpan ke cloud");
            await fetchNotes(); // Re-fetch to get server-generated ID
        } catch (error) {
            toast({ variant: 'destructive', title: 'Gagal Menyimpan ke Cloud' });
            setPersonalNotes(prev => prev.filter(n => n.uuid !== newNote.uuid)); // Revert
        }
    } else {
        const currentNotes = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY_NOTES) || '[]');
        localStorage.setItem(LOCAL_STORAGE_KEY_NOTES, JSON.stringify([newNote, ...currentNotes]));
    }
    router.push(`/notebook/${newNote.uuid}`);
  };

  const handleCardClick = (uuid: string) => {
    router.push(`/notebook/${uuid}`);
  }
  
  const handleGroupCardClick = (uuid: string) => {
    router.push(`/notebook/group/${uuid}`);
  }

  const handleEdit = (uuid: string, e: React.MouseEvent) => {
    e.stopPropagation();
    router.push(`/notebook/${uuid}?edit=true`);
  };

  const handleDelete = async (note: Note, e: React.MouseEvent) => {
    e.stopPropagation();
    
    const originalNotes = [...personalNotes];
    setPersonalNotes(prev => prev.filter(n => n.uuid !== note.uuid));
    
    try {
        if (isSyncEnabled) {
            const res = await fetchWithAuth(`/api/notebook/personal/${note.uuid}`, { method: 'DELETE' });
            if (!res.ok) throw new Error("Gagal menghapus catatan di server");
        } else {
            localStorage.setItem(LOCAL_STORAGE_KEY_NOTES, JSON.stringify(personalNotes.filter(n => n.uuid !== note.uuid)));
        }
        toast({title: "Catatan Dihapus"});
    } catch (error) {
        setPersonalNotes(originalNotes); // Revert
        toast({variant: 'destructive', title: "Gagal Menghapus Catatan"});
    }
  };
  
  const handleCreateGroup = (newGroup: NotebookGroup) => {
      // In a real app, this would be an API call. Here we just update the state.
      setGroupNotes(prev => [newGroup, ...prev]);
  };
  
  const getProgress = (note: Note) => {
    if (note.items.length === 0) return 0;
    const completedCount = note.items.filter(item => item.completed).length;
    return (completedCount / note.items.length) * 100;
  }
  
  const renderPersonalNotes = () => (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <Button onClick={handleCreateNewPersonalNote} className="w-full md:w-auto">
            <Plus className="mr-2" /> Buat Catatan Baru
        </Button>
        {isAuthenticated && (
            <div className="flex items-center space-x-2 p-2 rounded-lg bg-secondary">
                <Switch 
                    id="sync-switch"
                    checked={isSyncEnabled}
                    onCheckedChange={handleSyncToggle}
                    disabled={isMigrating}
                />
                <Label htmlFor="sync-switch" className="flex items-center gap-2 text-sm">
                    {isSyncEnabled ? <Cloud className="text-primary"/> : <CloudOff/>}
                    Simpan ke Cloud
                </Label>
            </div>
        )}
      </div>
      
      {isLoading ? (
        <div className="text-center py-16"><Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" /></div>
      ) : personalNotes.length > 0 ? (
        personalNotes.map(note => {
          const progress = getProgress(note);
          const isCompleted = progress === 100 && note.items.length > 0;

          return (
          <Card key={note.uuid} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => handleCardClick(note.uuid)}>
            <CardHeader>
                <CardTitle className="flex justify-between items-center">
                    <span className="truncate">{note.title || 'Tanpa Judul'}</span>
                     <div className="flex items-center gap-1 shrink-0">
                        {isSyncEnabled && <Cloud className="h-4 w-4 text-green-500" />}
                        {!isCompleted && (
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => handleEdit(note.uuid, e)}>
                                <Edit className="h-4 w-4" />
                            </Button>
                        )}
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                               <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={(e) => { e.stopPropagation(); }}>
                                 <Trash2 className="h-4 w-4" />
                               </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Anda yakin?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Tindakan ini tidak bisa dibatalkan. Ini akan menghapus catatan secara permanen.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel onClick={(e) => e.stopPropagation()}>Batal</AlertDialogCancel>
                                <AlertDialogAction onClick={(e) => handleDelete(note, e)}>Hapus</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <Progress value={progress} className="w-full" />
                <span className="text-sm font-semibold text-muted-foreground whitespace-nowrap">
                  {note.items.filter(i => i.completed).length} / {note.items.length}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Dibuat: {new Date(note.createdAt).toLocaleDateString('id-ID')}
              </p>
            </CardContent>
          </Card>
        )})
      ) : (
         <div className="text-center py-16 border-2 border-dashed rounded-lg">
          <Notebook className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-medium">Belum Ada Catatan</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Klik "Buat Catatan Baru" untuk memulai.
          </p>
        </div>
      )}
    </div>
  );

  const renderGroupNotes = () => {
    if (!isAuthenticated) {
        return (
             <div className="text-center py-16 border-2 border-dashed rounded-lg">
              <Lock className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-medium">Fitur Grup</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Silakan <Link href="/account" className='text-primary font-bold hover:underline'>masuk</Link> untuk membuat atau melihat catatan grup.
              </p>
            </div>
        )
    }

    return (
        <div className="space-y-4">
          <CreateGroupDialog onGroupCreated={handleCreateGroup} />
          {isLoading ? (
            <div className="text-center py-16"><Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" /></div>
          ) : groupNotes.length > 0 ? (
            groupNotes.map(group => (
              <Card key={group.uuid} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => handleGroupCardClick(group.uuid)}>
                <CardHeader>
                  <CardTitle>{group.title}</CardTitle>
                  <CardDescription>{group.tasks.length} Tugas Aktif</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex -space-x-2 overflow-hidden">
                      {group.members.slice(0, 5).map(member => (
                        <Avatar key={member.id} className="inline-block h-8 w-8 rounded-full ring-2 ring-background">
                          <AvatarImage src={member.avatarUrl} />
                          <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                      ))}
                       {group.members.length > 5 && <Avatar className="inline-block h-8 w-8 rounded-full ring-2 ring-background"><AvatarFallback>+{group.members.length - 5}</AvatarFallback></Avatar>}
                    </div>
                    <Users className="text-muted-foreground"/>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="text-center py-16 border-2 border-dashed rounded-lg">
              <Users className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-medium">Belum Ada Grup</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Klik "Buat Grup Baru" untuk memulai kolaborasi.
              </p>
            </div>
          )}
        </div>
      );
    }

  return (
    <div className="container mx-auto px-4 py-8 pb-24">
      <LoadingOverlay isLoading={isMigrating} message="Memindahkan catatan ke cloud..." />
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center">
            <h1 className="text-4xl font-bold font-headline tracking-tight">Catatan Cerdas</h1>
            <p className="text-muted-foreground mt-2 text-lg">
                Organisir ide dan tugas Anda dengan checklist canggih.
            </p>
        </div>
        
        <Tabs defaultValue="personal" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="personal">Pribadi</TabsTrigger>
            <TabsTrigger value="group">Grup</TabsTrigger>
          </TabsList>
          <TabsContent value="personal" className="mt-6">
            {renderPersonalNotes()}
          </TabsContent>
          <TabsContent value="group" className="mt-6">
            {renderGroupNotes()}
          </TabsContent>
        </Tabs>

      </div>
    </div>
  );
}
