
'use client';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Save, Send, Eye, Upload, Trash2, Tag, Loader2, Sparkles, FileEdit, Settings, RotateCcw, Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useState, useRef, useEffect, useCallback } from "react";
import Image from "next/image";
import { useToast } from "@/hooks/use-toast";
import { GenerateArticleDialog } from "@/components/cms/GenerateArticleDialog";
import { getArticle, saveArticle, type ArticlePayload, type ArticleWithAuthorAndTags } from "../actions";
import { generateSeoMeta } from "@/ai/genkit";
import { useRouter, useParams } from "next/navigation";
import crypto from 'crypto';

// A simple Tag input component
const TagInput = ({ tags, setTags }: { tags: string[], setTags: (tags: string[]) => void }) => {
    const [inputValue, setInputValue] = useState('');
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && inputValue.trim()) {
            e.preventDefault();
            const newTags = inputValue.split(',').map(tag => tag.trim().toLowerCase()).filter(Boolean);
            const uniqueNewTags = newTags.filter(tag => !tags.includes(tag));
            if (uniqueNewTags.length > 0) {
              setTags([...tags, ...uniqueNewTags]);
            }
            setInputValue('');
        }
    };
    const removeTag = (tagToRemove: string) => {
        setTags(tags.filter(tag => tag !== tagToRemove));
    };

    return (
        <div className="space-y-2">
            <Label htmlFor="tags">Tags (pisahkan dengan koma)</Label>
            <Input 
                id="tags" 
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ketik tag lalu tekan Enter"
            />
            <div className="flex flex-wrap gap-2">
                {tags.map(tag => (
                    <div key={tag} className="flex items-center gap-1 bg-secondary text-secondary-foreground rounded-full px-3 py-1 text-sm">
                        <Tag className="w-3 h-3"/>
                        {tag}
                        <button onClick={() => removeTag(tag)} className="ml-1 text-muted-foreground hover:text-destructive"><Trash2 className="w-3 h-3"/></button>
                    </div>
                ))}
            </div>
        </div>
    );
};


