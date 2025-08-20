/**
 * @fileOverview Core AI flow definitions and server actions for the application.
 * This file contains the primary logic for all Genkit flows and exports
 * the async functions that can be safely called from Client Components.
 */
'use server';

import { genkit, type GenerationCommonConfig } from 'genkit';
import { googleAI, gemini15Flash } from '@genkit-ai/googleai';
import { z } from 'zod';
import { ApiKeyManager, FALLBACK_KEY } from '@/services/ApiKeyManager';
import assistant from '@/data/assistant.json';

// Initialize a single, global AI instance.
// This instance will be configured dynamically within each flow.
export const ai = genkit({
  plugins: [
    googleAI(), // Initialized without an API key.
  ],
});


// --------------------------------------------------------------------------
//  CHAT FLOW DEFINITION
// --------------------------------------------------------------------------

const ChatMessageSchema = z.object({
  role: z.enum(['user', 'model']),
  content: z.string(),
});
export type ChatMessage = z.infer<typeof ChatMessageSchema>;
const ChatHistorySchema = z.array(ChatMessageSchema);

const chatFlow = ai.defineFlow(
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
    
    // Convert message history to the format Genkit expects for conversation
    const modelHistory = history.reduce((acc, msg) => {
      // Don't include the very last user message in the history object, it becomes the prompt
      if (acc.length === history.length - 1) return acc;
      
      if (acc.length === 0 || acc[acc.length - 1].role !== msg.role) {
        acc.push({ role: msg.role, parts: [{ text: msg.content }] });
      } else {
        acc[acc.length - 1].parts.push({ text: msg.content });
      }
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
      throw error; // Re-throw the error to be caught by the action caller
    }
  }
);

/**
 * A server action that processes chat history and returns an AI-generated response.
 */
export async function chat(history: ChatMessage[]): Promise<ChatMessage> {
  const validationResult = ChatHistorySchema.safeParse(history);
  if (!validationResult.success) {
    console.error("Invalid chat history format:", validationResult.error);
    throw new Error('Format riwayat percakapan tidak valid.');
  }

  try {
    const response = await chatFlow(history);
    return response;
  } catch (error) {
    console.error("Error running chatFlow:", error);
    // Propagate a user-friendly error message
    throw new Error((error as Error).message || "Terjadi kesalahan saat berkomunikasi dengan AI.");
  }
}


// --------------------------------------------------------------------------
//  ARTICLE GENERATION FLOWS
// --------------------------------------------------------------------------

const ArticleOutlineInputSchema = z.object({
  description: z.string().describe('Deskripsi singkat atau ide utama artikel.'),
});

const ArticleOutlineOutputSchema = z.object({
  outlines: z.array(z.object({
      title: z.string().describe("Judul yang menarik untuk artikel ini."),
      points: z.array(z.string()).describe("Poin-poin utama atau sub-judul dalam kerangka artikel.")
  })).describe('Tiga opsi kerangka artikel yang berbeda.'),
});

const generateArticleOutlineFlow = ai.defineFlow(
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

export async function generateArticleOutline(input: { description: string }) {
    try {
        return await generateArticleOutlineFlow(input);
    } catch (error) {
        console.error("Error running generateArticleOutlineFlow:", error);
        throw new Error((error as Error).message || "Gagal membuat kerangka artikel.");
    }
}


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

const generateArticleFromOutlineFlow = ai.defineFlow(
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

export async function generateArticleFromOutline(input: {
  selectedOutline: { title: string; points: string[] };
  wordCount: number;
}) {
     try {
        return await generateArticleFromOutlineFlow(input);
    } catch (error) {
        console.error("Error running generateArticleFromOutlineFlow:", error);
        throw new Error((error as Error).message || "Gagal membuat artikel.");
    }
}


const SeoMetaInputSchema = z.object({
  articleContent: z.string().describe('The full content of the blog article.'),
});

const SeoMetaOutputSchema = z.object({
  title: z.string().describe('A catchy, SEO-friendly meta title, around 60 characters.'),
  description: z.string().describe('A compelling meta description, around 155-160 characters.'),
});

const generateSeoMetaFlow = ai.defineFlow(
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

export async function generateSeoMeta(input: { articleContent: string }) {
     try {
        return await generateSeoMetaFlow(input);
    } catch (error) {
        console.error("Error running generateSeoMetaFlow:", error);
        throw new Error((error as Error).message || "Gagal membuat metadata SEO.");
    }
}
