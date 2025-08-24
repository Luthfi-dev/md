
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
  content: z.string().describe('The original HTML content of the article to be lengthened.'),
});
export type LengthenArticleInput = z.infer<typeof LengthenArticleInputSchema>;

export const LengthenArticleOutputSchema = z.object({
    content: z.string().describe('The new, lengthened HTML content of the article.'),
});
export type LengthenArticleOutput = z.infer<typeof LengthenArticleOutputSchema>;

export const ShortenArticleInputSchema = z.object({
  content: z.string().describe('The original HTML content of the article to be shortened.'),
});
export type ShortenArticleInput = z.infer<typeof ShortenArticleInputSchema>;

export const ShortenArticleOutputSchema = z.object({
    content: z.string().describe('The new, shortened HTML content of the article.'),
});
export type ShortenArticleOutput = z.infer<typeof ShortenArticleOutputSchema>;

export const GenerateHeadlinesInputSchema = z.object({
  content: z.string().describe('The content of the article to generate headlines for.'),
});
export type GenerateHeadlinesInput = z.infer<typeof GenerateHeadlinesInputSchema>;

export const GenerateHeadlinesOutputSchema = z.object({
    headlines: z.array(z.string()).describe('An array of 5 catchy and relevant headlines.'),
});
export type GenerateHeadlinesOutput = z.infer<typeof GenerateHeadlinesOutputSchema>;

export const SeoMetaInputSchema = z.object({
  articleContent: z.string().describe('The full content of the blog article.'),
});

export const SeoMetaOutputSchema = z.object({
  title: z.string().describe('A catchy, SEO-friendly meta title, around 60 characters.'),
  description: z.string().describe('A compelling meta description, around 155-160 characters.'),
});

// --- Project Estimator Schemas ---
export const ProjectFeatureInputSchema = z.object({
  projectName: z.string().describe('The overall name or type of the project, e.g., "Aplikasi Toko Online" atau "Jasa Desain Logo".'),
  featureDescription: z.string().describe('The specific feature or work item to be estimated, e.g., "Sistem Keranjang Belanja" atau "Revisi desain 3 kali".'),
});
export type ProjectFeatureInput = z.infer<typeof ProjectFeatureInputSchema>;

export const ProjectFeatureOutputSchema = z.object({
  priceMin: z.number().describe('The estimated minimum price for this feature in Indonesian Rupiah (IDR).'),
  priceMax: z.number().describe('The estimated maximum price for this feature in Indonesian Rupiah (IDR).'),
  justification: z.string().describe('A brief, one-sentence justification for the price range, explaining the complexity.'),
});
export type ProjectFeatureOutput = z.infer<typeof ProjectFeatureOutputSchema>;

// --- File Converter Schemas ---
export const HtmlToWordInputSchema = z.object({
  htmlContent: z.string().describe("An HTML string to convert."),
  filename: z.string().describe('The desired name of the file.'),
});
export type HtmlToWordInput = z.infer<typeof HtmlToWordInputSchema>;

export const HtmlToWordOutputSchema = z.object({
  docxDataUri: z.string().optional().describe('The content of the document as a DOCX data uri.'),
  error: z.string().optional(),
});
export type HtmlToWordOutput = z.infer<typeof HtmlToWordOutputSchema>;


// --- Creative Content Schemas ---
export const CreativeContentInputSchema = z.object({
  text: z.string().optional(),
  imageDataUri: z.string().optional().nullable(),
  style: z.string(),
});
export type CreativeContentInput = z.infer<typeof CreativeContentInputSchema>;

export const CreativeContentOutputSchema = z.object({
  content: z.string().describe('Konten pemasaran yang dihasilkan dalam format HTML.'),
});
export type CreativeContentOutput = z.infer<typeof CreativeContentOutputSchema>;
