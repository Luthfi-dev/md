
'use server';
/**
 * @fileOverview Core AI flow definitions and exported server actions.
 */

import { genkit, type GenerationCommonConfig } from 'genkit';
import { googleAI, gemini15Flash } from '@genkit-ai/googleai';
import { getApiKey, handleKeyFailure } from '@/services/ApiKeyManager';
import assistantData from '@/data/assistant.json';
import {
  ChatHistorySchema,
  ChatMessageSchema,
  ArticleOutlineInputSchema,
  ArticleOutlineOutputSchema,
  ArticleFromOutlineInputSchema,
  ArticleFromOutlineOutputSchema,
  SeoMetaInputSchema,
  SeoMetaOutputSchema,
  HtmlToWordInputSchema,
  HtmlToWordOutputSchema,
  type HtmlToWordInput,
  type HtmlToWordOutput,
  type ChatMessage,
  LengthenArticleInputSchema,
  LengthenArticleOutputSchema,
  ShortenArticleInputSchema,
  ShortenArticleOutputSchema,
  GenerateHeadlinesInputSchema,
  GenerateHeadlinesOutputSchema,
  CreativeContentInputSchema,
  CreativeContentOutputSchema,
  type CreativeContentInput,
  type CreativeContentOutput,
  TranslateContentInputSchema,
  TranslateContentOutputSchema,
  type TranslateContentInput,
  type TranslateContentOutput,
  GenerateVideoScriptInputSchema,
  GenerateVideoScriptOutputSchema,
  type GenerateVideoScriptInput,
  type GenerateVideoScriptOutput,
  AiRecommendationInputSchema,
  AiRecommendationOutputSchema,
  type AiRecommendationInput,
  type AiRecommendationOutput,
} from './schemas';
import htmlToDocx from 'html-to-docx';


// Initialize the shared AI instance.
// This is NOT exported, it's used internally by flows defined in this file.
const ai = genkit({
  plugins: [
    googleAI(),
  ],
});


// --------------------------------------------------------------------------
//  FLOW DEFINITIONS
// --------------------------------------------------------------------------

const chatFlow = ai.defineFlow(
  {
    name: 'chatFlow',
    inputSchema: ChatHistorySchema,
    outputSchema: ChatMessageSchema,
  },
  async (history) => {
    const apiKeyRecord = await getApiKey();
    
    const modelHistory = history.reduce((acc, msg, index) => {
      if (index === history.length - 1) return acc;
      acc.push({ role: msg.role, parts: [{ text: msg.content }] });
      return acc;
    }, [] as { role: 'user' | 'model'; parts: { text: string }[] }[]);

    const lastMessage = history[history.length - 1];
    const prompt = lastMessage?.content ?? '';

    const safetySettings: GenerationCommonConfig['safetySettings'] = [
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_ONLY_HIGH' },
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_ONLY_HIGH' },
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_ONLY_HIGH' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_ONLY_HIGH' },
    ];

    try {
      const response = await ai.generate({
        model: gemini15Flash,
        system: assistantData.systemPrompt,
        history: modelHistory,
        prompt: prompt,
        config: { safetySettings },
        plugins: [googleAI({ apiKey: apiKeyRecord.key })],
      });
      
      return { role: 'model', content: response.text };

    } catch (error) {
       if (error instanceof Error && error.message.includes('API key not valid')) {
        await handleKeyFailure(apiKeyRecord.id);
      }
      throw error;
    }
  }
);

const generateArticleOutlineFlow = ai.defineFlow(
  {
    name: 'generateArticleOutlineFlow',
    inputSchema: ArticleOutlineInputSchema,
    outputSchema: ArticleOutlineOutputSchema,
  },
  async (input) => {
    const apiKeyRecord = await getApiKey();
    const prompt = `Anda adalah seorang penulis konten profesional dan ahli SEO. Berdasarkan deskripsi berikut, buatkan 3 opsi kerangka (outline) yang menarik dan terstruktur untuk sebuah artikel blog. Setiap outline harus memiliki judul yang SEO-friendly dan beberapa poin utama (sub-judul).

Deskripsi: ${input.description}`;

    const { output } = await ai.generate({
        prompt: prompt,
        model: 'googleai/gemini-1.5-flash-latest',
        output: { schema: ArticleOutlineOutputSchema },
        plugins: [googleAI({ apiKey: apiKeyRecord.key })],
    });
    
    return output!;
  }
);

