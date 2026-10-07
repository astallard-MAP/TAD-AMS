const fs = require('fs');
let content = fs.readFileSync('functions/index.js', 'utf8');

// The regex correctly targets: await (getAIClient()).models.generateContent({ ... })
content = content.replace(/await\s*\(\s*getAIClient\(\)\s*\)\.models\.generateContent\(\s*\{\s*model:\s*(['"`].*?['"`]),\s*contents:\s*(.*?),\s*config:\s*\{\s*systemInstruction:\s*(.*?)\s*\}\s*\}\s*\)/g, 
  "await ai.generate({ model: $1, prompt: $2, system: $3 })");
content = content.replace(/await\s*\(\s*getAIClient\(\)\s*\)\.models\.generateContent\(\s*\{\s*model:\s*(['"`].*?['"`]),\s*contents:\s*(.*?)\s*\}\s*\)/g, 
  "await ai.generate({ model: $1, prompt: $2 })");
content = content.replace(/await\s*\(\s*getAIClient\(\)\s*\)\.models\.generateImages\(\s*\{\s*model:\s*(['"`].*?['"`]),\s*prompt:\s*(.*?),\s*config:.*?\s*\}\s*\)/g, 
  "await ai.generate({ model: $1, prompt: $2 })");

fs.writeFileSync('functions/index.js', content);
console.log('Fixed generation calls');
