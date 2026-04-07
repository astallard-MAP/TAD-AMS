const { onRequest } = require("firebase-functions/v2/https");
const { onSchedule } = require("firebase-functions/v2/scheduler");
const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const admin = require("firebase-admin");
const nodemailer = require("nodemailer");
const Parser = require("rss-parser");
const { genkit } = require("genkit");
const { vertexAI, gemini25Flash } = require("@genkit-ai/vertexai");
const { defineSecret } = require("firebase-functions/params");
const { google } = require("googleapis");

// Initialize Firebase Admin
admin.initializeApp();
const db = admin.firestore();

// Initialize Genkit (2026 v2.x Standard compatible with CommonJS)
const ai = genkit({
  plugins: [vertexAI({ location: 'us-central1' })]
});

// Define Secrets
const SMTP_PASS = defineSecret("SMTP_PASS");
const ADMIN_UID = defineSecret("ADMIN_UID");
const GEMINI_API_KEY = defineSecret("GEMINI_API_KEY");

const GBP_CLIENT_ID = defineSecret("GBP_CLIENT_ID");
const GBP_CLIENT_SECRET = defineSecret("GBP_CLIENT_SECRET");
const GBP_REFRESH_TOKEN = defineSecret("GBP_REFRESH_TOKEN");
const GBP_LOCATION_ID = defineSecret("GBP_LOCATION_ID");

const parser = new Parser({
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  }
});

function getTransporter() {
  return nodemailer.createTransport({
    host: "smtp.office365.com",
    port: 587,
    secure: false,
    auth: {
      user: "Andy@Cash4Houses.co.uk",
      pass: SMTP_PASS.value(),
    },
    tls: {
      ciphers: "SSLv3",
      rejectUnauthorized: false
    },
  });
}

exports.processLead = onDocumentCreated({ 
  document: "leads/{leadId}", 
  secrets: ["SMTP_PASS", "ADMIN_UID"] 
}, async (event) => {
    const data = event.data.data();
    if (!data) return;
    
    const transporter = getTransporter();

    const customerMailOptions = {
      from: '"Andy the Property Buyer" <Andy@Cash4Houses.co.uk>',
      to: data.email,
      subject: "I'm looking into your property inquiry - Andy",
      html: `<p>Hello ${data.firstName}, I've received your details for ${data.address}...</p>`,
    };

    const adminMailOptions = {
      from: '"Cash4Houses Portal" <Andy@Cash4Houses.co.uk>',
      to: ["Andy@Cash4Houses.co.uk"],
      subject: `🚨 NEW LEAD: ${data.firstName} - ${data.address}`,
      html: `<p>New property lead received for ${data.address}.</p>`,
    };

    try {
      await Promise.all([
        transporter.sendMail(customerMailOptions),
        transporter.sendMail(adminMailOptions),
        db.collection("communicationLogs").add({
          leadId: event.params.leadId,
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
          type: "Lead Confirmation",
          recipients: [data.email, "Andy@Cash4Houses.co.uk"],
          summary: `Initial enquiry processed for ${data.address}`
        })
      ]);
    } catch (error) {
      console.error("FAILED to send emails:", error);
    }
});

const RSS_FEEDS = [
  "https://www.ons.gov.uk/economy/inflationandpriceindices/rss",
  "https://www.ons.gov.uk/economy/economicoutputandproductivity/output/rss",
  "https://www.bankofengland.co.uk/rss/news",
  "https://www.thegazette.co.uk/all-notices/notice.rss?categorycode=G205000002",
  "https://thenegotiator.co.uk/feed/",
  "https://www.estateagenttoday.co.uk/rss",
  "https://propertyindustryeye.com/feed/",
  "https://www.zoopla.co.uk/discover/property-news/rss/",
  "https://www.rightmove.co.uk/news/feed/",
  "https://www.standard.co.uk/homesandproperty/rss",
  "https://www.essexlive.news/news/?service=rss",
  "https://www.echo-news.co.uk/news/rss/"
];

const NEGATIVE_KEYWORDS = [
  "Repossession", "Negative Equity", "Arrears", "Base Rate Increase", "Price Reduction", 
  "Insolvency", "Bankruptcy", "Crisis", "Unemployment", "Inflation"
];

async function updateMarketNews() {
  let allItems = [];
  for (const url of RSS_FEEDS) {
    try {
      const feed = await parser.parseURL(url);
      feed.items.forEach(item => {
        allItems.push({
          title: item.title,
          snippet: item.contentSnippet || item.content || "",
          link: item.link,
          pubDate: item.pubDate,
          source: feed.title
        });
      });
    } catch (err) { console.error(`Error parsing ${url}:`, err); }
  }

  const filtered = allItems.filter(item => {
    const text = (item.title + " " + item.snippet).toLowerCase();
    return NEGATIVE_KEYWORDS.some(k => text.includes(k.toLowerCase()));
  }).slice(0, 20);

  if (filtered.length === 0) return "No distressed triggers found in today's news.";

  const prompt = `Review these UK property news items and produce a daily amalgamated news story overview titled "What's Driving Todays Property Market". Data: ${JSON.stringify(filtered)}`;

  const { text } = await ai.generate({
    model: gemini25Flash,
    prompt: prompt
  });

  const archiveRef = db.collection("marketUpdatesArchive").doc();
  const updatePayload = {
    content: text,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    sources: [...new Set(filtered.map(f => f.source))]
  };

  await Promise.all([
    db.collection("marketUpdates").doc("latest").set(updatePayload),
    archiveRef.set(updatePayload)
  ]);

  return text;
}

exports.scheduledMarketUpdate = onSchedule({
  schedule: "0 8 * * *",
  timeZone: "Europe/London",
  memory: "512MiB",
  secrets: ["GBP_CLIENT_ID", "GBP_CLIENT_SECRET", "GBP_REFRESH_TOKEN", "GBP_LOCATION_ID", "GEMINI_API_KEY"]
}, async (event) => {
  await updateMarketNews();
});

exports.manualMarketUpdate = onRequest({
  cors: true,
  memory: "512MiB",
  timeoutSeconds: 300,
  secrets: ["GBP_CLIENT_ID", "GBP_CLIENT_SECRET", "GBP_REFRESH_TOKEN", "GBP_LOCATION_ID", "GEMINI_API_KEY"]
}, async (req, res) => {
  try {
    const result = await updateMarketNews();
    res.status(200).send(result);
  } catch (err) {
    console.error("Manual News Update Failed:", err);
    res.status(500).send(err.message);
  }
});
