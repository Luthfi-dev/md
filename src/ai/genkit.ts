
'use server';
/**
 * @fileOverview Core AI flow definitions and exported server actions.
 * This file now acts as a simple bridge to the ExternalAIService.
 */
import { callExternalAI } from '@/services/ExternalAIService';
import {
  ChatHistorySchema,
  ChatMessageSchema,
  ArticleOutlineInputSchema,
  ArticleFromOutlineInputSchema,
  LengthenArticleInputSchema,
  ShortenArticleInputSchema,
  GenerateHeadlinesInputSchema,
  SeoMetaInputSchema,
  CreativeContentInputSchema,
  TranslateContentInputSchema,
  GenerateVideoScriptInputSchema,
  AiRecommendationInputSchema,
  ProjectFeatureInputSchema,
  TtsInputSchema,
  type ChatMessage,
  type CreativeContentInput,
  type TranslateContentInput,
  type GenerateVideoScriptInput,
  type AiRecommendationInput,
  type ProjectFeatureInput,
  type TtsInput,
} from './schemas';
import { convertHtmlToWord as convertHtmlToWordFlow } from './flows/file-converter';
import type { HtmlToWordInput, HtmlToWordOutput } from './schemas';


// --------------------------------------------------------------------------
//  EXPORTED SERVER ACTIONS
// --------------------------------------------------------------------------

export async function chat(history: ChatMessage[]): Promise<ChatMessage> {
  const validationResult = ChatHistorySchema.safeParse(history);
  if (!validationResult.success) {
    console.error("Invalid chat history format:", validationResult.error);
    throw new Error('Format riwayat percakapan tidak valid.');
  }
  const lastMessage = history[history.length - 1];

  const responseText = await callExternalAI({
      prompt: lastMessage.content,
      // You can add more context from history if the API supports it
  });
  
  return { role: 'model', content: responseText };
}

export async function generateArticleOutline(input: { description: string }) {
    const validationResult = ArticleOutlineInputSchema.safeParse(input);
    if (!validationResult.success) throw new Error("Input untuk kerangka artikel tidak valid.");
    return await callExternalAI({ task: 'generateArticleOutline', data: input });
}

export async function generateArticleFromOutline(input: {
  selectedOutline: { title: string; points: string[] };
  wordCount: number;
}) {
    const validationResult = ArticleFromOutlineInputSchema.safeParse(input);
    if (!validationResult.success) throw new Error("Input untuk artikel tidak valid.");
    return await callExternalAI({ task: 'generateArticleFromOutline', data: input });
}

export async function lengthenArticle(input: { originalContent: string }) {
    const validationResult = LengthenArticleInputSchema.safeParse(input);
    if (!validationResult.success) throw new Error("Input untuk perpanjang artikel tidak valid.");
    return await callExternalAI({ task: 'lengthenArticle', data: input });
}

export async function shortenArticle(input: { content: string }) {
    const validationResult = ShortenArticleInputSchema.safeParse(input);
    if (!validationResult.success) throw new Error("Input untuk ringkas artikel tidak valid.");
    return await callExternalAI({ task: 'shortenArticle', data: input });
}

export async function generateHeadlines(input: { content: string }) {
    const validationResult = GenerateHeadlinesInputSchema.safeParse(input);
    if (!validationResult.success) throw new Error("Input untuk buat judul tidak valid.");
    return await callExternalAI({ task: 'generateHeadlines', data: input });
}

export async function generateSeoMeta(input: { articleContent: string }) {
    const validationResult = SeoMetaInputSchema.safeParse(input);
    if (!validationResult.success) throw new Error("Input untuk SEO meta tidak valid.");
    return await callExternalAI({ task: 'generateSeoMeta', data: input });
}

export async function generateCreativeContent(input: CreativeContentInput) {
  const validationResult = CreativeContentInputSchema.safeParse(input);
  if (!validationResult.success) throw new Error("Input untuk konten kreatif tidak valid.");
  return await callExternalAI({ task: 'generateCreativeContent', data: input });
}

export async function translateContent(input: TranslateContentInput) {
    const validationResult = TranslateContentInputSchema.safeParse(input);
    if (!validationResult.success) throw new Error("Input untuk terjemahan tidak valid.");
    return await callExternalAI({ task: 'translateContent', data: input });
}

export async function generateVideoScript(input: GenerateVideoScriptInput) {
    const validationResult = GenerateVideoScriptInputSchema.safeParse(input);
    if (!validationResult.success) throw new Error("Input untuk naskah video tidak valid.");
    return await callExternalAI({ task: 'generateVideoScript', data: input });
}

export async function getAiRecommendation(input: AiRecommendationInput) {
    const validationResult = AiRecommendationInputSchema.safeParse(input);
    if (!validationResult.success) {
      throw new Error(`Input untuk rekomendasi AI tidak valid: ${validationResult.error.message}`);
    }
    return await callExternalAI({ task: 'getAiRecommendation', data: input });
}

export async function estimateProjectFeature(input: ProjectFeatureInput) {
  const validationResult = ProjectFeatureInputSchema.safeParse(input);
  if (!validationResult.success) {
    throw new Error(`Input untuk estimasi proyek tidak valid: ${validationResult.error.message}`);
  }
  return await callExternalAI({ task: 'estimateProjectFeature', data: input });
}

export async function textToSpeech(input: TtsInput) {
    const validationResult = TtsInputSchema.safeParse(input);
    if (!validationResult.success) {
        throw new Error(`Input untuk text-to-speech tidak valid: ${validationResult.error.message}`);
    }
    return await callExternalAI({ task: 'textToSpeech', data: input });
}

// This function does not use AI and can remain as is.
export async function convertHtmlToWord(input: HtmlToWordInput): Promise<HtmlToWordOutput> {
  return await convertHtmlToWordFlow(input);
}
