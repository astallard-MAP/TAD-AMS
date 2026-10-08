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
 * SLIM-HASH (Hashtag Intelligence) Module
 * Enforces the strict rule: 3-7 hashtags, >=1 local, >=1 topical, >=1 brand.
 * Tracks usage to prevent identical consecutive sets.
 */

const BASE_POOLS = {
    local: ["#SouthendProperty", "#EssexHomes", "#WestcliffOnSea", "#LeighOnSea", "#RayleighProperty"],
    topical: ["#PropertyMarket", "#SellHouseFast", "#MortgageRates", "#ProbateProperty", "#RepossessionHelp"],
    brand: ["#Cash4Houses", "#TADAMS", "#CashBuyersEssex"]
};

async function runSlimHash() {
    const moduleId = "SLIM-HASH";
    
    const registryDoc = await db.collection('moduleRegistry').doc(moduleId).get();
    let enabled = true;
    let dryRun = false;

    if (registryDoc.exists) {
        enabled = registryDoc.data().enabled !== false;
        dryRun = registryDoc.data().dryRun === true;
    } else {
        await db.collection('moduleRegistry').doc(moduleId).set({ enabled: true, dryRun: false, lastRun: null, healthStatus: 'healthy' });
    }

    if (!enabled) return { success: false, reason: "disabled" };
    console.log(`[${moduleId}] Starting run (Dry Run: ${dryRun})`);

    try {
        // 1. Fetch hashtag history from Hive Mind
        const hashHistorySnap = await db.collection('hashtags').orderBy('lastUsed', 'desc').limit(10).get();
        const recentTags = hashHistorySnap.docs.map(d => d.data().tag);

        // 2. Select 1 of each category, preferring ones not recently used
        const selectTag = (pool) => {
            const available = pool.filter(t => !recentTags.includes(t));
            return available.length > 0 ? available[Math.floor(Math.random() * available.length)] : pool[Math.floor(Math.random() * pool.length)];
        };

        const set = [
            selectTag(BASE_POOLS.local),
            selectTag(BASE_POOLS.topical),
            selectTag(BASE_POOLS.brand)
        ];

        // 3. Add 1-2 random tags to reach 4-5 total (within 3-7 rule)
        const extras = [...BASE_POOLS.local, ...BASE_POOLS.topical].filter(t => !set.includes(t));
        set.push(extras[Math.floor(Math.random() * extras.length)]);

        const finalSet = [...new Set(set)]; // Deduplicate

        // 4. Record usage to Hive Mind
        if (!dryRun) {
            const batch = db.batch();
            finalSet.forEach(tag => {
                const ref = db.collection('hashtags').doc(tag.replace('#', ''));
                batch.set(ref, {
                    tag,
                    lastUsed: admin.firestore.FieldValue.serverTimestamp(),
                    useCount: admin.firestore.FieldValue.increment(1)
                }, { merge: true });
            });
            await batch.commit();

            await HiveClient.logRun(moduleId, "generatedSet", { tags: finalSet }, "info");
            await db.collection('moduleRegistry').doc(moduleId).update({ lastRun: admin.firestore.FieldValue.serverTimestamp(), healthStatus: 'healthy' });
        }

        return { success: true, tags: finalSet };
    } catch (error) {
        console.error(`[${moduleId}] Error:`, error);
        await HiveClient.logRun(moduleId, "error", { error: error.message }, "error");
        await db.collection('moduleRegistry').doc(moduleId).update({ healthStatus: 'failing' });
        return { success: false, error: error.message };
    }
}

// Scheduled Trigger: 04:00 Daily to prep sets for the day
exports.slimHashAgent = onSchedule({ region: "europe-west4", schedule: "0 4 * * *", timeZone: "Europe/London", memory: "2GiB", timeoutSeconds: 300 }, async () => { await runSlimHash(); });

// Synchronous callable function for pre-publish validation
exports.generateHashtags = runSlimHash;
