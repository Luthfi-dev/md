
'use client';
import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, FileSignature, Edit, Trash2, Loader2, MoreVertical, Globe, Lock, Search } from 'lucide-react';
import type { Template } from '@/types/surat';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { getPaginationSettings } from '@/data/app-settings';
import { Input } from '@/components/ui/input';
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';

// Simulate fetching public templates
import publicTemplatesData from '@/data/public-templates.json';

const LOCAL_STORAGE_KEY_TEMPLATES = 'surat_templates_v1';

const usePaginatedData = <T,>(data: T[], initialPageSize: number) => {
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = initialPageSize;

    const paginatedData = useMemo(() => {
        const startIndex = (currentPage - 1) * pageSize;
        return data.slice(startIndex, startIndex + pageSize);
    }, [data, currentPage, pageSize]);

    const totalPages = Math.ceil(data.length / pageSize);

    return {
        currentPage,
        setCurrentPage,
        paginatedData,
        totalPages
    };
}

export default function SuratListPage() {
  const [allMyTemplates, setAllMyTemplates] = useState<Template[]>([]);
  const [allPublicTemplates, setAllPublicTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const router = useRouter();

  const paginationSettings = getPaginationSettings();
  const itemsPerPage = paginationSettings.itemsPerPage;

  useEffect(() => {
    try {
      const storedTemplates = localStorage.getItem(LOCAL_STORAGE_KEY_TEMPLATES);
      if (storedTemplates) {
        setAllMyTemplates(JSON.parse(storedTemplates));
      }
      setAllPublicTemplates(publicTemplatesData as Template[]);
    } catch (error) {
      console.error("Failed to load templates", error);
    }
    setIsLoading(false);
  }, []);

  const filteredMyTemplates = useMemo(() => {
    if (!searchTerm) return allMyTemplates;
    return allMyTemplates.filter(t => t.title.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [allMyTemplates, searchTerm]);

  const filteredPublicTemplates = useMemo(() => {
    if (!searchTerm) return allPublicTemplates;
    return allPublicTemplates.filter(t => t.title.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [allPublicTemplates, searchTerm]);

  const {
      currentPage: myTemplatesPage,
      setCurrentPage: setMyTemplatesPage,
      paginatedData: paginatedMyTemplates,
      totalPages: myTemplatesTotalPages,
  } = usePaginatedData(filteredMyTemplates, itemsPerPage);

  const {
      currentPage: publicTemplatesPage,
      setCurrentPage: setPublicTemplatesPage,
      paginatedData: paginatedPublicTemplates,
      totalPages: publicTemplatesTotalPages,
  } = usePaginatedData(filteredPublicTemplates, itemsPerPage);
  
  useEffect(() => {
    setMyTemplatesPage(1);
    setPublicTemplatesPage(1);
  }, [searchTerm, setMyTemplatesPage, setPublicTemplatesPage]);

  const handleEdit = (id: string) => {
    router.push(`/surat-generator?id=${id}`);
  };

  const handleDelete = (id: string) => {
    try {
      const updatedTemplates = allMyTemplates.filter(t => t.id !== id);
      setAllMyTemplates(updatedTemplates);
      localStorage.setItem(LOCAL_STORAGE_KEY_TEMPLATES, JSON.stringify(updatedTemplates));
    } catch (error) {
      console.error("Failed to delete template from localStorage", error);
    }
    setIsDeleting(null);
  };
  
  const handleCreateNew = () => {
    router.push('/surat-generator');
  };
  
  const handleUsePublicTemplate = (template: Template) => {
     const newId = `surat_${Date.now()}`;
     const newTemplate: Template = {
       ...template,
       id: newId,
       title: `${template.title} (Salinan)`,
       lastModified: new Date().toISOString(),
       status: 'public', // Always default to public when copying
     };
     
     const updatedMyTemplates = [...allMyTemplates, newTemplate];
     setAllMyTemplates(updatedMyTemplates);
     localStorage.setItem(LOCAL_STORAGE_KEY_TEMPLATES, JSON.stringify(updatedMyTemplates));

     router.push(`/surat-generator?id=${newId}`);
  };

  const renderPagination = (currentPage: number, totalPages: number, setCurrentPage: (page: number) => void) => {
    if (totalPages <= 1) return null;
    return (
        <Pagination>
            <PaginationContent>
                <PaginationItem>
                    <PaginationPrevious href="#" onClick={(e) => {e.preventDefault(); setCurrentPage(Math.max(1, currentPage - 1))}} />
                </PaginationItem>
                {[...Array(totalPages)].map((_, i) => (
                    <PaginationItem key={i}>
                        <PaginationLink href="#" isActive={currentPage === i + 1} onClick={(e) => {e.preventDefault(); setCurrentPage(i + 1)}}>
                            {i + 1}
                        </PaginationLink>
                    </PaginationItem>
                ))}
                <PaginationItem>
                    <PaginationNext href="#" onClick={(e) => {e.preventDefault(); setCurrentPage(Math.min(totalPages, currentPage + 1))}} />
                </PaginationItem>
            </PaginationContent>
        </Pagination>
    );
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 pb-24">
      <AlertDialog open={!!isDeleting} onOpenChange={(open) => !open && setIsDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Anda yakin?</AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini tidak bisa dibatalkan. Ini akan menghapus template surat secara permanen.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={() => handleDelete(isDeleting!)}>Hapus</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="max-w-4xl mx-auto space-y-12">
        <div className="text-center">
            <h1 className="text-4xl font-bold font-headline tracking-tight">Generator Surat</h1>
            <p className="text-muted-foreground mt-2 text-lg">
                Buat, kelola, dan jelajahi template surat dengan mudah.
            </p>
        </div>
        <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input 
                placeholder="Cari template surat..."
                className="pl-10 h-12 rounded-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
        </div>
        
        <section>
          <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-8">
            <div>
              <h2 className="text-3xl font-bold font-headline tracking-tight">Template Surat Anda</h2>
              <p className="text-muted-foreground mt-1">
                Kelola, edit, atau buat template surat baru.
              </p>
            </div>
            <Button onClick={handleCreateNew} className="md:ml-auto w-full md:w-auto">
              <Plus className="mr-2" /> Buat Baru
            </Button>
          </div>

          {filteredMyTemplates.length > 0 ? (
            <div className="space-y-4">
              {paginatedMyTemplates.map(template => (
                <Card key={template.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4 overflow-hidden">
                      <FileSignature className="w-8 h-8 text-primary shrink-0" />
                      <div className="truncate">
                        <h3 className="font-semibold truncate">{template.title || 'Tanpa Judul'}</h3>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          {template.status === 'private' 
                              ? <><Lock className="h-3 w-3" /> Privat</> 
                              : <><Globe className="h-3 w-3"/> Publik</>
                          }
                          <span>·</span>
                           <span>{new Date(template.lastModified).toLocaleDateString('id-ID')}</span>
                        </div>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="w-5 h-5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(template.id)}>
                          <Edit className="mr-2 h-4 w-4" />
                          <span>Edit</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setIsDeleting(template.id)} className="text-destructive">
                          <Trash2 className="mr-2 h-4 w-4" />
                          <span>Hapus</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </CardContent>
                </Card>
              ))}
              <div className="pt-4">
                {renderPagination(myTemplatesPage, myTemplatesTotalPages, setMyTemplatesPage)}
              </div>
            </div>
          ) : (
            <div className="text-center py-16 border-2 border-dashed rounded-lg">
              <FileSignature className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-medium">{searchTerm ? 'Tidak Ditemukan' : 'Belum Ada Template'}</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {searchTerm ? `Tidak ada template pribadi yang cocok dengan "${searchTerm}".` : 'Klik "Buat Baru" untuk memulai template surat pertama Anda.'}
              </p>
            </div>
          )}
        </section>

        <section>
          <div className="mb-8">
             <h2 className="text-3xl font-bold font-headline tracking-tight">Jelajahi Template Publik</h2>
             <p className="text-muted-foreground mt-1">Gunakan template siap pakai yang dibuat oleh komunitas.</p>
          </div>
          {filteredPublicTemplates.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {paginatedPublicTemplates.map(template => (
                <Card key={template.id} className="flex flex-col">
                    <CardHeader>
                    <CardTitle className="truncate">{template.title}</CardTitle>
                    <CardDescription>{template.fields.length} field isian.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-grow flex flex-col">
                    <div className="flex-grow">
                        <p className="text-sm text-muted-foreground line-clamp-3" dangerouslySetInnerHTML={{ __html: template.content.replace(/<[^>]*>/g, ' ').replace(/\{\{[^}]*\}\}/g, '...') }}></p>
                    </div>
                    <Button className="w-full mt-4" onClick={() => handleUsePublicTemplate(template)}>
                        <Plus className="mr-2 h-4 w-4"/> Gunakan Template Ini
                    </Button>
                    </CardContent>
                </Card>
                ))}
            </div>
          ) : (
             <div className="text-center py-16 border-2 border-dashed rounded-lg">
                <FileSignature className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-medium">Tidak Ditemukan</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                    Tidak ada template publik yang cocok dengan "${searchTerm}".
                </p>
              </div>
          )}
          <div className="pt-8">
             {renderPagination(publicTemplatesPage, publicTemplatesTotalPages, setPublicTemplatesPage)}
          </div>
        </section>
      </div>
    </div>
  );
}
