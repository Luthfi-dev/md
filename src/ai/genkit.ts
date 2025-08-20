
'use server';

import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';
import { ApiKeyManager } from '@/services/ApiKeyManager';
import { z } from 'zod';
import assistant from '@/data/assistant.json';
import { gemini15Flash, type GenerationCommonConfig } from '@genkit-ai/googleai';

const FALLBACK_KEY = 'NO_VALID_KEY_CONFIGURED';

// This file defines and registers flows.
// It is imported by `dev.ts` to make Genkit aware of the flows,
// but should NOT be imported by any client-facing server actions.

export const ai = genkit({
  plugins: [
    googleAI({
      apiKey: async () => {
        const apiKeyRecord = await ApiKeyManager.getApiKey();
        if (apiKeyRecord.key === FALLBACK_KEY) {
          console.error('CRITICAL: No valid API key available for Genkit operation.');
          throw new Error('Layanan AI tidak terkonfigurasi. Silakan hubungi administrator.');
        }
        return apiKeyRecord.key;
      },
    }),
  ],
  errorHandler: async (err) => {
    console.error("Genkit error handler caught:", err);
  },
  model: 'googleai/gemini-1.5-flash-latest',
});


// -- Define the chat flow --

const ChatMessageSchema = z.object({
  role: z.enum(['user', 'model']),
  content: z.string(),
});

const ChatHistorySchema = z.array(ChatMessageSchema);

ai.defineFlow(
  {
    name: 'chatFlow',
    inputSchema: ChatHistorySchema,
    outputSchema: ChatMessageSchema,
  },
  async (history) => {
    // This logic now lives entirely on the server and is never imported by the client action.
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

    try {
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
          config: {
              safetySettings,
          },
      });

      const textResponse = response.text() ?? "Maaf, aku lagi bingung nih. Boleh coba tanya lagi dengan cara lain?";

      return {
          role: 'model',
          content: textResponse,
      };

    } catch (error) {
      console.error("Error fetching from Generative AI in chatFlow:", error);
      // This error will be propagated to the `ai.runFlow` call in the server action.
      throw new Error((error as Error).message || "Terjadi kesalahan tidak dikenal saat menghubungi AI.");
    }
  }
);