const generateArticleFromOutlineFlow = ai.defineFlow(
    {
        name: 'generateArticleFromOutlineFlow',
        inputSchema: ArticleFromOutlineInputSchema,
        outputSchema: ArticleFromOutlineOutputSchema,
    },
    async (input) => {
        const apiKeyRecord = await getApiKey();
        const prompt = `Anda adalah seorang penulis konten profesional dan ahli SEO. Berdasarkan kerangka (outline) berikut, tulis sebuah artikel blog yang lengkap, menarik, dan informatif dengan target sekitar ${input.wordCount} kata.
Gunakan format HTML dengan tag paragraf <p>, sub-judul <h2>, dan daftar <ul><li>. Pastikan gaya bahasanya engaging dan mudah dibaca.

Judul: ${input.selectedOutline.title}

Poin-poin/Sub-judul:
${input.selectedOutline.points.map(p => `- ${p}`).join('\n')}
`;

        const { output } = await ai.generate({
            prompt: prompt,
            model: 'googleai/gemini-1.5-flash-latest',
            output: { schema: ArticleFromOutlineOutputSchema },
            plugins: [googleAI({ apiKey: apiKeyRecord.key })],
        });
        return output!;
    }
);

const lengthenArticleFlow = ai.defineFlow(
    {
        name: 'lengthenArticleFlow',
        inputSchema: LengthenArticleInputSchema,
        outputSchema: LengthenArticleOutputSchema,
    },
    async (input) => {
        const apiKeyRecord = await getApiKey();
        const prompt = `Anda adalah seorang editor dan penulis konten profesional. Tugas Anda adalah memperpanjang artikel berikut tanpa mengubah gaya bahasa dan pesan intinya. Tambahkan lebih banyak detail, contoh, atau penjelasan mendalam pada setiap bagian. Pertahankan format HTML yang ada.

Artikel Asli:
---
${input.originalContent}
---
`;

        const { output } = await ai.generate({
            prompt: prompt,
            model: 'googleai/gemini-1.5-flash-latest',
            output: { schema: LengthenArticleOutputSchema },
            plugins: [googleAI({ apiKey: apiKeyRecord.key })],
        });
        return output!;
    }
);

const shortenArticleFlow = ai.defineFlow(
    {
        name: 'shortenArticleFlow',
        inputSchema: ShortenArticleInputSchema,
        outputSchema: ShortenArticleOutputSchema,
    },
    async (input) => {
        const apiKeyRecord = await getApiKey();
        const prompt = `Anda adalah seorang editor konten ahli. Tugas Anda adalah meringkas artikel berikut menjadi lebih padat dan ringkas, sekitar 50-60% dari panjang asli. Fokus pada poin-poin terpenting dan hilangkan kalimat yang berulang atau kurang relevan. Pertahankan format HTML dan gaya bahasa aslinya.

Artikel Asli:
---
${input.content}
---
`;

        const { output } = await ai.generate({
            prompt: prompt,
            model: 'googleai/gemini-1.5-flash-latest',
            output: { schema: ShortenArticleOutputSchema },
            plugins: [googleAI({ apiKey: apiKeyRecord.key })],
        });
        return output!;
    }
);

