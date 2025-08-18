import { config } from 'dotenv';
config();

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
