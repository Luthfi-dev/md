
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
import assistantData from '@/data/assistant.json';


// --------------------------------------------------------------------------
//  EXPORTED SERVER ACTIONS
// --------------------------------------------------------------------------

export async function chat(history: ChatMessage[]): Promise<ChatMessage> {
  const validationResult = ChatHistorySchema.safeParse(history);
  if (!validationResult.success) {
    console.error("Invalid chat history format:", validationResult.error);
    throw new Error('Format riwayat percakapan tidak valid.');
  }

  // Combine system prompt, history, and the latest message into a single text block
  const historyText = history.map(m => `${m.role}: ${m.content}`).join('\n');
  const combinedPrompt = `${assistantData.systemPrompt}\n\nRiwayat Percakapan:\n${historyText}\n\nmodel:`;

  const response = await callExternalAI({
      text: combinedPrompt
  });
  
  if (typeof response.response !== 'string') {
    throw new Error('Respons dari AI tidak berisi teks yang valid.');
  }
  
  return { role: 'model', content: response.response };
}

export async function generateArticleOutline(input: { description: string }) {
    const validationResult = ArticleOutlineInputSchema.safeParse(input);
    if (!validationResult.success) throw new Error("Input untuk kerangka artikel tidak valid.");
    
    const prompt = `Tugas: Buat 3 opsi kerangka artikel (outlines).\nDeskripsi: ${input.description}\n\nFormat output harus JSON yang sesuai dengan skema ArticleOutlineOutputSchema.`;
    return await callExternalAI({ text: prompt });
}

export async function generateArticleFromOutline(input: {
  selectedOutline: { title: string; points: string[] };
  wordCount: number;
}) {
    const validationResult = ArticleFromOutlineInputSchema.safeParse(input);
    if (!validationResult.success) throw new Error("Input untuk artikel tidak valid.");
    
    const prompt = `Tugas: Buat artikel lengkap dari kerangka yang diberikan.\nJudul: ${input.selectedOutline.title}\nPoin-poin: ${input.selectedOutline.points.join(', ')}\nTarget Jumlah Kata: ${input.wordCount}\n\nFormat output harus JSON yang sesuai dengan skema ArticleFromOutlineOutputSchema. Konten artikel harus dalam format HTML.`;
    return await callExternalAI({ text: prompt });
}

export async function lengthenArticle(input: { content: string }) {
    const validationResult = LengthenArticleInputSchema.safeParse(input);
    if (!validationResult.success) throw new Error("Input untuk perpanjang artikel tidak valid.");
    
    const prompt = `Tugas: Perpanjang artikel berikut, tambahkan lebih banyak detail dan penjelasan.\nKonten Asli (HTML):\n${input.content}\n\nFormat output harus JSON yang berisi field "response" dengan konten HTML baru yang lebih panjang.`;
    return await callExternalAI({ text: prompt });
}

export async function shortenArticle(input: { content: string }) {
    const validationResult = ShortenArticleInputSchema.safeParse(input);
    if (!validationResult.success) throw new Error("Input untuk ringkas artikel tidak valid.");

    const prompt = `Tugas: Ringkas artikel berikut menjadi lebih padat dan to-the-point.\nKonten Asli (HTML):\n${input.content}\n\nFormat output harus JSON yang berisi field "response" dengan konten HTML baru yang lebih ringkas.`;
    return await callExternalAI({ text: prompt });
}

export async function generateHeadlines(input: { content: string }) {
    const validationResult = GenerateHeadlinesInputSchema.safeParse(input);
    if (!validationResult.success) throw new Error("Input untuk buat judul tidak valid.");
    
    const prompt = `Tugas: Buat 5 judul alternatif yang menarik dan relevan untuk artikel berikut.\nKonten Artikel:\n${input.content}\n\nFormat output harus JSON yang berisi array string "response".`;
    return await callExternalAI({ text: prompt });
}

export async function generateSeoMeta(input: { articleContent: string }) {
    const validationResult = SeoMetaInputSchema.safeParse(input);
    if (!validationResult.success) throw new Error("Input untuk SEO meta tidak valid.");
    
    const prompt = `Tugas: Buat meta title (sekitar 60 karakter) dan meta description (sekitar 155-160 karakter) yang SEO-friendly untuk artikel berikut.\nKonten Artikel:\n${input.articleContent}\n\nFormat output harus JSON yang sesuai dengan skema SeoMetaOutputSchema.`;
    return await callExternalAI({ text: prompt });
}

