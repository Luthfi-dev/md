
'use server';

import { genkit, configureGenkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';

// Initialize genkit with the Google AI plugin.
// The API key will be configured dynamically at runtime.
export const ai = genkit({
  plugins: [googleAI()],
  // Define a custom error handler for when a request fails.
  errorHandler: async (err) => {
    console.error("Genkit error handler caught:", err);
  },
  model: 'googleai/gemini-1.5-flash-latest',
});
