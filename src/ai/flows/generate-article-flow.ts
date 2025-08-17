
'use server';
/**
 * @fileOverview An AI flow to generate an article based on a description.
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


// --- Flow Definitions ---

export const generateArticleOutline = ai.defineFlow(
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

export const generateArticleFromOutline = ai.defineFlow(
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
