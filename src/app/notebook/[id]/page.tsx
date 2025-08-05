
'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Trash2, Save, HelpCircle, ListPlus, Edit, ArrowLeft, Loader2 } from 'lucide-react';
import { type Note, type ChecklistItem } from '@/types/notebook';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/hooks/use-auth';
import { v4 as uuidv4 } from 'uuid';

const LOCAL_STORAGE_KEY_NOTES = 'notebook_notes_v1';
const LOCAL_STORAGE_KEY_SYNC = 'notebook_sync_enabled';


export default function NotebookEditPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();

  const id = params.id as string; // This is now UUID
  const { toast } = useToast();
  const { user, fetchWithAuth } = useAuth();
  
  const [note, setNote] = useState<Note | null>(null);
  const [isBulkAddOpen, setIsBulkAddOpen] = useState(false);
  const [bulkAddCount, setBulkAddCount] = useState(10);
  const [isNumbered, setIsNumbered] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  const isSyncEnabled = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(LOCAL_STORAGE_KEY_SYNC) === 'true';
  }, []);
  
  useEffect(() => {
    const editModeParam = searchParams.get('edit') === 'true';
    setIsEditMode(editModeParam);
    setIsLoading(true);

    const fetchNote = async () => {
        if (!id) return;
        try {
             if (isSyncEnabled && user) {
                const res = await fetchWithAuth(`/api/notebook/personal/${id}`);
                if (!res.ok) throw new Error("Gagal mengambil catatan dari cloud.");
                const data = await res.json();
                setNote(data.note);
            } else {
                const storedNotes: Note[] = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY_NOTES) || '[]');
                const currentNote = storedNotes.find(n => n.uuid === id);
                if (currentNote) {
                    setNote(currentNote);
                } else {
                    router.push('/notebook');
                }
            }
        } catch (error) {
             console.error("Gagal memuat catatan:", error);
             toast({ variant: 'destructive', title: 'Gagal Memuat Catatan' });
             router.push('/notebook');
        } finally {
            setIsLoading(false);
        }
    }
    fetchNote();
  }, [id, router, searchParams, toast, isSyncEnabled, fetchWithAuth, user]);

  const updateNote = useCallback((field: keyof Note, value: any) => {
    setNote(currentNote => currentNote ? { ...currentNote, [field]: value } : null);
  }, []);

  const addItem = useCallback(() => {
    if (!note) return;
    const newItem: ChecklistItem = {
      id: `local_${Date.now()}`,
      uuid: uuidv4(),
      label: '',
      completed: false,
    };
    updateNote('items', [...note.items, newItem]);
  }, [note, updateNote]);

  const updateItem = useCallback((itemUuid: string, newLabel: string) => {
    if (!note) return;
    const updatedItems = note.items.map(item => 
      item.uuid === itemUuid ? { ...item, label: newLabel } : item
    );
    updateNote('items', updatedItems);
  }, [note, updateNote]);

  const toggleItemCompletion = useCallback(async (itemUuid: string) => {
    if (!note) return;
    const updatedItems = note.items.map(item =>
      item.uuid === itemUuid ? { ...item, completed: !item.completed } : item
    );
    const updatedNote = { ...note, items: updatedItems };
    setNote(updatedNote);

    // Auto-save completion status
    if (isSyncEnabled && user) {
        try {
            // Debounced API call could be implemented here for performance
            await fetchWithAuth(`/api/notebook/personal/${note.uuid}`, {
                method: 'PUT',
                body: JSON.stringify(updatedNote)
            });
        } catch (e) {
             console.error("Auto-save failed:", e) // fail silently on auto-save
        }
    } else {
        const storedNotes: Note[] = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY_NOTES) || '[]');
        const existingIndex = storedNotes.findIndex(n => n.uuid === updatedNote.uuid);
        if (existingIndex > -1) {
            storedNotes[existingIndex] = updatedNote;
            localStorage.setItem(LOCAL_STORAGE_KEY_NOTES, JSON.stringify(storedNotes));
        }
    }
  }, [note, isSyncEnabled, user, fetchWithAuth]);

  const removeItem = useCallback((itemUuid: string) => {
    if (!note) return;
    updateNote('items', note.items.filter(item => item.uuid !== itemUuid));
  }, [note, updateNote]);
  
  const handleBulkAdd = useCallback(() => {
     if (!note || bulkAddCount <= 0) return;
     const newItems: ChecklistItem[] = Array.from({ length: bulkAddCount }, (_, i) => ({
      id: `local_bulk_${Date.now()}_${i}`,
      uuid: uuidv4(),
      label: isNumbered ? `${note.items.length + i + 1}. ` : '',
      completed: false,
    }));
    updateNote('items', [...note.items, ...newItems]);
    setIsBulkAddOpen(false);
    setBulkAddCount(10);
    setIsNumbered(false);
  }, [note, updateNote, bulkAddCount, isNumbered]);
  
  const handleSave = async () => {
    if (!note) return;
    if (!note.title.trim()) {
        toast({ variant: 'destructive', title: 'Judul tidak boleh kosong!' });
        return;
    }
    
    setIsSyncing(true);
    try {
        if (isSyncEnabled && user) {
            const res = await fetchWithAuth(`/api/notebook/personal/${note.uuid}`, {
                method: 'PUT',
                body: JSON.stringify(note)
            });
            if (!res.ok) throw new Error("Gagal menyimpan ke cloud");
        } else {
            const storedNotes: Note[] = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY_NOTES) || '[]');
            const existingIndex = storedNotes.findIndex(n => n.uuid === note.uuid);
            if (existingIndex > -1) {
                storedNotes[existingIndex] = note;
            } else {
                storedNotes.push(note);
            }
            localStorage.setItem(LOCAL_STORAGE_KEY_NOTES, JSON.stringify(storedNotes));
        }
        toast({ title: 'Catatan Disimpan!', description: `"${note.title}" telah berhasil disimpan.` });
        setIsEditMode(false);
    } catch (error) {
        console.error("Failed to save note", error);
        toast({ variant: 'destructive', title: 'Gagal Menyimpan', description: 'Terjadi kesalahan saat menyimpan catatan.' });
    } finally {
        setIsSyncing(false);
    }
  };

  const progress = useMemo(() => {
    if (!note || note.items.length === 0) return 0;
    const completedCount = note.items.filter(item => item.completed).length;
    return (completedCount / note.items.length) * 100;
  }, [note]);

  if (isLoading || !note) {
    return <div className="flex justify-center items-center h-screen"><Loader2 className="w-12 h-12 animate-spin text-primary" /></div>;
  }
  
  const isNoteCompleted = progress === 100 && note.items.length > 0;

  return (
    <div className="container mx-auto px-4 py-8 pb-24">
       <AlertDialog open={isBulkAddOpen} onOpenChange={setIsBulkAddOpen}>
          <AlertDialogContent>
              <AlertDialogHeader>
                  <AlertDialogTitle>Buat Banyak Item</AlertDialogTitle>
                  <AlertDialogDescription>Masukkan jumlah item checklist yang ingin Anda buat secara otomatis.</AlertDialogDescription>
              </AlertDialogHeader>
              <div className="py-4 space-y-4">
                  <div className='space-y-2'>
                    <Label htmlFor="bulk-add-count">Jumlah Item</Label>
                    <Input id="bulk-add-count" type="number" value={bulkAddCount} onChange={(e) => setBulkAddCount(Number(e.target.value))} min="1" max="100"/>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="is-numbered" checked={isNumbered} onCheckedChange={(checked) => setIsNumbered(checked as boolean)} />
                    <Label htmlFor="is-numbered">Aktifkan Penomoran Otomatis</Label>
                  </div>
              </div>
              <AlertDialogFooter>
                <AlertDialogCancel>Batal</AlertDialogCancel>
                <AlertDialogAction onClick={handleBulkAdd}>Buat</AlertDialogAction>
              </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        
        <Card className="max-w-2xl mx-auto">
            <CardHeader>
                <CardTitle className="flex items-center justify-between">
                    {isEditMode ? (
                        <Input 
                            placeholder="Judul Catatan Anda..." 
                            value={note.title}
                            onChange={(e) => updateNote('title', e.target.value)}
                            className="text-2xl font-bold border-0 shadow-none focus-visible:ring-0 p-0 h-auto"
                        />
                    ) : (
                        <span className="text-2xl font-bold">{note.title || 'Tanpa Judul'}</span>
                    )}

                    <div className="flex items-center gap-1">
                        {!isEditMode && !isNoteCompleted && (
                            <Button variant="ghost" size="icon" onClick={() => setIsEditMode(true)}><Edit className="h-5 w-5"/></Button>
                        )}
                        <AlertDialog>
                           <AlertDialogTrigger asChild>
                             <Button variant="ghost" size="icon"><HelpCircle className="h-5 w-5"/></Button>
                           </AlertDialogTrigger>
                           <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Cara Penggunaan Catatan Cerdas</AlertDialogTitle>
                              </AlertDialogHeader>
                               <div className="space-y-3 text-sm text-muted-foreground">
                                <p>1. Klik ikon <Edit size={16} className="inline-block"/> untuk masuk mode edit.</p>
                                <p>2. Saat mode edit, Anda bisa mengubah judul, menambah/mengedit/menghapus item.</p>
                                <p>3. Tambah item satu per satu dengan tombol <b className="text-foreground">Tambah Item</b>.</p>
                                <p>4. Buat banyak item sekaligus dengan tombol <b className="text-foreground">Buat Banyak Item</b>.</p>
                                <p>5. Klik <b className="text-foreground">Simpan Catatan</b> untuk menyimpan semua perubahan Anda.</p>
                              </div>
                              <AlertDialogFooter>
                                <AlertDialogAction>Mengerti!</AlertDialogAction>
                              </AlertDialogFooter>
                           </AlertDialogContent>
                        </AlertDialog>
                    </div>
                </CardTitle>
                <CardDescription>
                    <Progress value={progress} className="w-full mt-2" />
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-2">
                  {note.items.map((item) => (
                    <div key={item.uuid} className="flex items-center gap-2 group">
                      <Checkbox 
                        checked={item.completed}
                        onCheckedChange={() => toggleItemCompletion(item.uuid)}
                        className="w-5 h-5"
                      />
                      {isEditMode ? (
                        <Input 
                            value={item.label}
                            onChange={(e) => updateItem(item.uuid, e.target.value)}
                            className={`border-0 shadow-none focus-visible:ring-0 p-1 h-auto ${item.completed ? 'line-through text-muted-foreground' : ''}`}
                            placeholder='Isi tugas disini...'
                        />
                      ) : (
                        <span className={`p-1 ${item.completed ? 'line-through text-muted-foreground' : ''}`}>
                            {item.label || <span className="text-muted-foreground italic">Item kosong</span>}
                        </span>
                      )}
                      {isEditMode && (
                        <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100" onClick={() => removeItem(item.uuid)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>

                {isEditMode ? (
                    <>
                        <div className="flex flex-col sm:flex-row gap-2">
                            <Button onClick={addItem} variant="outline" className="w-full">
                                <Plus className="mr-2"/> Tambah Item
                            </Button>
                             <Button onClick={() => setIsBulkAddOpen(true)} variant="outline" className="w-full">
                                <ListPlus className="mr-2"/> Buat Banyak Item
                            </Button>
                        </div>
                        <Button onClick={handleSave} className="w-full" disabled={isSyncing}>
                            {isSyncing ? <Loader2 className="mr-2 animate-spin"/> : <Save className="mr-2"/>}
                            Simpan Perubahan
                        </Button>
                    </>
                ) : (
                     <Button onClick={() => router.push('/notebook')} variant="outline" className="w-full">
                        <ArrowLeft className="mr-2"/> Kembali ke Daftar
                    </Button>
                )}
            </CardContent>
        </Card>
    </div>
  );
}

    