'use server';

import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';
import { ApiKeyManager } from '@/services/ApiKeyManager';
import { z } from 'zod';
import assistant from '@/data/assistant.json';
import { gemini15Flash, type GenerationCommonConfig } from '@genkit-ai/googleai';

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

    const textResponse = response.text() ?? "Maaf, aku lagi bingung nih. Boleh coba tanya lagi dengan cara lain?";

    return { role: 'model', content: textResponse };

  } catch (error) {
    console.error("Error in chat server action:", error);
    throw new Error((error as Error).message || "Terjadi kesalahan tidak dikenal saat menghubungi AI.");
  }
}