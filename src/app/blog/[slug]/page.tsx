
// This is the page for displaying a single blog article.
// It will be rendered server-side for SEO benefits.
// The [slug] parameter will be used to fetch the specific article data.
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";

export default function ArticlePage({ params }: { params: { slug: string } }) {

  return (
    <div className="bg-background py-12 md:py-16">
        <div className="container max-w-4xl mx-auto px-4">
            <article>
                <header className="text-center mb-10">
                    <div className="flex justify-center gap-2 mb-4">
                        <Badge>Teknologi</Badge>
                        <Badge>Produktivitas</Badge>
                    </div>
                    <h1 className="text-3xl md:text-5xl font-bold font-headline tracking-tight mb-4">
                       Judul Artikel Akan Tampil Di Sini
                    </h1>
                    <p className="text-muted-foreground text-lg">
                        Dipublikasikan pada 1 Agustus 2024 oleh Tim Maudigi
                    </p>
                </header>

                <div className="relative aspect-video w-full rounded-2xl overflow-hidden mb-10 shadow-lg">
                     <Image 
                        data-ai-hint="technology blog"
                        src="https://placehold.co/1200x675.png" 
                        alt="Featured Image"
                        layout="fill"
                        objectFit="cover"
                     />
                </div>
                
                <div className="prose prose-lg dark:prose-invert max-w-none mx-auto">
                    <p>
                        Konten artikel yang ditulis di editor akan ditampilkan di sini. Ini adalah area di mana isi dari tulisan Anda akan muncul, diformat dengan indah untuk kenyamanan membaca.
                    </p>
                    <h2>Sub-Judul di Dalam Artikel</h2>
                    <p>
                        Anda dapat menambahkan berbagai elemen format seperti paragraf, sub-judul, daftar, dan banyak lagi untuk menstrukturkan tulisan Anda. Semua ini akan di-render dengan gaya yang konsisten dan mudah dibaca.
                    </p>
                    <ul>
                        <li>Poin pertama dalam daftar.</li>
                        <li>Poin kedua, menyoroti fitur penting.</li>
                        <li>Poin ketiga untuk melengkapi.</li>
                    </ul>
                </div>
            </article>

            <hr className="my-12" />

            <section>
                <h2 className="text-2xl font-bold text-center mb-8">Artikel Terkait Lainnya</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   {/* Placeholder for related articles */}
                   <Card className="hover:shadow-lg transition-shadow">
                        <CardHeader>
                            <CardTitle>Artikel Terkait 1</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground">Deskripsi singkat artikel terkait.</p>
                        </CardContent>
                   </Card>
                   <Card className="hover:shadow-lg transition-shadow">
                        <CardHeader>
                            <CardTitle>Artikel Terkait 2</CardTitle>
                        </CardHeader>
                        <CardContent>
                             <p className="text-muted-foreground">Deskripsi singkat artikel terkait.</p>
                        </CardContent>
                   </Card>
                </div>
            </section>
        </div>
    </div>
  );
}
