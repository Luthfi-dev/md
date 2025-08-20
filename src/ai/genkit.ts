
'use server';

import { genkit } from 'genkit';
import { googleAI, gemini15Flash } from '@genkit-ai/googleai';
import { ApiKeyManager } from '@/services/ApiKeyManager';
import { z } from 'zod';
import assistant from '@/data/assistant.json';
import type { GenerationCommonConfig } from '@genkit-ai/googleai';

const FALLBACK_KEY = 'NO_VALID_KEY_CONFIGURED';

const ChatMessageSchema = z.object({
  role: z.enum(['user', 'model']),
  content: z.string(),
});
export type ChatMessage = z.infer<typeof ChatMessageSchema>;
const ChatHistorySchema = z.array(ChatMessageSchema);

/**
 * A server action that processes chat history and returns an AI-generated response.
 * This function is safe to be called from client components.
 */
export async function chat(history: ChatMessage[]): Promise<ChatMessage> {
  const validationResult = ChatHistorySchema.safeParse(history);
  if (!validationResult.success) {
    console.error("Invalid chat history format:", validationResult.error);
    return {
      role: 'model',
      content: 'Maaf, terjadi kesalahan format pada riwayat percakapan.'
    };
  }

  try {
    const apiKeyRecord = await ApiKeyManager.getApiKey();
    if (apiKeyRecord.key === FALLBACK_KEY) {
      throw new Error('Layanan AI tidak terkonfigurasi. Silakan hubungi administrator.');
    }

    const ai = genkit({
        plugins: [
            googleAI({ apiKey: apiKeyRecord.key }),
        ],
    });

    const modelHistory = history.reduce((acc, msg) => {
      if (acc.length === 0 || acc[acc.length - 1].role !== msg.role) {
        acc.push({
          role: msg.role,
          parts: [{ text: msg.content }],
        });
      } else {
        acc[acc.length - 1].parts.push({ text: msg.content });
      }
      return acc;
    }, [] as { role: 'user' | 'model'; parts: { text: string }[] }[]);

    const lastMessage = modelHistory.pop();
    const prompt = lastMessage?.parts.map(p => p.text).join('\n') ?? '';

    const safetySettings: GenerationCommonConfig['safetySettings'] = [
        { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_ONLY_HIGH' },
        { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_ONLY_HIGH' },
        { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_ONLY_HIGH' },
        { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_ONLY_HIGH' },
    ];
      
    const response = await ai.generate({
        model: gemini15Flash,
        system: assistant.systemPrompt,
        history: modelHistory,
        prompt: prompt,
        config: { safetySettings },
    });

    const textResponse = response.text ?? "Maaf, aku lagi bingung nih. Boleh coba tanya lagi dengan cara lain?";

    return { role: 'model', content: textResponse };

  } catch (error) {
    console.error("Error in chat server action:", error);
    throw new Error((error as Error).message || "Terjadi kesalahan tidak dikenal saat menghubungi AI.");
  }
}

ai.defineFlow(
  {
    name: 'generateArticleOutlineFlow',
    inputSchema: z.object({ description: z.string() }),
    outputSchema: z.object({
      outlines: z.array(z.object({
        title: z.string(),
        points: z.array(z.string())
      }))
    }),
  },
  async (input) => {
    const prompt = `Anda adalah seorang penulis konten profesional dan ahli SEO. Berdasarkan deskripsi berikut, buatkan 3 opsi kerangka (outline) yang menarik dan terstruktur untuk sebuah artikel blog. Setiap outline harus memiliki judul yang SEO-friendly dan beberapa poin utama (sub-judul).

Deskripsi: ${input.description}`;

    const { output } = await ai.generate({
        prompt: prompt,
        model: 'googleai/gemini-1.5-flash-latest',
        output: {
            schema: z.object({
              outlines: z.array(z.object({
                title: z.string(),
                points: z.array(z.string())
              }))
            }),
        }
    });
    
    return output!;
  }
);

ai.defineFlow(
    {
        name: 'generateArticleFromOutlineFlow',
        inputSchema: z.object({
          selectedOutline: z.object({ title: z.string(), points: z.array(z.string()) }),
          wordCount: z.number(),
        }),
        outputSchema: z.object({ articleContent: z.string() }),
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
            output: {
                schema: z.object({ articleContent: z.string() }),
            }
        });
        return output!;
    }
);

ai.defineFlow(
  {
    name: 'generateSeoMetaFlow',
    inputSchema: z.object({ articleContent: z.string() }),
    outputSchema: z.object({ title: z.string(), description: z.string() }),
  },
  async (input) => {
    const { output } = await ai.generate({
        model: 'googleai/gemini-1.5-flash-latest',
        prompt: `You are an SEO expert. Based on the following article content, generate an optimized meta title (around 60 characters) and meta description (around 160 characters).

        Article Content:
        ${input.articleContent}
        `,
        output: {
            schema: z.object({ title: z.string(), description: z.string() })
        }
    });

    return output!;
  }
);
