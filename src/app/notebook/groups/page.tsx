
'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Users, Search, ArrowLeft, Loader2, Notebook } from 'lucide-react';
import { type NotebookGroup } from '@/types/notebook';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { CreateGroupDialog } from '@/components/notebook/CreateGroupDialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

export default function GroupNotebookListPage() {
  const [allGroups, setAllGroups] = useState<NotebookGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const router = useRouter();
  const { toast } = useToast();
  const { isAuthenticated, fetchWithAuth } = useAuth();

  const fetchGroups = useCallback(async () => {
    if (!isAuthenticated) return;
    setIsLoading(true);
    try {
      const res = await fetchWithAuth('/api/notebook/group');
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Gagal mengambil data grup.");
      }
      setAllGroups(data.groups || []);
    } catch (e) {
      console.error(e);
      toast({ variant: 'destructive', title: "Error", description: (e as Error).message });
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, fetchWithAuth, toast]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchGroups();
    } else if (isAuthenticated === false) {
      router.push('/account');
    }
  }, [isAuthenticated, fetchGroups, router]);

  const handleGroupCardClick = (uuid: string) => {
    router.push(`/notebook/group/${uuid}`);
  };
  
  const handleGroupCreated = (newGroup: NotebookGroup) => {
    setAllGroups(prev => [newGroup, ...prev]);
    router.push(`/notebook/group/${newGroup.uuid}`);
  }

  const filteredGroups = useMemo(() => {
    if (!searchTerm) return allGroups;
    return allGroups.filter(g => g.title.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [allGroups, searchTerm]);

  return (
    <div className="min-h-screen bg-card flex flex-col">
       <header className="sticky top-0 z-20 bg-card/80 backdrop-blur-sm p-4 border-b">
         <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className='shrink-0' onClick={() => router.push('/notebook')}>
                <ArrowLeft />
            </Button>
            <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                    placeholder="Cari grup..."
                    className="pl-10 h-11 bg-background"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
             <CreateGroupDialog onGroupCreated={handleGroupCreated} />
         </div>
      </header>
      
      <main className="flex-1 p-4 overflow-y-auto">
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="w-12 h-12 animate-spin text-primary" />
          </div>
        ) : filteredGroups.length > 0 ? (
          <div className="space-y-4">
            {filteredGroups.map(group => (
              <Card key={group.uuid} className="hover:shadow-md transition-shadow cursor-pointer bg-background" onClick={() => handleGroupCardClick(group.uuid)}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="truncate">{group.title}</span>
                    {group.activeTaskCount > 0 && <Badge>{group.activeTaskCount} Tugas Aktif</Badge>}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex -space-x-2 overflow-hidden">
                      {group.members.slice(0, 5).map(member => (
                        <Avatar key={member.id} className="inline-block h-8 w-8 rounded-full ring-2 ring-background">
                          <AvatarImage src={member.avatarUrl || undefined} />
                          <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                      ))}
                      {group.members.length > 5 && <Avatar className="inline-block h-8 w-8 rounded-full ring-2 ring-background"><AvatarFallback>+{group.members.length - 5}</AvatarFallback></Avatar>}
                    </div>
                    <div className="flex items-center text-sm text-muted-foreground gap-1">
                        <Users className="w-4 h-4" />
                        <span>{group.members.length}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 text-muted-foreground border-2 border-dashed rounded-lg bg-background">
            <Notebook className="mx-auto h-12 w-12 mb-4" />
            <h3 className="font-semibold">{searchTerm ? 'Grup Tidak Ditemukan' : 'Belum Ada Grup'}</h3>
            <p className="text-sm">
              {searchTerm ? `Tidak ada grup yang cocok dengan "${searchTerm}".` : "Klik 'Buat Grup Baru' untuk memulai kolaborasi."}
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
