
'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Trash2, ArrowLeft, Users, MoreVertical, UserPlus, Trash, Loader2, Notebook, ListPlus } from 'lucide-react';
import { type NotebookGroup, type GroupTask, type GroupMember, type GroupChecklistItem } from '@/types/notebook';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/use-auth';
import { v4 as uuidv4 } from 'uuid';

// --- Child Components for Readability ---

const AssigneeSelector = ({ members, selected, onSelectionChange }: { members: GroupMember[], selected: string[], onSelectionChange: (selected: string[]) => void }) => {
    const handleToggle = (memberId: string) => {
        onSelectionChange(
            selected.includes(memberId)
                ? selected.filter(id => id !== memberId)
                : [...selected, memberId]
        );
    };

    return (
        <div className="space-y-2">
            <p className="text-sm font-medium">Pilih Anggota (opsional)</p>
            <p className="text-xs text-muted-foreground">Jika tidak ada yang dipilih, tugas akan ditugaskan ke semua anggota.</p>
            <div className="flex flex-wrap gap-2 pt-2">
                {members.map(member => (
                    <div key={member.id} onClick={() => handleToggle(String(member.id))} className="cursor-pointer">
                        <Badge variant={selected.includes(String(member.id)) ? 'default' : 'secondary'} className="flex items-center gap-2 p-2">
                            <Avatar className="h-5 w-5"><AvatarImage src={member.avatarUrl || undefined} /><AvatarFallback>{member.name.charAt(0)}</AvatarFallback></Avatar>
                            <span>{member.name}</span>
                        </Badge>
                    </div>
                ))}
            </div>
        </div>
    );
};