const generateHeadlinesFlow = ai.defineFlow(
    {
        name: 'generateHeadlinesFlow',
        inputSchema: GenerateHeadlinesInputSchema,
        outputSchema: GenerateHeadlinesOutputSchema,
    },
    async (input) => {
        const apiKeyRecord = await getApiKey();
        const prompt = `Anda adalah seorang copywriter dan pakar branding. Berdasarkan konten berikut, buatkan 5 alternatif judul (headline) atau slogan yang sangat menarik, menjual, dan ringkas.

Konten:
---
${input.content}
---
`;

        const { output } = await ai.generate({
            prompt: prompt,
            model: 'googleai/gemini-1.5-flash-latest',
            output: { schema: GenerateHeadlinesOutputSchema },
            plugins: [googleAI({ apiKey: apiKeyRecord.key })],
        });
        return output!;
    }
);


const generateSeoMetaFlow = ai.defineFlow(
  {
    name: 'generateSeoMetaFlow',
    inputSchema: SeoMetaInputSchema,
    outputSchema: SeoMetaOutputSchema,
  },
  async (input) => {
    const apiKeyRecord = await getApiKey();
    const { output } = await ai.generate({
        model: 'googleai/gemini-1.5-flash-latest',
        prompt: `You are an SEO expert. Based on the following article content, generate an optimized meta title (around 60 characters) and meta description (around 160 characters).

        Article Content:
        ${input.articleContent}
        `,
        output: { schema: SeoMetaOutputSchema },
        plugins: [googleAI({ apiKey: apiKeyRecord.key })],
    });

    return output!;
  }
);

const generateCreativeContentFlow = ai.defineFlow(
  {
    name: 'generateCreativeContentFlow',
    inputSchema: CreativeContentInputSchema,
    outputSchema: CreativeContentOutputSchema,
  },
  async (input) => {
    const apiKeyRecord = await getApiKey();
    const promptParts = [];
    
    const basePrompt = `Anda adalah seorang ahli pemasaran digital dan copywriter yang sangat kreatif. Tugas Anda adalah membuat konten pemasaran yang menarik dan menjual berdasarkan informasi yang diberikan.
Gaya bahasa yang Anda gunakan harus **${input.style}**.
Pastikan outputnya dalam format HTML yang rapi, menggunakan tag seperti <h2> untuk judul, <p> untuk paragraf, dan <strong> atau <b> untuk penekanan. Jika relevan, sertakan juga beberapa hashtag yang sesuai.`;
    
    promptParts.push({ text: basePrompt });

    if (input.imageDataUri) {
        promptParts.push({ media: { url: input.imageDataUri } });
        promptParts.push({ text: '\nGunakan gambar ini sebagai referensi utama. Jelaskan apa yang ada di gambar dan buatlah teks pemasaran yang relevan.' });
    }

    if (input.text) {
        promptParts.push({ text: `\n\nBerikut adalah deskripsi tambahan dari pengguna: "${input.text}"` });
    }
    
    const { output } = await ai.generate({
      prompt: promptParts,
      model: googleAI.model('gemini-1.5-flash-latest'),
      output: { schema: CreativeContentOutputSchema },
      plugins: [googleAI({ apiKey: apiKeyRecord.key })],
    });

    if (!output) {
      throw new Error("AI tidak dapat menghasilkan konten. Coba lagi.");
    }
    return output;
  }
);

const translateContentFlow = ai.defineFlow(
  {
    name: 'translateContentFlow',
    inputSchema: TranslateContentInputSchema,
    outputSchema: TranslateContentOutputSchema,
  },
  async (input) => {
    const apiKeyRecord = await getApiKey();
    const prompt = `Anda adalah penerjemah profesional. Terjemahkan konten HTML berikut ke dalam bahasa **${input.targetLanguage}**. Pertahankan semua tag HTML dan struktur aslinya. Pastikan terjemahan akurat dan sesuai dengan konteks aslinya.

Konten Asli:
---
${input.content}
---
`;
    const { output } = await ai.generate({
      prompt: prompt,
      model: googleAI.model('gemini-1.5-flash-latest'),
      output: { schema: TranslateContentOutputSchema },
      plugins: [googleAI({ apiKey: apiKeyRecord.key })],
    });
    if (!output) throw new Error("AI tidak memberikan respons terjemahan.");
    return output;
  }
);


