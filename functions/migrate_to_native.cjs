const fs = require('fs');
let content = fs.readFileSync('index.js', 'utf8');

// Replace genkit imports
content = content.replace('const { genkit } = require("genkit");\nconst { googleGenAI } = require("@genkit-ai/google-genai");', 'const { GoogleGenAI } = require("@google/genai");');

// Remove genkit initialization
content = content.replace(/const ai = genkit\(\{\s*plugins: \[googleGenAI\(\{ location: 'europe-west4' \}\)\]\s*\}\);/, '');

// Add getAIClient singleton
const singleton = `let _aiClient = null;
function getAIClient() {
    if (!_aiClient) {
        // Native SDK relying on ADC (IAM role aiplatform.user granted by Lead Architect)
        _aiClient = new GoogleGenAI({ vertexai: { project: "c4h-wesbite", location: 'europe-west4' } });
    }
    return _aiClient;
}`;

content = content.replace('// Secrets', singleton + '\n\n// Secrets');

// Refactor text generation WITH system instruction
content = content.replace(/await ai\.generate\(\{\s*model:\s*(['"`].*?['"`]),\s*prompt:\s*(.*?),\s*system:\s*(.*?)\s*\}\)/g, 
  "await (getAIClient()).models.generateContent({ model: $1, contents: $2, config: { systemInstruction: $3 } })");

// Refactor text generation WITHOUT system instruction
content = content.replace(/await ai\.generate\(\{\s*model:\s*(['"`]gemini-2\.5-pro['"`]),\s*prompt:\s*(.*?)\s*\}\)/g, 
  "await (getAIClient()).models.generateContent({ model: $1, contents: $2 })");

// Refactor image generation
content = content.replace(/await ai\.generate\(\{\s*model:\s*(['"`]gemini-3\.1-flash-image['"`]),\s*prompt:\s*(.*?)\s*\}\)/g, 
  "await (getAIClient()).models.generateImages({ model: $1, prompt: $2, config: { numberOfImages: 1 } })");

// Refactor extraction payload. The genkit currently uses `result.media[0].url`
// The Native SDK generateImages returns `result.generatedImages[0].image.imageUri || data:image/png...`
const newImageParse = 'const mediaData = result.generatedImages[0].image.imageUri || `data:image/png;base64,${result.generatedImages[0].image.imageBytes}`;';
content = content.replace(/const mediaData = result\.media\[0\]\.url;/g, newImageParse);
content = content.replace(/let imageUrl = mediaData;/g, 'let imageUrl = mediaData;');

fs.writeFileSync('index.js', content);
console.log('Fixed syntax per Native SDK');
