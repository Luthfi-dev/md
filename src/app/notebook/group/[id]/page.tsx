
'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Trash2, ArrowLeft, Users, MoreVertical, UserPlus, Trash, Loader2, Notebook, ListPlus, ListChecks, ChevronDown } from 'lucide-react';
import { type NotebookGroup, type GroupTask, type GroupMember, type GroupChecklistItem } from '@/types/notebook';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/use-auth';
import { v4 as uuidv4 } from 'uuid';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { cn } from '@/lib/utils';
import { InviteMemberDialog } from '@/components/notebook/InviteMemberDialog';

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
    const [items, setItems] = useState<Omit<GroupChecklistItem, 'id' | 'taskId'>[]>([]);
    const [newItemLabel, setNewItemLabel] = useState('');
    const [isBulkAddOpen, setIsBulkAddOpen] = useState(false);
    const [bulkAddCount, setBulkAddCount] = useState(10);
    const [isNumbered, setIsNumbered] = useState(false);
    const { user } = useAuth();
    
    const resetState = () => {
        setTaskLabel('');
        setAssignedTo([]);
        setItems([]);
        setNewItemLabel('');
        setIsBulkAddOpen(false);
    }

    const handleAddNewItem = () => {
        if (!newItemLabel.trim()) return;
        setItems([...items, { uuid: uuidv4(), label: newItemLabel, completed: false }]);
        setNewItemLabel('');
    };

    const handleRemoveItem = (indexToRemove: number) => {
        setItems(items.filter((_, index) => index !== indexToRemove));
    };
    
    const handleBulkAdd = () => {
         const newItems: Omit<GroupChecklistItem, 'id' | 'taskId'>[] = Array.from({ length: bulkAddCount }, (_, i) => ({
            uuid: uuidv4(),
            label: isNumbered ? `${items.length + i + 1}. ` : '',
            completed: false,
        }));
        setItems([...items, ...newItems]);
        setIsBulkAddOpen(false);
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
        resetState();
    };

    return (
        <Dialog onOpenChange={(open) => !open && resetState()}>
            <AlertDialog open={isBulkAddOpen} onOpenChange={setIsBulkAddOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader><AlertDialogTitle>Buat Banyak Item</AlertDialogTitle></AlertDialogHeader>
                    <div className="py-4 space-y-4">
                        <Input type="number" value={bulkAddCount} onChange={(e) => setBulkAddCount(Number(e.target.value))} min="1" max="100"/>
                        <div className="flex items-center space-x-2">
                           <Checkbox id="is-numbered" checked={isNumbered} onCheckedChange={(checked) => setIsNumbered(checked as boolean)} />
                           <Label htmlFor="is-numbered">Penomoran Otomatis</Label>
                        </div>
                    </div>
                    <AlertDialogFooter><AlertDialogCancel>Batal</AlertDialogCancel><AlertDialogAction onClick={handleBulkAdd}>Buat</AlertDialogAction></AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

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
                        <div className="space-y-2">
                           {items.map((item, index) => (
                                <div key={index} className="flex items-center gap-2 text-sm bg-secondary p-1 rounded-md">
                                    <ListChecks className="h-4 w-4 text-muted-foreground"/>
                                    <span className="flex-1">{item.label || <i className="text-muted-foreground">Item kosong</i>}</span>
                                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleRemoveItem(index)}><Trash2 className="h-4 w-4 text-destructive"/></Button>
                                </div>
                            ))}
                        </div>
                         <div className="flex gap-2">
                            <Input value={newItemLabel} onChange={(e) => setNewItemLabel(e.target.value)} placeholder="Tambah sub-tugas..." onKeyDown={(e) => { if(e.key === 'Enter') { e.preventDefault(); handleAddNewItem(); }}} />
                            <Button type="button" onClick={handleAddNewItem}><Plus /></Button>
                        </div>
                         <Button variant="outline" size="sm" onClick={() => setIsBulkAddOpen(true)}>Tambah Banyak Item</Button>
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

const ViewMembersDialog = ({ group }: { group: NotebookGroup }) => (
    <Dialog>
        <DialogTrigger asChild>
            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                <Users className="mr-2" /> Lihat Anggota
            </DropdownMenuItem>
        </DialogTrigger>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Anggota Grup: {group.title}</DialogTitle>
                <DialogDescription>Total {group.members.length} anggota.</DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-3 max-h-[60vh] overflow-y-auto">
                {group.members.map(member => (
                    <div key={member.id} className="flex items-center justify-between p-2 rounded-md bg-secondary/50">
                        <div className="flex items-center gap-3">
                            <Avatar>
                                <AvatarImage src={member.avatarUrl || undefined} />
                                <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <p className="font-semibold">{member.name}</p>
                        </div>
                        <Badge variant={member.role === 'admin' ? 'default' : 'outline'}>{member.role}</Badge>
                    </div>
                ))}
            </div>
        </DialogContent>
    </Dialog>
)


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
    if (!isAuthenticated || !id) return;
    setIsLoading(true);
    try {
        const { data } = await fetchWithAuth(`/api/notebook/group/${id}`);
        if (!data.success) {
            throw new Error(data.message || "Gagal mengambil data grup.");
        }
        setGroup(data.group);
    } catch (e) {
        console.error(e);
        toast({variant: 'destructive', title: "Error", description: (e as Error).message});
        router.push('/notebook/groups');
    } finally {
        setIsLoading(false);
    }
  }, [id, router, isAuthenticated, fetchWithAuth, toast]);

  useEffect(() => {
    if(isAuthenticated === true) {
        fetchGroupDetails();
    } else if (isAuthenticated === false) {
        router.push('/account');
    }
  }, [isAuthenticated, fetchGroupDetails, router]);

  const toggleTaskCompletion = useCallback(async (task: GroupTask) => {
    if (!group) return;
    const updatedTask = { ...task, completed: !task.completed };
    setGroup(g => g ? { ...g, tasks: g.tasks.map(t => t.uuid === task.uuid ? updatedTask : t) } : null);

    try {
        const { data } = await fetchWithAuth(`/api/notebook/group/${group.uuid}/task/${task.uuid}`, {
            method: 'PUT',
            data: { completed: updatedTask.completed }
        });
        if (!data.success) throw new Error("Gagal memperbarui tugas");
    } catch (error) {
        setGroup(g => g ? { ...g, tasks: g.tasks.map(t => t.uuid === task.uuid ? task : t) } : null);
        toast({ variant: 'destructive', title: 'Gagal Memperbarui Tugas'});
    }
  }, [group, fetchWithAuth, toast]);

    const toggleChecklistItemCompletion = useCallback(async (task: GroupTask, itemUuid: string) => {
        if (!group) return;

        const updatedItems = task.items.map(item =>
            item.uuid === itemUuid ? { ...item, completed: !item.completed } : item
        );
        const allItemsCompleted = updatedItems.every(item => item.completed);
        const updatedTask = { ...task, items: updatedItems, completed: allItemsCompleted };

        setGroup(g => g ? { ...g, tasks: g.tasks.map(t => t.uuid === task.uuid ? updatedTask : t) } : null);

        try {
            const { data } = await fetchWithAuth(`/api/notebook/group/${group.uuid}/task/${task.uuid}`, {
                method: 'PUT',
                data: { items: updatedItems, completed: allItemsCompleted }
            });
            if (!data.success) throw new Error("Gagal memperbarui item checklist");
        } catch (error) {
            // Revert optimistic update
            setGroup(g => g ? { ...g, tasks: g.tasks.map(t => t.uuid === task.uuid ? task : t) } : null);
            toast({ variant: 'destructive', title: 'Gagal Memperbarui Item' });
        }
    }, [group, fetchWithAuth, toast]);

  const handleAddTask = useCallback(async (newTask: GroupTask) => {
    if (!group) return;
    setGroup(g => g ? { ...g, tasks: [newTask, ...g.tasks] } : null);

    try {
        const { data } = await fetchWithAuth(`/api/notebook/group/task`, {
            method: 'POST',
            data: {...newTask, groupUuid: group.uuid}
        });
        if (!data.success) throw new Error(data.message);
        toast({title: "Tugas Ditambahkan!"});
        fetchGroupDetails();
    } catch (error) {
        setGroup(g => g ? { ...g, tasks: g.tasks.filter(t => t.uuid !== newTask.uuid)} : null);
        toast({ variant: 'destructive', title: "Gagal Menambah Tugas", description: (error as Error).message });
    }
  }, [group, fetchWithAuth, toast, fetchGroupDetails]);
  
  const handleRemoveTask = useCallback(async (task: GroupTask) => {
    if (!group) return;
    const originalTasks = group.tasks;
    setGroup(g => g ? {...g, tasks: g.tasks.filter(t => t.uuid !== task.uuid)} : null);
    
    try {
        const { data } = await fetchWithAuth(`/api/notebook/group/${group.uuid}/task/${task.uuid}`, { method: 'DELETE' });
        if (!data.success) throw new Error("Gagal menghapus tugas");
        toast({title: "Tugas Dihapus"});
    } catch (error) {
        setGroup(g => g ? { ...g, tasks: originalTasks } : null);
        toast({variant: 'destructive', title: 'Gagal Menghapus Tugas'});
    }
  }, [group, fetchWithAuth, toast]);
  
  const getAssigneeAvatars = (task: GroupTask) => {
    if (!group) return [];
    const assignedIds = new Set(task.assignedTo);
    return task.assignedTo.length === 0
        ? [{ id: 0, name: 'Semua', avatarUrl: '', role: 'member' as const }]
        : group.members.filter(member => assignedIds.has(member.id));
  };
  
  const currentUserRole = useMemo(() => {
    if (!group || !user) return 'member';
    return group.members.find(m => m.id === user.id)?.role || 'member';
  }, [group, user]);
  
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
            <Button variant="ghost" size="icon" onClick={() => router.push('/notebook/groups')}>
                <ArrowLeft />
            </Button>
            <div className='flex items-center gap-3'>
                <Avatar><AvatarImage src={group.avatarUrl || `https://placehold.co/40x40.png?text=${group.title.charAt(0)}`}/><AvatarFallback>{group.title.charAt(0)}</AvatarFallback></Avatar>
                <div className='flex-1'><h1 className="font-bold text-lg truncate">{group.title}</h1><p className="text-xs text-muted-foreground">{group.members.length} Anggota</p></div>
            </div>
             <div className="ml-auto flex items-center">
                {currentUserRole === 'admin' && <InviteMemberDialog group={group} onMemberInvited={fetchGroupDetails} />}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreVertical /></Button></DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <ViewMembersDialog group={group} />
                        {currentUserRole === 'admin' && <DropdownMenuItem className="text-destructive"><Trash className="mr-2"/> Hapus Grup</DropdownMenuItem>}
                    </DropdownMenuContent>
                </DropdownMenu>
             </div>
        </header>

        <main className="flex-1 p-4 pb-24 overflow-y-auto">
            <div className="space-y-3">
              {group.tasks.map((task) => {
                 const progress = task.items.length > 0 ? (task.items.filter(i => i.completed).length / task.items.length) * 100 : task.completed ? 100 : 0;
                 const isAssignedToCurrentUser = task.assignedTo.length === 0 || task.assignedTo.includes(user?.id ?? -1);

                 return (
                    <Collapsible key={task.uuid} className="bg-background rounded-lg">
                      <div className="flex items-start gap-3 p-3">
                        <Checkbox id={`task-${task.id}`} checked={task.completed} onCheckedChange={() => toggleTaskCompletion(task)} className="w-5 h-5 mt-1" disabled={!isAssignedToCurrentUser}/>
                        <CollapsibleTrigger className="flex-1 text-left group">
                          <div className="flex-1">
                              <Label htmlFor={`task-${task.id}`} className={cn("cursor-pointer", task.completed && 'line-through text-muted-foreground')}>
                                {task.label || <span className="text-muted-foreground italic">Tugas kosong</span>}
                              </Label>
                              {task.items.length > 0 && <Progress value={progress} className="w-full mt-2 h-2" />}
                              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                  {getAssigneeAvatars(task).map(assignee => (
                                      assignee.name === 'Semua' 
                                      ? <Badge key="all" variant="secondary" className="flex items-center gap-1"><Users className="w-3 h-3"/>Semua</Badge>
                                      : <Avatar key={assignee.id} className="h-5 w-5"><AvatarImage src={assignee.avatarUrl || undefined} /><AvatarFallback>{assignee.name.charAt(0)}</AvatarFallback></Avatar>
                                  ))}
                                  {task.items.length > 0 && <ChevronDown className="w-4 h-4 ml-auto text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />}
                              </div>
                          </div>
                        </CollapsibleTrigger>
                        {currentUserRole === 'admin' && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8 shrink-0"><Trash2 className="h-4 w-4 text-destructive" /></Button></AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader><AlertDialogTitle>Hapus Tugas Ini?</AlertDialogTitle><AlertDialogDescription>Tindakan ini tidak bisa dibatalkan.</AlertDialogDescription></AlertDialogHeader>
                              <AlertDialogFooter><AlertDialogCancel>Batal</AlertDialogCancel><AlertDialogAction onClick={() => handleRemoveTask(task)}>Hapus</AlertDialogAction></AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>
                       {task.items.length > 0 && (
                          <CollapsibleContent>
                            <div className="pl-10 pr-4 pb-3 space-y-2">
                               {task.items.map(item => (
                                <div key={item.uuid} className="flex items-center gap-2 text-sm">
                                  <Checkbox 
                                    id={`item-${item.uuid}`} 
                                    checked={item.completed} 
                                    onCheckedChange={() => toggleChecklistItemCompletion(task, item.uuid)}
                                    disabled={!isAssignedToCurrentUser}
                                    />
                                  <Label htmlFor={`item-${item.uuid}`} className={cn("cursor-pointer", item.completed && "line-through text-muted-foreground", !isAssignedToCurrentUser && "cursor-not-allowed")}>{item.label}</Label>
                                </div>
                               ))}
                            </div>
                          </CollapsibleContent>
                       )}
                    </Collapsible>
                )})}
              {group.tasks.length === 0 && (
                  <div className="text-center py-16 text-muted-foreground border-2 border-dashed rounded-lg bg-background">
                    <Notebook className="mx-auto h-12 w-12 mb-4" />
                    <h3 className="font-semibold">Belum Ada Tugas</h3>
                    {currentUserRole === 'admin' ? (
                        <p className="text-sm">Klik tombol '+' untuk menambahkan tugas baru.</p>
                    ) : (
                        <p className="text-sm">Admin grup belum menambahkan tugas apa pun.</p>
                    )}
                  </div>
              )}
            </div>
        </main>
        
        {currentUserRole === 'admin' && <AddTaskDialog members={group.members} onTaskAdded={handleAddTask} />}
    </div>
  );
}
