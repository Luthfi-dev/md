import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import { getArticle } from "@/app/admin/cms/articles/editor/actions";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import Link from 'next/link';

// This function allows Next.js to know which slugs to pre-render at build time.
// For now, we will leave it empty and render pages on-demand.
export async function generateStaticParams() {
  return [];
}

// Generate metadata dynamically for each article
export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const article = await getArticle(params.slug);
  
  if (!article) {
    return {
      title: 'Artikel Tidak Ditemukan',
    }
  }

  return {
    title: article.meta_title || article.title,
    description: article.meta_description,
    openGraph: {
      title: article.meta_title || article.title,
      description: article.meta_description || 'Baca artikel selengkapnya di Maudigi.',
      type: 'article',
      publishedTime: article.published_at || new Date().toISOString(),
      authors: [article.authorName],
      images: article.featured_image_url ? [`/api/images/${article.featured_image_url}`] : [],
    },
    twitter: {
       card: 'summary_large_image',
       title: article.meta_title || article.title,
       description: article.meta_description || 'Baca artikel selengkapnya di Maudigi.',
       images: article.featured_image_url ? [`/api/images/${article.featured_image_url}`] : [],
    }
  }
}

export default async function ArticlePage({ params }: { params: { slug: string } }) {
    const article = await getArticle(params.slug);
    
    // If no article is found, or if it's not published, show a 404 page.
    if (!article || article.status !== 'published') {
        notFound();
    }

  return (
    <div className="bg-background py-12 md:py-16">
        <div className="container max-w-4xl mx-auto px-4">
            <article>
                <header className="text-center mb-10">
                    <div className="flex justify-center gap-2 mb-4">
                        {article.tags.map(tag => (
                           <Badge key={tag.id}>{tag.name}</Badge>
                        ))}
                    </div>
                    <h1 className="text-3xl md:text-5xl font-bold font-headline tracking-tight mb-4">
                       {article.title}
                    </h1>
                    <p className="text-muted-foreground text-lg">
                        Dipublikasikan pada {new Date(article.published_at!).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })} oleh {article.authorName}
                    </p>
                </header>

                {article.featured_image_url && (
                  <div className="relative aspect-video w-full rounded-2xl overflow-hidden mb-10 shadow-lg">
                     <Image 
                        data-ai-hint="technology blog"
                        src={`/api/images/${article.featured_image_url}`} 
                        alt={article.title}
                        fill
                        className="object-cover"
                        priority
                     />
                </div>
                )}
                
                <div 
                  className="prose prose-lg dark:prose-invert max-w-none mx-auto"
                  dangerouslySetInnerHTML={{ __html: article.content || ''}}
                />
            </article>

            {/* <hr className="my-12" /> */}

            {/* <section>
                <h2 className="text-2xl font-bold text-center mb-8">Artikel Terkait Lainnya</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   // Placeholder for related articles
                </div>
            </section> */}
        </div>
    </div>
  );
}
