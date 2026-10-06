const { onSchedule } = require("firebase-functions/v2/scheduler");
const admin = require('firebase-admin');
const HiveClient = require('../hive/hiveClient');
const db = admin.firestore();

/**
 * SLIM-VIS (Visual Producer) Module
 * Selects or generates images/text-cards for drafted copy.
 * Enforces deduplication and AI labeling rules.
 */

async function runSlimVis() {
    const moduleId = "SLIM-VIS";
    
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
        // 1. Fetch pending drafts from SLIM-COPY
        const draftsSnap = await db.collection('postDrafts').where('status', '==', 'pending_visuals').get();
        if (draftsSnap.empty) {
            console.log(`[${moduleId}] No pending drafts found.`);
            return { success: true, processed: 0 };
        }

        const batch = db.batch();
        let processed = 0;

        // 2. Process each draft
        for (const doc of draftsSnap.docs) {
            const draft = doc.data();
            
            // 3. Image Selection Logic (Mocked for MVP)
            // Simulating deduplication by randomly selecting a "real photo" or "text card"
            const isTextCard = Math.random() > 0.5;
            let visualAsset = {
                type: isTextCard ? "text_card" : "real_photo",
                url: isTextCard ? "https://cash4houses.co.uk/assets/card_template.png" : "https://cash4houses.co.uk/assets/stock_house.jpg",
                aiLabelled: true // Compliance: Explicitly flag if AI generated
            };

            if (!dryRun) {
                batch.update(doc.ref, {
                    visualAsset,
                    status: 'pending_compliance',
                    updatedAt: admin.firestore.FieldValue.serverTimestamp()
                });
                processed++;
            } else {
                console.log(`[${moduleId}] DRY RUN: Would attach visual ${visualAsset.type} to draft ${doc.id}`);
            }
        }

        if (!dryRun && processed > 0) {
            await batch.commit();
            await HiveClient.logRun(moduleId, "visualsAttached", { processedCount: processed }, "info");
            await db.collection('moduleRegistry').doc(moduleId).update({ lastRun: admin.firestore.FieldValue.serverTimestamp(), healthStatus: 'healthy' });
        }

        return { success: true, processed };
    } catch (error) {
        console.error(`[${moduleId}] Error:`, error);
        await HiveClient.logRun(moduleId, "error", { error: error.message }, "error");
        await db.collection('moduleRegistry').doc(moduleId).update({ healthStatus: 'failing' });
        return { success: false, error: error.message };
    }
}

// Scheduled Trigger: 07:15 Daily (Shortly after SLIM-COPY)
exports.slimVisAgent = onSchedule({ region: "europe-west4", schedule: "15 7 * * *", timeZone: "Europe/London", memory: "2GiB", timeoutSeconds: 300 }, async () => { await runSlimVis(); });
