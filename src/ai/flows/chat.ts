
'use server';
/**
 * @fileOverview A simple chat flow for an AI assistant.
 */
import { ai, configureAi } from '@/ai/genkit';
import { z } from 'zod';
import assistant from '@/data/assistant.json';

const ChatMessageSchema = z.object({
  role: z.enum(['user', 'model']),
  content: z.string(),
});
export type ChatMessage = z.infer<typeof ChatMessageSchema>;

const ChatHistorySchema = z.array(ChatMessageSchema);

export async function chat(history: ChatMessage[]): Promise<ChatMessage> {
  // Dynamically configure Genkit with the appropriate API key before running the flow
  await configureAi();
  return chatFlow(history);
}

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
      if (acc.length === 0 || acc[acc.length - 1].role !== msg.role) {
        acc.push({
          role: msg.role,
          parts: [{ text: msg.content }],
        });
      }
      return acc;
    }, [] as { role: 'user' | 'model'; parts: { text: string }[] }[]);
    
    // The last message is the prompt, the rest is history.
    const lastMessage = modelHistory.pop();
    const prompt = lastMessage?.parts[0].text ?? '';

    try {
        const response = await ai.generate({
            model: 'googleai/gemini-2.0-flash',
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
        return {
            role: 'model',
            content: "Maaf, sepertinya asisten sedang sibuk. Mohon coba lagi sesaat lagi ya."
        }
    }
  }
);
