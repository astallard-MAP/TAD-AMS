const { onRequest } = require("firebase-functions/v2/https");
const { onSchedule } = require("firebase-functions/v2/scheduler");
const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const admin = require("firebase-admin");
const nodemailer = require("nodemailer");
const Parser = require("rss-parser");
const { genkit } = require("genkit");
const { googleAI } = require("@genkit-ai/googleai");
const { defineSecret } = require("firebase-functions/params");

// Initialize Firebase Admin
admin.initializeApp();
const db = admin.firestore();

// Initialize Genkit (Social Media Agent & News Suite)
const ai = genkit({
  plugins: [googleAI()] 
});

// Secrets
const SMTP_PASS = defineSecret("SMTP_PASS");
const GBP_LOCATION_ID = defineSecret("GBP_LOCATION_ID");

const parser = new Parser({
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
  }
});

// --- SOCIAL MEDIA AGENT LOGIC ---
const ESSEX_TOWNS = [
  "Southend-on-Sea", "Thorpe Bay", "Shoeburyness", "Westcliff", "Rayleigh", 
  "Eastwood", "Rochford", "Benfleet", "Canvey Island", "Wickford", 
  "Basildon", "Stanford Le Hope", "Prittlewell", "Leigh-on-Sea"
];

const VALUE_PROP = `
- We buy any house in any condition for a fast, certain cash exit.
- We pay all legal fees.
- Guaranteed offer within 48 working hours (Mon-Fri, 9am-5pm).
- Completion in as little as 7 days.
- Strictly no pressure and no obligation to proceed.
- Website: https://cash4houses.co.uk
`;

async function generateSocialPost(timeOfDay) {
  const town = ESSEX_TOWNS[Math.floor(Math.random() * ESSEX_TOWNS.length)];
  
  const prompt = `
    Generate a high-quality social media post for 'Cash 4 Houses'.
    Target Town: ${town} (South East Essex).
    Time of Day: ${timeOfDay}.
    Tone: Clear, empathetic, professional yet local.
    
    Requirements:
    1. Mention ${town} or a local landmark.
    2. Include the Core Value Props: ${VALUE_PROP}
    3. Mandatory: Include the link https://cash4houses.co.uk.
    4. Caveat the 48-hour offer: (Mon-Fri, 9am-5pm).
    5. Provide 3-5 hashtags (e.g., #FastHouseSale #${town.replace(/\s/g, '')}).
    6. Provide a detailed image generation prompt for 'Nano Banana 2' model. 
       Themes: Keys for cash, contract signing, or 'SOLD' sign in a typical ${town} residential setting.
  `;

  const { text } = await ai.generate({
    model: 'googleai/gemini-2.5-flash',
    prompt: prompt
  });

  // Log to Social Archive
  const postRef = db.collection("socialPosts").doc();
  await postRef.set({
    content: text,
    scheduledTime: timeOfDay,
    town: town,
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
    published: false
  });

  return text;
}

// Scheduled Triggers (2x Daily, 6hr Gap)
exports.socialMorningPost = onSchedule({
  schedule: "0 9 * * *",
  timeZone: "Europe/London",
  secrets: ["GBP_LOCATION_ID"]
}, async (event) => {
  await generateSocialPost("Morning");
});

exports.socialAfternoonPost = onSchedule({
  schedule: "0 15 * * *",
  timeZone: "Europe/London",
  secrets: ["GBP_LOCATION_ID"]
}, async (event) => {
  await generateSocialPost("Afternoon");
});

// --- MARKET NEWS SUITE ---
const RSS_FEEDS = [
  "https://www.ons.gov.uk/economy/inflationandpriceindices/bulletins/consumerpriceinflation/rss",
  "https://www.ons.gov.uk/economy/grossdomesticproductgdp/rss",
  "https://www.bankofengland.co.uk/rss/news",
  "https://thenegotiator.co.uk/feed/",
  "https://www.estateagenttoday.co.uk/rss",
  "https://www.zoopla.co.uk/discover/property-news/rss/",
  "https://www.rightmove.co.uk/news/feed/",
  "https://www.standard.co.uk/homesandproperty/rss"
];

