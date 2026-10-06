const { onSchedule } = require("firebase-functions/v2/scheduler");
const admin = require('firebase-admin');
const HiveClient = require('../hive/hiveClient');
const db = admin.firestore();

/**
 * SLIM-MKT (Market Intelligence) Module
 * Responsible for fetching daily macro data (BoE, ONS, Rightmove, etc.)
 * and proposing new market snapshots to the Hive Mind.
 */

async function runSlimMkt() {
    const moduleId = "SLIM-MKT";
    
    // 1. Check Module Registry for Kill Switch & Dry Run mode
    const registryDoc = await db.collection('moduleRegistry').doc(moduleId).get();
    let enabled = true;
    let dryRun = false;

    if (registryDoc.exists) {
        enabled = registryDoc.data().enabled !== false;
        dryRun = registryDoc.data().dryRun === true;
    } else {
        // Auto-register if missing
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
        // --- 2. Gather Intelligence (Simulated API calls for MVP) ---
        // In reality, this would fetch from ONS, BoE, Rightmove APIs
        const marketData = {
            boeBaseRate: 4.5,
            averageYieldEast: 5.2,
            activeListingsEssex: 1250,
            inflationRate: 2.1,
            date: new Date().toISOString().split('T')[0]
        };

        const fact = `The current Bank of England base rate is ${marketData.boeBaseRate}%, with regional yields in the East at ${marketData.averageYieldEast}%.`;
        const evidence = "Aggregated from BoE and local listing data.";

        // --- 3. Execute Hive Mind Writes ---
        if (!dryRun) {
            // Write to Market Snapshot
            await db.collection('marketSnapshot').doc('current').set({
                ...marketData,
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                sourceLinks: ["https://bankofengland.co.uk"]
            });
            
            // Add to history
            await db.collection('marketSnapshot').doc('current').collection('history').add({
                ...marketData,
                recordedAt: admin.firestore.FieldValue.serverTimestamp()
            });

            // Propose as Knowledge
            await HiveClient.proposeKnowledge("market", fact, evidence, moduleId);

            // Log Run
            await HiveClient.logRun(moduleId, "runComplete", { marketData }, "info");
            
            // Update Registry
            await db.collection('moduleRegistry').doc(moduleId).update({
                lastRun: admin.firestore.FieldValue.serverTimestamp(),
                healthStatus: 'healthy'
            });
        } else {
            console.log(`[${moduleId}] DRY RUN: Would have saved Snapshot and proposed Knowledge:`, fact);
            await HiveClient.logRun(moduleId, "dryRunComplete", { marketData }, "info");
        }

        return { success: true, dryRun };

    } catch (error) {
        console.error(`[${moduleId}] Error:`, error);
        await HiveClient.logRun(moduleId, "error", { error: error.message }, "error");
        await db.collection('moduleRegistry').doc(moduleId).update({
            healthStatus: 'failing'
        });
        return { success: false, error: error.message };
    }
}

// Scheduled Trigger: 05:30 Daily
exports.slimMktAgent = onSchedule({ 
    region: "europe-west4", 
    schedule: "30 5 * * *", 
    timeZone: "Europe/London",
    memory: "2GiB", timeoutSeconds: 300
}, async (event) => { 
    await runSlimMkt(); 
});

// Manual HTTP trigger for testing
const { onRequest } = require("firebase-functions/v2/https");
exports.manualSlimMkt = onRequest({ region: "europe-west4" }, async (req, res) => {
    const result = await runSlimMkt();
    res.json(result);
});
