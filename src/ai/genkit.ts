
'use server';

import { genkit, configureGenkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';
import { ApiKeyManager } from '@/services/ApiKeyManager';

const FALLBACK_KEY = 'NO_VALID_KEY_CONFIGURED';

/**
 * Defines the initial AI instance for the entire application, without a pre-configured API key.
 * The API key will be configured dynamically at runtime.
 */
export const ai = genkit({
  plugins: [googleAI()],
  // Define a custom error handler for when a request fails.
  errorHandler: async (err) => {
      const currentKey = await ApiKeyManager.getApiKey(true); // Get the key that was just used (peek)
      if (currentKey && currentKey.id > 0) { // Only handle failures for DB keys
          console.warn(`API key ${currentKey.id} failed. Incrementing failure count.`);
          await ApiKeyManager.handleKeyFailure(currentKey.id);
      }
  },
  model: 'googleai/gemini-1.5-flash-latest',
});

/**
 * Asynchronously configures the global Genkit instance with a valid, rotated API key.
 * This function MUST be called before running any flow that requires the AI model.
 */
export async function configureAi() {
  const apiKeyRecord = await ApiKeyManager.getApiKey();
  
  if (apiKeyRecord.key === FALLBACK_KEY) {
    console.error('CRITICAL: No valid API key available for Genkit operation.');
    throw new Error('Layanan AI tidak terkonfigurasi. Silakan hubungi administrator.');
  }

  // This reconfigures the global genkit instance with the provided API key.
  configureGenkit({
    plugins: [
      googleAI({
        apiKey: apiKeyRecord.key,
        // Override the default retry logic to allow our custom key rotation to handle it.
        retry: {
           shouldRetry: (err) => {
              const errorMessage = (err as any)?.cause?.message || '';
              // Only retry on rate limit errors or server errors.
              return errorMessage.includes('RESOURCE_EXHAUSTED') || errorMessage.includes('UNAVAILABLE');
           },
           maxAttempts: 1, // We let our ApiKeyManager handle retries with different keys.
        }
      }),
    ],
  });
}
