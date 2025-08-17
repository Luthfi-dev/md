
'use server';

import { db } from "@/lib/db";
import { z } from "zod";
import type { RowDataPacket, ResultSetHeader } from "mysql2";
import { generateArticleFromOutline as genArticle, generateArticleOutline as genOutline } from "@/ai/flows/generate-article-flow";
import { generateSeoMetaFlow } from "@/ai/flows/generate-seo-meta-flow";

// --- Schemas ---

const ArticleSchema = z.object({
    uuid: z.string().uuid('UUID tidak valid'),
    title: z.string().min(1, 'Judul tidak boleh kosong'),
    slug: z.string().min(1, 'Slug tidak boleh kosong'),
    content: z.string().optional().nullable(),
    featured_image_url: z.string().optional().nullable(),
    author_id: z.number().int(),
    status: z.enum(['draft', 'pending_review', 'published']),
    meta_title: z.string().optional().nullable(),
    meta_description: z.string().optional().nullable(),
    tags: z.array(z.string()).optional(),
});

export type ArticlePayload = z.infer<typeof ArticleSchema>;
export type ArticleWithAuthor = {
    uuid: string;
    title: string;
    status: 'draft' | 'pending_review' | 'published';
    published_at: string | null;
    authorName: string;
}
export type ArticleWithAuthorAndTags = {
    uuid: string;
    title: string;
    slug: string;
    content: string | null;
    featured_image_url: string | null;
    status: 'draft' | 'pending_review' | 'published';
    meta_title: string | null;
    meta_description: string | null;
    published_at: string | null;
    author_id: number;
    authorName: string;
    authorEmail: string;
    tags: { id: number; name: string }[];
};

// --- GETTERS ---
export async function getArticle(uuid: string): Promise<ArticleWithAuthorAndTags | null> {
    let connection;
    try {
        connection = await db.getConnection();
        const [articleRows]: [any[], any] = await connection.execute(
            `SELECT a.*, u.name as authorName, u.email as authorEmail 
             FROM articles a 
             JOIN users u ON a.author_id = u.id 
             WHERE a.uuid = ?`, [uuid]
        );
        if (articleRows.length === 0) return null;
        
        const [tagRows]: [any[], any] = await connection.execute(
            `SELECT t.id, t.name FROM tags t 
             JOIN article_tags at ON t.id = at.tag_id 
             WHERE at.article_id = ?`, [articleRows[0].id]
        );
        
        return { ...articleRows[0], tags: tagRows };
    } catch (error) {
        console.error("Error getting article:", error);
        throw new Error("Gagal mengambil data artikel dari database.");
    } finally {
        if (connection) connection.release();
    }
}

export async function getArticles(): Promise<ArticleWithAuthor[]> {
     let connection;
    try {
        connection = await db.getConnection();
        const [rows]: [any[], any] = await connection.execute(
            `SELECT a.uuid, a.title, a.status, a.published_at, u.name as authorName 
             FROM articles a 
             JOIN users u ON a.author_id = u.id 
             ORDER BY a.updated_at DESC`
        );
        return rows;
    } catch (error) {
        console.error("Error getting articles:", error);
        throw new Error("Gagal mengambil daftar artikel.");
    } finally {
        if (connection) connection.release();
    }
}

// --- MUTATIONS ---
export async function saveArticle(payload: ArticlePayload) {
    let connection;
    try {
        const validation = ArticleSchema.safeParse(payload);
        if (!validation.success) {
            // Throw the specific Zod error message
            throw new Error(validation.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', '));
        }
        
        const { tags, ...articleData } = validation.data;
        const isPublished = articleData.status === 'published';
        
        connection = await db.getConnection();
        await connection.beginTransaction();

        const [existing]: [any[], any] = await connection.execute('SELECT id FROM articles WHERE uuid = ?', [articleData.uuid]);
        let articleId: number;
        
        if (existing.length > 0) {
            articleId = existing[0].id;
            const publishedAtUpdate = isPublished ? ', published_at = COALESCE(published_at, CURRENT_TIMESTAMP)' : '';
            const sql = `UPDATE articles SET title=?, slug=?, content=?, featured_image_url=?, status=?, meta_title=?, meta_description=? ${publishedAtUpdate} WHERE id=?`;
            await connection.execute(sql, [
                articleData.title, articleData.slug, articleData.content, articleData.featured_image_url,
                articleData.status, articleData.meta_title, articleData.meta_description, articleId
            ]);
        } else {
            const publishedAtValue = isPublished ? 'CURRENT_TIMESTAMP' : 'NULL';
            const sql = `INSERT INTO articles (uuid, title, slug, content, featured_image_url, author_id, status, meta_title, meta_description, published_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ${publishedAtValue})`;
            const [result] = await connection.execute<ResultSetHeader>(sql, [
                articleData.uuid, articleData.title, articleData.slug, articleData.content, 
                articleData.featured_image_url, articleData.author_id, articleData.status, 
                articleData.meta_title, articleData.meta_description
            ]);
            articleId = result.insertId;
        }

        if (tags && tags.length > 0) {
            const tagIds: number[] = [];
            for (const tagName of tags) {
                const [tagResult] = await connection.execute<ResultSetHeader>(
                    'INSERT INTO tags (name) VALUES (?) ON DUPLICATE KEY UPDATE id=LAST_INSERT_ID(id)', [tagName]
                );
                tagIds.push(tagResult.insertId);
            }
            
            await connection.execute('DELETE FROM article_tags WHERE article_id = ?', [articleId]);
            const articleTagValues = tagIds.map(tagId => [articleId, tagId]);
            await connection.query('INSERT INTO article_tags (article_id, tag_id) VALUES ?', [articleTagValues]);
        } else {
            await connection.execute('DELETE FROM article_tags WHERE article_id = ?', [articleId]);
        }

        await connection.commit();
        return { uuid: articleData.uuid, id: articleId };

    } catch (error) {
        if (connection) await connection.rollback();
        console.error("Error saving article:", error);
        throw new Error((error as Error).message || "Terjadi kesalahan saat menyimpan artikel.");
    } finally {
        if (connection) connection.release();
    }
}

export async function deleteArticle(uuid: string): Promise<{ success: boolean }> {
    let connection;
    try {
        connection = await db.getConnection();
        const [result] = await connection.execute<ResultSetHeader>('DELETE FROM articles WHERE uuid = ?', [uuid]);
        
        if (result.affectedRows === 0) {
            throw new Error("Artikel tidak ditemukan atau sudah dihapus.");
        }
        
        return { success: true };
    } catch (error) {
        console.error("Error deleting article:", error);
        throw new Error("Gagal menghapus artikel.");
    } finally {
        if (connection) connection.release();
    }
}

// --- AI FUNCTIONS ---

export async function generateArticleOutline(description: string) {
    return await genOutline({ description });
}

export async function generateArticleFromOutline(input: {
  selectedOutline: { title: string; points: string[] };
  wordCount: number;
}) {
    return await genArticle(input);
}

export async function generateSeoMeta(input: { articleContent: string }) {
    return await generateSeoMetaFlow(input);
}

    