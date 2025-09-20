
'use server';
/**
 * @fileOverview All core AI text-based and multimodal generation flows.
 * This file centralizes the logic for interacting with the Genkit AI models
 * for various content generation and analysis tasks.
 */
import { performGenerationWithRotation } from '@/ai/init';
import { z } from 'zod';
import * as schemas from '../schemas';
import { gemini15Flash } from '@genkit-ai/googleai';
import wav from 'wav';

/**
 * Wrapper function to execute a generation task with API key rotation and retry logic.
 * @param flowName Name of the flow for logging.
 * @param options The options to pass to the generation function (e.g., ai.generate).
 * @returns The output of the generation function.
 */
async function executeGeneration(flowName: string, options: any) {
    return performGenerationWithRotation(flowName, options);
}


// --- Chat Flow ---
// NOTE: The chat flow is now handled directly by ExternalAIService.ts for public access.
// This Genkit flow is disabled to prevent conflicts.
export const chat = async (prompt: string) => {
    // This flow is intentionally left blank.
    // The UI now calls the service in `src/services/ExternalAIService.ts` directly.
    return { role: 'model', content: 'This Genkit flow is disabled.' };
};


// --- Article Generation Flows ---

export const generateArticleOutline = async (input: schemas.ArticleOutlineInput) => {
    const { output } = await executeGeneration('generateArticleOutline', {
        model: gemini15Flash,
        prompt: `Buat 3 opsi kerangka artikel (outlines) yang komprehensif berdasarkan deskripsi berikut: "${input.description}". Setiap kerangka harus memiliki judul yang menarik dan poin-poin utama yang jelas.`,
        output: {
            schema: schemas.ArticleOutlineOutputSchema,
        },
    });
    return output!;
};


export const generateArticleFromOutline = async (input: schemas.ArticleFromOutlineInput) => {
    const { output } = await executeGeneration('generateArticleFromOutline', {
        model: gemini15Flash,
        prompt: `Tulis artikel lengkap dalam format HTML berdasarkan kerangka berikut. Target jumlah kata sekitar ${input.wordCount} kata.\n\nJudul: ${input.selectedOutline.title}\nPoin-poin:\n- ${input.selectedOutline.points.join('\n- ')}`,
        output: {
            schema: schemas.ArticleFromOutlineOutputSchema
        }
    });
    return output!;
};


export const lengthenArticle = async (input: schemas.LengthenArticleInput) => {
    const { output } = await executeGeneration('lengthenArticle', {
        model: gemini15Flash,
        prompt: `Perpanjang dan elaborasi konten artikel HTML berikut. Tambahkan lebih banyak detail, contoh, atau penjelasan mendalam untuk membuatnya lebih komprehensif. Pastikan format HTML tetap terjaga.\n\nKonten Asli:\n${input.originalContent}`,
        output: {
            schema: schemas.LengthenArticleOutputSchema,
        }
    });
    return output!;
};

export const shortenArticle = async (input: schemas.ShortenArticleInput) => {
    const { output } = await executeGeneration('shortenArticle', {
        model: gemini15Flash,
        prompt: `Ringkas konten artikel HTML berikut menjadi lebih padat dan to-the-point. Hilangkan kalimat yang berulang atau tidak perlu, tetapi pertahankan ide utamanya. Pastikan format HTML tetap terjaga.\n\nKonten Asli:\n${input.content}`,
        output: {
            schema: schemas.ShortenArticleOutputSchema,
        }
    });
    return output!;
};


export const generateHeadlines = async (input: schemas.GenerateHeadlinesInput) => {
    const { output } = await executeGeneration('generateHeadlines', {
        model: gemini15Flash,
        prompt: `Buat 5 judul alternatif yang menarik, informatif, dan SEO-friendly untuk artikel berikut:\n\n${input.content}`,
        output: {
            schema: schemas.GenerateHeadlinesOutputSchema
        }
    });
    return output!;
};

