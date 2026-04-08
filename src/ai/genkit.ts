import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';

// Initialize Genkit with Google GenAI Plugin (2026 Migration)
// Configuration is inherited from the Vertex AI Project Environment.
// Note: No hardcoded API keys are used as per production hardening.
export const ai = genkit({
  plugins: [
    googleAI() // Replaces deprecated vertexAI plugin
  ]
});

// Configure for gemini-2.5-flash for character-perfect news summarisation
export const model = 'googleai/gemini-2.5-flash';
