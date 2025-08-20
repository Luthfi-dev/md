
'use server';
/**
 * @fileOverview A simple chat flow for an AI assistant.
 */
import { ai } from '@/ai/genkit';
import { z } from 'zod';
import assistant from '@/data/assistant.json';

const ChatMessageSchema = z.object({
  role: z.enum(['user', 'model']),
  content: z.string(),
});
export type ChatMessage = z.infer<typeof ChatMessageSchema>;

const ChatHistorySchema = z.array(ChatMessageSchema);

// The main function exported to the client. It directly calls the flow.
export async function chat(history: ChatMessage[]): Promise<ChatMessage> {
  return chatFlow(history);
}

// The Genkit flow definition. It's not exported directly to the client.
const chatFlow = ai.defineFlow(
  {
    name: 'chatFlow',
    inputSchema: ChatHistorySchema,
    outputSchema: ChatMessageSchema,
  },
  async (history) => {
    // Transform the chat history into the format the model expects.
    // The Gemini API requires roles to alternate between 'user' and 'model'.
    const modelHistory = history.reduce((acc, msg) => {
      // Ensure the last message in accumulator is not the same role
      if (acc.length === 0 || acc[acc.length - 1].role !== msg.role) {
        acc.push({
          role: msg.role,
          parts: [{ text: msg.content }],
        });
      } else {
        // If the role is the same, append the content to the last message's parts.
        // This handles cases of multiple consecutive user or model messages.
        acc[acc.length - 1].parts.push({ text: msg.content });
      }
      return acc;
    }, [] as { role: 'user' | 'model'; parts: { text: string }[] }[]);
    
    // The last message is the prompt, the rest is history.
    const lastMessage = modelHistory.pop();
    const prompt = lastMessage?.parts.map(p => p.text).join('\n') ?? '';

    try {
        const response = await ai.generate({
            model: 'googleai/gemini-1.5-flash-latest',
            system: assistant.systemPrompt,
            history: modelHistory,
            prompt: prompt,
            config: {
                safetySettings: [
                    { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_ONLY_HIGH' },
                    { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_ONLY_HIGH' },
                    { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_ONLY_HIGH' },
                    { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_ONLY_HIGH' },
                ],
            },
        });
    
        const textResponse = response.text ?? "Maaf, aku lagi bingung nih. Boleh coba tanya lagi dengan cara lain?";
    
        return {
            role: 'model',
            content: textResponse,
        };

    } catch (error) {
        console.error("Error fetching from Generative AI:", error);
        // This now returns the actual error message from genkit.ts or the AI service.
        const errorMessage = error instanceof Error ? error.message : "Terjadi kesalahan tidak dikenal.";
        return {
            role: 'model',
            content: `Maaf, terjadi masalah: ${errorMessage}`
        }
    }
  }
);
