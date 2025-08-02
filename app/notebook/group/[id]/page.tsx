
'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Trash2, ArrowLeft, Users, MoreVertical, UserPlus, Trash, Loader2 } from 'lucide-react';
import { type NotebookGroup, type GroupTask, type GroupMember } from '@/types/notebook';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose, DialogTrigger } from "@/components/ui/dialog";
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from '@/components/ui/badge';
import notebookGroupsData from '@/data/notebook-groups.json';


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
                    <div key={member.id} onClick={() => handleToggle(member.id)} className="cursor-pointer">
                        <Badge variant={selected.includes(member.id) ? 'default' : 'secondary'} className="flex items-center gap-2 p-2">
                            <Avatar className="h-5 w-5"><AvatarImage src={member.avatarUrl} /><AvatarFallback>{member.name.charAt(0)}</AvatarFallback></Avatar>
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

    const handleAddTask = () => {
        if (!taskLabel.trim()) return;
        onTaskAdded({
            id: `task_${Date.now()}`,
            label: taskLabel,
            completed: false,
            assignedTo: assignedTo,
        });
        setTaskLabel('');
        setAssignedTo([]);
    };

    return (
         <Dialog>
            <DialogTrigger asChild><Button className="w-full"><Plus className="mr-2"/> Tambah Tugas</Button></DialogTrigger>
            <DialogContent>
                <DialogHeader><DialogTitle>Buat Tugas Baru</DialogTitle></DialogHeader>
                <div className="py-4 space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="task-label">Nama Tugas</Label>
                        <Input id="task-label" value={taskLabel} onChange={(e) => setTaskLabel(e.target.value)} placeholder="Contoh: Desain landing page" />
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
  const id = params.id as string;
  const { toast } = useToast();
  
  const [group, setGroup] = useState<NotebookGroup | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const currentGroup = (notebookGroupsData as NotebookGroup[]).find(g => g.id === id);
    if (currentGroup) {
      setGroup(currentGroup);
    } else {
      router.push('/notebook');
    }
    setIsLoading(false);
  }, [id, router]);

  const toggleTaskCompletion = useCallback((taskId: string) => {
    setGroup(currentGroup => {
        if (!currentGroup) return null;
        return { 
            ...currentGroup, 
            tasks: currentGroup.tasks.map(task => 
                task.id === taskId ? { ...task, completed: !task.completed } : task
            ) 
        };
    });
  }, []);

  const handleAddTask = useCallback((newTask: GroupTask) => {
      setGroup(currentGroup => {
          if (!currentGroup) return null;
          return { ...currentGroup, tasks: [...currentGroup.tasks, newTask] };
      });
      toast({title: "Tugas Ditambahkan!", description: `"${newTask.label}" telah ditambahkan ke grup.`});
  }, [toast]);
  
  const handleRemoveTask = useCallback((taskId: string) => {
      setGroup(currentGroup => {
          if(!currentGroup) return null;
          return {...currentGroup, tasks: currentGroup.tasks.filter(t => t.id !== taskId)};
      });
  }, []);

  const progress = useMemo(() => {
    if (!group || group.tasks.length === 0) return 0;
    const completedCount = group.tasks.filter(task => task.completed).length;
    return (completedCount / group.tasks.length) * 100;
  }, [group]);
  
  const getAssigneeAvatars = (task: GroupTask) => {
    if (!group) return [];
    return task.assignedTo.length === 0
        ? [{ id: 'all', name: 'Semua', avatarUrl: '' }]
        : group.members.filter(member => task.assignedTo.includes(member.id));
  };
  
  if (isLoading || !group) {
    return (
        <div className="flex justify-center items-center h-screen">
            <Loader2 className="w-12 h-12 animate-spin text-primary" />
        </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 pb-24">
        <Card className="max-w-4xl mx-auto">
            <CardHeader>
                <div className='flex justify-between items-start'>
                    <div>
                        <CardTitle className="text-2xl font-bold">{group.title}</CardTitle>
                        <CardDescription className="flex items-center gap-2 mt-2">
                             <Progress value={progress} className="w-32" />
                             <span>{Math.round(progress)}% Selesai</span>
                        </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                        <Dialog>
                            <DialogTrigger asChild>
                                <Button variant="outline" size="sm" className="hidden sm:flex"><UserPlus className="mr-2" /> Undang</Button>
                            </DialogTrigger>
                             <DialogContent>
                                 <DialogHeader><DialogTitle>Undang Anggota Baru</DialogTitle></DialogHeader>
                                <div className="py-4"><Input placeholder="Ketik nama, username, atau email..." /></div>
                                <DialogFooter>
                                    <DialogClose asChild><Button variant="outline">Batal</Button></DialogClose>
                                    <Button>Kirim Undangan</Button>
                                </DialogFooter>
                             </DialogContent>
                        </Dialog>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreVertical /></Button></DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem><UserPlus className="mr-2"/> Undang Anggota</DropdownMenuItem>
                                <DropdownMenuItem className="text-destructive"><Trash className="mr-2"/> Hapus Grup</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>

                <div className="flex items-center gap-2 pt-4">
                    <div className="flex -space-x-2 overflow-hidden">
                        {group.members.map(member => (
                            <Avatar key={member.id} className="inline-block h-8 w-8 rounded-full ring-2 ring-background">
                            <AvatarImage src={member.avatarUrl} alt={member.name} />
                            <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                        ))}
                    </div>
                    <span className="text-sm text-muted-foreground">{group.members.length} anggota</span>
                </div>
            </CardHeader>

            <CardContent className="space-y-4">
                <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-2">
                  {group.tasks.map((task) => (
                    <div key={task.id} className="flex items-start gap-3 p-3 bg-secondary/50 rounded-lg">
                      <Checkbox 
                        id={`task-${task.id}`}
                        checked={task.completed}
                        onCheckedChange={() => toggleTaskCompletion(task.id)}
                        className="w-5 h-5 mt-1"
                      />
                      <div className="flex-1">
                          <Label htmlFor={`task-${task.id}`} className={task.completed ? 'line-through text-muted-foreground' : ''}>
                            {task.label || <span className="text-muted-foreground italic">Tugas kosong</span>}
                          </Label>
                          <div className="flex items-center gap-2 mt-1.5">
                             {getAssigneeAvatars(task).map(assignee => (
                                 assignee.id === 'all' 
                                 ? <Badge key="all" variant="secondary" className="flex items-center gap-1"><Users className="w-3 h-3"/>Semua</Badge>
                                 : <Avatar key={assignee.id} className="h-5 w-5"><AvatarImage src={assignee.avatarUrl} /><AvatarFallback>{assignee.name.charAt(0)}</AvatarFallback></Avatar>
                             ))}
                          </div>
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
                            <AlertDialogAction onClick={() => handleRemoveTask(task.id)}>Hapus</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  ))}
                  {group.tasks.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground"><p>Belum ada tugas di grup ini.</p></div>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                    <AddTaskDialog members={group.members} onTaskAdded={handleAddTask} />
                    <Button onClick={() => router.push('/notebook')} variant="outline" className="w-full">
                        <ArrowLeft className="mr-2"/> Kembali ke Daftar
                    </Button>
                </div>
            </CardContent>
        </Card>
    </div>
  );
}
