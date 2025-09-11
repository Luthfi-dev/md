
/**
 * @fileoverview This file initializes the Genkit AI instance with the necessary plugins and configurations.
 * It is crucial that this file does not contain 'use server' if it's meant for server-side setup,
 * but since it's used by server actions, it can exist in this context.
 */
import { genkit, type GenerativeAIError } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';
import { getNextKey, reportFailure, updateLastUsed } from '@/services/ApiKeyManager';

const MAX_RETRIES = 3;

/**
 * Creates a Genkit AI instance configured with a dynamically rotated API key.
 * This function will retry with different keys upon failure.
 * @param flowName The name of the flow for logging purposes.
 * @returns A configured Genkit AI instance and the keyId used.
 */
export async function getConfiguredAi(flowName: string) {
    let lastError: any = null;

    for (let i = 0; i < MAX_RETRIES; i++) {
        const apiKeyRecord = await getNextKey();
        
        if (!apiKeyRecord) {
            console.error(`[${flowName}] No active API keys available from ApiKeyManager.`);
            continue; // Try again, maybe cache is stale
        }

        const { id: keyId, key: apiKey } = apiKeyRecord;
        console.log(`[${flowName}] Attempt ${i + 1}/${MAX_RETRIES} using API Key ID: ${keyId}`);
        
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
                    await updateLastUsed(keyId); // Report success
                    return result;
                } catch (error) {
                    console.warn(`[${flowName}] API Key ID ${keyId} failed. Error:`, error);
                    await reportFailure(keyId); // Report failure
                    throw error; // Re-throw to be caught by the outer catch block
                }
            };
            
            return { generateWithRetry, keyId };
        } catch (error) {
            // This catch is for initial configuration errors, less likely but possible.
            lastError = error;
            console.error(`[${flowName}] Configuration failed for key ID ${keyId}. Error:`, error);
            await reportFailure(keyId);
        }
    }

    console.error(`[${flowName}] All API key retries failed.`);
    throw new Error(lastError?.message || 'Layanan AI sedang sibuk atau mengalami gangguan setelah beberapa kali percobaan. Coba lagi nanti.');
}
