
'use server';

import { googleAI } from '@genkit-ai/googleai';
import { genkit, type GenkitError } from 'genkit';
import * as schemas from '../schemas';
import * as ApiKeyManager from '@/services/ApiKeyManager';
import wav from 'wav';

/**
 * A robust wrapper for making Genkit API calls with key rotation and error handling.
 * This will be used by each AI function in this file.
 * @param flowName The name of the flow for logging.
 * @param generateOptions The options to pass to `ai.generate()`.
 * @returns The result from a successful `ai.generate` call.
 * @throws An error if all keys fail.
 */
async function performGeneration(flowName: string, generateOptions: any) {
    const dbKeys = await ApiKeyManager.getNextKey(true) || [];
    const envKeys = ApiKeyManager.getEnvKeys();
    const allAvailableKeys = [...dbKeys, ...envKeys];

    if (allAvailableKeys.length === 0) {
        throw new Error('Tidak ada kunci API yang aktif baik di database maupun di .env. Mohon konfigurasi kunci API.');
    }

    let lastError: any = null;

    for (const apiKeyRecord of allAvailableKeys) {
        const { id: keyId, key: apiKey, isEnv } = apiKeyRecord;
        const keyIdentifier = isEnv ? `env key ending in ...${apiKey.slice(-4)}` : `DB Key ID ${keyId}`;
        
        console.log(`[${flowName}] Attempting generation with: ${keyIdentifier}`);
        
        try {
            const ai = genkit({
                plugins: [googleAI({ apiKey })],
                enableTracing: false,
            });

            // Explicitly construct the generation object to ensure correctness
            const result = await ai.generate(generateOptions);

            if (!isEnv) {
                await ApiKeyManager.updateLastUsed(keyId as number);
            }
            console.log(`[${flowName}] Generation successful with ${keyIdentifier}.`);
            return result;

        } catch (error) {
            lastError = error;
            const errorMessage = (error as GenkitError)?.message || (error as Error)?.message || 'Unknown error';
            console.warn(`[${flowName}] Generation FAILED with ${keyIdentifier}. Error:`, errorMessage);
            
            if (!isEnv) {
                await ApiKeyManager.reportFailure(keyId as number);
            }
        }
    }

    console.error(`[${flowName}] All API key attempts failed.`);
    throw new Error(lastError?.message || 'Layanan AI sedang sibuk atau mengalami gangguan setelah mencoba semua kunci yang tersedia. Coba lagi nanti.');
}


// This file uses an external, non-Genkit chat service, so it remains unchanged.
export const chat = async (history: schemas.ChatMessage[]): Promise<schemas.ChatMessage> => {
  try {
    const aiResponse = await import('@/services/ExternalAIService').then(module => module.chat(history));
    return aiResponse;
  } catch (error) {
    console.error("Chat flow error:", error);
    return {
      role: 'model',
      content: `Maaf, terjadi masalah saat menghubungi asisten. Error: ${(error as Error).message}`
    };
  }
};


export const generateArticleOutline = async (input: schemas.ArticleOutlineInput) => {
    try {
        const result = await performGeneration('generateArticleOutline', {
            model: 'googleai/gemini-2.0-flash',
            prompt: `Buat 3 opsi kerangka artikel (outlines) yang komprehensif berdasarkan deskripsi berikut: "${input.description}". Setiap kerangka harus memiliki judul yang menarik dan poin-poin utama yang jelas.`,
            output: {
                schema: schemas.ArticleOutlineOutputSchema,
            },
        });
        if (!result?.output) {
          throw new Error("AI tidak memberikan respons yang valid untuk kerangka artikel.");
        }
        return result.output;
    } catch (error) {
        console.error("Error in generateArticleOutline:", error);
        throw new Error((error as Error).message || "Gagal membuat kerangka artikel.");
    }
};

export const generateArticleFromOutline = async (input: schemas.ArticleFromOutlineInput) => {
    try {
        const result = await performGeneration('generateArticleFromOutline', {
            model: 'googleai/gemini-2.0-flash',
            prompt: `Tulis artikel lengkap dalam format HTML berdasarkan kerangka berikut. Target jumlah kata sekitar ${input.wordCount} kata.\n\nJudul: ${input.selectedOutline.title}\nPoin-poin:\n- ${input.selectedOutline.points.join('\n- ')}`,
            output: {
                schema: schemas.ArticleFromOutlineOutputSchema
            }
        });
        if (!result?.output) {
          throw new Error("AI tidak memberikan respons yang valid untuk pembuatan artikel.");
        }
        return result.output;
    } catch (error) {
        console.error("Error in generateArticleFromOutline:", error);
        throw new Error((error as Error).message || "Gagal membuat artikel.");
    }
};

