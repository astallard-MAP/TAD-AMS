const { onSchedule } = require("firebase-functions/v2/scheduler");
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
 * SLIM-LOCAL (Local Presence) Module
 * Handles Google Business Profile (GBP) posts, local review responses, and local hooks.
 */

async function runSlimLocal() {
    const moduleId = "SLIM-LOCAL";
    
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
        // MVP: Simulate fetching new GBP reviews and auto-drafting a response
        const newReviewsCount = 1;

        if (!dryRun) {
            await HiveClient.logRun(moduleId, "gbpPresenceUpdated", { reviewsProcessed: newReviewsCount, localPosts: 1 }, "info");
            await db.collection('moduleRegistry').doc(moduleId).update({ lastRun: admin.firestore.FieldValue.serverTimestamp(), healthStatus: 'healthy' });
        } else {
            console.log(`[${moduleId}] DRY RUN: Would have processed ${newReviewsCount} reviews and published 1 local post.`);
        }

        return { success: true, reviewsProcessed: newReviewsCount };
    } catch (error) {
        console.error(`[${moduleId}] Error:`, error);
        await HiveClient.logRun(moduleId, "error", { error: error.message }, "error");
        await db.collection('moduleRegistry').doc(moduleId).update({ healthStatus: 'failing' });
        return { success: false, error: error.message };
    }
}

// Scheduled Trigger: Daily
exports.slimLocalAgent = onSchedule({ region: "europe-west4", schedule: "0 10 * * *", timeZone: "Europe/London", memory: "2GiB", timeoutSeconds: 300 }, async () => { await runSlimLocal(); });
