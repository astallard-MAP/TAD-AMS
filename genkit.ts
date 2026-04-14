import { genkit } from 'genkit';
import { vertexAI } from '@genkit-ai/vertexai';

// Initialize Genkit with Vertex AI Plugin (Production Directive)
// Configuration is inherited from the Vertex AI Project Environment.
// Note: No hardcoded API keys are used as per production hardening.
export const ai = genkit({
  plugins: [
    vertexAI({ location: 'us-central1' })
  ]
});

// Configure for gemini-2.5-flash for character-perfect news summarisation
export const model = 'vertexai/gemini-2.5-flash';