// Main Component for EDITING an existing article or new one.
export default function ArticleEditorPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string; // This can be UUID or "new"

  const [article, setArticle] = useState<Partial<ArticleWithAuthorAndTags> | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isGeneratingMeta, setIsGeneratingMeta] = useState(false);
  
  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isAiDialogOpen, setIsAiDialogOpen] = useState(false);

  const generateSlug = useCallback((title: string) => {
    return title
      .toLowerCase()
      .replace(/ /g, '-')
      .replace(/[^\w-]+/g, '');
  }, []);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setArticle(prev => ({
        ...prev,
        title: newTitle,
        slug: generateSlug(newTitle),
        meta_title: prev?.meta_title ? prev.meta_title : newTitle,
    }));
  };

  useEffect(() => {
    const fetchArticleData = async (articleId: string) => {
      setIsLoading(true);
      try {
        const fetchedArticle = await getArticle(articleId);
        if (fetchedArticle) {
          setArticle({
              ...fetchedArticle,
              tags: fetchedArticle.tags.map(t => t.name)
          });
          if (editorRef.current) {
              editorRef.current.innerHTML = fetchedArticle.content || '';
          }
        } else {
           toast({ variant: 'destructive', title: 'Artikel tidak ditemukan' });
           router.push('/admin/cms/articles');
        }
      } catch (error) {
         toast({ variant: 'destructive', title: 'Gagal memuat artikel', description: (error as Error).message });
      } finally {
          setIsLoading(false);
      }
    };
    
    if (id === 'new') {
        // This is a new article, initialize with default values
        setArticle({
            uuid: crypto.randomUUID(),
            title: '',
            slug: '',
            content: '<p>Tulis konten artikel Anda di sini...</p>',
            status: 'draft',
            tags: [],
        });
        setIsLoading(false);
    } else {
        fetchArticleData(id);
    }
  }, [id, toast, router]);
  

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('subfolder', 'articles');

    try {
        const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData,
        });
        const result = await response.json();
        if (result.success) {
            setArticle(prev => ({ ...prev, featured_image_url: result.filePath }));
            toast({ title: 'Gambar Unggulan Diunggah' });
        } else {
            throw new Error(result.message);
        }
    } catch (error) {
        toast({ variant: 'destructive', title: 'Gagal Mengunggah', description: (error as Error).message });
    } finally {
        setIsUploading(false);
    }
  };
  
  const handleArticleGenerated = (content: string, title?: string) => {
    if(editorRef.current) {
        editorRef.current.innerHTML = content;
    }
    setArticle(p => ({...p, content}));
    if (title) {
       handleTitleChange({ target: { value: title } } as React.ChangeEvent<HTMLInputElement>);
    }
    setIsAiDialogOpen(false);
  };
  
  const handleGenerateMeta = async () => {
      const content = editorRef.current?.innerText || '';
      if (content.length < 50) {
        toast({variant: 'destructive', title: 'Konten Tidak Cukup', description: 'Tulis setidaknya 50 karakter di editor untuk menghasilkan meta.'});
        return;
      }
      setIsGeneratingMeta(true);
      try {
        const result = await generateSeoMeta({ articleContent: content });
        if (result && result.title && result.description) {
            setArticle(p => ({
                ...p,
                meta_title: result.title,
                meta_description: result.description,
            }));
            toast({ title: 'Meta SEO Dibuat!'});
        }
      } catch(error) {
        toast({variant: 'destructive', title: 'Gagal Membuat Meta', description: (error as Error).message});
      } finally {
        setIsGeneratingMeta(false);
      }
  }

  const handleSave = async (status: 'draft' | 'pending_review' | 'published') => {
      if (!user || !article?.uuid) {
          toast({ variant: "destructive", title: "Data tidak valid atau Anda belum login." });
          return;
      }
       if (!article.title || article.title.trim() === '') {
        toast({
            variant: "destructive",
            title: "Gagal Menyimpan",
            description: "Judul artikel tidak boleh kosong.",
        });
        return;
      }
      setIsSaving(true);
      
      const payload: ArticlePayload = {
          uuid: article.uuid!,
          title: article.title || '',
          slug: article.slug || generateSlug(article.title || ''),
          content: editorRef.current?.innerHTML || '',
          featured_image_url: article.featured_image_url,
          status: status,
          author_id: article.author_id || user.id,
          meta_title: article.meta_title,
          meta_description: article.meta_description,
          tags: article.tags || [],
      };

      try {
          await saveArticle(payload);
          toast({ title: 'Artikel Disimpan!', description: `Status artikel sekarang: ${status}`});
          setArticle(p => ({ ...p, status })); // Update status in local state
          // If it was a new article, update the URL
          if (id === 'new') {
              router.replace(`/admin/cms/articles/editor/${payload.uuid}`);
          }
      } catch(error) {
           const errorMessage = (error as Error).message;
           toast({ variant: "destructive", title: "Gagal Menyimpan", description: errorMessage, duration: 8000 });
      } finally {
          setIsSaving(false);
      }
  };
  
  const executeCommand = (command: 'bold' | 'italic' | 'underline' | 'justifyLeft' | 'justifyCenter' | 'justifyRight') => {
    if (editorRef.current) {
        editorRef.current.focus();
        document.execCommand(command, false);
    }
  };

  const isSuperAdmin = user?.role === 1;

  if (isLoading || !article) {
    return <div className="flex justify-center items-center h-96"><Loader2 className="w-12 h-12 animate-spin text-primary"/></div>;
  }

  return (
    <>
    <GenerateArticleDialog
        isOpen={isAiDialogOpen}
        onOpenChange={setIsAiDialogOpen}
        onArticleGenerated={handleArticleGenerated}
        initialContent={article.content || ''}
        initialTitle={article.title || ''}
    />
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2"><FileEdit/> {id === 'new' ? 'Tulis Artikel Baru' : 'Edit Artikel'}</CardTitle>
             <Button variant="outline" onClick={() => setIsAiDialogOpen(true)}>
                <Sparkles className="mr-2 text-primary"/> Buat dengan AI
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Judul Artikel</Label>
              <Input 
                  id="title" 
                  placeholder="Judul yang menarik..." 
                  className="text-lg h-12" 
                  value={article.title || ''}
                  onChange={handleTitleChange}
              />
            </div>
             <div className="space-y-2">
                <Label>Editor Konten</Label>
                 <div className="border rounded-t-md p-2 flex items-center gap-2 bg-secondary/50 flex-wrap">
                    <Button variant="outline" size="icon" onMouseDown={(e) => { e.preventDefault(); executeCommand('bold'); }}><Bold /></Button>
                    <Button variant="outline" size="icon" onMouseDown={(e) => { e.preventDefault(); executeCommand('italic'); }}><Italic /></Button>
                    <Button variant="outline" size="icon" onMouseDown={(e) => { e.preventDefault(); executeCommand('underline'); }}><Underline /></Button>
                    <div className="border-l h-6 mx-1"></div>
                    <Button variant="outline" size="icon" onMouseDown={(e) => { e.preventDefault(); executeCommand('justifyLeft'); }}><AlignLeft /></Button>
                    <Button variant="outline" size="icon" onMouseDown={(e) => { e.preventDefault(); executeCommand('justifyCenter'); }}><AlignCenter /></Button>
                    <Button variant="outline" size="icon" onMouseDown={(e) => { e.preventDefault(); executeCommand('justifyRight'); }}><AlignRight /></Button>
                </div>
                <div 
                    ref={editorRef}
                    contentEditable={true}
                    className="min-h-[400px] w-full rounded-b-md border border-input bg-background p-3 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 prose dark:prose-invert max-w-none"
                    dangerouslySetInnerHTML={{ __html: article.content || '' }}
                    suppressContentEditableWarning={true}
                />
            </div>
          </CardContent>
        </Card>
        <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Settings/> Pengaturan SEO</CardTitle></CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="slug">Slug URL</Label>
                    <Input 
                        id="slug" 
                        placeholder="contoh: tips-belajar-efektif" 
                        value={article.slug || ''}
                        onChange={(e) => setArticle(p => ({...p, slug: e.target.value}))}
                     />
                </div>
                <div className="space-y-2">
                    <div className="flex justify-between items-center">
                        <Label htmlFor="meta-title">Judul Meta (Optimal 60 karakter)</Label>
                        <Button variant="ghost" size="icon" onClick={handleGenerateMeta} disabled={isGeneratingMeta}>
                           {isGeneratingMeta ? <Loader2 className="animate-spin" /> : <Sparkles className="text-primary"/>}
                        </Button>
                    </div>
                    <Input 
                        id="meta-title"
                        value={article.meta_title || ''}
                        onChange={(e) => setArticle(p => ({...p, meta_title: e.target.value}))}
                     />
                </div>
                <div className="space-y-2">
                    <div className="flex justify-between items-center">
                        <Label htmlFor="meta-description">Deskripsi Meta (Optimal 160 karakter)</Label>
                        <Button variant="ghost" size="icon" onClick={handleGenerateMeta} disabled={isGeneratingMeta}>
                           {isGeneratingMeta ? <Loader2 className="animate-spin" /> : <Sparkles className="text-primary"/>}
                        </Button>
                    </div>
                    <Textarea 
                        id="meta-description"
                        value={article.meta_description || ''}
                        onChange={(e) => setArticle(p => ({...p, meta_description: e.target.value}))}
                    />
                </div>
                 <TagInput tags={article.tags || []} setTags={(newTags) => setArticle(p => ({ ...p, tags: newTags }))} />
            </CardContent>
        </Card>
      </div>

      <div className="lg:col-span-1 space-y-6">
        <Card>
            <CardHeader>
                <CardTitle>Publikasi</CardTitle>
                <CardDescription>Status saat ini: {article.status}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
                 <Button variant="outline" className="w-full" onClick={() => handleSave('draft')} disabled={isSaving}>
                    {isSaving ? <Loader2 className="animate-spin mr-2"/> : <Save className="mr-2" />} Simpan Draft
                </Button>
                
                {isSuperAdmin ? (
                    <Button className="w-full" onClick={() => handleSave('published')} disabled={isSaving}>
                       {isSaving ? <Loader2 className="animate-spin mr-2"/> : <Send className="mr-2" />} Publikasikan
                    </Button>
                ) : (
                    <Button className="w-full" onClick={() => handleSave('pending_review')} disabled={isSaving || article.status === 'pending_review'}>
                       {isSaving ? <Loader2 className="animate-spin mr-2"/> : <Eye className="mr-2" />} 
                       {article.status === 'pending_review' ? 'Menunggu Review' : 'Kirim untuk Review'}
                    </Button>
                )}
                 {isSuperAdmin && article.status === 'pending_review' && (
                    <Button className="w-full" variant="secondary" onClick={() => handleSave('draft')}>
                        <RotateCcw className="mr-2"/> Kembalikan ke Draft
                    </Button>
                 )}
            </CardContent>
        </Card>
        <Card>
            <CardHeader><CardTitle>Gambar Unggulan</CardTitle></CardHeader>
            <CardContent className="space-y-4">
                <div className="aspect-video w-full rounded-md border-2 border-dashed flex items-center justify-center bg-secondary/50 overflow-hidden">
                    {isUploading ? <Loader2 className="animate-spin text-primary"/> :
                     article.featured_image_url ? <Image src={`/api/images/${article.featured_image_url}`} alt="Preview" width={300} height={169} className="object-cover w-full h-full"/> : <p className="text-xs text-muted-foreground">Tidak ada gambar</p>}
                </div>
                <Button variant="outline" className="w-full" onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
                    <Upload className="mr-2"/> Unggah Gambar
                </Button>
                <Input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload}/>
            </CardContent>
        </Card>
      </div>
    </div>
    </>
  );
}
