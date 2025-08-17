
'use client';
import ArticleEditorPage from './[id]/page';

// This is a wrapper to allow the editor to be accessed without an ID for new articles.
// The slug `[id]` will be "new" in this case.
export default function NewArticlePage() {
    return <ArticleEditorPage />;
}