const generateVideoScriptFlow = ai.defineFlow(
  {
    name: 'generateVideoScriptFlow',
    inputSchema: GenerateVideoScriptInputSchema,
    outputSchema: GenerateVideoScriptOutputSchema,
  },
  async (input) => {
    const apiKeyRecord = await getApiKey();
    const prompt = `Anda adalah seorang penulis naskah video profesional. Ubah konten berikut menjadi naskah video pendek (sekitar 1 menit) yang menarik untuk platform seperti Instagram Reels atau TikTok. Buat format yang jelas dengan bagian-bagian seperti:
- **Scene [Nomor]:** (Deskripsi singkat adegan visual, B-roll, atau teks di layar)
- **Narasi/Dialog:** (Teks yang akan diucapkan)
- **Musik/SFX:** (Saran untuk musik latar atau efek suara)

Pastikan naskahnya dinamis dan mudah diikuti. Gunakan format HTML.

Konten Asli:
---
${input.content}
---
`;
    const { output } = await ai.generate({
      prompt: prompt,
      model: googleAI.model('gemini-1.5-flash-latest'),
      output: { schema: GenerateVideoScriptOutputSchema },
      plugins: [googleAI({ apiKey: apiKeyRecord.key })],
    });
    if (!output) throw new Error("AI tidak memberikan respons naskah video.");
    return output;
  }
);

const convertHtmlToWordFlow = ai.defineFlow(
  {
    name: 'convertHtmlToWordFlow',
    inputSchema: HtmlToWordInputSchema,
    outputSchema: HtmlToWordOutputSchema,
  },
  async (input) => {
    try {
        const docxBuffer = await htmlToDocx(input.htmlContent, undefined, {
            table: { row: { cantSplit: true } },
            footer: true,
            pageNumber: true,
             pageSize: {
                width: 11906,
                height: 16838,
            },
        });

        const docxDataUri = `data:application/vnd.openxmlformats-officedocument.wordprocessingml.document;base64,${(docxBuffer as Buffer).toString('base64')}`;

        return { docxDataUri };

    } catch (e: any) {
        console.error("Error in convertHtmlToWordFlow:", e);
        return { error: e.message || 'An unknown error occurred during conversion.' };
    }
  }
);

const getAiRecommendationFlow = ai.defineFlow(
  {
    name: 'getAiRecommendationFlow',
    inputSchema: AiRecommendationInputSchema,
    outputSchema: AiRecommendationOutputSchema,
  },
  async (input) => {
    const apiKeyRecord = await getApiKey();

    const prompt = [
        { text: "Anda adalah seorang konsultan ahli (seperti stylist, desainer interior, atau penasihat umum) yang sangat baik dalam mencocokkan barang. Tugas Anda adalah menganalisis satu 'Item Utama' dan beberapa 'Item Pilihan', lalu merekomendasikan satu pilihan terbaik yang paling cocok dengan item utama. Berikan juga ringkasan dan alasan yang logis untuk pilihan Anda dalam BAHASA INDONESIA." },
        { text: "ITEM UTAMA (Referensi):" },
        { media: { url: input.mainItem.dataUri } },
        { text: "\n\nITEM PILIHAN (Pilih salah satu dari berikut ini):" }
    ];

    input.choices.forEach((choice, index) => {
        prompt.push({ text: `\nPilihan ${index}:` });
        prompt.push({ media: { url: choice.dataUri } });
    });

    prompt.push({ text: "\n\nAnalisis Anda HARUS dalam Bahasa Indonesia dan mencakup:\n1. Pilihan terbaik (berdasarkan indeks, mulai dari 0).\n2. Ringkasan singkat (misal: 'Kombinasi Klasik & Modern').\n3. Alasan yang jelas dan logis, mempertimbangkan warna, gaya, acara, atau kriteria relevan lainnya." });

    const { output } = await ai.generate({
      prompt: prompt,
      model: googleAI.model('gemini-1.5-flash-latest'),
      output: { schema: AiRecommendationOutputSchema },
      plugins: [googleAI({ apiKey: apiKeyRecord.key })],
    });

    if (!output) {
      throw new Error("AI tidak dapat memberikan rekomendasi. Coba lagi.");
    }
    return output;
  }
);


