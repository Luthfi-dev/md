'use server';

/**
 * @fileOverview This file is the server action entrypoint for the chat functionality.
 * It is SAFE to be imported by client components because it does not import any server-side objects.
 */
import { ai } from 'genkit';
import { z } from 'zod';

const ChatMessageSchema = z.object({
  role: z.enum(['user', 'model']),
  content: z.string(),
});
export type ChatMessage = z.infer<typeof ChatMessageSchema>;

const ChatHistorySchema = z.array(ChatMessageSchema);

export async function chat(history: ChatMessage[]): Promise<ChatMessage> {
  // Validate the input from the client using Zod.
  const validationResult = ChatHistorySchema.safeParse(history);
  if (!validationResult.success) {
    console.error("Invalid chat history format:", validationResult.error);
    return {
      role: 'model',
      content: 'Maaf, terjadi kesalahan format pada riwayat percakapan.'
    };
  }

  try {
    // Run the 'chatFlow' which is defined and registered on the server (in genkit.ts).
    // This is a safe way to trigger server-only logic from a server action.
    const response = await ai.runFlow('chatFlow', history);
    return response;
  } catch (error) {
    console.error("Error running chatFlow from server action:", error);
    // Return a more informative error message to the user
    return {
        role: 'model',
        content: `Maaf, terjadi masalah: ${(error as Error).message}`
    };
  }
}
