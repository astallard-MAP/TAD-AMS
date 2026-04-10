const { google } = require("googleapis");
console.log("Keys on google object:");
console.log(Object.keys(google).filter(k => k.startsWith('mybusiness')).join(', '));
