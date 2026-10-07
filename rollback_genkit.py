import re

file_path = r"c:\Antigravity Project\C4H Website\TAD-AMS\functions\index.js"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# Replace getAIClient block
getAIClient_block = r"""let _aiClient = null;
function getAIClient\(\) \{
    if \(!_aiClient\) \{
        // Native SDK relying on ADC \(IAM role aiplatform\.user granted by Lead Architect\)
        _aiClient = new GoogleGenAI\(\{ vertexAI: \{ project: "c4h-wesbite", location: 'europe-west4' \} \}\);
    \}
    return _aiClient;
\}"""

genkit_init = """const { genkit } = require("genkit");
const { googleGenAI } = require("@genkit-ai/google-genai");

// Initialize Genkit (Social Media Agent & News Suite)
const ai = genkit({
    plugins: [googleGenAI({ project: process.env.GCLOUD_PROJECT || "c4h-wesbite", location: 'europe-west4' })] 
});"""

content = re.sub(getAIClient_block, genkit_init, content)

# Replace the import
content = content.replace('const { GoogleGenAI } = require("@google/genai");\n', '')

# Revert standard generateContent calls (with systemInstruction)
# e.g., const { text } = await (getAIClient()).models.generateContent({ model: 'gemini-2.5-pro', contents: `History: ${JSON.stringify(history)}\nUser: ${message}`, config: { systemInstruction: systemPrompt } });
# -> const { text } = await ai.generate({ model: 'gemini-2.5-pro', prompt: `History: ${JSON.stringify(history)}\nUser: ${message}`, system: systemPrompt });
def replace_gen_sys(match):
    prefix = match.group(1)
    prompt = match.group(2)
    sys = match.group(3)
    return f"{prefix}await ai.generate({{ model: 'gemini-2.5-pro', prompt: {prompt}, system: {sys} }});"

content = re.sub(
    r"(.*?=\s*)await\s*\(getAIClient\(\)\)\.models\.generateContent\(\{\s*model:\s*'gemini-2\.5-pro',\s*contents:\s*(.*?),\s*config:\s*\{\s*systemInstruction:\s*(.*?)\s*\}\s*\}\);",
    replace_gen_sys,
    content
)

# Revert standard generateContent calls (without systemInstruction)
def replace_gen_norm(match):
    prefix = match.group(1)
    prompt = match.group(2)
    return f"{prefix}await ai.generate({{ model: 'gemini-2.5-pro', prompt: {prompt} }});"

content = re.sub(
    r"(.*?=\s*)await\s*\(getAIClient\(\)\)\.models\.generateContent\(\{\s*model:\s*'gemini-2\.5-pro',\s*contents:\s*(.*?)\s*\}\);",
    replace_gen_norm,
    content
)

# Revert image generation
# const result = await (getAIClient()).models.generateImages({ model: 'gemini-3.1-flash-image', prompt: prompt, config: { numberOfImages: 1 } });
# const mediaData = result.generatedImages[0].image.imageUri || `data:image/png;base64,${result.generatedImages[0].image.imageBytes}`;
# -> const result = await ai.generate({ model: 'gemini-2.5-pro', prompt: prompt });
# -> const mediaData = result.media[0].url;

content = re.sub(
    r"const result = await \(getAIClient\(\)\)\.models\.generateImages\(\{\s*model:\s*'gemini-3\.1-flash-image',\s*prompt:\s*(.*?),\s*config:\s*\{\s*numberOfImages:\s*1\s*\}\s*\}\);",
    r"const result = await ai.generate({ model: 'gemini-2.5-pro', prompt: \1 });",
    content
)

content = re.sub(
    r"const mediaData = result\.generatedImages\[0\]\.image\.imageUri \|\| `data:image/png;base64,\$\{result\.generatedImages\[0\]\.image\.imageBytes\}`;",
    r"const mediaData = result.media[0].url;",
    content
)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)
print("Rollback applied to functions/index.js")
