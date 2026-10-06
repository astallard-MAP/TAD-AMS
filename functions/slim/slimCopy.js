const { onSchedule } = require("firebase-functions/v2/scheduler");
const admin = require('firebase-admin');
const HiveClient = require('../hive/hiveClient');
const formats = require('./formats');
const db = admin.firestore();

/**
 * SLIM-COPY (Copywriter) Module
 * Generates 2-3 copy variants for a given post slot, utilizing insights and knowledge
 * from the Hive Mind to ensure relevance and empathy.
 */

async function runSlimCopy() {
    const moduleId = "SLIM-COPY";
    
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
        // 1. Fetch Hive Mind Context
        const digest = await HiveClient.getDailyDigest();
        
        // 2. Fetch Recent Post Types to enforce Help-First Rule (SLIM-4.2)
        const recentSnap = await db.collection('postDrafts').orderBy('createdAt', 'desc').limit(3).get();
        const recentTypes = recentSnap.docs.map(d => d.data().postType || 'value');
        const targetType = formats.determineNextPostType(recentTypes);

        // 3. Generate 2-3 variants based on format library (SLIM-4.1) & multiple CTAs (SLIM-4.3)
        const variants = [];
        const variantCount = Math.floor(Math.random() * 2) + 2; // 2 or 3 variants
        const town = "Southend-on-Sea"; // Could be dynamically injected from knowledge/local data

        for (let i = 0; i < variantCount; i++) {
            const format = formats.selectFormat(targetType);
            const ctaType = formats.CTAs[i % formats.CTAs.length].type;
            const ctaText = formats.getCta(ctaType);
            
            let text = format.template.replace('{town}', town).replace('{painPoint}', 'mounting debts');
            variants.push(`${text}\n\n${ctaText}`);
        }

        if (!dryRun) {
            // Save draft variants to a staging collection for SLIM-VIS and SLIM-COMP to process
            await db.collection('postDrafts').add({
                variants,
                postType: targetType,
                status: 'pending_visuals',
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                contextUsed: digest.newInsights.length > 0 ? "recent_insights" : "baseline"
            });

            await HiveClient.logRun(moduleId, "generatedCopy", { variantsCount: variants.length }, "info");
            await db.collection('moduleRegistry').doc(moduleId).update({ lastRun: admin.firestore.FieldValue.serverTimestamp(), healthStatus: 'healthy' });
        }

        return { success: true, variants };
    } catch (error) {
        console.error(`[${moduleId}] Error:`, error);
        await HiveClient.logRun(moduleId, "error", { error: error.message }, "error");
        await db.collection('moduleRegistry').doc(moduleId).update({ healthStatus: 'failing' });
        return { success: false, error: error.message };
    }
}

// Scheduled Trigger: 07:00 Daily to prep the morning slot
exports.slimCopyAgent = onSchedule({ region: "europe-west4", schedule: "0 7 * * *", timeZone: "Europe/London", memory: "2GiB", timeoutSeconds: 300 }, async () => { await runSlimCopy(); });