export const generateSeoMeta = async (input: schemas.SeoMetaInput) => {
    const { output } = await executeGeneration('generateSeoMeta', {
        model: gemini15Flash,
        prompt: `Buat meta title (sekitar 60 karakter) dan meta description (sekitar 155-160 karakter) yang SEO-friendly untuk artikel berikut:\n\n${input.articleContent}`,
        output: {
            schema: schemas.SeoMetaOutputSchema
        }
    });
    return output!;
};


// --- Creative Content Flow ---
export const generateCreativeContent = async (input: schemas.CreativeContentInput) => {
    const promptParts = [
        `Buat konten pemasaran kreatif dengan gaya bahasa "${input.style}".`,
    ];
    if (input.text) {
        promptParts.push(`Deskripsi produk/ide: ${input.text}`);
    }
    if (input.imageDataUri) {
        promptParts.push({ media: { url: input.imageDataUri } });
    }
    promptParts.push("\n\nPastikan output berupa format HTML yang kaya dan menarik, tetapi JANGAN sertakan tag gambar (<img>). Fokus hanya pada konten teks.");

    const { output } = await executeGeneration('generateCreativeContent', {
        model: gemini15Flash,
        prompt: promptParts,
        output: { schema: schemas.CreativeContentOutputSchema },
    });
    return output!;
};


// --- Translation & Video Script Flows ---
export const translateContent = async (input: schemas.TranslateContentInput) => {
    const { output } = await executeGeneration('translateContent', {
        model: gemini15Flash,
        prompt: `Terjemahkan konten HTML berikut ke dalam bahasa ${input.targetLanguage}. Pertahankan semua tag HTML.\n\nKonten:\n${input.content}`,
        output: { schema: schemas.TranslateContentOutputSchema },
    });
    return output!;
};

export const generateVideoScript = async (input: schemas.GenerateVideoScriptInput) => {
    const { output } = await executeGeneration('generateVideoScript', {
        model: gemini15Flash,
        prompt: `Ubah konten berikut menjadi naskah video yang terstruktur. Gunakan heading (<h1>, <h2>) untuk adegan dan paragraf untuk narasi/dialog.\n\nKonten:\n${input.content}`,
        output: { schema: schemas.GenerateVideoScriptOutputSchema },
    });
    return output!;
};

// --- Recommendation & Project Estimation Flows ---
export const getAiRecommendation = async (input: schemas.AiRecommendationInput) => {
    const promptParts: any[] = [
        `Anda adalah seorang fashion stylist dan konsultan pencocokan barang yang ahli. Tugas Anda adalah memberikan rekomendasi item terbaik dari beberapa pilihan untuk item utama. Item utama adalah gambar pertama, dan pilihan-pilihannya adalah gambar berikutnya. Berikan ringkasan yang menarik dan alasan yang logis. Pastikan semua respons (summary dan reasoning) dalam Bahasa Indonesia.`,
        "Item Utama:",
        { media: { url: input.mainItem.dataUri } },
        "Pilihan:",
        ...input.choices.map(choice => ({ media: { url: choice.dataUri } })),
    ];

    const { output } = await executeGeneration('getAiRecommendation', {
        model: gemini15Flash,
        prompt: promptParts,
        output: { schema: schemas.AiRecommendationOutputSchema },
    });
    return output!;
};


export const estimateProjectFeature = async (input: schemas.ProjectFeatureInput) => {
    const { output } = await executeGeneration('estimateProjectFeature', {
        model: gemini15Flash,
        prompt: `Berikan estimasi harga (minimum dan maksimum) dalam Rupiah (IDR) untuk fitur proyek berikut. Berikan juga justifikasi singkat untuk rentang harga tersebut.\n\nNama Proyek: ${input.projectName}\nDeskripsi Fitur: ${input.featureDescription}`,
        output: { schema: schemas.ProjectFeatureOutputSchema },
    });
    return output!;
};

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

export const textToSpeech = async (input: schemas.TtsInput) => {
    try {
        const { media } = await executeGeneration('textToSpeech', {
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
};
