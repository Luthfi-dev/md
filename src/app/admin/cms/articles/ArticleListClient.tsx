
'use client';

import { useState, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Plus, MoreVertical, Edit, Trash2, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { deleteArticle, type ArticleWithAuthor } from "./editor/actions";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

export function ArticleListClient({ initialArticles }: { initialArticles: ArticleWithAuthor[] }) {
  const router = useRouter();
  const { toast } = useToast();
  
  const [articles, setArticles] = useState<ArticleWithAuthor[]>(initialArticles);
  const [searchTerm, setSearchTerm] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async () => {
    if (!deletingId) return;
    try {
        await deleteArticle(deletingId);
        setArticles(prev => prev.filter(a => a.uuid !== deletingId));
        toast({ title: 'Artikel Dihapus' });
    } catch(error) {
        toast({ variant: 'destructive', title: 'Gagal Menghapus', description: (error as Error).message });
    } finally {
        setDeletingId(null);
    }
  };

  const filteredArticles = useMemo(() => {
    return articles.filter(article => 
        article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        article.authorName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [articles, searchTerm]);

  const getStatusBadge = (status: 'draft' | 'pending_review' | 'published') => {
    switch (status) {
      case 'draft': return <Badge variant="secondary">Draft</Badge>;
      case 'pending_review': return <Badge variant="outline" className="text-yellow-600 border-yellow-600">Review</Badge>;
      case 'published': return <Badge variant="default" className="bg-green-600">Published</Badge>;
      default: return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <>
    <AlertDialog open={!!deletingId} onOpenChange={() => setDeletingId(null)}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Anda yakin?</AlertDialogTitle>
                <AlertDialogDescription>Tindakan ini akan menghapus artikel secara permanen.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>Batal</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete}>Hapus</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
     <div className="space-y-4">
        <div className="flex justify-between items-center">
            <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input 
                    placeholder="Cari berdasarkan judul atau penulis..."
                    className="pl-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
             <Button onClick={() => router.push('/admin/cms/articles/editor/new')} className="ml-4">
                <Plus className="mr-2 h-4 w-4" /> Tulis Artikel Baru
            </Button>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Judul</TableHead>
              <TableHead>Penulis</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Tanggal Publikasi</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredArticles.length > 0 ? filteredArticles.map(article => (
              <TableRow key={article.uuid}>
                <TableCell className="font-medium">{article.title}</TableCell>
                <TableCell>{article.authorName}</TableCell>
                <TableCell>{getStatusBadge(article.status)}</TableCell>
                <TableCell>{article.published_at ? new Date(article.published_at).toLocaleDateString('id-ID') : '-'}</TableCell>
                <TableCell className="text-right">
                   <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon"><MoreVertical className="w-5 h-5" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => router.push(`/admin/cms/articles/editor/${article.uuid}`)}>
                          <Edit className="mr-2 h-4 w-4" /> Edit
                        </DropdownMenuItem>
                         <DropdownMenuItem onClick={() => setDeletingId(article.uuid)} className="text-destructive">
                           <Trash2 className="mr-2 h-4 w-4" /> Hapus
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                </TableCell>
              </TableRow>
            )) : (
                 <TableRow>
                    <TableCell colSpan={5} className="text-center h-24">
                        Tidak ada artikel ditemukan.
                    </TableCell>
                </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
