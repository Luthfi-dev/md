
'use server';
/**
 * @fileoverview This file initializes the Genkit AI instance with the necessary plugins and configurations.
 * It is crucial that this file does not contain 'use server' if it's meant for server-side setup,
 * but since it's used by server actions, it can exist in this context.
 */
import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';
import { getNextKey, reportFailure, updateLastUsed, getEnvKeys } from '@/services/ApiKeyManager';

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
    const dbKeys = await getNextKey(true) || [];
    const envKeys = getEnvKeys();
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

            // Correctly spread the options into a new object for the generate call
            const result = await ai.generate({ ...options });

            if (!isEnv) {
                await updateLastUsed(keyId as number);
            }
            console.log(`[${flowName}] Generation successful with ${keyIdentifier}.`);
            return result;

        } catch (error) {
            lastError = error;
            console.warn(`[${flowName}] Generation FAILED with ${keyIdentifier}. Error:`, (error as Error).message);
            
            if (!isEnv) {
                await reportFailure(keyId as number);
            }
        }
    }

    console.error(`[${flowName}] All API key attempts failed.`);
    throw new Error(lastError?.message || 'Layanan AI sedang sibuk atau mengalami gangguan setelah mencoba semua kunci yang tersedia. Coba lagi nanti.');
}
