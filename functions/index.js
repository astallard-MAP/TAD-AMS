const functions = require("firebase-functions");
const admin = require("firebase-admin");
const nodemailer = require("nodemailer");
const Parser = require("rss-parser");
const parser = new Parser();
const { GoogleGenerativeAI } = require("@google/generative-ai");

admin.initializeApp();

// Office 365 SMTP configuration
const transporter = nodemailer.createTransport({
  host: "smtp.office365.com",
  port: 587,
  secure: false, // STARTTLS
  auth: {
    user: "Andy@Cash4Houses.co.uk",
    pass: "FTBss12pq#",
  },
  tls: {
    // Office 365 requires specific TLS settings sometimes
    ciphers: "SSLv3",
    rejectUnauthorized: false
  },
});

/**
 * Triggers when a new lead is added to the 'leads' collection.
 * Sends a confirmation email to the lead and a notification to Andy.
 */
exports.processLead = functions.firestore
  .document("leads/{leadId}")
  .onCreate(async (snap, context) => {
    const data = snap.data();

    // 1. Email to the Customer (The Lead)
    const customerMailOptions = {
      from: '"Andy the Property Buyer" <Andy@Cash4Houses.co.uk>',
      to: data.email,
      subject: "I'm looking into your property inquiry - Andy",
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #333; max-width: 600px; line-height: 1.6;">
          <h2 style="color: #d32f2f;">Hello ${data.firstName},</h2>
          <p>Thanks for getting in touch about your property at <strong>${data.address}</strong>.</p>
          <p>I've just received your details and I'm starting an initial investigation. I'll be checking the HM Land Registry and local comparable sales to ensure I can give you the best possible guaranteed cash offer.</p>
          <p>I understand you're looking to move ${data.timescale === 'Within 7 Days' ? 'very quickly' : 'soon'}, and I'll do my best to accommodate that.</p>
          <p>Expect a call or email from me shortly. If you'd like to chat right now, feel free to give me a ring on <a href="tel:01702416323" style="color: #d32f2f; font-weight: bold; text-decoration: none;">01702 416 323</a>.</p>
          <br>
          <p>Best regards,</p>
          <p><strong>Andy</strong><br>
          <span style="color: #666;">Property Buyer @ Cash4Houses</span></p>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="font-size: 0.8rem; color: #999;">This is an automated notification from the Cash4Houses portal regarding your property inquiry.</p>
        </div>
      `,
    };

    // 2. Email to Andy (Notification for the portal owner)
    const adminMailOptions = {
      from: '"Cash4Houses Portal" <Andy@Cash4Houses.co.uk>',
      to: ["Andy@Cash4Houses.co.uk", "andrew@essex.properties"],
      subject: `🚨 NEW LEAD: ${data.firstName} - ${data.address}`,
      html: `
        <div style="font-family: sans-serif; padding: 20px; background: #f9f9f9; border: 1px solid #ddd;">
          <h2 style="margin-top: 0;">New Property Lead</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Name:</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${data.title} ${data.firstName} ${data.surname}</td></tr>
            <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Email:</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${data.email}</td></tr>
            <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Phone:</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${data.mobile}</td></tr>
            <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Address:</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${data.address}</td></tr>
            <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Property:</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${data.type} (${data.bedrooms} Bedrooms)</td></tr>
            <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Condition:</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${data.condition}</td></tr>
            <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Reason:</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${data.reason}</td></tr>
            <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Timescale:</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${data.timescale}</td></tr>
          </table>
          <p style="margin-top: 20px;"><a href="https://console.firebase.google.com/project/c4h-wesbite/firestore/data/~2Fleads~2F${context.params.leadId}" style="display: inline-block; padding: 10px 20px; background: #007bff; color: #fff; text-decoration: none; border-radius: 4px;">View in Firebase Console</a></p>
        </div>
      `,
    };

    try {
      await Promise.all([
        transporter.sendMail(customerMailOptions),
        transporter.sendMail(adminMailOptions),
      ]);
      console.log(`Successfully sent emails for lead ${context.params.leadId}`);
    } catch (error) {
      console.error("FAILED to send emails:", error);
    }
  });

// --- AI Market News Component ---

const RSS_FEEDS = [
  "https://www.ons.gov.uk/economy/rss",
  "https://www.ons.gov.uk/employmentandlabourmarket/peoplenotinwork/unemployment/rss",
  "https://www.bankofengland.co.uk/rss/news",
  "https://www.thegazette.co.uk/all-notices/notice.rss?categorycode=G205000002",
  "https://thenegotiator.co.uk/feed/",
  "https://www.estateagenttoday.co.uk/rss",
  "https://propertyindustryeye.com/feed/",
  "https://www.zoopla.co.uk/discover/property-news/rss/",
  "https://www.rightmove.co.uk/news/feed/",
  "https://www.mylondon.news/news/?service=rss",
  "https://www.standard.co.uk/homesandproperty/rss",
  "https://www.hertfordshiremercury.co.uk/news/?service=rss",
  "https://www.essexlive.news/news/?service=rss",
  "https://www.echo-news.co.uk/news/rss/"
];

const NEGATIVE_KEYWORDS = [
  "Repossession", "Negative Equity", "Arrears", "Redundancy", 
  "Base Rate Increase", "Price Reduction", "Fall-through", "Chain Collapse",
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

  const apiKey = functions.config().google_ai?.key;
  if (!apiKey) {
    console.error("Missing google_ai.key");
    return "AI generation failed: Missing API key.";
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const prompt = `
    You are "Andy the Property Buyer", an expert with decades of experience in the UK property market. 
    Review the following news items and produce a daily amalgamated news story overview titled "What's Driving Todays Property Market".
    
    Focus on: Negative aspects (interest rates, unemployment, house prices down, agency closures) that signal a homeowner might need to sell quickly.
    Persona: Professional, realistic, and helpful.
    Sources: Attribute info to the provided source names.
    Format: Use clean Markdown with headers and bullet points.
    
    News Data:
    ${JSON.stringify(filtered)}
  `;

  const result = await model.generateContent(prompt);
  const text = result.response.text();

  await admin.firestore().collection("marketUpdates").doc("latest").set({
    content: text,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    sources: [...new Set(filtered.map(f => f.source))]
  });

  return text;
}

exports.scheduledMarketUpdate = functions.pubsub
  .schedule("0 8 * * *")
  .timeZone("Europe/London")
  .onRun(async (context) => {
    await updateMarketNews();
  });

exports.manualMarketUpdate = functions.https.onRequest(async (req, res) => {
  try {
    const result = await updateMarketNews();
    res.status(200).send(result);
  } catch (err) {
    res.status(500).send(err.message);
  }
});
