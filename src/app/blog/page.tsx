
// This file will serve as the main blog listing page.
// It will fetch all *published* articles and display them in a grid.
// For now, it will be a simple placeholder.

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function BlogIndexPage() {
  return (
    <div className="container mx-auto px-4 py-8 pb-24">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold font-headline tracking-tight">Blog & Artikel</h1>
          <p className="text-muted-foreground mt-2 text-lg">
            Wawasan, tips, dan pembaruan terbaru dari tim kami.
          </p>
        </div>

        {/* Placeholder for article grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
                <CardHeader>
                    <CardTitle>Artikel Segera Hadir</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">Bagian ini sedang dalam pengembangan. Nantikan artikel-artikel menarik dari kami!</p>
                </CardContent>
            </Card>
        </div>

      </div>
    </div>
  );
}

