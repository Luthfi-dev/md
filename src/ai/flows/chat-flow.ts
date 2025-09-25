
'use server';

import { googleAI } from '@genkit-ai/googleai';
import { genkit } from 'genkit';
import * as schemas from '../schemas';
import { performGeneration } from '../init';
import wav from 'wav';

// Inisialisasi plugin sekali saja
const googleAiPlugin = googleAI({
  apiKey: process.env.GEMINI_API_KEY,
});

genkit({
  plugins: [googleAiPlugin],
  logLevel: 'silent',
  enableTracing: false,
});

export const chat = async (history: schemas.ChatMessage[]): Promise<schemas.ChatMessage> => {
    // This is a placeholder that simulates the external API call for chat.
    // In a real scenario, you'd have your fetch/axios logic here.
    return Promise.resolve({
        role: 'model',
        content: 'Fungsi chat asisten saat ini sedang menggunakan API eksternal dan stabil. Fitur AI lain telah dikembalikan ke Genkit.'
    });
};

export const generateArticleOutline = async (input: schemas.ArticleOutlineInput) => {
    const result = await performGeneration('generateArticleOutline', {
        model: 'googleai/gemini-1.5-flash',
        prompt: `Buat 3 opsi kerangka artikel (outlines) yang komprehensif berdasarkan deskripsi berikut: "${input.description}". Setiap kerangka harus memiliki judul yang menarik dan poin-poin utama yang jelas.`,
        output: {
            schema: schemas.ArticleOutlineOutputSchema,
        },
    });
    if (!result?.output) {
      throw new Error("AI tidak memberikan respons yang valid untuk kerangka artikel.");
    }
    return result.output;
};

export const generateArticleFromOutline = async (input: schemas.ArticleFromOutlineInput) => {
    const result = await performGeneration('generateArticleFromOutline', {
        model: 'googleai/gemini-1.5-flash',
        prompt: `Tulis artikel lengkap dalam format HTML berdasarkan kerangka berikut. Target jumlah kata sekitar ${input.wordCount} kata.\n\nJudul: ${input.selectedOutline.title}\nPoin-poin:\n- ${input.selectedOutline.points.join('\n- ')}`,
        output: {
            schema: schemas.ArticleFromOutlineOutputSchema
        }
    });
    if (!result?.output) {
      throw new Error("AI tidak memberikan respons yang valid untuk pembuatan artikel.");
    }
    return result.output;
};

export const lengthenArticle = async (input: schemas.LengthenArticleInput) => {
    const result = await performGeneration('lengthenArticle', {
        model: 'googleai/gemini-1.5-flash',
        prompt: `Perpanjang dan elaborasi konten artikel HTML berikut. Tambahkan lebih banyak detail, contoh, atau penjelasan mendalam untuk membuatnya lebih komprehensif. Pastikan format HTML tetap terjaga.\n\nKonten Asli:\n${input.originalContent}`,
        output: {
            schema: schemas.LengthenArticleOutputSchema,
        }
    });
    if (!result?.output) {
      throw new Error("AI tidak memberikan respons yang valid untuk perpanjangan artikel.");
    }
    return result.output;
};

export const shortenArticle = async (input: schemas.ShortenArticleInput) => {
    const result = await performGeneration('shortenArticle', {
        model: 'googleai/gemini-1.5-flash',
        prompt: `Ringkas konten artikel HTML berikut menjadi lebih padat dan to-the-point. Hilangkan kalimat yang berulang atau tidak perlu, tetapi pertahankan ide utamanya. Pastikan format HTML tetap terjaga.\n\nKonten Asli:\n${input.content}`,
        output: {
            schema: schemas.ShortenArticleOutputSchema,
        }
    });
     if (!result?.output) {
      throw new Error("AI tidak memberikan respons yang valid untuk peringkasan artikel.");
    }
    return result.output;
};

export const generateHeadlines = async (input: schemas.GenerateHeadlinesInput) => {
    const result = await performGeneration('generateHeadlines', {
        model: 'googleai/gemini-1.5-flash',
        prompt: `Buat 5 judul alternatif yang menarik, informatif, dan SEO-friendly untuk artikel berikut:\n\n${input.content}`,
        output: {
            schema: schemas.GenerateHeadlinesOutputSchema
        }
    });
     if (!result?.output) {
      throw new Error("AI tidak memberikan respons yang valid untuk pembuatan judul.");
    }
    return result.output;
};

