const { onSchedule } = require("firebase-functions/v2/scheduler");
const admin = require('firebase-admin');
const HiveClient = require('../hive/hiveClient');
const db = admin.firestore();

/**
 * SLIM-FUNNEL (Lead Funnel & Conversion) Module
 * Scans the leads collection hourly. 
 * Detects funnel breakages (e.g., leads without an auto-responder email sent) 
 * and sends instant alerts.
 */

async function runSlimFunnel() {
    const moduleId = "SLIM-FUNNEL";
    
    const registryDoc = await db.collection('moduleRegistry').doc(moduleId).get();
    let enabled = true; let dryRun = false;

    if (registryDoc.exists) {
        enabled = registryDoc.data().enabled !== false; dryRun = registryDoc.data().dryRun === true;
    } else {
        await db.collection('moduleRegistry').doc(moduleId).set({ enabled: true, dryRun: false, lastRun: null, healthStatus: 'healthy' });
    }

    if (!enabled) return { success: false, reason: "disabled" };
    console.log(`[${moduleId}] Starting run (Dry Run: ${dryRun})`);

    try {
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        
        // MVP: Check for recent leads
        const leadsSnap = await db.collection('leads')
            .where('createdAt', '>=', admin.firestore.Timestamp.fromDate(oneHourAgo))
            .get();

        let breakagesFound = 0;
        let newLeads = 0;

        leadsSnap.forEach(doc => {
            newLeads++;
            const lead = doc.data();
            // Detect breakage: no auto-responder sent within an hour
            if (!lead.autoResponderSent) {
                breakagesFound++;
            }
        });

        if (!dryRun) {
            // If breakages found, trigger an alert (mocked here by logging an error severity to Hive)
            if (breakagesFound > 0) {
                await HiveClient.logRun(moduleId, "funnelBreakageDetected", { breakagesFound, newLeads }, "error");
            } else {
                await HiveClient.logRun(moduleId, "funnelHealthy", { newLeads }, "info");
            }
            await db.collection('moduleRegistry').doc(moduleId).update({ lastRun: admin.firestore.FieldValue.serverTimestamp(), healthStatus: 'healthy' });
        } else {
            console.log(`[${moduleId}] DRY RUN: Found ${newLeads} leads, ${breakagesFound} breakages.`);
        }

        return { success: true, newLeads, breakagesFound };
    } catch (error) {
        console.error(`[${moduleId}] Error:`, error);
        await HiveClient.logRun(moduleId, "error", { error: error.message }, "error");
        await db.collection('moduleRegistry').doc(moduleId).update({ healthStatus: 'failing' });
        return { success: false, error: error.message };
    }
}

// Scheduled Trigger: Hourly
exports.slimFunnelAgent = onSchedule({ region: "europe-west4", schedule: "0 * * * *", timeZone: "Europe/London", memory: "2GiB", timeoutSeconds: 300 }, async () => { await runSlimFunnel(); });
