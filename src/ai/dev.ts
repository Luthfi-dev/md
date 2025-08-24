
'use server';
/**
 * @fileOverview Development-only entry point for Genkit.
 * This file is used to register all flows with the Genkit development tools.
 * It ensures that all defined flows are discoverable by the system.
 */
import { config } from 'dotenv';
import { configureGenkit } from 'genkit';
config();

// Import all flow definition files here to register them with Genkit.
// This single import is responsible for making all flows in genkit.ts available.
import '@/ai/genkit';
