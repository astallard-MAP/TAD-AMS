const { onRequest } = require("firebase-functions/v2/https");
const { getApps, initializeApp } = require("firebase-admin/app");
const { getFirestore, FieldValue, Timestamp } = require("firebase-admin/firestore");
const { getStorage } = require("firebase-admin/storage");

const admin = {
    get apps() { return getApps(); },
    initializeApp: initializeApp,
    firestore: () => getFirestore(),
    storage: () => getStorage()
};
admin.firestore.FieldValue = FieldValue;
admin.firestore.Timestamp = Timestamp;
const HiveClient = require('../hive/hiveClient');
const db = admin.firestore();

/**
 * SLIM-ANDY (Chatbot Upgrade - SLIM-3.8 / 3.12)
 * The public-facing conversational agent. 
 * Reads from Hive Mind to ensure honest, accurate cost and process answers.
 * Extracts anonymized segments at the end of the chat.
 */

exports.slimAndyAgent = onRequest({ region: "europe-west4", cors: true, memory: "2GiB", timeoutSeconds: 300 }, async (req, res) => {
    // SLIM-6.3: Enforce Firebase App Check to prevent unauthorized API abuse
    if (req.appCheckToken === undefined && process.env.FUNCTIONS_EMULATOR !== "true") {
        res.status(401).json({ error: "Unauthorized. App Check token missing." });
        return;
    }

    // Fix for Bug P-3: Fallback gracefully if userId is missing
    const userId = req.body.userId || "anonymous_user_" + Date.now();
    const userMessage = req.body.message || "";
    
    if (!userMessage) {
        return res.status(400).json({ error: "Missing message" });
    }

    const moduleId = "SLIM-ANDY";

    try {
        const registryDoc = await db.collection('moduleRegistry').doc(moduleId).get();
        let enabled = registryDoc.exists ? registryDoc.data().enabled !== false : true;

        if (!enabled) {
            return res.json({ response: "I am currently offline for maintenance. Please call us directly or use the contact form." });
        }

        // 1. Fetch Hive Mind Context (Process & Costs)
        const processDocs = await HiveClient.readKnowledge('process');
        const costDocs = await HiveClient.readKnowledge('cost');
        
        // MVP: Simulate LLM processing with rule-based detection
        const msgLower = userMessage.toLowerCase();
        let botResponse = "I'm Andy, the Cash 4 Houses AI assistant. ";
        let detectedSegment = null;

        // (b) Segment Recognition
        if (msgLower.includes("divorce") || msgLower.includes("split")) detectedSegment = "divorce";
        else if (msgLower.includes("probate") || msgLower.includes("inherited")) detectedSegment = "probate";
        else if (msgLower.includes("arrears") || msgLower.includes("repossession")) detectedSegment = "arrears";
        
        // (c) Honest process/cost answers
        if (msgLower.includes("fees") || msgLower.includes("cost")) {
            botResponse += "We cover up to £1,500 of your seller legal fees. There are no hidden valuation or admin costs. ";
        } else if (msgLower.includes("how long")) {
            botResponse += "We can legally complete a cash purchase in as little as 7 days, but we operate on a timeline that suits you. ";
        } else {
            botResponse += "How can I help you today? ";
        }

        // (e) Independent Legal Advice / Compare Options Note
        if (msgLower.includes("solicitor") || msgLower.includes("legal")) {
            botResponse += "We always recommend you seek independent legal advice. You are free to choose your own solicitor, or we can recommend an independent panel. ";
        }

        // (d) "Talk to a human" trigger
        if (msgLower.includes("human") || msgLower.includes("call me") || msgLower.includes("speak to someone")) {
            botResponse = "I completely understand. A human member of our team will take over this chat or call you shortly. Please leave your phone number if you haven't already.";
        }

        // (f) Anonymized end-of-chat summary (Simulated Trigger on 'bye')
        if (msgLower.includes("bye") || msgLower.includes("thanks")) {
            if (detectedSegment) {
                // (g) No PII to Hive - HiveClient handles scrubbing
                await HiveClient.addSellerInsight(
                    detectedSegment, 
                    "End of chat summary (anonymised)", 
                    "None recorded", 
                    "Provided honest timeline", 
                    85, 
                    moduleId
                );
            }
        }

        // Log the run to Hive Mind Audit Log
        await HiveClient.logRun(moduleId, "chatResponded", { segment: detectedSegment, length: userMessage.length }, "info");

        res.json({ response: botResponse });

    } catch (error) {
        console.error(`[${moduleId}] Error:`, error);
        res.json({ response: "I'm experiencing a technical hiccup. Please call us directly on our main number." });
    }
});
