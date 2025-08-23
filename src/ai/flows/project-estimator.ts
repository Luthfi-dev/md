'use server';
/**
 * @fileOverview An AI flow for estimating software project feature costs.
 *
 * - estimateProjectFeature: A function that provides a cost estimation for a specific software feature.
 * - ProjectFeatureInputSchema: The input schema for the estimation flow.
 * - ProjectFeatureOutputSchema: The output schema for the estimation flow.
 */

import { genkit } from 'genkit';
import { z } from 'zod';
import { getApiKey } from '@/services/ApiKeyManager';
import { googleAI } from '@genkit-ai/googleai';

// --- Zod Schemas for Input and Output ---

export const ProjectFeatureInputSchema = z.object({
  projectName: z.string().describe('The overall name or type of the project, e.g., "Aplikasi Toko Online".'),
  featureDescription: z.string().describe('The specific feature to be estimated, e.g., "Sistem Keranjang Belanja".'),
});

export const ProjectFeatureOutputSchema = z.object({
  priceMin: z.number().describe('The estimated minimum price for this feature in Indonesian Rupiah (IDR).'),
  priceMax: z.number().describe('The estimated maximum price for this feature in Indonesian Rupiah (IDR).'),
  justification: z.string().describe('A brief, one-sentence justification for the price range, explaining the complexity.'),
});

// --- Type Definitions ---

export type ProjectFeatureInput = z.infer<typeof ProjectFeatureInputSchema>;
export type ProjectFeatureOutput = z.infer<typeof ProjectFeatureOutputSchema>;


// --- Genkit Flow Definition ---

const estimateProjectFeatureFlow = genkit.defineFlow(
  {
    name: 'estimateProjectFeatureFlow',
    inputSchema: ProjectFeatureInputSchema,
    outputSchema: ProjectFeatureOutputSchema,
  },
  async (input) => {
    const apiKeyRecord = await getApiKey();
    
    const prompt = `
      Anda adalah seorang konsultan IT senior dan manajer proyek di Indonesia dengan pengalaman 15 tahun dalam pengembangan perangkat lunak.
      Tugas Anda adalah memberikan estimasi biaya yang realistis untuk sebuah fitur dalam sebuah proyek perangkat lunak.
      Gunakan data dan standar harga pengembangan software di Indonesia.
      Berikan harga dalam Rupiah (IDR).

      Anda HARUS memberikan output dalam format JSON yang sesuai dengan skema yang diberikan.
      - priceMin dan priceMax harus berupa angka (number), bukan string.
      - justification harus berupa satu kalimat singkat yang menjelaskan kompleksitas dan alasan rentang harga tersebut.

      Konteks Proyek: ${input.projectName}
      Fitur yang akan diestimasi: "${input.featureDescription}"
    `;

    const { output } = await genkit.generate({
      prompt: prompt,
      model: googleAI.model('gemini-1.5-flash-latest'),
      output: { schema: ProjectFeatureOutputSchema },
      plugins: [googleAI({ apiKey: apiKeyRecord.key })],
    });

    if (!output) {
      throw new Error('Gagal mendapatkan estimasi dari AI. Coba lagi.');
    }

    return output;
  }
);


// --- Exported Server Action ---

export async function estimateProjectFeature(input: ProjectFeatureInput): Promise<ProjectFeatureOutput> {
  return await estimateProjectFeatureFlow(input);
}
