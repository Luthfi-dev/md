
'use server';
/**
 * @fileOverview All core AI text-based and multimodal generation flows.
 * This file centralizes the logic for interacting with the Genkit AI models
 * for various content generation and analysis tasks.
 */
import {ai} from '@/ai/init';
import {z} from 'zod';
import * as schemas from '../schemas';
import assistantData from '@/data/assistant.json';
import {gemini15Flash} from '@genkit-ai/googleai';
import wav from 'wav';

// --- Chat Flow ---
export const chat = ai.defineFlow(
  {
    name: 'chatFlow',
    inputSchema: schemas.ChatHistorySchema,
    outputSchema: schemas.ChatMessageSchema,
  },
  async history => {
    const {output} = await ai.generate({
      model: gemini15Flash,
      history,
      prompt: history[history.length - 1].content,
      system: assistantData.systemPrompt,
    });
    // Ensure content is never null to prevent schema validation errors.
    return {role: 'model', content: output || ''};
  }
);


// --- Article Generation Flows ---

export const generateArticleOutline = ai.defineFlow({
    name: 'generateArticleOutlineFlow',
    inputSchema: schemas.ArticleOutlineInputSchema,
    outputSchema: schemas.ArticleOutlineOutputSchema,
}, async (input) => {
    const {output} = await ai.generate({
        model: gemini15Flash,
        prompt: `Buat 3 opsi kerangka artikel (outlines) yang komprehensif berdasarkan deskripsi berikut: "${input.description}". Setiap kerangka harus memiliki judul yang menarik dan poin-poin utama yang jelas.`,
        output: {
            schema: schemas.ArticleOutlineOutputSchema,
        },
    });
    return output!;
});


export const generateArticleFromOutline = ai.defineFlow({
    name: 'generateArticleFromOutlineFlow',
    inputSchema: schemas.ArticleFromOutlineInputSchema,
    outputSchema: schemas.ArticleFromOutlineOutputSchema,
}, async (input) => {
    const {output} = await ai.generate({
        model: gemini15Flash,
        prompt: `Tulis artikel lengkap dalam format HTML berdasarkan kerangka berikut. Target jumlah kata sekitar ${input.wordCount} kata.\n\nJudul: ${input.selectedOutline.title}\nPoin-poin:\n- ${input.selectedOutline.points.join('\n- ')}`,
        output: {
            schema: schemas.ArticleFromOutlineOutputSchema
        }
    });
    return output!;
});


export const lengthenArticle = ai.defineFlow({
    name: 'lengthenArticleFlow',
    inputSchema: schemas.LengthenArticleInputSchema,
    outputSchema: schemas.LengthenArticleOutputSchema,
}, async(input) => {
    const {output} = await ai.generate({
        model: gemini15Flash,
        prompt: `Perpanjang dan elaborasi konten artikel HTML berikut. Tambahkan lebih banyak detail, contoh, atau penjelasan mendalam untuk membuatnya lebih komprehensif. Pastikan format HTML tetap terjaga.\n\nKonten Asli:\n${input.originalContent}`,
        output: {
            schema: schemas.LengthenArticleOutputSchema,
        }
    });
    return output!;
});

export const shortenArticle = ai.defineFlow({
    name: 'shortenArticleFlow',
    inputSchema: schemas.ShortenArticleInputSchema,
    outputSchema: schemas.ShortenArticleOutputSchema,
}, async(input) => {
    const {output} = await ai.generate({
        model: gemini15Flash,
        prompt: `Ringkas konten artikel HTML berikut menjadi lebih padat dan to-the-point. Hilangkan kalimat yang berulang atau tidak perlu, tetapi pertahankan ide utamanya. Pastikan format HTML tetap terjaga.\n\nKonten Asli:\n${input.content}`,
        output: {
            schema: schemas.ShortenArticleOutputSchema,
        }
    });
    return output!;
});


export const generateHeadlines = ai.defineFlow({
    name: 'generateHeadlinesFlow',
    inputSchema: schemas.GenerateHeadlinesInputSchema,
    outputSchema: schemas.GenerateHeadlinesOutputSchema,
}, async(input) => {
    const {output} = await ai.generate({
        model: gemini15Flash,
        prompt: `Buat 5 judul alternatif yang menarik, informatif, dan SEO-friendly untuk artikel berikut:\n\n${input.content}`,
        output: {
            schema: schemas.GenerateHeadlinesOutputSchema
        }
    });
    return output!;
});

export const generateSeoMeta = ai.defineFlow({
    name: 'generateSeoMetaFlow',
    inputSchema: schemas.SeoMetaInputSchema,
    outputSchema: schemas.SeoMetaOutputSchema,
}, async(input) => {
    const {output} = await ai.generate({
        model: gemini15Flash,
        prompt: `Buat meta title (sekitar 60 karakter) dan meta description (sekitar 155-160 karakter) yang SEO-friendly untuk artikel berikut:\n\n${input.articleContent}`,
        output: {
            schema: schemas.SeoMetaOutputSchema
        }
    });
    return output!;
});


