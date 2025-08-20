import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';
import { ApiKeyManager } from '@/services/ApiKeyManager';

/**
 * Defines the AI instance for the entire application.
 * It's configured with the googleAI plugin and uses a dynamic API key provider.
 * This provider fetches a key from the ApiKeyManager on-demand for each request,
 * enabling key rotation and resilient error handling.
 */
export const ai = genkit({
  plugins: [
    googleAI({
      // Provide the API key dynamically using a function.
      // This function will be called by Genkit internally for each operation.
      apiKey: async () => {
        const apiKeyRecord = await ApiKeyManager.getApiKey();
        if (!apiKeyRecord) {
            // Log the error but don't throw here, as Genkit's retry logic might handle it.
            // If all keys fail, Genkit will eventually throw its own error.
            console.error('No active Gemini API keys available.');
            return ''; // Return empty string to let Genkit's own error handling proceed.
        }
        return apiKeyRecord.key;
      },
      // Override the default retry logic to use our custom key rotation.
      // We only want to retry on UNAVAILABLE (e.g. rate limit, server error), not on INVALID_ARGUMENT (e.g. bad prompt).
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

// DEPRECATED: This function is no longer needed with the new dynamic API key provider.
// Keeping it here but commented out to show the change in approach.
/*
export async function configureAi() {
  // This logic is now handled directly inside the genkit() initialization.
}
*/
