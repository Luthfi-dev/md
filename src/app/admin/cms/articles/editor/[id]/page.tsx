
'use client';

// This is a placeholder for the Article Editor page.
// This would be a complex component with a rich text editor, form fields for metadata,
// and logic for saving/publishing based on user role.

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Save, Send, Eye, Upload, Trash2, Tag, Loader2, Sparkles, FileEdit, Settings } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useState, useRef } from "react";
import Image from "next/image";
import { useToast } from "@/hooks/use-toast";
import { GenerateArticleDialog } from "@/components/cms/GenerateArticleDialog";

// A simple Tag input component
const TagInput = ({ tags, setTags }: { tags: string[], setTags: (tags: string[]) => void }) => {
    const [inputValue, setInputValue] = useState('');
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && inputValue.trim()) {
            e.preventDefault();
            const newTags = inputValue.split(',').map(tag => tag.trim()).filter(Boolean);
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

export default function ArticleEditorPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [featuredImageUrl, setFeaturedImageUrl] = useState<string | null>(null);
  const [tags, setTags] = useState<string[]>(['Berita', 'Teknologi']);
  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isAiDialogOpen, setIsAiDialogOpen] = useState(false);

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
            setFeaturedImageUrl(`/api/images/${result.filePath}`);
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
  
  const handleArticleGenerated = (articleContent: string) => {
    if(editorRef.current) {
        editorRef.current.innerHTML = articleContent;
    }
    setIsAiDialogOpen(false);
  };

  const isSuperAdmin = user?.role === 1;

  // Placeholder save logic
  const handleSave = async (status: 'draft' | 'pending_review' | 'published') => {
      setIsSaving(true);
      await new Promise(res => setTimeout(res, 1500)); // simulate API call
      setIsSaving(false);
      toast({ title: 'Artikel Disimpan!', description: `Status artikel sekarang: ${status}`});
  };

  return (
    <>
    <GenerateArticleDialog
        isOpen={isAiDialogOpen}
        onOpenChange={setIsAiDialogOpen}
        onArticleGenerated={handleArticleGenerated}
    />
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2"><FileEdit/> Konten Artikel</CardTitle>
             <Button variant="outline" onClick={() => setIsAiDialogOpen(true)}>
                <Sparkles className="mr-2 text-primary"/> Buat dengan AI
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Judul Artikel</Label>
              <Input id="title" placeholder="Judul yang menarik..." className="text-lg h-12" />
            </div>
             <div className="space-y-2">
                <Label>Editor Konten</Label>
                <div 
                    ref={editorRef}
                    contentEditable={true}
                    className="min-h-[400px] w-full rounded-md border border-input bg-background p-3 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 prose dark:prose-invert max-w-none"
                >
                    <p>Tulis konten artikel Anda di sini...</p>
                </div>
            </div>
          </CardContent>
        </Card>
        <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Settings/> Pengaturan SEO</CardTitle></CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="slug">Slug URL</Label>
                    <Input id="slug" placeholder="contoh: tips-belajar-efektif" />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="meta-title">Judul Meta (Optimal 60 karakter)</Label>
                    <Input id="meta-title" />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="meta-description">Deskripsi Meta (Optimal 160 karakter)</Label>
                    <Textarea id="meta-description" />
                </div>
                 <TagInput tags={tags} setTags={setTags} />
            </CardContent>
        </Card>
      </div>

      <div className="lg:col-span-1 space-y-6">
        <Card>
            <CardHeader>
                <CardTitle>Publikasi</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
                 <Button variant="outline" className="w-full" onClick={() => handleSave('draft')}>
                    <Save className="mr-2" /> Simpan sebagai Draft
                </Button>
                {isSuperAdmin ? (
                    <Button className="w-full" onClick={() => handleSave('published')}>
                       <Send className="mr-2" /> Publikasikan
                    </Button>
                ) : (
                    <Button className="w-full" onClick={() => handleSave('pending_review')}>
                       <Eye className="mr-2" /> Kirim untuk Tinjauan
                    </Button>
                )}
            </CardContent>
        </Card>
        <Card>
            <CardHeader><CardTitle>Gambar Unggulan</CardTitle></CardHeader>
            <CardContent className="space-y-4">
                <div className="aspect-video w-full rounded-md border-2 border-dashed flex items-center justify-center bg-secondary/50 overflow-hidden">
                    {isUploading ? <Loader2 className="animate-spin text-primary"/> :
                     featuredImageUrl ? <Image src={featuredImageUrl} alt="Preview" width={300} height={169} className="object-cover w-full h-full"/> : <p className="text-xs text-muted-foreground">Tidak ada gambar</p>}
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
