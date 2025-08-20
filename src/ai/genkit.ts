/**
 * @fileOverview Core Genkit flow definitions.
 * This file is ONLY for defining and registering flows with Genkit.
 * It MUST NOT be imported by any client-facing server action files.
 * It is imported by `dev.ts` to make flows available to the Genkit environment.
 */
import { genkit, type GenerationCommonConfig } from 'genkit';
import { googleAI, gemini15Flash } from '@genkit-ai/googleai';
import { z } from 'zod';
import { ApiKeyManager, FALLBACK_KEY } from '@/services/ApiKeyManager';
import assistant from '@/data/assistant.json';
import {
  ChatHistorySchema,
  ChatMessageSchema,
  ArticleOutlineInputSchema,
  ArticleOutlineOutputSchema,
  ArticleFromOutlineInputSchema,
  ArticleFromOutlineOutputSchema,
  SeoMetaInputSchema,
  SeoMetaOutputSchema
} from './schemas';

// Initialize a single, global AI instance.
export const ai = genkit({
  plugins: [
    googleAI(), // Initialized without an API key.
  ],
});


// --------------------------------------------------------------------------
//  FLOW DEFINITIONS
//  These are the core AI logic functions registered with Genkit.
// --------------------------------------------------------------------------

ai.defineFlow(
  {
    name: 'chatFlow',
    inputSchema: ChatHistorySchema,
    outputSchema: ChatMessageSchema,
  },
  async (history) => {
    const apiKeyRecord = await ApiKeyManager.getApiKey();
    if (apiKeyRecord.key === FALLBACK_KEY) {
      throw new Error('Layanan AI tidak terkonfigurasi. Silakan hubungi administrator.');
    }
    
    const modelHistory = history.reduce((acc, msg, index) => {
      if (index === history.length - 1) return acc;
      acc.push({ role: msg.role, parts: [{ text: msg.content }] });
      return acc;
    }, [] as { role: 'user' | 'model'; parts: { text: string }[] }[]);

    const lastMessage = history[history.length - 1];
    const prompt = lastMessage?.content ?? '';

    const safetySettings: GenerationCommonConfig['safetySettings'] = [
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_ONLY_HIGH' },
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_ONLY_HIGH' },
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_ONLY_HIGH' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_ONLY_HIGH' },
    ];

    try {
      const response = await ai.generate({
        model: gemini15Flash,
        system: assistant.systemPrompt,
        history: modelHistory,
        prompt: prompt,
        config: { safetySettings },
        plugins: [googleAI({ apiKey: apiKeyRecord.key })],
      });
      
      return { role: 'model', content: response.text };

    } catch (error) {
       if (error instanceof Error && error.message.includes('API key not valid')) {
        const currentKey = await ApiKeyManager.getApiKey(true);
        await ApiKeyManager.handleKeyFailure(currentKey.id);
      }
      throw error;
    }
  }
);


ai.defineFlow(
  {
    name: 'generateArticleOutlineFlow',
    inputSchema: ArticleOutlineInputSchema,
    outputSchema: ArticleOutlineOutputSchema,
  },
  async (input) => {
    const prompt = `Anda adalah seorang penulis konten profesional dan ahli SEO. Berdasarkan deskripsi berikut, buatkan 3 opsi kerangka (outline) yang menarik dan terstruktur untuk sebuah artikel blog. Setiap outline harus memiliki judul yang SEO-friendly dan beberapa poin utama (sub-judul).

Deskripsi: ${input.description}`;

    const { output } = await ai.generate({
        prompt: prompt,
        model: 'googleai/gemini-1.5-flash-latest',
        output: { schema: ArticleOutlineOutputSchema }
    });
    
    return output!;
  }
);


ai.defineFlow(
    {
        name: 'generateArticleFromOutlineFlow',
        inputSchema: ArticleFromOutlineInputSchema,
        outputSchema: ArticleFromOutlineOutputSchema,
    },
    async (input) => {
        const prompt = `Anda adalah seorang penulis konten profesional dan ahli SEO. Berdasarkan kerangka (outline) berikut, tulis sebuah artikel blog yang lengkap, menarik, dan informatif dengan target sekitar ${input.wordCount} kata.
Gunakan format HTML dengan tag paragraf <p>, sub-judul <h2>, dan daftar <ul><li>. Pastikan gaya bahasanya engaging dan mudah dibaca.

Judul: ${input.selectedOutline.title}

Poin-poin/Sub-judul:
${input.selectedOutline.points.map(p => `- ${p}`).join('\n')}
`;

        const { output } = await ai.generate({
            prompt: prompt,
            model: 'googleai/gemini-1.5-flash-latest',
            output: { schema: ArticleFromOutlineOutputSchema }
        });
        return output!;
    }
);


ai.defineFlow(
  {
    name: 'generateSeoMetaFlow',
    inputSchema: SeoMetaInputSchema,
    outputSchema: SeoMetaOutputSchema,
  },
  async (input) => {
    const { output } = await ai.generate({
        model: 'googleai/gemini-1.5-flash-latest',
        prompt: `You are an SEO expert. Based on the following article content, generate an optimized meta title (around 60 characters) and meta description (around 160 characters).

        Article Content:
        ${input.articleContent}
        `,
        output: { schema: SeoMetaOutputSchema }
    });

    return output!;
  }
);
