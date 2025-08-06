
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Notebook, Trash2, Edit, Users, Cloud, CloudOff, Loader2, Info, X, Search } from 'lucide-react';
import { type Note } from '@/types/notebook';
import { Progress } from '@/components/ui/progress';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { v4 as uuidv4 } from 'uuid';
import { Alert, AlertTitle } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';

const LOCAL_STORAGE_KEY_NOTES = 'notebook_notes_v1';
const LOCAL_STORAGE_KEY_SYNC_INFO = 'notebook_sync_info_dismiss_count';
const MAX_DISMISS_COUNT = 3;

export default function NotebookListPage() {
  const [allNotes, setAllNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [syncingNoteId, setSyncingNoteId] = useState<string | null>(null);
  const [deletingNoteId, setDeletingNoteId] = useState<string | null>(null);
  const [showSyncInfo, setShowSyncInfo] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const router = useRouter();
  const { toast } = useToast();
  const { isAuthenticated, user, fetchWithAuth } = useAuth();

  const fetchPersonalNotes = useCallback(async () => {
    setIsLoading(true);
    let cloudNotes: Note[] = [];
    try {
      if (isAuthenticated && user) {
        const res = await fetchWithAuth('/api/notebook/personal');
        if (res.ok) {
          const data = await res.json();
          cloudNotes = data.notes?.map((n: Note) => ({ ...n, isSynced: true, lastModified: n.lastModified || n.createdAt })) || [];
        }
      }

      const localNotesRaw = localStorage.getItem(LOCAL_STORAGE_KEY_NOTES);
      const localNotes: Note[] = localNotesRaw ? JSON.parse(localNotesRaw).map((n:Note) => ({...n, lastModified: n.lastModified || n.createdAt})) : [];
      
      const cloudNoteUuids = new Set(cloudNotes.map(n => n.uuid));
      const uniqueLocalNotes = localNotes.filter(ln => !cloudNoteUuids.has(ln.uuid));

      const syncedNotes = cloudNotes.map(cn => {
          const correspondingLocal = localNotes.find(ln => ln.uuid === cn.uuid);
          if (correspondingLocal && new Date(correspondingLocal.lastModified) > new Date(cn.lastModified)) {
              return { ...correspondingLocal, isSynced: false };
          }
          return cn;
      });
      
      const finalNotes = [...syncedNotes, ...uniqueLocalNotes];
      finalNotes.sort((a, b) => new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime());
      
      setAllNotes(finalNotes);

    } catch (e) {
      console.error("Failed to fetch personal notes", e);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, user, fetchWithAuth]);

  useEffect(() => {
    fetchPersonalNotes();
  }, [isAuthenticated, fetchPersonalNotes]);
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const dismissCount = parseInt(localStorage.getItem(LOCAL_STORAGE_KEY_SYNC_INFO) || '0', 10);
      const hasUnsynced = allNotes.some(n => !n.isSynced);
      if (isAuthenticated && hasUnsynced && dismissCount < MAX_DISMISS_COUNT) {
        setShowSyncInfo(true);
      } else {
        setShowSyncInfo(false);
      }
    }
  }, [allNotes, isAuthenticated]);


  const handleDismissSyncInfo = () => {
     const newCount = parseInt(localStorage.getItem(LOCAL_STORAGE_KEY_SYNC_INFO) || '0', 10) + 1;
     localStorage.setItem(LOCAL_STORAGE_KEY_SYNC_INFO, String(newCount));
     setShowSyncInfo(false);
  }

  const handleCreateNewPersonalNote = () => {
    const newNote: Note = {
      uuid: uuidv4(),
      title: 'Catatan Baru Tanpa Judul',
      items: [],
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString(),
      isSynced: false,
    };
    
    const currentNotes = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY_NOTES) || '[]');
    localStorage.setItem(LOCAL_STORAGE_KEY_NOTES, JSON.stringify([newNote, ...currentNotes]));
    setAllNotes(prev => [newNote, ...prev]);

    router.push(`/notebook/${newNote.uuid}?edit=true`);
  };

  const handleCardClick = (uuid: string) => {
    router.push(`/notebook/${uuid}`);
  }

  const handleEdit = (uuid: string, e: React.MouseEvent) => {
    e.stopPropagation();
    router.push(`/notebook/${uuid}?edit=true`);
  };

  const handleDelete = async (note: Note) => {
    const originalNotes = [...allNotes];
    setAllNotes(prev => prev.filter(n => n.uuid !== note.uuid));
    setDeletingNoteId(null);

    try {
      if (note.isSynced && isAuthenticated) {
        const res = await fetchWithAuth(`/api/notebook/personal/${note.uuid}`, { method: 'DELETE' });
        if (!res.ok) throw new Error("Gagal menghapus catatan di server");
      }
      const localNotes = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY_NOTES) || '[]');
      localStorage.setItem(LOCAL_STORAGE_KEY_NOTES, JSON.stringify(localNotes.filter((n: Note) => n.uuid !== note.uuid)));

      toast({title: "Catatan Dihapus"});
    } catch (error) {
      setAllNotes(originalNotes);
      toast({variant: 'destructive', title: "Gagal Menghapus Catatan"});
    }
  };

  const handleSyncNote = async (note: Note, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      toast({ variant: 'destructive', title: 'Login Diperlukan', description: 'Silakan login untuk menyimpan catatan ke cloud.' });
      return;
    }
    setSyncingNoteId(note.uuid);
    try {
      const res = await fetchWithAuth('/api/notebook/personal/sync', {
        method: 'POST',
        body: JSON.stringify({ notes: [note] })
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Gagal sinkronisasi');
      }
      
      const updatedNote = { ...note, isSynced: true };
      
      // Update local storage
      const localNotes = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY_NOTES) || '[]');
      const updatedLocalNotes = localNotes.map((n: Note) => n.uuid === note.uuid ? updatedNote : n);
      localStorage.setItem(LOCAL_STORAGE_KEY_NOTES, JSON.stringify(updatedLocalNotes));
      
      // Update state
      setAllNotes(prev => prev.map(n => n.uuid === note.uuid ? updatedNote : n));


      toast({ title: 'Berhasil!', description: `Catatan "${note.title || 'Tanpa Judul'}" berhasil disimpan ke cloud.`});
    } catch (error) {
      toast({ variant: 'destructive', title: 'Gagal Sinkronisasi', description: (error as Error).message });
    } finally {
      setSyncingNoteId(null);
    }
  }
  
  const filteredNotes = useMemo(() => {
    if (!searchTerm) return allNotes;
    return allNotes.filter(note => note.title.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [allNotes, searchTerm]);

  const getProgress = (note: Note) => {
    if (!note.items || note.items.length === 0) return 0;
    const completedCount = note.items.filter(item => item.completed).length;
    return (completedCount / note.items.length) * 100;
  }

  return (
    <div className="container mx-auto px-4 py-8 pb-24">
      <header className="mb-8 text-center">
        <h1 className="text-4xl font-bold font-headline tracking-tight">Catatan Cerdas</h1>
        <p className="text-muted-foreground mt-2 text-lg">
          Organisir ide dan tugas Anda.
        </p>
      </header>

      <div className="max-w-4xl mx-auto space-y-6">
         <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
             <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input 
                    placeholder="Cari catatan..."
                    className="pl-10 h-11"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            <div className="flex gap-2 w-full md:w-auto">
                <Button onClick={() => router.push('/notebook/groups')} variant="outline" className="w-full">
                    <Users className="mr-2" /> Grup
                </Button>
                <Button onClick={handleCreateNewPersonalNote} className="w-full">
                    <Plus className="mr-2" /> Buat Baru
                </Button>
            </div>
         </div>

        {showSyncInfo && (
            <Alert>
                <div className='flex items-start gap-3'>
                    <Info className="h-5 w-5 mt-0.5 text-primary" />
                <div>
                    <AlertTitle className="font-bold">Informasi Sinkronisasi</AlertTitle>
                    <CardDescription className="text-xs">
                        <CloudOff className="inline-block w-4 h-4 text-destructive mr-1"/>
                        berarti ada perubahan yang belum disimpan ke cloud. Klik ikon untuk sinkronisasi.
                    </CardDescription>
                </div>
                <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0 -mr-2 -mt-2" onClick={handleDismissSyncInfo}>
                    <X className="w-4 w-4" />
                </Button>
            </div>
            </Alert>
        )}

        {isLoading ? (
            <div className="text-center py-16"><Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" /></div>
        ) : filteredNotes.length > 0 ? (
            filteredNotes.map(note => {
            const progress = getProgress(note);
            const isCompleted = progress === 100 && note.items.length > 0;

            return (
                <Card key={note.uuid} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => handleCardClick(note.uuid)}>
                <CardHeader>
                    <CardTitle className="flex justify-between items-center">
                        <span className="truncate">{note.title || 'Tanpa Judul'}</span>
                        <div className="flex items-center gap-1 shrink-0">
                            {isAuthenticated && (
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => handleSyncNote(note, e)} disabled={note.isSynced || syncingNoteId === note.uuid}>
                                    {syncingNoteId === note.uuid ? <Loader2 className="h-4 w-4 animate-spin"/> :
                                    note.isSynced ? <Cloud className="h-4 w-4 text-green-500" /> : <CloudOff className="h-4 w-4 text-destructive" />
                                    }
                                </Button>
                            )}
                            {!isCompleted && (
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => handleEdit(note.uuid, e)}>
                                    <Edit className="h-4 w-4" />
                                </Button>
                            )}
                            <AlertDialog onOpenChange={(open) => !open && setDeletingNoteId(null)}>
                                <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={(e) => { e.stopPropagation(); setDeletingNoteId(note.uuid); }}>
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                                </AlertDialogTrigger>
                                {deletingNoteId === note.uuid && (
                                    <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Anda yakin?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                        Tindakan ini tidak bisa dibatalkan. Ini akan menghapus catatan secara permanen.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel onClick={(e) => e.stopPropagation()}>Batal</AlertDialogCancel>
                                        <AlertDialogAction onClick={(e) => { e.stopPropagation(); handleDelete(note); }}>Hapus</AlertDialogAction>
                                    </AlertDialogFooter>
                                    </AlertDialogContent>
                                )}
                            </AlertDialog>
                        </div>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center gap-4">
                    <Progress value={progress} className="w-full" />
                    <span className="text-sm font-semibold text-muted-foreground whitespace-nowrap">
                        {note.items?.filter(i => i.completed).length || 0} / {note.items?.length || 0}
                    </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                    Diubah: {new Date(note.lastModified || note.createdAt).toLocaleString('id-ID')}
                    </p>
                </CardContent>
                </Card>
            );
            })
        ) : (
            <div className="text-center py-16 border-2 border-dashed rounded-lg">
            <Notebook className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-medium">{searchTerm ? 'Catatan Tidak Ditemukan' : 'Belum Ada Catatan'}</h3>
            <p className="mt-1 text-sm text-muted-foreground">
                {searchTerm ? `Tidak ada catatan pribadi yang cocok dengan "${searchTerm}".` : 'Klik "Buat Catatan Baru" untuk memulai.'}
            </p>
            </div>
        )}
      </div>
    </div>
  );
}
