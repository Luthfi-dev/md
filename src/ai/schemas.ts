
/**
 * @fileOverview Shared schemas for AI flows.
 * This file contains only Zod schema definitions and TypeScript types.
 * It is safe to be imported by both Client and Server Components.
 * It MUST NOT contain the 'use server' directive.
 */
import { z } from 'zod';

// --- Chat Schemas ---
export const ChatMessageSchema = z.object({
  role: z.enum(['user', 'model']),
  content: z.string(),
});
export type ChatMessage = z.infer<typeof ChatMessageSchema>;
export const ChatHistorySchema = z.array(ChatMessageSchema);

// --- Article Generation Schemas ---
export const ArticleOutlineInputSchema = z.object({
  description: z.string().describe('Deskripsi singkat atau ide utama artikel.'),
});

export const ArticleOutlineOutputSchema = z.object({
  outlines: z.array(z.object({
      title: z.string().describe("Judul yang menarik untuk artikel ini."),
      points: z.array(z.string()).describe("Poin-poin utama atau sub-judul dalam kerangka artikel.")
  })).describe('Tiga opsi kerangka artikel yang berbeda.'),
});

export const ArticleFromOutlineInputSchema = z.object({
  selectedOutline: z.object({
    title: z.string(),
    points: z.array(z.string())
  }),
  wordCount: z.number().describe('Target jumlah kata untuk artikel.'),
});

export const ArticleFromOutlineOutputSchema = z.object({
  articleContent: z.string().describe('Konten artikel lengkap dalam format HTML.'),
});

export const LengthenArticleInputSchema = z.object({
  originalContent: z.string().describe('The original HTML content of the article to be lengthened.'),
});

export const LengthenArticleOutputSchema = z.object({
    articleContent: z.string().describe('The new, lengthened HTML content of the article.'),
});


export const SeoMetaInputSchema = z.object({
  articleContent: z.string().describe('The full content of the blog article.'),
});

export const SeoMetaOutputSchema = z.object({
  title: z.string().describe('A catchy, SEO-friendly meta title, around 60 characters.'),
  description: z.string().describe('A compelling meta description, around 155-160 characters.'),
});
