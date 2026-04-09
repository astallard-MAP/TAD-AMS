const { onRequest } = require("firebase-functions/v2/https");
const { onSchedule } = require("firebase-functions/v2/scheduler");
const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const admin = require("firebase-admin");
const { Client } = require("@microsoft/microsoft-graph-client");
const { ClientSecretCredential } = require("@azure/identity");
require("isomorphic-fetch");
const Parser = require("rss-parser");
const { genkit } = require("genkit");
const { vertexAI } = require("@genkit-ai/vertexai");
const { defineSecret } = require("firebase-functions/params");

// Initialize Firebase Admin
admin.initializeApp();
const db = admin.firestore();

// Initialize Genkit (Social Media Agent & News Suite)
const ai = genkit({
  plugins: [vertexAI({ location: 'us-central1' })] 
});

// Secrets
const AZURE_TENANT_ID = defineSecret("AZURE_TENANT_ID");
const AZURE_CLIENT_ID = defineSecret("AZURE_CLIENT_ID");
const AZURE_CLIENT_SECRET = defineSecret("AZURE_CLIENT_SECRET");
const GBP_LOCATION_ID = defineSecret("GBP_LOCATION_ID");
const META_PAGE_ID = defineSecret("META_PAGE_ID");
const META_PERMANENT_PAGE_TOKEN = defineSecret("META_PERMANENT_PAGE_TOKEN");
const META_APP_ID = defineSecret("META_APP_ID");
const META_APP_SECRET = defineSecret("META_APP_SECRET");

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
  try {
    const { text } = await ai.generate({ model: 'vertexai/gemini-2.5-flash', prompt: prompt });
    await db.collection("socialPosts").add({ content: text, scheduledTime: timeOfDay, town: town, timestamp: admin.firestore.FieldValue.serverTimestamp(), published: false });
    return text;
  } catch (error) {
    console.error("AI Error (Social):", error);
    return "Social content generation failed. Please check API status.";
  }
}

exports.socialMorningPost = onSchedule({ schedule: "0 9 * * *", timeZone: "Europe/London", secrets: ["GBP_LOCATION_ID"] }, async (event) => { await generateSocialPost("Morning"); });
exports.socialAfternoonPost = onSchedule({ schedule: "0 15 * * *", timeZone: "Europe/London", secrets: ["GBP_LOCATION_ID"] }, async (event) => { await generateSocialPost("Afternoon"); });

// --- MARKET NEWS SUITE ---
const RSS_FEEDS = [
  "https://www.ons.gov.uk/economy/grossdomesticproductgdp/rss", 
  "https://www.bankofengland.co.uk/rss/news",
  "https://www.propertyindustryeye.com/feed/",
  "https://www.mortgagestrategy.co.uk/feed/"
];
async function updateMarketNews() {
  let allItems = [];
  for (const url of RSS_FEEDS) {
    try {
      const feed = await parser.parseURL(url);
      feed.items.forEach(item => allItems.push({ title: item.title, snippet: item.contentSnippet || "", source: feed.title }));
    } catch (err) { console.warn(`RSS Fail: ${url}`); }
  }
  const prompt = `Summarize these property triggers: ${JSON.stringify(allItems.slice(0, 10))}`;
  try {
    const { text } = await ai.generate({ model: 'vertexai/gemini-2.5-flash', prompt: prompt });
    const payload = { content: text, updatedAt: admin.firestore.FieldValue.serverTimestamp() };
    await db.collection("marketUpdates").doc("latest").set(payload);
    return { success: true, content: text };
  } catch (error) {
    console.error("AI Error (Market News):", error);
    return { success: false, content: "Market analysis temporarily unavailable. Check Generative Language API status." };
  }
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
        },
        saveToSentItems: true
      });
      await db.collection("communicationLogs").add({ leadId: event.params.leadId, timestamp: admin.firestore.FieldValue.serverTimestamp(), type: "Enquiry", summary: `Graph API: sent to ${data.email}` });
    } catch (error) { 
      console.error("Graph Error:", error);
      if (error.requestId) console.log("Graph Request ID:", error.requestId);
      if (error.clientRequestId) console.log("Graph Client Request ID:", error.clientRequestId);
    }
});

exports.manualSocialGenerate = onRequest({ cors: true, memory: "512MiB" }, async (req, res) => {
  const text = await generateSocialPost("Manual");
  res.status(200).send(text);
});

