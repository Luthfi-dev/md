'use server';

import { NextResponse } from 'next/server';
import { getArticles } from '@/app/admin/cms/articles/editor/actions';

// An API route to expose articles to the client-side homepage component.
// This is necessary because the homepage is a Client Component and cannot fetch server-side data directly.
export async function GET() {
    try {
        const articles = await getArticles();
        const publishedArticles = articles.filter(a => a.status === 'published');
        return NextResponse.json({ success: true, articles: publishedArticles });
    } catch (error) {
        console.error("API Error fetching articles: ", error);
        return NextResponse.json({ success: false, message: "Failed to fetch articles." }, { status: 500 });
    }
}
