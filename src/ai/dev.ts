
import { config } from 'dotenv';
import { configureGenkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';
import { ApiKeyManager } from '@/services/ApiKeyManager';
config();

const FALLBACK_KEY = 'NO_VALID_KEY_CONFIGURED';

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


// Ensure you have a default key in your .env for local development without a DB
// This is a fallback if the DB connection fails or has no keys.
if (!process.env.GEMINI_API_KEY) {
  console.warn(
    'GEMINI_API_KEY environment variable not set. Genkit dev may not function.'
  );
}

// Import all flow definition files here to register them with Genkit
import '@/services/ApiKeyManager.ts';
import '@/ai/flows/file-converter.ts';
import '@/ai/flows/chat.ts';
import '@/ai/flows/article-flows.ts';