exports.testEmailConnection = onRequest({ 
  cors: true, 
  secrets: ["AZURE_TENANT_ID", "AZURE_CLIENT_ID", "AZURE_CLIENT_SECRET"] 
}, async (req, res) => {
  try {
    const client = getGraphClient();
    await client.api('/users/andy@cash4houses.co.uk/sendMail').post({
      message: {
        subject: "Office 365 Configuration: GRAPH API SUCCESS",
        body: { contentType: "HTML", content: `<p>Diagnostic check complete at ${new Date().toISOString()}. Secure OAuth2 link active.</p>` },
        toRecipients: [{ emailAddress: { address: "andy@cash4houses.co.uk" } }]
      },
      saveToSentItems: true
    });
    res.status(200).json({ success: true, message: "Graph Auth verified. Test email dispatched." });
  } catch (err) { 
    console.error("Test Email Error:", err);
    if (err.requestId) console.log("Graph Request ID:", err.requestId);
    if (err.clientRequestId) console.log("Graph Client Request ID:", err.clientRequestId);
    res.status(200).json({ success: false, error: err.code || "AUTH_FAIL", message: err.message, requestId: err.requestId }); 
  }
});

// --- META GRAPH API (FB & IG) ---
exports.publishToMeta = onRequest({ 
  cors: true, 
  secrets: ["META_PAGE_ID", "META_PERMANENT_PAGE_TOKEN", "META_APP_ID", "META_APP_SECRET"] 
}, async (req, res) => {
  const { postId } = req.body;
  if (!postId) return res.status(400).send("Missing postId");

  try {
    const postDoc = await db.collection("socialPosts").doc(postId).get();
    if (!postDoc.exists) return res.status(404).send("Post not found");
    const postData = postDoc.data();
    const content = postData.content;
    const imageUrl = postData.imageUrl; // Optional image

    const pageId = META_PAGE_ID.value();
    const token = META_PERMANENT_PAGE_TOKEN.value();

    // --- 1. FACEBOOK PUBLISHING ---
    const fbUrl = `https://graph.facebook.com/v19.0/${pageId}/feed`;
    const fbPayload = { message: content, access_token: token };
    if (imageUrl) fbPayload.link = imageUrl;

    const fbResp = await fetch(fbUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fbPayload)
    });
    const fbResult = await fbResp.json();

    // --- 2. INSTAGRAM PUBLISHING ---
    const igAccountUrl = `https://graph.facebook.com/v19.0/${pageId}?fields=instagram_business_account&access_token=${token}`;
    const igAccountResp = await fetch(igAccountUrl);
    const igAccountData = await igAccountResp.json();
    const igAccountId = igAccountData.instagram_business_account?.id;

    let igResult = { status: "Skipped" };
    
    // Instagram requires an image/video for publishing via API
    if (igAccountId && imageUrl) {
      try {
        // Step A: Create Media Container
        const containerUrl = `https://graph.facebook.com/v19.0/${igAccountId}/media`;
        const containerResp = await fetch(containerUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            image_url: imageUrl,
            caption: content,
            access_token: token
          })
        });
        const containerData = await containerResp.json();
        
        if (containerData.id) {
          // Step B: Publish Media
          const publishUrl = `https://graph.facebook.com/v19.0/${igAccountId}/media_publish`;
          const publishResp = await fetch(publishUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              creation_id: containerData.id,
              access_token: token
            })
          });
          igResult = await publishResp.json();
        } else {
          igResult = { error: containerData.error || "Failed to create container" };
        }
      } catch (igErr) {
        igResult = { error: igErr.message };
      }
    } else if (igAccountId && !imageUrl) {
      igResult = { status: "Skipped - Text only posts not supported on IG API" };
    }

    // Update the post record
    await db.collection("socialPosts").doc(postId).update({ 
      published: true, 
      fbPostId: fbResult.id || null,
      igPostId: igResult.id || null,
      metaPublishedAt: admin.firestore.FieldValue.serverTimestamp(),
      metaStatus: {
        facebook: fbResult.id ? "Success" : "Error",
        instagram: igResult.id ? "Success" : (igAccountId ? "Failed/Skipped" : "No IG Account")
      }
    });

    res.status(200).json({ 
      success: true, 
      facebook: fbResult,
      instagram: igResult
    });

  } catch (error) {
    console.error("Meta Publishing Error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

exports.verifyMetaConnection = onRequest({
  cors: true,
  secrets: ["META_PAGE_ID", "META_PERMANENT_PAGE_TOKEN"]
}, async (req, res) => {
  try {
    const pageId = META_PAGE_ID.value();
    const token = META_PERMANENT_PAGE_TOKEN.value();
    const url = `https://graph.facebook.com/v19.0/${pageId}?fields=name,username,followers_count&access_token=${token}`;
    const resp = await fetch(url);
    const data = await resp.json();
    
    if (data.error) {
      throw new Error(data.error.message);
    }
    
    res.status(200).json({ success: true, pageDetails: data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
