
'use server';
/**
 * @fileOverview A simple chat flow for an AI assistant.
 */
import { generate, type GenerationCommonConfig } from 'genkit';
import { configureAi } from '@/ai/genkit';
import { z } from 'zod';
import assistant from '@/data/assistant.json';
import { gemini15Flash } from '@genkit-ai/googleai';

const ChatMessageSchema = z.object({
  role: z.enum(['user', 'model']),
  content: z.string(),
});
export type ChatMessage = z.infer<typeof ChatMessageSchema>;

const ChatHistorySchema = z.array(ChatMessageSchema);

// The main function exported to the client. It directly calls the flow logic.
export async function chat(history: ChatMessage[]): Promise<ChatMessage> {
  // IMPORTANT: Configure AI with a valid key before making a call.
  await configureAi();

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

    const response = await generate({
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