// --- Creative Content Flow ---
export const generateCreativeContent = ai.defineFlow({
    name: 'generateCreativeContentFlow',
    inputSchema: schemas.CreativeContentInputSchema,
    outputSchema: schemas.CreativeContentOutputSchema,
}, async(input) => {
    const promptParts = [
        `Buat konten pemasaran kreatif dengan gaya bahasa "${input.style}".`,
    ];
    if (input.text) {
        promptParts.push(`Deskripsi produk/ide: ${input.text}`);
    }
    if (input.imageDataUri) {
        promptParts.push({ media: { url: input.imageDataUri } });
    }
    promptParts.push("\n\nPastikan output berupa format HTML yang kaya dan menarik.");

    const {output} = await ai.generate({
        model: gemini15Flash,
        prompt: promptParts,
        output: { schema: schemas.CreativeContentOutputSchema },
    });
    return output!;
});


// --- Translation & Video Script Flows ---
export const translateContent = ai.defineFlow({
    name: 'translateContentFlow',
    inputSchema: schemas.TranslateContentInputSchema,
    outputSchema: schemas.TranslateContentOutputSchema,
}, async(input) => {
    const {output} = await ai.generate({
        model: gemini15Flash,
        prompt: `Terjemahkan konten HTML berikut ke dalam bahasa ${input.targetLanguage}. Pertahankan semua tag HTML.\n\nKonten:\n${input.content}`,
        output: { schema: schemas.TranslateContentOutputSchema },
    });
    return output!;
});

export const generateVideoScript = ai.defineFlow({
    name: 'generateVideoScriptFlow',
    inputSchema: schemas.GenerateVideoScriptInputSchema,
    outputSchema: schemas.GenerateVideoScriptOutputSchema,
}, async(input) => {
    const {output} = await ai.generate({
        model: gemini15Flash,
        prompt: `Ubah konten berikut menjadi naskah video yang terstruktur. Gunakan heading (<h1>, <h2>) untuk adegan dan paragraf untuk narasi/dialog.\n\nKonten:\n${input.content}`,
        output: { schema: schemas.GenerateVideoScriptOutputSchema },
    });
    return output!;
});

// --- Recommendation & Project Estimation Flows ---
export const getAiRecommendation = ai.defineFlow({
    name: 'getAiRecommendationFlow',
    inputSchema: schemas.AiRecommendationInputSchema,
    outputSchema: schemas.AiRecommendationOutputSchema,
}, async(input) => {
    const promptParts: any[] = [
        `Anda adalah seorang fashion stylist dan konsultan pencocokan barang yang ahli. Tugas Anda adalah memberikan rekomendasi item terbaik dari beberapa pilihan untuk item utama. Item utama adalah gambar pertama, dan pilihan-pilihannya adalah gambar berikutnya. Berikan ringkasan yang menarik dan alasan yang logis.`,
        "Item Utama:",
        { media: { url: input.mainItem.dataUri } },
        "Pilihan:",
        ...input.choices.map(choice => ({ media: { url: choice.dataUri } })),
    ];

    const {output} = await ai.generate({
        model: gemini15Flash,
        prompt: promptParts,
        output: { schema: schemas.AiRecommendationOutputSchema },
    });
    return output!;
});


export const estimateProjectFeature = ai.defineFlow({
    name: 'estimateProjectFeatureFlow',
    inputSchema: schemas.ProjectFeatureInputSchema,
    outputSchema: schemas.ProjectFeatureOutputSchema,
}, async(input) => {
    const {output} = await ai.generate({
        model: gemini15Flash,
        prompt: `Berikan estimasi harga (minimum dan maksimum) dalam Rupiah (IDR) untuk fitur proyek berikut. Berikan juga justifikasi singkat untuk rentang harga tersebut.\n\nNama Proyek: ${input.projectName}\nDeskripsi Fitur: ${input.featureDescription}`,
        output: { schema: schemas.ProjectFeatureOutputSchema },
    });
    return output!;
});

// --- Text to Speech Flow ---
async function toWav(pcmData: Buffer, channels = 1, rate = 24000, sampleWidth = 2): Promise<string> {
  return new Promise((resolve, reject) => {
    const writer = new wav.Writer({
      channels,
      sampleRate: rate,
      bitDepth: sampleWidth * 8,
    });

    let bufs: any[] = [];
    writer.on('error', reject);
    writer.on('data', function (d) { bufs.push(d); });
    writer.on('end', function () { resolve(Buffer.concat(bufs).toString('base64')); });

    writer.write(pcmData);
    writer.end();
  });
}

export const textToSpeech = ai.defineFlow({
    name: 'textToSpeechFlow',
    inputSchema: schemas.TtsInputSchema,
    outputSchema: schemas.TtsOutputSchema,
}, async(input) => {
    try {
        const { media } = await ai.generate({
            model: 'googleai/gemini-2.5-flash-preview-tts',
            config: {
                responseModalities: ['AUDIO'],
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: { voiceName: input.voice },
                    },
                },
            },
            prompt: input.text,
        });

        if (!media || !media.url) {
            throw new Error('No media returned from TTS model.');
        }

        const audioBuffer = Buffer.from(media.url.substring(media.url.indexOf(',') + 1), 'base64');
        const wavBase64 = await toWav(audioBuffer);

        return { media: 'data:audio/wav;base64,' + wavBase64 };
    } catch (error) {
        console.error("Text to speech flow error:", error);
        return { error: (error as Error).message || 'An unknown error occurred during TTS generation.' };
    }
});
