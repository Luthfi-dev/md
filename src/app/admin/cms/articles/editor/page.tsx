// This file is intentionally left blank. 
// The route /admin/cms/articles/editor will now be handled by the editor/new/page.tsx for creating new articles,
// or by editor/[id]/page.tsx for editing existing ones.
// This prevents direct access to a generic editor page without context.
'use client';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function EditorRootPage() {
    const router = useRouter();
    useEffect(() => {
        // Redirect to the article list if someone lands here directly.
        router.replace('/admin/cms/articles');
    }, [router]);
    return null;
}
