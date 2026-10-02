const fs = require('fs');
let c = fs.readFileSync('index.js', 'utf8');
const replacement = `const { setGlobalOptions } = require("firebase-functions/v2");
setGlobalOptions({ region: "europe-west4" });\n\nconst { onRequest`;
c = c.replace('const { onRequest', replacement);
fs.writeFileSync('index.js', c, 'utf8');
console.log('Region updated.');
