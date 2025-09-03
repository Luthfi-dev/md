
/**
 * @fileoverview This file initializes the Genkit AI instance with the necessary plugins and configurations.
 * It is crucial that this file does NOT contain the 'use server' directive, as it is a configuration module
 * meant to be imported by server-side code, not a server-action file itself.
 */
import { genkit, type Plugin, GenerativeAIError } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';
import { getNextKey, reportFailure, updateLastUsed } from '@/services/ApiKeyManager';

const MAX_RETRIES = 3;

/**
 * Creates a Genkit AI instance configured with a dynamically rotated API key.
 * This function will retry with different keys upon failure.
 * @param flowName The name of the flow for logging purposes.
 * @returns A configured Genkit AI instance.
 */
export async function getConfiguredAi(flowName: string) {
    let lastError: any = null;

    for (let i = 0; i < MAX_RETRIES; i++) {
        const apiKeyRecord = await getNextKey();
        
        if (!apiKeyRecord) {
            console.error("No active API keys available from ApiKeyManager.");
            throw new Error("Layanan AI tidak tersedia saat ini. Tidak ada kunci API yang aktif.");
        }

        const { id: keyId, key: apiKey } = apiKeyRecord;

        try {
            console.log(`[${flowName}] Attempt ${i + 1}/${MAX_RETRIES} using API Key ID: ${keyId}`);
            
            const ai = genkit({
                plugins: [googleAI({ apiKey })],
                // Disable Genkit's internal logging/tracing to avoid conflicts with our custom logic
                enableTracing: false, 
                traceStore: undefined,
                flowStateStore: undefined,
            });

            // "Test" the key with a simple check. We wrap generate to add our retry logic.
            const generateWithRetry = async (options: any) => {
                try {
                    const result = await ai.generate(options);
                    await updateLastUsed(keyId);
                    return result;
                } catch (error) {
                    // Re-throw to be caught by the outer catch block
                    throw error;
                }
            };
            
            return {
                generateWithRetry,
                keyId // Return keyId to report failures
            };

        } catch (error) {
            console.warn(`[${flowName}] API Key ID ${keyId} failed. Error:`, error);
            await reportFailure(keyId);
            lastError = error;
        }
    }

    console.error(`[${flowName}] All API key retries failed.`);
    throw new GenerativeAIError({
        message: 'Layanan AI sedang sibuk atau mengalami gangguan setelah beberapa kali percobaan. Coba lagi nanti.',
        cause: lastError
    });
}
