const fs = require('fs');
const path = require('path');

const slimDir = path.join(__dirname, '../functions/slim');
const files = fs.readdirSync(slimDir).filter(f => f.endsWith('.js'));

files.forEach(f => {
    const fullPath = path.join(slimDir, f);
    let content = fs.readFileSync(fullPath, 'utf8');
    if (content.includes("require('./hiveClient')")) {
        content = content.replace(/require\('\.\/hiveClient'\)/g, "require('../hive/hiveClient')");
        fs.writeFileSync(fullPath, content);
        console.log('Fixed', f);
    }
});
