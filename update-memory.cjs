const fs = require('fs');
const path = require('path');
const dir = path.join(__dirname, 'functions', 'slim');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.js'));
files.forEach(f => {
    const filePath = path.join(dir, f);
    let content = fs.readFileSync(filePath, 'utf8');
    content = content.replace(/memory:\s*"(?:256|512)MiB"/g, 'memory: "2GiB", timeoutSeconds: 300');
    fs.writeFileSync(filePath, content);
    console.log(`Updated ${f}`);
});
