
'use server';
/**
 * @fileOverview An AI flow to generate SEO metadata for an article.
 */

import { ai, configureAi } from '@/ai/genkit';
import { z } from 'genkit';

// --- Schema Definitions ---
const SeoMetaInputSchema = z.object({
  articleContent: z.string().describe('The full content of the blog article.'),
});

const SeoMetaOutputSchema = z.object({
  title: z.string().describe('A catchy, SEO-friendly meta title, around 60 characters.'),
  description: z.string().describe('A compelling meta description, around 155-160 characters.'),
});

// --- Flow Definition ---
ai.defineFlow(
  {
    name: 'generateSeoMetaFlow',
    inputSchema: SeoMetaInputSchema,
    outputSchema: SeoMetaOutputSchema,
  },
  async (input) => {
    await configureAi();
    
    const { output } = await ai.generate({
        model: 'googleai/gemini-2.0-flash',
        prompt: `You are an SEO expert. Based on the following article content, generate an optimized meta title (around 60 characters) and meta description (around 160 characters).

        Article Content:
        ${input.articleContent}
        `,
        output: {
            schema: SeoMetaOutputSchema
        }
    });

    return output!;
  }
);
