
'use server';

import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';
import { ApiKeyManager } from '@/services/ApiKeyManager';
import { z } from 'zod';
import assistant from '@/data/assistant.json';
import { gemini15Flash } from '@genkit-ai/googleai';
import type { GenerationCommonConfig } from 'genkit';

const FALLBACK_KEY = 'NO_VALID_KEY_CONFIGURED';

// This file now ONLY defines and registers flows. It is NOT imported by client-facing server actions.
// It is imported by `dev.ts` to make Genkit aware of the flows.

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
      console.error("Error fetching from Generative AI:", error);
      const errorMessage = error instanceof Error ? error.message : "Terjadi kesalahan tidak dikenal.";
      // Throw the error to be caught by the runFlow caller
      throw new Error(errorMessage);
    }
  }
);
