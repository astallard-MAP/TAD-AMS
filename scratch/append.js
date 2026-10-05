const fs = require('fs');

const data = `
// --- SLIM FLEET MODULES ---
const slimMkt = require('./slim/slimMkt');
exports.slimMktAgent = slimMkt.slimMktAgent;
exports.manualSlimMkt = slimMkt.manualSlimMkt;
`;

fs.appendFileSync('functions/index.js', data);
console.log('Appended successfully');
