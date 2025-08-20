'use server';
/**
 * @fileOverview Server Actions for AI flows.
 * This file exports async functions that are safe to be called from Client Components.
 * They act as a bridge to the Genkit flows, ensuring no server-side objects are
 * exposed to the client.
 */
import { ai } from './genkit'; // Import the globally configured ai instance
import { z } from 'zod';

// Re-define schema here for validation within the action
const ChatMessageSchema = z.object({
  role: z.enum(['user', 'model']),
  content: z.string(),
});
export type ChatMessage = z.infer<typeof ChatMessageSchema>;
const ChatHistorySchema = z.array(ChatMessageSchema);

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
    const response = await ai.runFlow('chatFlow', history);
    return response;
  } catch (error) {
    console.error("Error running chatFlow:", error);
    // Propagate a user-friendly error message
    throw new Error((error as Error).message || "Terjadi kesalahan saat berkomunikasi dengan AI.");
  }
}

/**
 * A server action to generate article outlines.
 */
export async function generateArticleOutline(input: { description: string }) {
    try {
        return await ai.runFlow('generateArticleOutlineFlow', input);
    } catch (error) {
        console.error("Error running generateArticleOutlineFlow:", error);
        throw new Error((error as Error).message || "Gagal membuat kerangka artikel.");
    }
}

/**
 * A server action to generate a full article from a selected outline.
 */
export async function generateArticleFromOutline(input: {
  selectedOutline: { title: string; points: string[] };
  wordCount: number;
}) {
     try {
        return await ai.runFlow('generateArticleFromOutlineFlow', input);
    } catch (error) {
        console.error("Error running generateArticleFromOutlineFlow:", error);
        throw new Error((error as Error).message || "Gagal membuat artikel.");
    }
}

/**
 * A server action to generate SEO metadata from article content.
 */
export async function generateSeoMeta(input: { articleContent: string }) {
     try {
        return await ai.runFlow('generateSeoMetaFlow', input);
    } catch (error) {
        console.error("Error running generateSeoMetaFlow:", error);
        throw new Error((error as Error).message || "Gagal membuat metadata SEO.");
    }
}
