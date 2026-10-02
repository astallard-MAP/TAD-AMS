const fs = require('fs');
let c = fs.readFileSync('index.js', 'utf8');
if (c.includes('\u0000')) {
  c = fs.readFileSync('index.js', 'utf16le');
}
const regex = /exports\.testEmailConnection = onRequest\(\{\s*cors: true,\s*secrets: \["AZURE_TENANT_ID", "AZURE_CLIENT_ID", "AZURE_CLIENT_SECRET"\]\s*\}, async \(req, res\) => \{[\s\S]*?\}\);/;
const replacement = `exports.testEmailConnection = onRequest({ 
  cors: true, 
  secrets: ["GMAIL_APP_PASSWORD"] 
}, async (req, res) => {
  try {
    await dispatchEmail({
      to: "astallard65@gmail.com",
      subject: "Nodemailer Configuration: SMTP SUCCESS",
      body: \`<p>Diagnostic check complete at \${new Date().toISOString()}. Gmail SMTP link active.</p>\`
    });
    res.status(200).json({ success: true, message: "Nodemailer Transport verified. Test email dispatched." });
  } catch (err) { 
    console.error("Test Email Error:", err);
    res.status(200).json({ success: false, error: err.code || "AUTH_FAIL", message: err.message }); 
  }
});`;

c = c.replace(regex, replacement);
fs.writeFileSync('index.js', c, 'utf8');
console.log('done');