export const generateSeoMeta = async (input: schemas.SeoMetaInput) => {
    const result = await performGeneration('generateSeoMeta', {
        model: 'googleai/gemini-1.5-flash',
        prompt: `Buat meta title (sekitar 60 karakter) dan meta description (sekitar 155-160 karakter) yang SEO-friendly untuk artikel berikut:\n\n${input.articleContent}`,
        output: {
            schema: schemas.SeoMetaOutputSchema
        }
    });
     if (!result?.output) {
      throw new Error("AI tidak memberikan respons yang valid untuk SEO meta.");
    }
    return result.output;
};

export const generateCreativeContent = async (input: schemas.CreativeContentInput) => {
    let promptParts: any[] = [];
    const textPromptParts = ['Buat konten pemasaran kreatif'];

    if (input.style) {
        textPromptParts.push(`dengan gaya bahasa "${input.style}"`);
    }

    if (input.imageDataUri) {
        promptParts.push({ media: { url: input.imageDataUri } });
        textPromptParts.push('berdasarkan gambar yang diunggah');
    }
    
    textPromptParts.push('Pastikan output berupa format HTML yang kaya dan menarik, tetapi JANGAN sertakan tag gambar (<img>). Fokus hanya pada konten teks.');
    
    if (input.text) {
        textPromptParts.push(`Berikut adalah deskripsi produk/idenya: ${input.text}`);
    }

    promptParts.push({ text: textPromptParts.join(' ') });
    
    const result = await performGeneration('generateCreativeContent', {
        model: 'googleai/gemini-1.5-flash',
        prompt: promptParts,
        output: { schema: schemas.CreativeContentOutputSchema },
    });

    if (!result?.output) {
      throw new Error("AI tidak memberikan konten.");
    }

    return result.output;
};


export const translateContent = async (input: schemas.TranslateContentInput) => {
    const result = await performGeneration('translateContent', {
        model: 'googleai/gemini-1.5-flash',
        prompt: `Terjemahkan konten HTML berikut ke dalam bahasa ${input.targetLanguage}. Pertahankan semua tag HTML.\n\nKonten:\n${input.content}`,
        output: { schema: schemas.TranslateContentOutputSchema },
    });
    if (!result?.output) {
      throw new Error("AI tidak memberikan respons yang valid untuk terjemahan.");
    }
    return result.output;
};

export const generateVideoScript = async (input: schemas.GenerateVideoScriptInput) => {
    const result = await performGeneration('generateVideoScript', {
        model: 'googleai/gemini-1.5-flash',
        prompt: `Ubah konten berikut menjadi naskah video yang terstruktur. Gunakan heading (<h1>, <h2>) untuk adegan dan paragraf untuk narasi/dialog.\n\nKonten:\n${input.content}`,
        output: { schema: schemas.GenerateVideoScriptOutputSchema },
    });
    if (!result?.output) {
      throw new Error("AI tidak memberikan respons yang valid untuk naskah video.");
    }
    return result.output;
};

export const getAiRecommendation = async (input: schemas.AiRecommendationInput) => {
    const promptParts = [
        { text: "Anda adalah seorang fashion stylist dan konsultan pencocokan barang yang ahli. Tugas Anda adalah memberikan rekomendasi item terbaik dari beberapa pilihan untuk item utama. Item utama adalah gambar pertama, dan pilihan-pilihannya adalah gambar berikutnya. Berikan ringkasan yang menarik dan alasan yang logis. Pastikan semua respons (summary dan reasoning) dalam Bahasa Indonesia." },
        { text: "Item Utama:" },
        { media: { url: input.mainItem.dataUri } },
        { text: "Pilihan:" },
        ...input.choices.map(choice => ({ media: { url: choice.dataUri } })),
    ];
    
    const options = {
        model: 'googleai/gemini-1.5-flash',
        prompt: promptParts,
        output: { schema: schemas.AiRecommendationOutputSchema },
    };
    
    const result = await performGeneration('getAiRecommendation', options);
    if (!result?.output) {
      throw new Error("AI tidak memberikan respons yang valid untuk rekomendasi.");
    }
    return result.output;
};

export const estimateProjectFeature = async (input: schemas.ProjectFeatureInput) => {
    const result = await performGeneration('estimateProjectFeature', {
        model: 'googleai/gemini-1.5-flash',
        prompt: `Berikan estimasi harga (minimum dan maksimum) dalam Rupiah (IDR) untuk fitur proyek berikut. Berikan juga justifikasi singkat untuk rentang harga tersebut.\n\nNama Proyek: ${input.projectName}\nDeskripsi Fitur: ${input.featureDescription}`,
        output: { schema: schemas.ProjectFeatureOutputSchema },
    });
    if (!result?.output) {
      throw new Error("AI tidak memberikan respons yang valid untuk estimasi proyek.");
    }
    return result.output;
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
            model: 'googleai/gemini-1.5-flash-tts',
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

    
