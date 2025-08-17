
'use server';
/**
 * @fileOverview An AI flow to generate an article based on a description.
 *
 * - generateArticleOutline: Creates several outline options for an article.
 * - generateArticleFromOutline: Writes a full article from a selected outline.
 */

import { ai, configureAi } from '@/ai/genkit';
import { z } from 'genkit';

// --- Schema for Outline Generation ---
const ArticleOutlineInputSchema = z.object({
  description: z.string().describe('Deskripsi singkat atau ide utama artikel.'),
});

const ArticleOutlineOutputSchema = z.object({
  outlines: z.array(z.object({
      title: z.string().describe("Judul yang menarik untuk artikel ini."),
      points: z.array(z.string()).describe("Poin-poin utama atau sub-judul dalam kerangka artikel.")
  })).describe('Tiga opsi kerangka artikel yang berbeda.'),
});
export type ArticleOutlineOutput = z.infer<typeof ArticleOutlineOutputSchema>;

// --- Schema for Full Article Generation ---
const ArticleFromOutlineInputSchema = z.object({
  selectedOutline: z.object({
    title: z.string(),
    points: z.array(z.string())
  }),
  wordCount: z.number().describe('Target jumlah kata untuk artikel.'),
});

const ArticleFromOutlineOutputSchema = z.object({
  articleContent: z.string().describe('Konten artikel lengkap dalam format HTML.'),
});
export type ArticleFromOutlineOutput = z.infer<typeof ArticleFromOutlineOutputSchema>;


// --- Prompt Definitions (defined once at the top level) ---

const articleOutlinePrompt = ai.definePrompt({
    name: 'articleOutlinePrompt',
    input: { schema: ArticleOutlineInputSchema },
    output: { schema: ArticleOutlineOutputSchema },
    prompt: `Anda adalah seorang penulis konten profesional dan ahli SEO. Berdasarkan deskripsi berikut, buatkan 3 opsi kerangka (outline) yang menarik dan terstruktur untuk sebuah artikel blog. Setiap outline harus memiliki judul yang SEO-friendly dan beberapa poin utama (sub-judul).

Deskripsi: {{{description}}}`,
});

const articleFromOutlinePrompt = ai.definePrompt({
    name: 'articleFromOutlinePrompt',
    input: { schema: ArticleFromOutlineInputSchema },
    output: { schema: ArticleFromOutlineOutputSchema },
    prompt: `Anda adalah seorang penulis konten profesional dan ahli SEO. Berdasarkan kerangka (outline) berikut, tulis sebuah artikel blog yang lengkap, menarik, dan informatif dengan target sekitar {{{wordCount}}} kata.
Gunakan format HTML dengan tag paragraf <p>, sub-judul <h2>, dan daftar <ul><li>. Pastikan gaya bahasanya engaging dan mudah dibaca.

Judul: {{{selectedOutline.title}}}

Poin-poin/Sub-judul:
{{#each selectedOutline.points}}
- {{{this}}}
{{/each}}
`,
});


// --- Flow 1: Generate Outlines ---

const generateArticleOutlineFlow = ai.defineFlow(
  {
    name: 'generateArticleOutlineFlow',
    inputSchema: ArticleOutlineInputSchema,
    outputSchema: ArticleOutlineOutputSchema,
  },
  async (input) => {
    await configureAi();
    const { output } = await articleOutlinePrompt(input);
    return output!;
  }
);

// --- Flow 2: Generate Full Article from Outline ---

const generateArticleFromOutlineFlow = ai.defineFlow(
    {
        name: 'generateArticleFromOutlineFlow',
        inputSchema: ArticleFromOutlineInputSchema,
        outputSchema: ArticleFromOutlineOutputSchema,
    },
    async (input) => {
        await configureAi();
        const { output } = await articleFromOutlinePrompt(input);
        return output!;
    }
);


// --- Exported Server Actions ---

export async function generateArticleOutline(description: string): Promise<ArticleOutlineOutput> {
  return generateArticleOutlineFlow({ description });
}

export async function generateArticleFromOutline(input: z.infer<typeof ArticleFromOutlineInputSchema>): Promise<ArticleFromOutlineOutput> {
    return generateArticleFromOutlineFlow(input);
}

    