export const lengthenArticle = async (input: schemas.LengthenArticleInput) => {
    try {
        const result = await performGeneration('lengthenArticle', {
            model: 'googleai/gemini-2.0-flash',
            prompt: `Perpanjang dan elaborasi konten artikel HTML berikut. Tambahkan lebih banyak detail, contoh, atau penjelasan mendalam untuk membuatnya lebih komprehensif. Pastikan format HTML tetap terjaga.\n\nKonten Asli:\n${input.originalContent}`,
            output: {
                schema: schemas.LengthenArticleOutputSchema,
            }
        });
        if (!result?.output) {
          throw new Error("AI tidak memberikan respons yang valid untuk perpanjangan artikel.");
        }
        return result.output;
    } catch (error) {
        console.error("Error in lengthenArticle:", error);
        throw new Error((error as Error).message || "Gagal memperpanjang artikel.");
    }
};

export const shortenArticle = async (input: schemas.ShortenArticleInput) => {
    try {
        const result = await performGeneration('shortenArticle', {
            model: 'googleai/gemini-2.0-flash',
            prompt: `Ringkas konten artikel HTML berikut menjadi lebih padat dan to-the-point. Hilangkan kalimat yang berulang atau tidak perlu, tetapi pertahankan ide utamanya. Pastikan format HTML tetap terjaga.\n\nKonten Asli:\n${input.content}`,
            output: {
                schema: schemas.ShortenArticleOutputSchema,
            }
        });
         if (!result?.output) {
          throw new Error("AI tidak memberikan respons yang valid untuk peringkasan artikel.");
        }
        return result.output;
    } catch (error) {
        console.error("Error in shortenArticle:", error);
        throw new Error((error as Error).message || "Gagal meringkas artikel.");
    }
};

export const generateHeadlines = async (input: schemas.GenerateHeadlinesInput) => {
    try {
        const result = await performGeneration('generateHeadlines', {
            model: 'googleai/gemini-2.0-flash',
            prompt: `Buat 5 judul alternatif yang menarik, informatif, dan SEO-friendly untuk artikel berikut:\n\n${input.content}`,
            output: {
                schema: schemas.GenerateHeadlinesOutputSchema
            }
        });
         if (!result?.output) {
          throw new Error("AI tidak memberikan respons yang valid untuk pembuatan judul.");
        }
        return result.output;
    } catch (error) {
        console.error("Error in generateHeadlines:", error);
        throw new Error((error as Error).message || "Gagal membuat judul.");
    }
};

export const generateSeoMeta = async (input: schemas.SeoMetaInput) => {
    try {
        const result = await performGeneration('generateSeoMeta', {
            model: 'googleai/gemini-2.0-flash',
            prompt: `Buat meta title (sekitar 60 karakter) dan meta description (sekitar 155-160 karakter) yang SEO-friendly untuk artikel berikut:\n\n${input.articleContent}`,
            output: {
                schema: schemas.SeoMetaOutputSchema
            }
        });
         if (!result?.output) {
          throw new Error("AI tidak memberikan respons yang valid untuk SEO meta.");
        }
        return result.output;
    } catch (error) {
        console.error("Error in generateSeoMeta:", error);
        throw new Error((error as Error).message || "Gagal membuat meta SEO.");
    }
};

export const generateCreativeContent = async (input: schemas.CreativeContentInput) => {
    try {
        const textParts: string[] = ['Buat konten pemasaran kreatif'];
        if (input.style) {
            textParts.push(`dengan gaya bahasa "${input.style}"`);
        }
        if (input.imageDataUri) {
            textParts.push('berdasarkan gambar yang diunggah');
        }
        textParts.push('Pastikan output berupa format HTML yang kaya dan menarik, tetapi JANGAN sertakan tag gambar (<img>). Fokus hanya pada konten teks.');
        if (input.text) {
            textParts.push(`Berikut adalah deskripsi produk/idenya: ${input.text}`);
        }
        
        const prompt: any[] = [{ text: textParts.join(' ') }];
        if (input.imageDataUri) {
            prompt.unshift({ media: { url: input.imageDataUri } });
        }
        
        const result = await performGeneration('generateCreativeContent', {
            model: 'googleai/gemini-2.0-flash',
            prompt: prompt,
            output: { schema: schemas.CreativeContentOutputSchema },
        });

        if (!result?.output?.content) {
          throw new Error("AI tidak memberikan konten.");
        }
        return result.output;
    } catch (error) {
        console.error("Error in generateCreativeContent:", error);
        throw new Error((error as Error).message || "Gagal membuat konten kreatif.");
    }
};


