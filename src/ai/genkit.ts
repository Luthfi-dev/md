
import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';
import { ApiKeyManager } from '@/services/ApiKeyManager';

const FALLBACK_KEY = 'NO_VALID_KEY_CONFIGURED';

/**
 * Defines the AI instance for the entire application.
 * It's configured with the googleAI plugin and uses a dynamic API key provider.
 * This provider fetches a key from the ApiKeyManager on-demand for each request,
 * enabling key rotation and resilient error handling.
 */
export const ai = genkit({
  plugins: [
    googleAI({
      apiKey: async () => {
        const apiKeyRecord = await ApiKeyManager.getApiKey();
        // If the key is the fallback, it means no valid keys are available.
        if (apiKeyRecord.key === FALLBACK_KEY) {
          console.error('CRITICAL: No valid API key available for Genkit operation.');
          // Throwing an error here prevents the API call from even being attempted.
          throw new Error('Layanan AI tidak terkonfigurasi. Silakan hubungi administrator.');
        }
        return apiKeyRecord.key;
      },
      // Override the default retry logic to use our custom key rotation.
      retry: {
         shouldRetry: (err) => {
            const errorMessage = (err as any)?.cause?.message || '';
            // Only retry on rate limit errors (RESOURCE_EXHAUSTED) or server errors (UNAVAILABLE)
            return errorMessage.includes('RESOURCE_EXHAUSTED') || errorMessage.includes('UNAVAILABLE');
         },
         // How many times to retry with a NEW key before giving up.
         maxAttempts: 5, // A reasonable number of retries
         backoff: {
            start: 1000,
            factor: 1.5,
            max: 5000,
         }
      }
    }),
  ],
  // Define a custom error handler for when a request fails.
  // This allows us to mark keys as failed.
  errorHandler: async (err) => {
      const currentKey = await ApiKeyManager.getApiKey(true); // Get the key that was just used (peek)
      if (currentKey) {
          console.warn(`API key ${currentKey.id} failed. Incrementing failure count.`);
          await ApiKeyManager.handleKeyFailure(currentKey.id);
      }
  },
  // Set a default model to be used across the app unless specified otherwise.
  model: 'googleai/gemini-pro',
});
