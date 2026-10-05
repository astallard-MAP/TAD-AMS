const fs = require('fs');

const data = `
const slimFunnel = require('./slim/slimFunnel');
exports.slimFunnelAgent = slimFunnel.slimFunnelAgent;

const slimLocal = require('./slim/slimLocal');
exports.slimLocalAgent = slimLocal.slimLocalAgent;

const slimOrch = require('./slim/slimOrch');
exports.slimOrchAgent = slimOrch.slimOrchAgent;
`;

fs.appendFileSync('functions/index.js', data);
console.log('Appended successfully');
