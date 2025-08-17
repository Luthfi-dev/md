'use client';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Save, Loader2, FileEdit } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useState, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { createArticle } from "../actions";
import { useRouter } from "next/navigation";

// This is a dedicated page ONLY for creating a new article.
// It keeps the logic simple and avoids the loading issues of the dynamic page.
export default function NewArticlePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);

  const handleSaveDraft = async () => {
      if (!user) {
          toast({ variant: "destructive", title: "Anda harus login untuk membuat artikel." });
          return;
      }
      if (!title.trim()) {
        toast({
            variant: "destructive",
            title: "Judul wajib diisi",
            description: "Silakan beri judul artikel Anda sebelum menyimpan.",
        });
        return;
      }
      
      setIsSaving(true);
      
      const payload = {
          title: title,
          content: editorRef.current?.innerHTML || '',
          author_id: user.id,
      };

      try {
          const result = await createArticle(payload);
          if (result.success && result.uuid) {
              toast({ title: 'Draft Disimpan!', description: 'Anda sekarang dapat melanjutkan mengedit.'});
              // Redirect to the edit page for the newly created article
              router.push(`/admin/cms/articles/editor/${result.uuid}`);
          } else {
              throw new Error(result.message || "Gagal membuat artikel di server.");
          }
      } catch(error) {
           const errorMessage = (error as Error).message;
           toast({ variant: "destructive", title: "Gagal Menyimpan", description: errorMessage });
      } finally {
          setIsSaving(false);
      }
  };
  
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><FileEdit/> Tulis Artikel Baru</CardTitle>
            <CardDescription>Isi judul dan konten di bawah ini. Simpan sebagai draf untuk mendapatkan lebih banyak opsi pengeditan.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Judul Artikel</Label>
              <Input 
                  id="title" 
                  placeholder="Judul yang menarik..." 
                  className="text-lg h-12" 
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
              />
            </div>
             <div className="space-y-2">
                <Label>Editor Konten</Label>
                <div 
                    ref={editorRef}
                    contentEditable={true}
                    className="min-h-[400px] w-full rounded-md border border-input bg-background p-3 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 prose dark:prose-invert max-w-none"
                >
                  <p>Mulai tulis di sini...</p>
                </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="lg:col-span-1 space-y-6">
        <Card>
            <CardHeader>
                <CardTitle>Publikasi</CardTitle>
            </CardHeader>
            <CardContent>
                 <Button className="w-full" onClick={handleSaveDraft} disabled={isSaving}>
                    {isSaving ? <Loader2 className="animate-spin mr-2"/> : <Save className="mr-2" />} Simpan Draft Pertama
                </Button>
                <p className="text-xs text-muted-foreground mt-2">Simpan sebagai draf untuk mengaktifkan fitur SEO, AI, gambar, dan lainnya.</p>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
