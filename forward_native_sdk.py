import re

file_path = r"c:\Antigravity Project\C4H Website\TAD-AMS\functions\index.js"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# Replace genkit init block
genkit_init = r"""const \{ genkit \} = require\("genkit"\);
const \{ googleGenAI \} = require\("@genkit-ai/google-genai"\);

// Initialize Genkit \(Social Media Agent & News Suite\)
const ai = genkit\(\{
    plugins: \[googleGenAI\(\{ project: process\.env\.GCLOUD_PROJECT \|\| "c4h-wesbite", location: 'europe-west4' \}\)\] 
\}\);"""

getAIClient_block = """const { GoogleGenAI } = require("@google/genai");

let _aiClient = null;
function getAIClient() {
    if (!_aiClient) {
        // Native SDK using ADC via aiplatform.user IAM role
        _aiClient = new GoogleGenAI({ vertexAI: { project: "c4h-wesbite", location: 'europe-west4' } });
    }
    return _aiClient;
}"""

content = re.sub(genkit_init, getAIClient_block, content)


# 1. Revert calls with system instructions
def replace_gen_sys(match):
    prefix = match.group(1)
    prompt = match.group(2)
    sys = match.group(3)
    return f"{prefix}await (getAIClient()).models.generateContent({{ model: 'gemini-2.5-pro', contents: {prompt}, config: {{ systemInstruction: {sys} }} }});"

content = re.sub(
    r"(.*?=\s*)await ai\.generate\(\{\s*model:\s*'gemini-2\.5-pro',\s*prompt:\s*(.*?),\s*system:\s*(.*?)\s*\}\);",
    replace_gen_sys,
    content
)

# 2. Revert calls without system instructions
def replace_gen_norm(match):
    prefix = match.group(1)
    prompt = match.group(2)
    return f"{prefix}await (getAIClient()).models.generateContent({{ model: 'gemini-2.5-pro', contents: {prompt} }});"

content = re.sub(
    r"(.*?=\s*)await ai\.generate\(\{\s*model:\s*'gemini-2\.5-pro',\s*prompt:\s*(.*?)\s*\}\);",
    replace_gen_norm,
    content
)

# 3. Image Generation Replacement
content = re.sub(
    r"const result = await ai\.generate\(\{ model: 'gemini-2\.5-pro', prompt: (.*?) \}\);",
    r"const result = await (getAIClient()).models.generateImages({ model: 'gemini-3.1-flash-image', prompt: \1, config: { numberOfImages: 1 } });",
    content
)

# 4. Image Extraction Replacement
content = re.sub(
    r"const mediaData = result\.media\[0\]\.url;",
    r"const mediaData = result.generatedImages[0].image.imageUri || `data:image/png;base64,${result.generatedImages[0].image.imageBytes}`;",
    content
)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)
print("Forward applied to functions/index.js")
