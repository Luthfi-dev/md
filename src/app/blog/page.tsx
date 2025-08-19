import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getArticles, type ArticleWithAuthor } from "../admin/cms/articles/editor/actions";
import Link from 'next/link';
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { ArticleSearch } from "./ArticleSearch";

// Revalidate every hour
export const revalidate = 3600;

export default async function BlogIndexPage({
  searchParams,
}: {
  searchParams?: { [key: string]: string | string[] | undefined };
}) {
  const query = typeof searchParams?.q === 'string' ? searchParams.q : '';
  const page = typeof searchParams?.page === 'string' ? Number(searchParams.page) : 1;

  const allArticles: ArticleWithAuthor[] = await getArticles().catch(err => {
    console.error("Failed to fetch articles for blog page:", err);
    return [];
  });
  
  const publishedArticles = allArticles.filter(a => a.status === 'published');
  
  const filteredArticles = query
    ? publishedArticles.filter(article => 
        article.title.toLowerCase().includes(query.toLowerCase()) || 
        article.authorName.toLowerCase().includes(query.toLowerCase())
      )
    : publishedArticles;

  const itemsPerPage = 9;
  const totalPages = Math.ceil(filteredArticles.length / itemsPerPage);
  const paginatedArticles = filteredArticles.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  return (
    <div className="container mx-auto px-4 py-8 pb-24">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold font-headline tracking-tight">Blog & Artikel</h1>
          <p className="text-muted-foreground mt-2 text-lg">
            Wawasan, tips, dan pembaruan terbaru dari tim kami.
          </p>
        </div>
        
        <ArticleSearch initialQuery={query} />

        {paginatedArticles.length > 0 ? (
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {paginatedArticles.map(article => (
              <Link href={`/blog/${article.slug}`} key={article.uuid} className="group">
                <Card className="h-full flex flex-col overflow-hidden transition-shadow duration-300 hover:shadow-xl">
                  {article.featured_image_url && (
                    <div className="relative aspect-video w-full overflow-hidden">
                       <Image 
                        src={`/api/images/${article.featured_image_url}`}
                        alt={article.title}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                       />
                    </div>
                  )}
                  <CardHeader>
                    <CardTitle className="line-clamp-2">{article.title}</CardTitle>
                     <CardDescription>{new Date(article.published_at!).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })} oleh {article.authorName}</CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 text-muted-foreground">
              <p>Tidak ada artikel ditemukan {query ? `untuk "${query}"` : ''}.</p>
          </div>
        )}

        {/* Placeholder for Pagination Controls */}

      </div>
    </div>
  );
}
