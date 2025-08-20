/**
 * @fileOverview Server Actions for AI flows.
 * This file contains the async functions that client components can safely import and call.
 * It is marked with "use server" and ONLY exports async functions.
 * It calls Genkit flows by their string name, avoiding direct imports of complex server-side objects.
 */
'use server';

import { genkit } from 'genkit';
import {
  type ChatMessage,
  ChatHistorySchema,
  ArticleOutlineInputSchema,
  ArticleFromOutlineInputSchema,
  SeoMetaInputSchema
} from './schemas';

// This imports the `ai` object configured in genkit.ts
import { ai } from './genkit';

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
    throw new Error((error as Error).message || "Terjadi kesalahan saat berkomunikasi dengan AI.");
  }
}

/**
 * Generates three different article outlines based on a description.
 */
export async function generateArticleOutline(input: { description: string }) {
    const validationResult = ArticleOutlineInputSchema.safeParse(input);
    if (!validationResult.success) throw new Error("Input untuk kerangka artikel tidak valid.");

    try {
        return await ai.runFlow('generateArticleOutlineFlow', input);
    } catch (error) {
        console.error("Error running generateArticleOutlineFlow:", error);
        throw new Error((error as Error).message || "Gagal membuat kerangka artikel.");
    }
}

/**
 * Generates a full article based on a selected outline.
 */
export async function generateArticleFromOutline(input: {
  selectedOutline: { title: string; points: string[] };
  wordCount: number;
}) {
    const validationResult = ArticleFromOutlineInputSchema.safeParse(input);
    if (!validationResult.success) throw new Error("Input untuk artikel tidak valid.");

    try {
        return await ai.runFlow('generateArticleFromOutlineFlow', input);
    } catch (error) {
        console.error("Error running generateArticleFromOutlineFlow:", error);
        throw new Error((error as Error).message || "Gagal membuat artikel.");
    }
}

/**
 * Generates SEO metadata for a given article content.
 */
export async function generateSeoMeta(input: { articleContent: string }) {
    const validationResult = SeoMetaInputSchema.safeParse(input);
    if (!validationResult.success) throw new Error("Input untuk SEO meta tidak valid.");

    try {
        return await ai.runFlow('generateSeoMetaFlow', input);
    } catch (error) {
        console.error("Error running generateSeoMetaFlow:", error);
        throw new Error((error as Error).message || "Gagal membuat metadata SEO.");
    }
}
