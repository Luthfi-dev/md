
'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, FileSignature, Edit, Trash2, Loader2, MoreVertical, Globe, Lock } from 'lucide-react';
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
import { Badge } from '@/components/ui/badge';

// Simulate fetching public templates
import publicTemplatesData from '@/data/public-templates.json';

const LOCAL_STORAGE_KEY_TEMPLATES = 'surat_templates_v1';

export default function SuratListPage() {
  const [myTemplates, setMyTemplates] = useState<Template[]>([]);
  const [publicTemplates, setPublicTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    try {
      const storedTemplates = localStorage.getItem(LOCAL_STORAGE_KEY_TEMPLATES);
      if (storedTemplates) {
        setMyTemplates(JSON.parse(storedTemplates));
      }
      setPublicTemplates(publicTemplatesData as Template[]);
    } catch (error) {
      console.error("Failed to load templates", error);
    }
    setIsLoading(false);
  }, []);

  const handleEdit = (id: string) => {
    router.push(`/surat-generator?id=${id}`);
  };

  const handleDelete = (id: string) => {
    try {
      const updatedTemplates = myTemplates.filter(t => t.id !== id);
      setMyTemplates(updatedTemplates);
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
     };
     
     const updatedMyTemplates = [...myTemplates, newTemplate];
     setMyTemplates(updatedMyTemplates);
     localStorage.setItem(LOCAL_STORAGE_KEY_TEMPLATES, JSON.stringify(updatedMyTemplates));

     router.push(`/surat-generator?id=${newId}`);
  };

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
        <section>
          <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold font-headline tracking-tight">Template Surat Anda</h1>
              <p className="text-muted-foreground mt-1">
                Kelola, edit, atau buat template surat baru.
              </p>
            </div>
            <Button onClick={handleCreateNew} className="md:ml-auto w-full md:w-auto">
              <Plus className="mr-2" /> Buat Baru
            </Button>
          </div>

          {myTemplates.length > 0 ? (
            <div className="space-y-4">
              {myTemplates.map(template => (
                <Card key={template.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <FileSignature className="w-8 h-8 text-primary shrink-0" />
                      <div>
                        <h3 className="font-semibold">{template.title || 'Tanpa Judul'}</h3>
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
            </div>
          ) : (
            <div className="text-center py-16 border-2 border-dashed rounded-lg">
              <FileSignature className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-medium">Belum Ada Template</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Klik "Buat Baru" untuk memulai template surat pertama Anda.
              </p>
            </div>
          )}
        </section>

        <section>
          <div className="mb-8">
             <h2 className="text-3xl font-bold font-headline tracking-tight">Jelajahi Template Publik</h2>
             <p className="text-muted-foreground mt-1">Gunakan template siap pakai yang dibuat oleh komunitas.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {publicTemplates.map(template => (
              <Card key={template.id} className="flex flex-col">
                <CardHeader>
                  <CardTitle>{template.title}</CardTitle>
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
        </section>
      </div>
    </div>
  );
}
