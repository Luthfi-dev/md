
'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Trash2, Save, HelpCircle, ListPlus, Edit, ArrowLeft } from 'lucide-react';
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

const LOCAL_STORAGE_KEY_NOTES = 'notebook_notes_v1';

export default function NotebookEditPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const { toast } = useToast();
  
  const [note, setNote] = useState<Note | null>(null);
  const [isBulkAddOpen, setIsBulkAddOpen] = useState(false);
  const [bulkAddCount, setBulkAddCount] = useState(10);
  const [isNumbered, setIsNumbered] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  useEffect(() => {
    if (!id) return;

    if (id === 'new') {
      setNote({
        id: `note_${Date.now()}`,
        title: '',
        items: [],
        createdAt: new Date().toISOString(),
      });
      setIsEditMode(true); // Start in edit mode for new notes
    } else {
      try {
        const storedNotes = localStorage.getItem(LOCAL_STORAGE_KEY_NOTES);
        if (storedNotes) {
          const notes: Note[] = JSON.parse(storedNotes);
          const currentNote = notes.find(n => n.id === id);
          if (currentNote) {
            setNote(currentNote);
          } else {
            router.push('/notebook');
          }
        } else {
            router.push('/notebook');
        }
      } catch (error) {
        console.error("Failed to load note", error);
        router.push('/notebook');
      }
    }
  }, [id, router]);

  const updateNote = useCallback((field: keyof Note, value: any) => {
    setNote(currentNote => currentNote ? { ...currentNote, [field]: value } : null);
  }, []);

  const addItem = useCallback(() => {
    if (!note) return;
    const newItem: ChecklistItem = {
      id: `item_${Date.now()}`,
      label: '',
      completed: false,
    };
    updateNote('items', [...note.items, newItem]);
  }, [note, updateNote]);

  const updateItem = useCallback((itemId: string, newLabel: string) => {
    if (!note) return;
    const updatedItems = note.items.map(item => 
      item.id === itemId ? { ...item, label: newLabel } : item
    );
    updateNote('items', updatedItems);
  }, [note, updateNote]);

  const toggleItemCompletion = useCallback((itemId: string) => {
    if (!note) return;
    const updatedItems = note.items.map(item =>
      item.id === itemId ? { ...item, completed: !item.completed } : item
    );
    const updatedNote = { ...note, items: updatedItems };
    setNote(updatedNote);

    // Auto-save completion status
    try {
        const storedNotesRaw = localStorage.getItem(LOCAL_STORAGE_KEY_NOTES);
        let notes: Note[] = storedNotesRaw ? JSON.parse(storedNotesRaw) : [];
        const existingIndex = notes.findIndex(n => n.id === updatedNote.id);
        if (existingIndex > -1) {
            notes[existingIndex] = updatedNote;
            localStorage.setItem(LOCAL_STORAGE_KEY_NOTES, JSON.stringify(notes));
        }
    } catch (error) {
        console.error("Failed to auto-save note completion", error);
    }

  }, [note]);

  const removeItem = useCallback((itemId: string) => {
    if (!note) return;
    updateNote('items', note.items.filter(item => item.id !== itemId));
  }, [note, updateNote]);
  
  const handleBulkAdd = useCallback(() => {
     if (!note || bulkAddCount <= 0) return;
     const newItems: ChecklistItem[] = Array.from({ length: bulkAddCount }, (_, i) => ({
      id: `item_${Date.now()}_${i}`,
      label: isNumbered ? `${note.items.length + i + 1}. ` : '',
      completed: false,
    }));
    updateNote('items', [...note.items, ...newItems]);
    setIsBulkAddOpen(false);
    setBulkAddCount(10);
    setIsNumbered(false);
  }, [note, updateNote, bulkAddCount, isNumbered]);
  
  const handleSave = () => {
    if (!note) return;
    if (!note.title.trim()) {
        toast({ variant: 'destructive', title: 'Judul tidak boleh kosong!' });
        return;
    }
    
    try {
      const storedNotesRaw = localStorage.getItem(LOCAL_STORAGE_KEY_NOTES);
      let notes: Note[] = storedNotesRaw ? JSON.parse(storedNotesRaw) : [];
      
      const existingIndex = notes.findIndex(n => n.id === note.id);
      if (existingIndex > -1) {
        notes[existingIndex] = note;
      } else {
        notes.push(note);
      }
      
      localStorage.setItem(LOCAL_STORAGE_KEY_NOTES, JSON.stringify(notes));
      toast({ title: 'Catatan Disimpan!', description: `"${note.title}" telah berhasil disimpan.` });
      setIsEditMode(false); // Exit edit mode after saving
    } catch (error) {
        console.error("Failed to save note", error);
        toast({ variant: 'destructive', title: 'Gagal Menyimpan', description: 'Terjadi kesalahan saat menyimpan catatan.' });
    }
  };

  const progress = useMemo(() => {
    if (!note || note.items.length === 0) return 0;
    const completedCount = note.items.filter(item => item.completed).length;
    return (completedCount / note.items.length) * 100;
  }, [note]);

  if (!note) {
    return <div>Loading...</div>;
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
                                <AlertDialogTitle>Cara Penggunaan Jurnal Cerdas</AlertDialogTitle>
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
                    <div key={item.id} className="flex items-center gap-2 group">
                      <Checkbox 
                        checked={item.completed}
                        onCheckedChange={() => toggleItemCompletion(item.id)}
                        className="w-5 h-5"
                      />
                      {isEditMode ? (
                        <Input 
                            value={item.label}
                            onChange={(e) => updateItem(item.id, e.target.value)}
                            className={`border-0 shadow-none focus-visible:ring-0 p-1 h-auto ${item.completed ? 'line-through text-muted-foreground' : ''}`}
                            placeholder='Isi tugas disini...'
                        />
                      ) : (
                        <span className={`p-1 ${item.completed ? 'line-through text-muted-foreground' : ''}`}>
                            {item.label || <span className="text-muted-foreground italic">Item kosong</span>}
                        </span>
                      )}
                      {isEditMode && (
                        <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100" onClick={() => removeItem(item.id)}>
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
                        <Button onClick={handleSave} className="w-full">
                            <Save className="mr-2"/> Simpan Perubahan
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
