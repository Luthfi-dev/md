
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Notebook, Trash2, Edit, Users, MessageSquare, Phone, UserPlus, Lock } from 'lucide-react';
import { type Note, type NotebookGroup } from '@/types/notebook';
import { Progress } from '@/components/ui/progress';
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
} from "@/components/ui/alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-is-mobile';
import { useAuth } from '@/hooks/use-auth';


// Simulate data
import notebookGroupsData from '@/data/notebook-groups.json';

const LOCAL_STORAGE_KEY_NOTES = 'notebook_notes_v1';

const CreateGroupDialog = ({ onGroupCreated }: { onGroupCreated: (newGroup: NotebookGroup) => void }) => {
    const [groupName, setGroupName] = useState('');
    const { toast } = useToast();
    const isMobile = useIsMobile();
    const { user } = useAuth();

    const handleCreateGroup = () => {
        if (!groupName.trim()) {
            toast({ variant: 'destructive', title: 'Nama Grup Wajib Diisi' });
            return;
        }
        const newGroup: NotebookGroup = {
            id: `group_${Date.now()}`,
            title: groupName,
            members: [
                { id: user!.id.toString(), name: "Anda", avatarUrl: user!.avatar || `https://placehold.co/40x40/3B82F6/FFFFFF.png?text=${user!.name.charAt(0)}` }
            ],
            tasks: []
        };
        onGroupCreated(newGroup);
        setGroupName('');
    };

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button className="w-full md:w-auto">
                    <Plus className="mr-2" /> Buat Grup Baru
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
                        <Label>Undang Anggota (Opsional)</Label>
                        <div className="p-4 border-2 border-dashed rounded-lg text-center space-y-3">
                             <Input placeholder="Ketik nama, username, atau email..." />
                             <p className="text-xs text-muted-foreground">ATAU</p>
                             <div className='flex flex-col sm:flex-row gap-2 justify-center'>
                                <Button variant="outline" size="sm" className="w-full"><Phone className="mr-2"/> Undang {isMobile ? '' : 'dari Kontak'}</Button>
                                <Button variant="outline" size="sm" className="w-full"><MessageSquare className="mr-2"/> Undang {isMobile ? '' : 'via WhatsApp'}</Button>
                             </div>
                        </div>
                    </div>
                </div>
                <DialogFooter>
                    <DialogClose asChild>
                      <Button variant="outline">Batal</Button>
                    </DialogClose>
                    <DialogClose asChild>
                        <Button onClick={handleCreateGroup}>Buat Grup</Button>
                    </DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};


export default function NotebookListPage() {
  const [personalNotes, setPersonalNotes] = useState<Note[]>([]);
  const [groupNotes, setGroupNotes] = useState<NotebookGroup[]>([]);
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    try {
      const storedNotes = localStorage.getItem(LOCAL_STORAGE_KEY_NOTES);
      if (storedNotes) {
        setPersonalNotes(JSON.parse(storedNotes));
      }
      // In a real app, this would be an API call based on user's groups
      setGroupNotes(notebookGroupsData); 
    } catch (error) {
      console.error("Failed to load notes", error);
    }
  }, []);

  const handleCreateNewPersonalNote = () => {
    router.push(`/notebook/new`);
  };

  const handleCardClick = (id: string) => {
    router.push(`/notebook/${id}`);
  }
  
  const handleGroupCardClick = (id: string) => {
    router.push(`/notebook/group/${id}`);
  }

  const handleEdit = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    router.push(`/notebook/${id}?edit=true`);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const updatedNotes = personalNotes.filter(n => n.id !== id);
      setPersonalNotes(updatedNotes);
      localStorage.setItem(LOCAL_STORAGE_KEY_NOTES, JSON.stringify(updatedNotes));
    } catch (error) {
      console.error("Failed to delete note from localStorage", error);
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
      <Button onClick={handleCreateNewPersonalNote} className="w-full md:w-auto">
        <Plus className="mr-2" /> Buat Catatan Baru
      </Button>
      
      {personalNotes.length > 0 ? (
        personalNotes.map(note => {
          const progress = getProgress(note);
          const isCompleted = progress === 100 && note.items.length > 0;

          return (
          <Card key={note.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => handleCardClick(note.id)}>
            <CardHeader>
                <CardTitle className="flex justify-between items-center">
                    <span className="truncate">{note.title || 'Tanpa Judul'}</span>
                     <div className="flex items-center gap-1 shrink-0">
                        {!isCompleted && (
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => handleEdit(note.id, e)}>
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
                                <AlertDialogAction onClick={(e) => handleDelete(note.id, e)}>Hapus</AlertDialogAction>
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
          {groupNotes.length > 0 ? (
            groupNotes.map(group => (
              <Card key={group.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => handleGroupCardClick(group.id)}>
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
