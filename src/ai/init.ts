
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
 * This function will retry with different keys from the database, and then from .env as a fallback.
 * @param flowName The name of the flow for logging purposes.
 * @returns An object containing the generate function and the keyId used.
 */
export async function getConfiguredAi(flowName: string) {
    // 1. Try fetching keys from the database first
    let availableKeys = await getNextKey(true); // Get all active DB keys

    // 2. If no DB keys, fall back to .env
    if (!availableKeys || availableKeys.length === 0) {
        console.warn(`[${flowName}] No active keys in DB. Falling back to .env.`);
        availableKeys = getEnvKeys();
        if (availableKeys.length === 0) {
            throw new Error('Tidak ada kunci API yang aktif baik di database maupun di .env. Mohon konfigurasi kunci API.');
        }
    }

    let lastError: any = null;

    // 3. Iterate through all available keys (DB or .env)
    for (const apiKeyRecord of availableKeys) {
        const { id: keyId, key: apiKey, isEnv } = apiKeyRecord;
        console.log(`[${flowName}] Attempting with API Key ID: ${isEnv ? 'env' : keyId}`);
        
        try {
            const ai = genkit({
                plugins: [googleAI({ apiKey })],
                enableTracing: false,
                traceStore: undefined,
                flowStateStore: undefined,
            });

            // This closure captures the configured 'ai' instance.
            const generateWithRetry = async (options: any) => {
                try {
                    const result = await ai.generate(options);
                    if (!isEnv) {
                        await updateLastUsed(keyId as number); // Report success only for DB keys
                    }
                    return result;
                } catch (error) {
                    console.warn(`[${flowName}] API Key ${isEnv ? 'from .env' : `ID ${keyId}`} failed.`, (error as Error).message);
                    if (!isEnv) {
                        await reportFailure(keyId as number); // Report failure only for DB keys
                    }
                    throw error; // Re-throw to be caught by the outer loop
                }
            };
            
            return { generateWithRetry, keyId: isEnv ? 'env' : keyId };
        } catch (error) {
            lastError = error;
            console.error(`[${flowName}] Configuration failed for key ${isEnv ? 'from .env' : `ID ${keyId}`}.`, error);
            if (!isEnv) {
                await reportFailure(keyId as number);
            }
        }
    }

    console.error(`[${flowName}] All API key retries failed.`);
    throw new Error(lastError?.message || 'Layanan AI sedang sibuk atau mengalami gangguan setelah beberapa kali percobaan. Coba lagi nanti.');
}
