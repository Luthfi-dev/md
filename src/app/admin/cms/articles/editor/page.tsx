
'use client';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

// This is a wrapper to allow the editor to be accessed without an ID for new articles.
export default function EditorRootRedirect() {
    const router = useRouter();

    useEffect(() => {
        // This page should not be accessed directly.
        // It always redirects to create a new article.
        router.replace('/admin/cms/articles/editor/new');
    }, [router]);

    // Render a loading state while redirecting
    return (
        <div className="flex h-64 w-full items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin" />
        </div>
    );
}
