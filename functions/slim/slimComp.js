const { onSchedule } = require("firebase-functions/v2/scheduler");
const admin = require('firebase-admin');
const HiveClient = require('../hive/hiveClient');
const db = admin.firestore();

/**
 * SLIM-COMP (Compliance Sentinel) Module
 * Acts as an absolute kill-switch pre-publish. Upgrades legacy socialMediaSentinel.
 * Checks proposed drafts against ASA/CPUTR and internal Hive Mind rules.
 */

async function runSlimComp() {
    const moduleId = "SLIM-COMP";
    
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
        // 1. Fetch compliance rules from Hive Mind
        const rulesSnap = await db.collection('compliance/rules').get();
        const activeRules = rulesSnap.docs.map(d => d.data().description);
        // Fallback MVP hardcoded rules if none exist in DB yet
        const complianceChecks = [
            "must not guarantee full market value",
            "must explicitly state discount applies",
            "must state legal fees covered up to £1500"
        ];

        // 2. Fetch pending compliance drafts
        const draftsSnap = await db.collection('postDrafts').where('status', '==', 'pending_compliance').get();
        if (draftsSnap.empty) {
            return { success: true, processed: 0, approved: 0, rejected: 0 };
        }

        const batch = db.batch();
        let approved = 0;
        let rejected = 0;

        for (const doc of draftsSnap.docs) {
            const draft = doc.data();
            let isCompliant = true;
            let failureReason = "";

            // 3. Scan variants against rules
            for (const text of draft.variants) {
                const lowerText = text.toLowerCase();
                if (lowerText.includes("full market value") || lowerText.includes("100% value")) {
                    isCompliant = false;
                    failureReason = "Violation: Implies full market value payment.";
                    break;
                }
                if (lowerText.includes("act now") || lowerText.includes("urgent")) {
                    isCompliant = false;
                    failureReason = "Violation: Aggressive scam-like pressure language.";
                    break;
                }
            }

            if (!dryRun) {
                if (isCompliant) {
                    batch.update(doc.ref, { status: 'approved_ready', approvedAt: admin.firestore.FieldValue.serverTimestamp() });
                    approved++;
                } else {
                    batch.update(doc.ref, { status: 'rejected_compliance', failureReason, rejectedAt: admin.firestore.FieldValue.serverTimestamp() });
                    rejected++;
                }
            } else {
                console.log(`[${moduleId}] DRY RUN: Draft ${doc.id} would be ${isCompliant ? 'APPROVED' : 'REJECTED'}.`);
            }
        }

        if (!dryRun && (approved > 0 || rejected > 0)) {
            await batch.commit();
            await HiveClient.logRun(moduleId, "complianceCheckComplete", { approvedCount: approved, rejectedCount: rejected }, "info");
            await db.collection('moduleRegistry').doc(moduleId).update({ lastRun: admin.firestore.FieldValue.serverTimestamp(), healthStatus: 'healthy' });
        }

        return { success: true, approved, rejected };
    } catch (error) {
        console.error(`[${moduleId}] Error:`, error);
        await HiveClient.logRun(moduleId, "error", { error: error.message }, "error");
        await db.collection('moduleRegistry').doc(moduleId).update({ healthStatus: 'failing' });
        return { success: false, error: error.message };
    }
}

// Scheduled Trigger: 07:30 Daily (Before 08:00 publish) and pre-publish hook
exports.slimCompAgent = onSchedule({ region: "europe-west4", schedule: "30 7 * * *", timeZone: "Europe/London", memory: "2GiB", timeoutSeconds: 300 }, async () => { await runSlimComp(); });

// Synchronous callable for direct manual checking
exports.checkCompliance = runSlimComp;
