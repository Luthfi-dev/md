
/**
 * @fileoverview This file initializes the Genkit AI instance with the necessary plugins and configurations.
 * It is crucial that this file does not contain 'use server' if it's meant for server-side setup,
 * but since it's used by server actions, it can exist in this context.
 */
import { genkit, type GenerativeAIError } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';
import { getNextKey, reportFailure, updateLastUsed, getEnvKeys, clearCache } from '@/services/ApiKeyManager';

/**
 * Creates a Genkit AI instance configured with a dynamically rotated API key.
 * This function now robustly tries all available keys from the database,
 * and only if all of them fail, it proceeds to try keys from the .env file.
 * 
 * @param flowName The name of the flow for logging purposes.
 * @param options The options to pass to the `ai.generate` function. This now includes the model.
 * @returns The result from a successful `ai.generate` call.
 * @throws An error if all keys from both the database and .env fail.
 */
export async function performGeneration(flowName: string, options: any) {
    // 1. Get all available keys, DB first, then .env as a fallback list
    const dbKeys = await getNextKey(true) || [];
    const envKeys = getEnvKeys();
    const allAvailableKeys = [...dbKeys, ...envKeys];

    if (allAvailableKeys.length === 0) {
        throw new Error('Tidak ada kunci API yang aktif baik di database maupun di .env. Mohon konfigurasi kunci API.');
    }

    let lastError: any = null;

    // 2. Iterate through all available keys
    for (const apiKeyRecord of allAvailableKeys) {
        const { id: keyId, key: apiKey, isEnv } = apiKeyRecord;
        const keyIdentifier = isEnv ? `env key ending in ...${apiKey.slice(-4)}` : `DB Key ID ${keyId}`;
        
        console.log(`[${flowName}] Attempting generation with: ${keyIdentifier}`);
        
        try {
            // Configure Genkit with the current key
            const ai = genkit({
                plugins: [googleAI({ apiKey })],
                enableTracing: false,
            });

            // Attempt the generation using the provided options directly
            const result = await ai.generate(options);

            // If successful, update its usage timestamp (if it's a DB key) and return
            console.log(`[${flowName}] Generation successful with ${keyIdentifier}.`);
            if (!isEnv) {
                await updateLastUsed(keyId as number);
            }
            return result;

        } catch (error) {
            lastError = error;
            console.warn(`[${flowName}] Generation FAILED with ${keyIdentifier}. Error:`, (error as Error).message);
            
            // If it's a database key, report the failure
            if (!isEnv) {
                await reportFailure(keyId as number);
            }
            // The loop will then continue to the next key
        }
    }

    // 3. If the loop completes without a successful return, it means all keys have failed.
    console.error(`[${flowName}] All API key attempts failed.`);
    throw new Error(lastError?.message || 'Layanan AI sedang sibuk atau mengalami gangguan setelah mencoba semua kunci yang tersedia. Coba lagi nanti.');
}
