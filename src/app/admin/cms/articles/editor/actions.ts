'use server';
import { ai } from '@/ai/genkit';
import { db } from "@/lib/db";
import { z } from "zod";
import type { RowDataPacket, ResultSetHeader } from "mysql2";
import crypto from 'crypto';


// --- Schemas ---

const ArticlePayloadSchema = z.object({
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
export type ArticlePayload = z.infer<typeof ArticlePayloadSchema>;

const CreateArticlePayloadSchema = ArticlePayloadSchema.pick({
    uuid: true,
    title: true,
    slug: true,
    content: true,
    author_id: true,
});
export type CreateArticlePayload = z.infer<typeof CreateArticlePayloadSchema>;

export type ArticleWithAuthor = {
    uuid: string;
    title: string;
    slug: string;
    status: 'draft' | 'pending_review' | 'published';
    published_at: string | null;
    authorName: string;
    featured_image_url: string | null;
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
export async function getArticle(slugOrUuid: string): Promise<ArticleWithAuthorAndTags | null> {
    if (!slugOrUuid || slugOrUuid === 'new') return null; // Prevent DB query for invalid or new states
    let connection;
    try {
        const isUuid = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(slugOrUuid);
        const queryColumn = isUuid ? 'a.uuid' : 'a.slug';

        connection = await db.getConnection();
        const [articleRows]: [any[], any] = await connection.execute(
            `SELECT a.*, u.name as authorName, u.email as authorEmail 
             FROM articles a 
             JOIN users u ON a.author_id = u.id 
             WHERE ${queryColumn} = ?`, [slugOrUuid]
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
            `SELECT a.uuid, a.title, a.slug, a.status, a.published_at, a.featured_image_url, u.name as authorName 
             FROM articles a 
             JOIN users u ON a.author_id = u.id 
             ORDER BY a.published_at DESC, a.updated_at DESC`
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

export async function createArticle(payload: Omit<CreateArticlePayload, 'slug' | 'content' | 'uuid'> & { content?: string }) {
    let connection;
    try {
        const uuid = crypto.randomUUID();
        const slug = payload.title.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');

        const finalPayload: CreateArticlePayload = {
            ...payload,
            uuid,
            slug,
            content: payload.content || '',
        };

        const validation = CreateArticlePayloadSchema.safeParse(finalPayload);
        if (!validation.success) {
            throw new Error(validation.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', '));
        }

        const { title, content, author_id } = validation.data;
        
        connection = await db.getConnection();
        const sql = `INSERT INTO articles (uuid, title, slug, content, author_id, status) VALUES (?, ?, ?, ?, ?, 'draft')`;
        await connection.execute<ResultSetHeader>(sql, [uuid, title, slug, content, author_id]);

        return { success: true, uuid, message: "Artikel berhasil dibuat." };

    } catch (error) {
        console.error("Error creating article:", error);
        throw new Error((error as Error).message || "Terjadi kesalahan saat membuat artikel.");
    } finally {
        if (connection) connection.release();
    }
}

export async function saveArticle(payload: ArticlePayload) {
    let connection;
    try {
        const validation = ArticlePayloadSchema.safeParse(payload);
        if (!validation.success) {
            const errorDetails = validation.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
            throw new Error(`Validasi gagal: ${errorDetails}`);
        }
        
        const { tags, ...articleData } = validation.data;
        const isPublished = articleData.status === 'published';
        
        connection = await db.getConnection();
        await connection.beginTransaction();

        const [existing]: [any[], any] = await connection.execute('SELECT id, published_at FROM articles WHERE uuid = ?', [articleData.uuid]);
        if (existing.length === 0) {
            throw new Error("Artikel tidak ditemukan untuk diperbarui.");
        }
        const articleId = existing[0].id;
        
        const wasAlreadyPublished = !!existing[0].published_at;
        const publishedAtUpdate = isPublished && !wasAlreadyPublished ? ', published_at = CURRENT_TIMESTAMP' : '';

        const sql = `UPDATE articles SET title=?, slug=?, content=?, featured_image_url=?, status=?, meta_title=?, meta_description=? ${publishedAtUpdate} WHERE id=?`;
        await connection.execute(sql, [
            articleData.title, articleData.slug, articleData.content, articleData.featured_image_url,
            articleData.status, articleData.meta_title, articleData.meta_description, articleId
        ]);

        // Tag handling
        await connection.execute('DELETE FROM article_tags WHERE article_id = ?', [articleId]);
        if (tags && tags.length > 0) {
            const tagIds: number[] = [];
            for (const tagName of tags) {
                const [tagResult] = await connection.execute<ResultSetHeader>(
                    'INSERT INTO tags (name) VALUES (?) ON DUPLICATE KEY UPDATE id=LAST_INSERT_ID(id)', [tagName]
                );
                tagIds.push(tagResult.insertId);
            }
            
            const articleTagValues = tagIds.map(tagId => [articleId, tagId]);
            await connection.query('INSERT INTO article_tags (article_id, tag_id) VALUES ?', [articleTagValues]);
        }

        await connection.commit();
        return { success: true, uuid: articleData.uuid, id: articleId };

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


export async function generateSeoMeta(input: { articleContent: string }) {
     try {
        const result = await ai.runFlow('generateSeoMetaFlow', input);
        return result;
    } catch (error) {
        console.error("Error running generateSeoMetaFlow:", error);
        throw new Error((error as Error).message || "Gagal membuat metadata SEO.");
    }
}
