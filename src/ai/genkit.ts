import { vertexAI } from '@genkit-ai/vertexai';
import { genkit } from '@genkit-ai/ai';

// Initialize Genkit with Vertex AI Plugin
// Note: No apiKey field is present, as Vertex AI relies on Google Cloud Authentication.
export const ai = genkit({
  plugins: [
    vertexAI({
      location: 'us-central1' // Production region
    })
  ]
});

// Configure for gemini-2.5-flash as gemini-1.5 is retired
export const model = 'vertexai/gemini-2.5-flash';
