/**
 * @fileoverview This file initializes the Genkit AI instance with the necessary plugins and configurations.
 * It is crucial that this file does NOT contain the 'use server' directive, as it is a configuration module
 * meant to be imported by server-side code, not a server-action file itself.
 */
import {genkit, type Plugin} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

// The user has requested to directly use this API key for stability and debugging.
const hardcodedApiKey = process.env.GEMINI_API_KEY;

const plugins: Plugin<any>[] = [
  googleAI({
    apiKey: hardcodedApiKey,
  }),
];

export const ai = genkit({
  plugins,
  // Firebase-related stores are disabled as the package is removed.
  // flowStateStore: 'firebase', 
  // traceStore: 'firebase',
  // enableTracing: true,
});
