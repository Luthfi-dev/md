
'use client';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import ArticleEditorPage from './[id]/page';

// This is a wrapper to allow the editor to be accessed without an ID for new articles.
// It effectively redirects to the dynamic route with a "new" slug.
export default function NewArticlePageWrapper() {
    const router = useRouter();

    const handleCreateNew = () => {
        router.push('/admin/cms/articles/editor/new');
    }

    // This page should ideally not be rendered directly, but as a fallback,
    // we can provide a button to go to the correct page.
    // The main entry point should be the button on the article list page.
    return (
        <div className="flex justify-center items-center h-full">
             <Button onClick={handleCreateNew}>
                <Plus className="mr-2 h-4 w-4" /> Tulis Artikel Baru
            </Button>
        </div>
    );
}