export async function generateCreativeContent(input: CreativeContentInput) {
  const validationResult = CreativeContentInputSchema.safeParse(input);
  if (!validationResult.success) throw new Error("Input untuk konten kreatif tidak valid.");

  let imagePrompt = '';
  if(input.imageDataUri) {
    imagePrompt = `\nIni adalah Data URI gambar referensi yang harus dipertimbangkan: ${input.imageDataUri}`;
  }
  
  const prompt = `Tugas: Buat konten pemasaran kreatif.\nGaya Bahasa: ${input.style}\nDeskripsi Teks: ${input.text}${imagePrompt}\n\nFormat output harus JSON yang berisi field "response" dengan konten pemasaran yang dihasilkan dalam format HTML.`;
  return await callExternalAI({ text: prompt });
}

export async function translateContent(input: TranslateContentInput) {
    const validationResult = TranslateContentInputSchema.safeParse(input);
    if (!validationResult.success) throw new Error("Input untuk terjemahan tidak valid.");

    const prompt = `Tugas: Terjemahkan konten HTML berikut ke dalam bahasa ${input.targetLanguage}.\nKonten HTML:\n${input.content}\n\nFormat output harus JSON yang berisi field "response" dengan konten HTML yang sudah diterjemahkan.`;
    return await callExternalAI({ text: prompt });
}

export async function generateVideoScript(input: GenerateVideoScriptInput) {
    const validationResult = GenerateVideoScriptInputSchema.safeParse(input);
    if (!validationResult.success) throw new Error("Input untuk naskah video tidak valid.");

    const prompt = `Tugas: Ubah konten berikut menjadi naskah video yang terstruktur.\nKonten Sumber:\n${input.content}\n\nFormat output harus JSON yang berisi field "response" dengan naskah dalam format HTML terstruktur (misalnya, menggunakan heading untuk scene dan paragraf untuk narasi/dialog).`;
    return await callExternalAI({ text: prompt });
}

export async function getAiRecommendation(input: AiRecommendationInput) {
    const validationResult = AiRecommendationInputSchema.safeParse(input);
    if (!validationResult.success) {
      throw new Error(`Input untuk rekomendasi AI tidak valid: ${validationResult.error.message}`);
    }

    const prompt = `Tugas: Berikan rekomendasi item terbaik dari beberapa pilihan untuk item utama. Analisis gaya, warna, dan keserasian.\n\nItem Utama (Data URI): ${input.mainItem.dataUri}\n\nPilihan Item (Data URI):\n${input.choices.map((c, i) => `Pilihan ${i+1}: ${c.dataUri}`).join('\n')}\n\nFormat output harus JSON yang sesuai dengan skema AiRecommendationOutputSchema.`;
    return await callExternalAI({ text: prompt });
}

export async function estimateProjectFeature(input: ProjectFeatureInput) {
  const validationResult = ProjectFeatureInputSchema.safeParse(input);
  if (!validationResult.success) {
    throw new Error(`Input untuk estimasi proyek tidak valid: ${validationResult.error.message}`);
  }

  const prompt = `Tugas: Berikan estimasi harga (minimum dan maksimum) dalam Rupiah (IDR) untuk fitur proyek berikut.\nNama Proyek: ${input.projectName}\nDeskripsi Fitur: ${input.featureDescription}\n\nFormat output harus JSON yang sesuai dengan skema ProjectFeatureOutputSchema. Berikan justifikasi singkat untuk rentang harga tersebut.`;
  return await callExternalAI({ text: prompt });
}

export async function textToSpeech(input: TtsInput) {
    const validationResult = TtsInputSchema.safeParse(input);
    if (!validationResult.success) {
        throw new Error(`Input untuk text-to-speech tidak valid: ${validationResult.error.message}`);
    }

    const prompt = `Tugas: Ubah teks berikut menjadi audio.\nTeks: "${input.text}"\nSuara: ${input.voice}\n\nFormat output harus JSON yang berisi field "media" dengan audio yang dihasilkan sebagai data URI format WAV.`;
    return await callExternalAI({ text: prompt });
}

// This function does not use AI and can remain as is.
export async function convertHtmlToWord(input: HtmlToWordInput): Promise<HtmlToWordOutput> {
  return await convertHtmlToWordFlow(input);
}

    