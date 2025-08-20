
import { config } from 'dotenv';
import { configureGenkit } from 'genkit';
config();

// Import all flow definition files here to register them with Genkit
import '@/services/ApiKeyManager.ts';
import '@/ai/flows/file-converter.ts';
import '@/ai/genkit.ts'; // This registers the chatFlow
import '@/ai/flows/article-flows.ts';
