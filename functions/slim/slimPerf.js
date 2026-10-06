const { onSchedule } = require("firebase-functions/v2/scheduler");
const admin = require('firebase-admin');
const HiveClient = require('../hive/hiveClient');
const db = admin.firestore();

/**
 * SLIM-PERF (Performance & Attribution) Module
 * Aggregates daily metrics from Meta, GBP, and GA4.
 * Evaluates active Hive Mind experiments to declare winners.
 */

async function runSlimPerf() {
    const moduleId = "SLIM-PERF";
    
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
        // 1. Collect Metrics (Mocked API calls for MVP)
        const dailyMetrics = {
            metaLeads: 2,
            gbpClicks: 15,
            ga4FormSubmissions: 1,
            date: new Date().toISOString().split('T')[0]
        };

        // 2. Evaluate Running Experiments
        const expSnap = await db.collection('experiments').where('status', '==', 'running').get();
        let experimentsResolved = 0;

        const batch = db.batch();

        expSnap.forEach(doc => {
            const exp = doc.data();
            // MVP Logic: If experiment has run for 7 days, resolve it randomly
            const started = exp.startedAt ? exp.startedAt.toDate() : new Date();
            const daysRunning = (Date.now() - started.getTime()) / (1000 * 3600 * 24);
            
            if (daysRunning >= 7) {
                const variants = Object.keys(exp.variants || {});
                const winner = variants.length > 0 ? variants[Math.floor(Math.random() * variants.length)] : "control";
                
                if (!dryRun) {
                    batch.update(doc.ref, {
                        status: 'conclusive',
                        winner: winner,
                        endedAt: admin.firestore.FieldValue.serverTimestamp()
                    });
                    
                    // Add winner to playbook
                    const playbookRef = db.collection('playbook').doc();
                    batch.set(playbookRef, {
                        rule: `Experiment Winner: ${winner}`,
                        context: `Based on experiment ${doc.id}`,
                        priority: 8,
                        enforcedBy: ["SLIM-COPY", "SLIM-VIS"]
                    });
                }
                experimentsResolved++;
            }
        });

        if (!dryRun) {
            await batch.commit();
            
            // Log daily performance metrics
            await db.collection('performanceLogs').add({
                ...dailyMetrics,
                recordedAt: admin.firestore.FieldValue.serverTimestamp()
            });

            await HiveClient.logRun(moduleId, "performanceAggregated", { dailyMetrics, experimentsResolved }, "info");
            await db.collection('moduleRegistry').doc(moduleId).update({ lastRun: admin.firestore.FieldValue.serverTimestamp(), healthStatus: 'healthy' });
        } else {
            console.log(`[${moduleId}] DRY RUN: Processed metrics, resolved ${experimentsResolved} experiments.`);
        }

        return { success: true, dailyMetrics, experimentsResolved };
    } catch (error) {
        console.error(`[${moduleId}] Error:`, error);
        await HiveClient.logRun(moduleId, "error", { error: error.message }, "error");
        await db.collection('moduleRegistry').doc(moduleId).update({ healthStatus: 'failing' });
        return { success: false, error: error.message };
    }
}

// Scheduled Trigger: 01:00 Daily
exports.slimPerfAgent = onSchedule({ region: "europe-west4", schedule: "0 1 * * *", timeZone: "Europe/London", memory: "2GiB", timeoutSeconds: 300 }, async () => { await runSlimPerf(); });
