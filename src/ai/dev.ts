import { config } from 'dotenv';
import { configureGenkit } from 'genkit';
config();

// Import all flow definition files here to register them with Genkit
import '@/services/ApiKeyManager.ts';
// This file contains all the ai.defineFlow(...) calls
import '@/ai/genkit.ts'; 
import '@/ai/flows/file-converter.ts';
// This file is now empty but we keep the import to avoid breaking changes if it's used elsewhere.
// In a future cleanup, this could be removed if no other flows are defined there.
import '@/ai/flows/article-flows.ts';
