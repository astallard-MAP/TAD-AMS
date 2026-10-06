const { onSchedule } = require("firebase-functions/v2/scheduler");
const admin = require('firebase-admin');
const HiveClient = require('../hive/hiveClient');
const db = admin.firestore();

/**
 * SLIM-PSY (Seller Psychology & Empathy) Module
 * Extracts insights from daily leads and chat transcripts to find common objections 
 * and pain points, then feeds them into the Hive Mind's sellerInsights.
 */

async function runSlimPsy() {
    const moduleId = "SLIM-PSY";
    
    // 1. Check Module Registry for Kill Switch & Dry Run mode
    const registryDoc = await db.collection('moduleRegistry').doc(moduleId).get();
    let enabled = true;
    let dryRun = false;

    if (registryDoc.exists) {
        enabled = registryDoc.data().enabled !== false;
        dryRun = registryDoc.data().dryRun === true;
    } else {
        await db.collection('moduleRegistry').doc(moduleId).set({
            enabled: true,
            dryRun: false,
            lastRun: null,
            healthStatus: 'healthy'
        });
    }

    if (!enabled) {
        console.log(`[${moduleId}] Module is disabled via kill-switch. Exiting.`);
        return { success: false, reason: "disabled" };
    }

    console.log(`[${moduleId}] Starting run (Dry Run: ${dryRun})`);

    try {
        // --- 2. Gather Intelligence (Simulated extraction for MVP) ---
        // In a real scenario, this queries the last 24h of leads/chat logs
        // and uses LLM to extract segments and objections.
        
        const extractedInsight = {
            segment: "arrears",
            painPoint: "Terrified of repossession hearing next week. Need certainty fast.",
            objection: "Are you just going to drop the price at the last minute?",
            successfulCounter: "We guarantee our offer price in writing within 24 hours of viewing, covering legal fees so there are no surprises.",
            confidenceScore: 88
        };

        // --- 3. Execute Hive Mind Writes ---
        if (!dryRun) {
            // Write to Seller Insights (HiveClient automatically scrubs PII)
            await HiveClient.addSellerInsight(
                extractedInsight.segment,
                extractedInsight.painPoint,
                extractedInsight.objection,
                extractedInsight.successfulCounter,
                extractedInsight.confidenceScore,
                moduleId
            );

            // Log Run
            await HiveClient.logRun(moduleId, "runComplete", { insightsProcessed: 1 }, "info");
            
            // Update Registry
            await db.collection('moduleRegistry').doc(moduleId).update({
                lastRun: admin.firestore.FieldValue.serverTimestamp(),
                healthStatus: 'healthy'
            });
        } else {
            console.log(`[${moduleId}] DRY RUN: Would have added seller insight:`, extractedInsight.objection);
            await HiveClient.logRun(moduleId, "dryRunComplete", { insightsProcessed: 1 }, "info");
        }

        return { success: true, dryRun, insightsProcessed: 1 };

    } catch (error) {
        console.error(`[${moduleId}] Error:`, error);
        await HiveClient.logRun(moduleId, "error", { error: error.message }, "error");
        await db.collection('moduleRegistry').doc(moduleId).update({
            healthStatus: 'failing'
        });
        return { success: false, error: error.message };
    }
}

// Scheduled Trigger: 02:00 Daily
exports.slimPsyAgent = onSchedule({ 
    region: "europe-west4", 
    schedule: "0 2 * * *", 
    timeZone: "Europe/London",
    memory: "2GiB", timeoutSeconds: 300
}, async (event) => { 
    await runSlimPsy(); 
});

// Manual HTTP trigger for testing
const { onRequest } = require("firebase-functions/v2/https");
exports.manualSlimPsy = onRequest({ region: "europe-west4" }, async (req, res) => {
    const result = await runSlimPsy();
    res.json(result);
});
