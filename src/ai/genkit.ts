
'use server';

import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';
import { ApiKeyManager } from '@/services/ApiKeyManager';
import { z } from 'zod';
import assistant from '@/data/assistant.json';
import { gemini15Flash } from '@genkit-ai/googleai';
import type { GenerationCommonConfig } from 'genkit';

const FALLBACK_KEY = 'NO_VALID_KEY_CONFIGURED';

// This function now dynamically provides the API key to the googleAI plugin.
// It's called by Genkit internally for each operation.
export const ai = genkit({
  plugins: [
    googleAI({
      apiKey: async () => {
        const apiKeyRecord = await ApiKeyManager.getApiKey();
        if (apiKeyRecord.key === FALLBACK_KEY) {
          console.error('CRITICAL: No valid API key available for Genkit operation.');
          // Throwing an error here is better as it clearly indicates a configuration problem.
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
    // The API key is now handled automatically by the plugin's apiKey provider.
    
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
          { category: 'DANGEROUS_CONTENT', threshold: 'BLOCK_ONLY_HIGH' },
          { category: 'HATE_SPEECH', threshold: 'BLOCK_ONLY_HIGH' },
          { category: 'HARASSMENT', threshold: 'BLOCK_ONLY_HIGH' },
          { category: 'SEXUALLY_EXPLICIT', threshold: 'BLOCK_ONLY_HIGH' },
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
      return {
          role: 'model',
          content: `Maaf, terjadi masalah: ${errorMessage}`
      }
    }
  }
);
