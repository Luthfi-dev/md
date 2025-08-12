import { genkit, configureGenkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';
import { ApiKeyManager } from '@/services/ApiKeyManager';

// Define the initial AI instance without plugins, as they will be configured dynamically.
export const ai = genkit();

/**
 * Dynamically configures the Genkit instance with a rotating Google AI API key.
 * This function should be called at the beginning of each flow that uses the AI.
 * It ensures that a valid, working API key is used for each operation.
 */
export async function configureAi() {
  const apiKey = await ApiKeyManager.getApiKey();

  if (!apiKey) {
    throw new Error('No active Gemini API keys available. Please add a key to the database.');
  }

  // This reconfigures the global genkit instance with the provided API key.
  configureGenkit({
    plugins: [
      googleAI({
        apiKey: apiKey.key,
        // Override the default retry logic to use our custom key rotation.
        // We only want to retry on UNAVAILABLE (e.g. rate limit, server error), not on INVALID_ARGUMENT (e.g. bad prompt).
        retry: {
            // Define which errors should trigger a retry with a new key.
             shouldRetry: (err) => {
                const errorMessage = (err as any)?.cause?.message || '';
                return errorMessage.includes('UNAVAILABLE');
             },
             // How many times to retry with a NEW key before giving up.
             maxAttempts: (await ApiKeyManager.getActiveKeyCount()) + 1,
             // The delay between retries.
             backoff: {
                start: 1000,
                factor: 1.5,
                max: 3000,
             }
        }
      }),
    ],
    // Use a more available model for free tier keys.
    model: 'googleai/gemini-2.0-flash',
    // Define a custom error handler for when a request fails.
    errorHandler: async (err, flow, input) => {
        const currentKey = await ApiKeyManager.getApiKey(true); // Get the key that was just used
        if (currentKey) {
            console.warn(`API key ${currentKey.id} failed. Incrementing failure count.`);
            await ApiKeyManager.handleKeyFailure(currentKey.id);
        }
    }
  });
}
