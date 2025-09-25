
'use server';
/**
 * @fileoverview This file initializes the Genkit AI instance with the necessary plugins and configurations.
 */
import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';

// Initialize a default AI instance.
// The API key will be overridden in each specific flow that uses it.
export const ai = genkit({
  plugins: [googleAI()],
  enableTracing: false,
});
