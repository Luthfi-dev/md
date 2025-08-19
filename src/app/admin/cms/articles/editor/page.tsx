'use client';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function EditorRootRedirect() {
    const router = useRouter();

    useEffect(() => {
        // This page should not be accessed directly.
        // It always redirects to create a new article.
        router.replace('/admin/cms/articles/editor/new');
    }, [router]);

    return null; // Render nothing while redirecting
}