export const translateContent = async (input: schemas.TranslateContentInput) => {
    try {
        const result = await performGeneration('translateContent', {
            model: 'googleai/gemini-2.0-flash',
            prompt: `Terjemahkan konten HTML berikut ke dalam bahasa ${input.targetLanguage}. Pertahankan semua tag HTML.\n\nKonten:\n${input.content}`,
            output: { schema: schemas.TranslateContentOutputSchema },
        });
        if (!result?.output) {
          throw new Error("AI tidak memberikan respons yang valid untuk terjemahan.");
        }
        return result.output;
    } catch (error) {
        console.error("Error in translateContent:", error);
        throw new Error((error as Error).message || "Gagal menerjemahkan konten.");
    }
};

export const generateVideoScript = async (input: schemas.GenerateVideoScriptInput) => {
    try {
        const result = await performGeneration('generateVideoScript', {
            model: 'googleai/gemini-2.0-flash',
            prompt: `Ubah konten berikut menjadi naskah video yang terstruktur. Gunakan heading (<h1>, <h2>) untuk adegan dan paragraf untuk narasi/dialog.\n\nKonten:\n${input.content}`,
            output: { schema: schemas.GenerateVideoScriptOutputSchema },
        });
        if (!result?.output) {
          throw new Error("AI tidak memberikan respons yang valid untuk naskah video.");
        }
        return result.output;
    } catch (error) {
        console.error("Error in generateVideoScript:", error);
        throw new Error((error as Error).message || "Gagal membuat naskah video.");
    }
};

export const getAiRecommendation = async (input: schemas.AiRecommendationInput) => {
    try {
        const promptParts: ({ text: string } | { media: { url: string } })[] = [
            { text: "Anda adalah seorang fashion stylist dan konsultan pencocokan barang yang ahli. Tugas Anda adalah memberikan rekomendasi item terbaik dari beberapa pilihan untuk item utama. Item utama adalah gambar pertama, dan pilihan-pilihannya adalah gambar berikutnya. Berikan ringkasan yang menarik dan alasan yang logis. Pastikan semua respons (summary dan reasoning) dalam Bahasa Indonesia." },
            { text: "Item Utama:" },
            { media: { url: input.mainItem.dataUri } },
            { text: "Pilihan:" },
            ...input.choices.map(choice => ({ media: { url: choice.dataUri } })),
        ];
        
        const options = {
            model: 'googleai/gemini-2.0-flash',
            prompt: promptParts,
            output: { schema: schemas.AiRecommendationOutputSchema },
        };
        
        const result = await performGeneration('getAiRecommendation', options);

        if (!result?.output || typeof result.output.bestChoiceIndex !== 'number') {
          throw new Error("AI tidak memberikan respons yang valid untuk rekomendasi.");
        }
        return result.output;
    } catch (error) {
        console.error("Error in getAiRecommendation:", error);
        throw new Error((error as Error).message || "Gagal mendapatkan rekomendasi AI.");
    }
};

export const estimateProjectFeature = async (input: schemas.ProjectFeatureInput) => {
    try {
        const result = await performGeneration('estimateProjectFeature', {
            model: 'googleai/gemini-2.0-flash',
            prompt: `Berikan estimasi harga (minimum dan maksimum) dalam Rupiah (IDR) untuk fitur proyek berikut. Berikan juga justifikasi singkat untuk rentang harga tersebut.\n\nNama Proyek: ${input.projectName}\nDeskripsi Fitur: ${input.featureDescription}`,
            output: { schema: schemas.ProjectFeatureOutputSchema },
        });
        if (!result?.output) {
          throw new Error("AI tidak memberikan respons yang valid untuk estimasi proyek.");
        }
        return result.output;
    } catch (error) {
        console.error("Error in estimateProjectFeature:", error);
        throw new Error((error as Error).message || "Gagal mengestimasi fitur proyek.");
    }
};

async function toWav(pcmData: Buffer, channels = 1, rate = 24000, sampleWidth = 2): Promise<string> {
    return new Promise((resolve, reject) => {
        const writer = new wav.Writer({
            channels,
            sampleRate: rate,
            bitDepth: sampleWidth * 8,
        });
        let bufs: any[] = [];
        writer.on('error', reject);
        writer.on('data', (d) => bufs.push(d));
        writer.on('end', () => resolve(Buffer.concat(bufs).toString('base64')));
        writer.write(pcmData);
        writer.end();
    });
}

export const textToSpeech = async (input: schemas.TtsInput) => {
    try {
        const result = await performGeneration('textToSpeech', {
            model: 'googleai/gemini-2.5-pro-preview-tts',
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

        if (!result || !result.media || !result.media.url) {
            throw new Error('No media returned from TTS model.');
        }

        const audioBuffer = Buffer.from(result.media.url.substring(result.media.url.indexOf(',') + 1), 'base64');
        const wavBase64 = await toWav(audioBuffer);

        return { media: 'data:audio/wav;base64,' + wavBase64 };
    } catch (error) {
        console.error("Text to speech flow error:", error);
        return { error: (error as Error).message || 'An unknown error occurred during TTS generation.' };
    }
};