const NEGATIVE_KEYWORDS = ["Repossession", "Negative Equity", "Arrears", "Insolvency", "Bankruptcy"];

async function updateMarketNews() {
  let allItems = [];
  for (const url of RSS_FEEDS) {
    try {
      const feed = await parser.parseURL(url);
      feed.items.forEach(item => {
        allItems.push({ title: item.title, snippet: item.contentSnippet || "", link: item.link, source: feed.title });
      });
    } catch (err) { console.warn(`RSS Fail: ${url}`); }
  }

  const filtered = allItems.filter(item => {
    const text = (item.title + " " + item.snippet).toLowerCase();
    return NEGATIVE_KEYWORDS.some(k => text.includes(k.toLowerCase()));
  }).slice(0, 15);

  if (filtered.length === 0) return { success: false, error: "News sources unavailable" };

  const prompt = `Review these UK property news items and produce a daily amalgamated news story overview titled "What's Driving Todays Property Market". Specifically discuss the implications for South East Essex (Southend, Basildon, Rayleigh, Leigh-on-Sea). Data: ${JSON.stringify(filtered)}`;

  const { text } = await ai.generate({ model: 'googleai/gemini-2.5-flash', prompt: prompt });

  const payload = { content: text, updatedAt: admin.firestore.FieldValue.serverTimestamp(), sources: [...new Set(filtered.map(f => f.source))] };
  await db.collection("marketUpdates").doc("latest").set(payload);
  await db.collection("marketUpdatesArchive").add(payload);
  return { success: true, content: text };
}

exports.manualMarketUpdate = onRequest({ cors: true, memory: "512MiB", timeoutSeconds: 300 }, async (req, res) => {
  try {
    const result = await updateMarketNews();
    if (!result.success) return res.status(503).json(result);
    res.status(200).send(result.content);
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// --- LEAD PROCESSING ---
function getTransporter() {
  return nodemailer.createTransport({
    host: "smtp.office365.com", port: 587, secure: false,
    auth: { user: "Andy@Cash4Houses.co.uk", pass: SMTP_PASS.value() },
    tls: { ciphers: "SSLv3", rejectUnauthorized: false },
  });
}

exports.processLead = onDocumentCreated({ document: "leads/{leadId}", secrets: ["SMTP_PASS"] }, async (event) => {
    const data = event.data.data();
    if (!data) return;
    const transporter = getTransporter();
    try {
      await Promise.all([
        transporter.sendMail({ from: '"Andy" <Andy@Cash4Houses.co.uk>', to: data.email, subject: "Inquiry Confirmation", html: `<p>Hello ${data.firstName}, looking into ${data.address}...</p>` }),
        db.collection("communicationLogs").add({ leadId: event.params.leadId, timestamp: admin.firestore.FieldValue.serverTimestamp(), type: "Enquiry", summary: `Processed for ${data.address}` })
      ]);
    } catch (error) { console.error(error); }
});

exports.manualSocialGenerate = onRequest({ cors: true, memory: "512MiB" }, async (req, res) => {
  try {
    const text = await generateSocialPost("Manual/Immediate");
    res.status(200).send(text);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

exports.testEmailConnection = onRequest({ cors: true, secrets: ["SMTP_PASS"] }, async (req, res) => {
  const transporter = getTransporter();
  try {
    // 1. Verify Handshake
    await transporter.verify();
    
    // 2. Send Diagnostic Email
    await transporter.sendMail({
      from: '"System Diagnostic" <Andy@Cash4Houses.co.uk>',
      to: "Andy@Cash4Houses.co.uk",
      subject: "Office 365 Configuration: SUCCESS",
      html: `<p>Diagnostic check complete at ${new Date().toISOString()}. The portal is communicating effectively with the SMTP server.</p>`
    });

    res.status(200).json({ success: true, message: "Handshake verified. Test email dispatched." });
  } catch (err) {
    console.error("Diagnostic Failure:", err);
    res.status(500).json({ 
      success: false, 
      error: err.code || "UNKNOWN",
      message: err.message 
    });
  }
});
