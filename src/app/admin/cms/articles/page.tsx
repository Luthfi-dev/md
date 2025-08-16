
'use client';

// This is a placeholder for the full CMS article management page.
// In a real application, this page would list all articles, allow filtering,
// and provide actions for editing, deleting, and reviewing posts.
// For now, it will provide a button to create a new article.

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Newspaper, Plus } from "lucide-react";
import { useRouter } from "next/navigation";

export default function ManageArticlesPage() {
  const router = useRouter();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Newspaper />
          Manajemen Artikel
        </CardTitle>
        <CardDescription>
          Buat, edit, dan kelola semua artikel untuk blog dan rekomendasi.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between items-center">
            <p>Daftar artikel akan ditampilkan di sini.</p>
            <Button onClick={() => router.push('/admin/cms/articles/editor')}>
                <Plus className="mr-2 h-4 w-4" /> Tulis Artikel Baru
            </Button>
        </div>
      </CardContent>
    </Card>
  );
}
