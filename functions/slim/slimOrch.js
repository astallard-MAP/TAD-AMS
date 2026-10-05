const { onSchedule } = require("firebase-functions/v2/scheduler");
const admin = require('firebase-admin');
const HiveClient = require('../hive/hiveClient');
const db = admin.firestore();

/**
 * SLIM-ORCH (Orchestrator "Queen") Module
 * Monitors fleet health, manages kill-switches, flags contradictions, 
 * and prepares the Daily Digest / Weekly Fleet Report.
 */

async function runSlimOrch() {
    const moduleId = "SLIM-ORCH";
    
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
        // 1. Health Check
        const registrySnap = await db.collection('moduleRegistry').get();
        let failingModules = [];
        let totalModules = 0;

        registrySnap.forEach(doc => {
            totalModules++;
            const data = doc.data();
            if (data.healthStatus === 'failing' && doc.id !== moduleId) {
                failingModules.push(doc.id);
            }
        });

        // 2. Contradiction Flagging Check
        const knowledgeSnap = await db.collection('knowledge').where('status', '==', 'conflict_flagged').get();
        const flaggedConflicts = knowledgeSnap.size;

        if (!dryRun) {
            const batch = db.batch();

            // 3. Trigger Kill Switches if severe cascade failure
            if (failingModules.length > Math.floor(totalModules / 2)) {
                console.error(`[${moduleId}] CASCADE FAILURE DETECTED. Engaging Kill-Switches.`);
                registrySnap.forEach(doc => {
                    if (doc.id !== moduleId) {
                        batch.update(doc.ref, { enabled: false, healthStatus: 'killed_by_queen' });
                    }
                });
            }

            // 4. Generate Daily Report
            const reportRef = db.collection('fleetReports').doc();
            batch.set(reportRef, {
                date: new Date().toISOString().split('T')[0],
                failingModules,
                flaggedConflicts,
                totalModules,
                createdAt: admin.firestore.FieldValue.serverTimestamp()
            });

            await batch.commit();

            await HiveClient.logRun(moduleId, "orchestrationComplete", { failingModules, flaggedConflicts }, failingModules.length > 0 ? "warning" : "info");
            await db.collection('moduleRegistry').doc(moduleId).update({ lastRun: admin.firestore.FieldValue.serverTimestamp(), healthStatus: 'healthy' });
        } else {
            console.log(`[${moduleId}] DRY RUN: Found ${failingModules.length} failing modules and ${flaggedConflicts} conflicts.`);
        }

        return { success: true, failingModules, flaggedConflicts };
    } catch (error) {
        console.error(`[${moduleId}] Error:`, error);
        await HiveClient.logRun(moduleId, "error", { error: error.message }, "error");
        await db.collection('moduleRegistry').doc(moduleId).update({ healthStatus: 'failing' });
        return { success: false, error: error.message };
    }
}

// Scheduled Trigger: 06:00 Daily
exports.slimOrchAgent = onSchedule({ region: "europe-west4", schedule: "0 6 * * *", timeZone: "Europe/London", memory: "256MiB" }, async () => { await runSlimOrch(); });
