const fs = require('fs');
let c = fs.readFileSync('index.js', 'utf8');
c = c.replace(/secrets:\s*\["AZURE_TENANT_ID",\s*"AZURE_CLIENT_ID",\s*"AZURE_CLIENT_SECRET"\]/g, 'secrets: [GMAIL_APP_PASSWORD]');
fs.writeFileSync('index.js', c, 'utf8');
console.log('Secrets updated.');