// --------------------------------------------------------------------------
//  EXPORTED SERVER ACTIONS
// --------------------------------------------------------------------------

export async function chat(history: ChatMessage[]): Promise<ChatMessage> {
  const validationResult = ChatHistorySchema.safeParse(history);
  if (!validationResult.success) {
    console.error("Invalid chat history format:", validationResult.error);
    throw new Error('Format riwayat percakapan tidak valid.');
  }
  return chatFlow(history);
}

export async function generateArticleOutline(input: { description: string }) {
    const validationResult = ArticleOutlineInputSchema.safeParse(input);
    if (!validationResult.success) throw new Error("Input untuk kerangka artikel tidak valid.");
    return generateArticleOutlineFlow(input);
}

export async function generateArticleFromOutline(input: {
  selectedOutline: { title: string; points: string[] };
  wordCount: number;
}) {
    const validationResult = ArticleFromOutlineInputSchema.safeParse(input);
    if (!validationResult.success) throw new Error("Input untuk artikel tidak valid.");
    return generateArticleFromOutlineFlow(input);
}

export async function lengthenArticle(input: { originalContent: string }) {
    const validationResult = LengthenArticleInputSchema.safeParse(input);
    if (!validationResult.success) throw new Error("Input untuk perpanjang artikel tidak valid.");
    return lengthenArticleFlow(input);
}

export async function shortenArticle(input: { content: string }) {
    const validationResult = ShortenArticleInputSchema.safeParse(input);
    if (!validationResult.success) throw new Error("Input untuk ringkas artikel tidak valid.");
    return shortenArticleFlow(input);
}

export async function generateHeadlines(input: { content: string }) {
    const validationResult = GenerateHeadlinesInputSchema.safeParse(input);
    if (!validationResult.success) throw new Error("Input untuk buat judul tidak valid.");
    return generateHeadlinesFlow(input);
}

export async function generateSeoMeta(input: { articleContent: string }) {
    const validationResult = SeoMetaInputSchema.safeParse(input);
    if (!validationResult.success) throw new Error("Input untuk SEO meta tidak valid.");
    return generateSeoMetaFlow(input);
}

export async function generateCreativeContent(input: CreativeContentInput): Promise<CreativeContentOutput> {
  const validationResult = CreativeContentInputSchema.safeParse(input);
  if (!validationResult.success) throw new Error("Input untuk konten kreatif tidak valid.");
  return generateCreativeContentFlow(input);
}

export async function translateContent(input: TranslateContentInput): Promise<TranslateContentOutput> {
    const validationResult = TranslateContentInputSchema.safeParse(input);
    if (!validationResult.success) throw new Error("Input untuk terjemahan tidak valid.");
    return translateContentFlow(input);
}

export async function generateVideoScript(input: GenerateVideoScriptInput): Promise<GenerateVideoScriptOutput> {
    const validationResult = GenerateVideoScriptInputSchema.safeParse(input);
    if (!validationResult.success) throw new Error("Input untuk naskah video tidak valid.");
    return generateVideoScriptFlow(input);
}

export async function convertHtmlToWord(input: HtmlToWordInput): Promise<HtmlToWordOutput> {
  return await convertHtmlToWordFlow(input);
}

export async function getAiRecommendation(input: AiRecommendationInput): Promise<AiRecommendationOutput> {
    const validationResult = AiRecommendationInputSchema.safeParse(input);
    if (!validationResult.success) {
      throw new Error(`Input untuk rekomendasi AI tidak valid: ${validationResult.error.message}`);
    }
    return getAiRecommendationFlow(input);
}
