const fs = require('fs');
let c = fs.readFileSync('index.js', 'utf8');

const startIdx = c.indexOf('exports.testEmailConnection = onRequest');
const endIdx = c.indexOf('// --- META GRAPH API (FB & IG) ---');

const replacement = `exports.testEmailConnection = onRequest({ 
  cors: true, 
  secrets: [GMAIL_APP_PASSWORD] 
}, async (req, res) => {
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'astallard65@gmail.com',
        pass: GMAIL_APP_PASSWORD.value()
      }
    });
    
    // Verify the SMTP connection details are correct
    await transporter.verify();
    
    // Dispatch a test email to yourself
    await transporter.sendMail({
      from: '"Andrew Stallard | Cash 4 Houses" <astallard65@gmail.com>',
      to: 'astallard65@gmail.com',
      subject: 'System Diagnostic: SMTP Connection Active',
      text: 'The Nodemailer SMTP integration is working perfectly.'
    });

    res.status(200).send("SUCCESS: SMTP connection verified and test email dispatched!");
  } catch (err) {
    console.error("SMTP Test Failed:", err);
    res.status(500).send("ERROR: SMTP Test Failed - " + err.message);
  }
});

`;

if (startIdx !== -1 && endIdx !== -1) {
  c = c.slice(0, startIdx) + replacement + c.slice(endIdx);
  fs.writeFileSync('index.js', c, 'utf8');
  console.log('Fixed syntax error successfully.');
} else {
  console.log('Could not find start or end index.');
}
