const { onRequest } = require("firebase-functions/v2/https");
const { onSchedule } = require("firebase-functions/v2/scheduler");
const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const admin = require("firebase-admin");
const { Client } = require("@microsoft/microsoft-graph-client");
const { ClientSecretCredential } = require("@azure/identity");
require("isomorphic-fetch");
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
const AZURE_TENANT_ID = defineSecret("AZURE_TENANT_ID");
const AZURE_CLIENT_ID = defineSecret("AZURE_CLIENT_ID");
const AZURE_CLIENT_SECRET = defineSecret("AZURE_CLIENT_SECRET");
const GBP_LOCATION_ID = defineSecret("GBP_LOCATION_ID");

const parser = new Parser({
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
  }
});

// --- MICROSOFT GRAPH API CLIENT ---
function getGraphClient() {
  const credential = new ClientSecretCredential(
    AZURE_TENANT_ID.value(),
    AZURE_CLIENT_ID.value(),
    AZURE_CLIENT_SECRET.value()
  );
  return Client.initWithMiddleware({
    authProvider: {
      getAccessToken: async () => {
        const token = await credential.getToken("https://graph.microsoft.com/.default");
        return token.token;
      }
    }
  });
}

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
  const prompt = `Generate a high-quality social media post for 'Cash 4 Houses'. Town: ${town}. Time: ${timeOfDay}. ${VALUE_PROP}`;
  const { text } = await ai.generate({ model: 'googleai/gemini-2.5-flash', prompt: prompt });
  await db.collection("socialPosts").add({ content: text, scheduledTime: timeOfDay, town: town, timestamp: admin.firestore.FieldValue.serverTimestamp(), published: false });
  return text;
}

exports.socialMorningPost = onSchedule({ schedule: "0 9 * * *", timeZone: "Europe/London", secrets: ["GBP_LOCATION_ID"] }, async (event) => { await generateSocialPost("Morning"); });
exports.socialAfternoonPost = onSchedule({ schedule: "0 15 * * *", timeZone: "Europe/London", secrets: ["GBP_LOCATION_ID"] }, async (event) => { await generateSocialPost("Afternoon"); });

// --- MARKET NEWS SUITE ---
const RSS_FEEDS = ["https://www.ons.gov.uk/economy/grossdomesticproductgdp/rss", "https://www.bankofengland.co.uk/rss/news"];
async function updateMarketNews() {
  let allItems = [];
  for (const url of RSS_FEEDS) {
    try {
      const feed = await parser.parseURL(url);
      feed.items.forEach(item => allItems.push({ title: item.title, snippet: item.contentSnippet || "", source: feed.title }));
    } catch (err) { console.warn(`RSS Fail: ${url}`); }
  }
  const prompt = `Summarize these property triggers: ${JSON.stringify(allItems.slice(0, 10))}`;
  const { text } = await ai.generate({ model: 'googleai/gemini-2.5-flash', prompt: prompt });
  const payload = { content: text, updatedAt: admin.firestore.FieldValue.serverTimestamp() };
  await db.collection("marketUpdates").doc("latest").set(payload);
  return { success: true, content: text };
}

exports.manualMarketUpdate = onRequest({ cors: true, memory: "512MiB" }, async (req, res) => {
  const result = await updateMarketNews();
  res.status(200).send(result.content);
});

// --- LEAD PROCESSING (MICROSOFT GRAPH) ---
exports.processLead = onDocumentCreated({ 
  document: "leads/{leadId}", 
  secrets: ["AZURE_TENANT_ID", "AZURE_CLIENT_ID", "AZURE_CLIENT_SECRET"] 
}, async (event) => {
    const data = event.data.data();
    if (!data) return;
    const client = getGraphClient();
    try {
      await client.api('/users/andy@cash4houses.co.uk/sendMail').post({
        message: {
          subject: "Inquiry Confirmation",
          body: { contentType: "HTML", content: `<p>Hello ${data.firstName}, Andrew Stallard here. Received your details for <strong>${data.address}</strong>. Analyising now. Guaranteed offer within 48 hours.</p>` },
          toRecipients: [{ emailAddress: { address: data.email } }]
        }
      });
      await db.collection("communicationLogs").add({ leadId: event.params.leadId, timestamp: admin.firestore.FieldValue.serverTimestamp(), type: "Enquiry", summary: `Graph API: sent to ${data.email}` });
    } catch (error) { console.error("Graph Error:", error); }
});

exports.manualSocialGenerate = onRequest({ cors: true, memory: "512MiB" }, async (req, res) => {
  const text = await generateSocialPost("Manual");
  res.status(200).send(text);
});

exports.testEmailConnection = onRequest({ 
  cors: true, 
  secrets: ["AZURE_TENANT_ID", "AZURE_CLIENT_ID", "AZURE_CLIENT_SECRET"] 
}, async (req, res) => {
  const client = getGraphClient();
  try {
    await client.api('/users/andy@cash4houses.co.uk/sendMail').post({
      message: {
        subject: "Office 365 Configuration: GRAPH API SUCCESS",
        body: { contentType: "HTML", content: `<p>Diagnostic check complete at ${new Date().toISOString()}. Secure OAuth2 link active.</p>` },
        toRecipients: [{ emailAddress: { address: "andy@cash4houses.co.uk" } }]
      }
    });
    res.status(200).json({ success: true, message: "Graph Auth verified. Test email dispatched." });
  } catch (err) { res.status(500).json({ success: false, error: err.code || "AUTH_FAIL", message: err.message }); }
});