const AddTaskDialog = ({ members, onTaskAdded }: { members: GroupMember[], onTaskAdded: (task: GroupTask) => void }) => {
    const [taskLabel, setTaskLabel] = useState('');
    const [assignedTo, setAssignedTo] = useState<string[]>([]);
    const [items, setItems] = useState<Omit<GroupChecklistItem, 'id'>[]>([]);
    const [newItemLabel, setNewItemLabel] = useState('');
    const { user } = useAuth();

    const handleAddNewItem = () => {
        if (!newItemLabel.trim()) return;
        setItems([...items, { uuid: uuidv4(), label: newItemLabel, completed: false }]);
        setNewItemLabel('');
    };

    const handleRemoveItem = (indexToRemove: number) => {
        setItems(items.filter((_, index) => index !== indexToRemove));
    };

    const handleAddTask = () => {
        if (!taskLabel.trim() || !user) return;
        const finalItems: GroupChecklistItem[] = items.map(item => ({ ...item, id: 0 })); // Add dummy id
        onTaskAdded({
            id: 0, // Placeholder ID for local state
            uuid: uuidv4(),
            label: taskLabel,
            completed: false,
            assignedTo: assignedTo.map(id => parseInt(id, 10)),
            createdBy: user.id,
            items: finalItems
        });
        // Reset state
        setTaskLabel('');
        setAssignedTo([]);
        setItems([]);
        setNewItemLabel('');
    };

    return (
        <Dialog onOpenChange={(open) => !open && (setTaskLabel(''), setAssignedTo([]), setItems([]), setNewItemLabel(''))}>
            <DialogTrigger asChild>
                <Button className="fixed bottom-24 right-6 h-16 w-16 rounded-full shadow-lg z-20">
                    <Plus className="h-8 w-8" />
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader><DialogTitle>Buat Tugas Baru</DialogTitle></DialogHeader>
                <div className="py-4 space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                    <div className="space-y-2">
                        <Label htmlFor="task-label">Nama Tugas</Label>
                        <Input id="task-label" value={taskLabel} onChange={(e) => setTaskLabel(e.target.value)} placeholder="Contoh: Desain landing page" />
                    </div>
                    
                    <div className="space-y-2">
                        <Label>Checklist Item (Opsional)</Label>
                        <div className="flex gap-2">
                            <Input value={newItemLabel} onChange={(e) => setNewItemLabel(e.target.value)} placeholder="Tambah sub-tugas..." onKeyDown={(e) => { if(e.key === 'Enter') { e.preventDefault(); handleAddNewItem(); }}} />
                            <Button type="button" onClick={handleAddNewItem}><Plus /></Button>
                        </div>
                        <div className="space-y-1 pt-2">
                            {items.map((item, index) => (
                                <div key={index} className="flex items-center gap-2 text-sm bg-secondary p-1 rounded-md">
                                    <ListPlus className="h-4 w-4 text-muted-foreground"/>
                                    <span className="flex-1">{item.label}</span>
                                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleRemoveItem(index)}><Trash2 className="h-4 w-4 text-destructive"/></Button>
                                </div>
                            ))}
                        </div>
                    </div>

                    <AssigneeSelector members={members} selected={assignedTo} onSelectionChange={setAssignedTo} />
                </div>
                <DialogFooter>
                    <DialogClose asChild><Button variant="outline">Batal</Button></DialogClose>
                    <DialogClose asChild><Button onClick={handleAddTask}>Tambah</Button></DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

// --- Main Page Component ---

export default function GroupNotebookPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string; // Group UUID
  const { toast } = useToast();
  const { isAuthenticated, user, fetchWithAuth } = useAuth();
  
  const [group, setGroup] = useState<NotebookGroup | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchGroupDetails = useCallback(async () => {
    if (!isAuthenticated || !id) {
        return;
    }
    setIsLoading(true);
    try {
        const res = await fetchWithAuth(`/api/notebook/group/${id}`);
        if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.message || "Gagal mengambil data grup.");
        }
        const data = await res.json();
        setGroup(data.group);
    } catch (e) {
        console.error(e);
        toast({variant: 'destructive', title: "Error", description: (e as Error).message});
        router.push('/notebook');
    } finally {
        setIsLoading(false);
    }
  }, [id, router, isAuthenticated, fetchWithAuth, toast]);

  useEffect(() => {
    // Only fetch if authenticated. If not, the user shouldn't be here.
    if(isAuthenticated === true) {
        fetchGroupDetails();
    } else if (isAuthenticated === false) {
        router.push('/account');
    }
  }, [isAuthenticated, fetchGroupDetails, router]);

  const toggleTaskCompletion = useCallback(async (task: GroupTask) => {
    if (!group) return;

    const updatedTask = { ...task, completed: !task.completed };
    
    // Optimistic UI update
    setGroup(g => g ? { ...g, tasks: g.tasks.map(t => t.id === task.id ? updatedTask : t) } : null);

    try {
        const res = await fetchWithAuth(`/api/notebook/group/${group.uuid}/task/${task.uuid}`, {
            method: 'PUT',
            body: JSON.stringify(updatedTask)
        });
        if (!res.ok) throw new Error("Gagal memperbarui tugas");
    } catch (error) {
        // Revert on failure
        setGroup(g => g ? { ...g, tasks: g.tasks.map(t => t.id === task.id ? task : t) } : null);
        toast({ variant: 'destructive', title: 'Gagal Memperbarui Tugas'});
    }
  }, [group, fetchWithAuth, toast]);

  const handleAddTask = useCallback(async (newTask: GroupTask) => {
    if (!group) return;
    
    // Optimistic UI update
    setGroup(g => g ? { ...g, tasks: [newTask, ...g.tasks] } : null);

    try {
        const res = await fetchWithAuth(`/api/notebook/group/task`, {
            method: 'POST',
            body: JSON.stringify({...newTask, groupUuid: group.uuid})
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.message);
        
        toast({title: "Tugas Ditambahkan!"});
        fetchGroupDetails(); // Re-fetch to get server-generated ID and confirm state
    } catch (error) {
        setGroup(g => g ? { ...g, tasks: g.tasks.filter(t => t.uuid !== newTask.uuid)} : null);
        toast({ variant: 'destructive', title: "Gagal Menambah Tugas", description: (error as Error).message });
    }
  }, [group, fetchWithAuth, toast, fetchGroupDetails]);
  
  const handleRemoveTask = useCallback(async (task: GroupTask) => {
    if (!group) return;

    const originalTasks = group.tasks;
    // Optimistic UI update
    setGroup(g => g ? {...g, tasks: g.tasks.filter(t => t.id !== task.id)} : null);
    
    try {
        const res = await fetchWithAuth(`/api/notebook/group/${group.uuid}/task/${task.uuid}`, { method: 'DELETE' });
        if (!res.ok) throw new Error("Gagal menghapus tugas");
        toast({title: "Tugas Dihapus"});
    } catch (error) {
        setGroup(g => g ? { ...g, tasks: originalTasks } : null);
        toast({variant: 'destructive', title: 'Gagal Menghapus Tugas'});
    }
  }, [group, fetchWithAuth, toast]);

  const progress = useMemo(() => {
    if (!group || group.tasks.length === 0) return 0;
    const completedCount = group.tasks.filter(task => task.completed).length;
    return (completedCount / group.tasks.length) * 100;
  }, [group]);
  
  const getAssigneeAvatars = (task: GroupTask) => {
    if (!group) return [];
    const assignedIds = new Set(task.assignedTo);
    return task.assignedTo.length === 0
        ? [{ id: 0, name: 'Semua', avatarUrl: '' }] // Use a placeholder ID
        : group.members.filter(member => assignedIds.has(member.id));
  };
  
  if (isLoading || !group) {
    return (
        <div className="flex justify-center items-center h-screen bg-card">
            <Loader2 className="w-12 h-12 animate-spin text-primary" />
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-card flex flex-col">
        <header className="p-4 flex items-center gap-4 sticky top-0 bg-card/80 backdrop-blur-sm z-10 border-b">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
                <ArrowLeft />
            </Button>
            <div className='flex items-center gap-3'>
                <Avatar>
                    <AvatarImage src={group.avatarUrl || `https://placehold.co/40x40.png?text=${group.title.charAt(0)}`}/>
                    <AvatarFallback>{group.title.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className='flex-1'>
                    <h1 className="font-bold text-lg truncate">{group.title}</h1>
                    <p className="text-xs text-muted-foreground">{group.members.length} Anggota</p>
                </div>
            </div>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="ml-auto">
                        <MoreVertical />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem><UserPlus className="mr-2"/> Undang Anggota</DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive"><Trash className="mr-2"/> Hapus Grup</DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </header>

        <main className="flex-1 p-4 pb-24 overflow-y-auto">
            <div className='mb-6'>
                <Label className='text-xs text-muted-foreground'>Progres Penyelesaian</Label>
                <div className='flex items-center gap-2 mt-1'>
                    <Progress value={progress} />
                    <span className="text-sm font-semibold text-muted-foreground whitespace-nowrap">{Math.round(progress)}%</span>
                </div>
            </div>

            <div className="space-y-3">
              {group.tasks.map((task) => (
                <div key={task.id || task.uuid} className="flex items-start gap-3 p-3 bg-background rounded-lg">
                  <Checkbox 
                    id={`task-${task.id}`}
                    checked={task.completed}
                    onCheckedChange={() => toggleTaskCompletion(task)}
                    className="w-5 h-5 mt-1"
                  />
                  <div className="flex-1">
                      <Label htmlFor={`task-${task.id}`} className={task.completed ? 'line-through text-muted-foreground' : ''}>
                        {task.label || <span className="text-muted-foreground italic">Tugas kosong</span>}
                      </Label>
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                         {getAssigneeAvatars(task).map(assignee => (
                             assignee.name === 'Semua' 
                             ? <Badge key="all" variant="secondary" className="flex items-center gap-1"><Users className="w-3 h-3"/>Semua</Badge>
                             : <Avatar key={assignee.id} className="h-5 w-5"><AvatarImage src={assignee.avatarUrl || undefined} /><AvatarFallback>{assignee.name.charAt(0)}</AvatarFallback></Avatar>
                         ))}
                      </div>
                       {task.items && task.items.length > 0 && (
                          <div className="mt-2 space-y-1 pl-4 border-l-2 ml-2">
                              {task.items.map((item) => (
                                  <div key={item.id} className="flex items-center gap-2 text-sm">
                                      <Checkbox id={`item-${item.id}`} checked={item.completed} className="w-4 h-4" />
                                      <Label htmlFor={`item-${item.id}`} className={item.completed ? 'line-through text-muted-foreground' : ''}>{item.label}</Label>
                                  </div>
                              ))}
                          </div>
                      )}
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Hapus Tugas Ini?</AlertDialogTitle>
                        <AlertDialogDescription>Tindakan ini tidak bisa dibatalkan.</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Batal</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleRemoveTask(task)}>Hapus</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              ))}
              {group.tasks.length === 0 && (
                  <div className="text-center py-16 text-muted-foreground border-2 border-dashed rounded-lg">
                    <Notebook className="mx-auto h-12 w-12 mb-4" />
                    <h3 className="font-semibold">Belum Ada Tugas</h3>
                    <p className="text-sm">Klik tombol '+' untuk menambahkan tugas baru.</p>
                  </div>
              )}
            </div>
        </main>
        
        <AddTaskDialog members={group.members} onTaskAdded={handleAddTask} />
    </div>
  );
}
