
'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Trash2, HelpCircle, ListPlus, Edit, ArrowLeft, Loader2, Save } from 'lucide-react';
import { type Note, type ChecklistItem } from '@/types/notebook';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Progress } from '@/components/ui/progress';
import { v4 as uuidv4 } from 'uuid';
import { useDebouncedCallback } from 'use-debounce';

const LOCAL_STORAGE_KEY_NOTES = 'notebook_notes_v1';

export default function NotebookEditPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();

  const id = params.id as string; // This is UUID
  const { toast } = useToast();

  const [note, setNote] = useState<Note | null>(null);
  const [isBulkAddOpen, setIsBulkAddOpen] = useState(false);
  const [bulkAddCount, setBulkAddCount] = useState(10);
  const [isNumbered, setIsNumbered] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Debounced save to avoid excessive saving on every keystroke
  const debouncedSave = useDebouncedCallback((noteToSave: Note) => {
    try {
      const storedNotes: Note[] = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY_NOTES) || '[]');
      const existingIndex = storedNotes.findIndex(n => n.uuid === noteToSave.uuid);
      if (existingIndex > -1) {
        storedNotes[existingIndex] = noteToSave;
      } else {
        storedNotes.unshift(noteToSave);
      }
      localStorage.setItem(LOCAL_STORAGE_KEY_NOTES, JSON.stringify(storedNotes));
    } catch (error) {
      console.error("Gagal menyimpan catatan ke lokal:", error);
    }
  }, 1000);

  const updateNoteAndMarkUnsynced = useCallback((updatedNote: Note) => {
    const newNoteState = { 
      ...updatedNote, 
      isSynced: false,
      lastModified: new Date().toISOString()
    };
    setNote(newNoteState);
    debouncedSave(newNoteState);
  }, [debouncedSave]);

  useEffect(() => {
    const editModeParam = searchParams.get('edit') === 'true';
    setIsLoading(true);

    const loadNote = () => {
        if (!id) return;
        try {
            const storedNotes: Note[] = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY_NOTES) || '[]');
            const currentNote = storedNotes.find(n => n.uuid === id);
            if (currentNote) {
                setNote(currentNote);
                if (editModeParam || currentNote.title === 'Catatan Baru Tanpa Judul') {
                    setIsEditMode(true);
                }
            } else {
                router.push('/notebook');
            }
        } catch (error) {
             console.error("Gagal memuat catatan:", error);
             toast({ variant: 'destructive', title: 'Gagal Memuat Catatan' });
             router.push('/notebook');
        } finally {
            setIsLoading(false);
        }
    }
    loadNote();
  }, [id, router, searchParams, toast]);

  const updateNoteField = (field: keyof Note, value: any) => {
    if (!note) return;
    updateNoteAndMarkUnsynced({ ...note, [field]: value });
  };

  const addItem = () => {
    if (!note) return;
    const newItem: ChecklistItem = {
      uuid: uuidv4(),
      label: '',
      completed: false,
    };
    updateNoteAndMarkUnsynced({ ...note, items: [...note.items, newItem] });
  };

  const updateItem = (itemUuid: string, newLabel: string) => {
    if (!note) return;
    const updatedItems = note.items.map(item =>
      item.uuid === itemUuid ? { ...item, label: newLabel } : item
    );
    updateNoteAndMarkUnsynced({ ...note, items: updatedItems });
  };

  const toggleItemCompletion = (itemUuid: string) => {
    if (!note) return;
    const updatedItems = note.items.map(item =>
      item.uuid === itemUuid ? { ...item, completed: !item.completed } : item
    );
    updateNoteAndMarkUnsynced({ ...note, items: updatedItems });
  };

  const removeItem = (itemUuid: string) => {
    if (!note) return;
    updateNoteAndMarkUnsynced({ ...note, items: note.items.filter(item => item.uuid !== itemUuid) });
  };

  const handleBulkAdd = () => {
     if (!note || bulkAddCount <= 0) return;
     const newItems: ChecklistItem[] = Array.from({ length: bulkAddCount }, (_, i) => ({
      uuid: uuidv4(),
      label: isNumbered ? `${note.items.length + i + 1}. ` : '',
      completed: false,
    }));
    updateNoteAndMarkUnsynced({ ...note, items: [...note.items, ...newItems] });
    setIsBulkAddOpen(false);
    setBulkAddCount(10);
    setIsNumbered(false);
  };

  const progress = useMemo(() => {
    if (!note || !note.items || note.items.length === 0) return 0;
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
                            onChange={(e) => updateNoteField('title', e.target.value)}
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
                                <p>3. Perubahan akan disimpan secara otomatis ke perangkat Anda.</p>
                                <p>4. Gunakan tombol awan di halaman daftar untuk menyimpan ke cloud.</p>
                              </div>
                              <AlertDialogFooter>
                                <AlertDialogAction>Mengerti!</AlertDialogAction>
                              </AlertDialogFooter>
                           </AlertDialogContent>
                        </AlertDialog>
                    </div>
                </CardTitle>
                <CardDescription className="flex items-center gap-2">
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
                        <span className={`p-1 flex-1 ${item.completed ? 'line-through text-muted-foreground' : ''}`}>
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
                        <Button onClick={() => setIsEditMode(false)} className="w-full">
                            <Save className="mr-2"/> Selesai Mengedit
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
