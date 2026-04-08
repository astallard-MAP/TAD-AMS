const { onRequest } = require("firebase-functions/v2/https");
const { onSchedule } = require("firebase-functions/v2/scheduler");
const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const admin = require("firebase-admin");
const nodemailer = require("nodemailer");
const Parser = require("rss-parser");
const { genkit } = require("genkit");
const { googleAI } = require("@genkit-ai/googleai");
const { defineSecret } = require("firebase-functions/params");
const { google } = require("googleapis");

// Initialize Firebase Admin
admin.initializeApp();
const db = admin.firestore();

// Initialize Genkit (2026 Google GenAI Migration)
const ai = genkit({
  plugins: [googleAI()] // No hardcoded API keys; relies on Vertex project auth
});

// Define Secrets
const SMTP_PASS = defineSecret("SMTP_PASS");
const ADMIN_UID = defineSecret("ADMIN_UID");

const parser = new Parser({
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
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
  secrets: ["SMTP_PASS"] 
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
  "https://www.ons.gov.uk/economy/inflationandpriceindices/bulletins/consumerpriceinflation/rss",
  "https://www.ons.gov.uk/economy/grossdomesticproductgdp/rss",
  "https://www.bankofengland.co.uk/rss/news",
  "https://thenegotiator.co.uk/feed/",
  "https://www.estateagenttoday.co.uk/rss",
  "https://www.zoopla.co.uk/discover/property-news/rss/",
  "https://www.rightmove.co.uk/news/feed/",
  "https://www.standard.co.uk/homesandproperty/rss"
];

const NEGATIVE_KEYWORDS = [
  "Repossession", "Negative Equity", "Arrears", "Base Rate Increase", "Price Reduction", 
  "Insolvency", "Bankruptcy", "Crisis", "Unemployment", "Inflation"
];

async function updateMarketNews() {
  let allItems = [];
  
  // 1. RSS Parallel Fetching
  for (const url of RSS_FEEDS) {
    try {
      const feed = await parser.parseURL(url);
      feed.items.forEach(item => {
        allItems.push({
          title: item.title,
          snippet: item.contentSnippet || item.content || "",
          link: item.link,
          source: feed.title
        });
      });
    } catch (err) { console.warn(`RSS Fail: ${url}`); }
  }

  // 2. Resilient JSON Fetch (ONS Fallback)
  if (allItems.length < 5) {
      try {
          const response = await fetch("https://api.ons.gov.uk/timeseries/CHAW/dataset/MM23/data", {
              headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
          });
          const data = await response.json();
          allItems.push({
              title: `ONS Market Indicator: ${data.description.title}`,
              snippet: `Latest data: ${data.description.unit} - Value: ${data.years[0]?.value || 'N/A'}`,
              link: "https://www.ons.gov.uk",
              source: "ONS Data API"
          });
      } catch (e) { console.error("ONS JSON Fallback Failed"); }
  }

  const filtered = allItems.filter(item => {
    const text = (item.title + " " + item.snippet).toLowerCase();
    return NEGATIVE_KEYWORDS.some(k => text.includes(k.toLowerCase()));
  }).slice(0, 15);

  if (filtered.length === 0) {
      return { success: false, error: "News sources unavailable" };
  }

  const prompt = `Review these UK property news items and produce a daily amalgamated news story overview titled "What's Driving Todays Property Market". Specifically discuss the implications for South East Essex (Southend, Basildon, Rayleigh, Leigh-on-Sea). Data: ${JSON.stringify(filtered)}`;

  const { text } = await ai.generate({
    model: 'googleai/gemini-2.5-flash',
    prompt: prompt
  });

  const updatePayload = {
    content: text,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    sources: [...new Set(filtered.map(f => f.source))]
  };

  await Promise.all([
    db.collection("marketUpdates").doc("latest").set(updatePayload),
    db.collection("marketUpdatesArchive").add(updatePayload)
  ]);

  return { success: true, content: text };
}

exports.manualMarketUpdate = onRequest({
  cors: true,
  memory: "512MiB",
  timeoutSeconds: 300
}, async (req, res) => {
  try {
    const result = await updateMarketNews();
    if (!result.success) {
        return res.status(503).json(result);
    }
    res.status(200).send(result.content);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
