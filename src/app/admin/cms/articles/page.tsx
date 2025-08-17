
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Newspaper } from "lucide-react";
import { getArticles, type ArticleWithAuthor } from "./editor/actions";
import { ArticleListClient } from "./ArticleListClient";


export default async function ManageArticlesPage() {
  // Fetch data directly on the server.
  // This makes the initial page load much faster as the data is included in the HTML.
  const initialArticles: ArticleWithAuthor[] = await getArticles().catch(err => {
    console.error("Failed to fetch articles on server:", err);
    return [];
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
            <div>
                <CardTitle className="flex items-center gap-2"><Newspaper /> Manajemen Artikel</CardTitle>
                <CardDescription>Buat, edit, dan kelola semua artikel untuk blog.</CardDescription>
            </div>
        </div>
      </CardHeader>
      <CardContent>
         <ArticleListClient initialArticles={initialArticles} />
      </CardContent>
    </Card>
  );
}
