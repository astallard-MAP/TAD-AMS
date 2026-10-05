const admin = require('firebase-admin');

// Ensure firebase-admin is initialized before using
if (!admin.apps.length) {
    admin.initializeApp();
}

const db = admin.firestore();

async function migrateLegacyToHive() {
    console.log("Starting SLIM-2.5 Migration...");

    const batch = db.batch();
    let count = 0;

    try {
        // 1. Migrate socialStrategy/latest -> playbook
        const socialStrategySnap = await db.collection('socialStrategy').doc('latest').get();
        if (socialStrategySnap.exists) {
            const data = socialStrategySnap.data();
            const playbookRef = db.collection('playbook').doc('legacy_social_strategy');
            batch.set(playbookRef, {
                rule: "Legacy Social Strategy imported",
                context: "Migrated from socialStrategy/latest",
                priority: 3,
                enforcedBy: [],
                legacyData: data,
                migratedAt: admin.firestore.FieldValue.serverTimestamp()
            });
            count++;
        }

        // 2. Migrate marketUpdates/latest -> marketSnapshot
        const marketUpdatesSnap = await db.collection('marketUpdates').doc('latest').get();
        if (marketUpdatesSnap.exists) {
            const data = marketUpdatesSnap.data();
            const snapshotRef = db.collection('marketSnapshot').doc('legacy_market_update');
            batch.set(snapshotRef, {
                id: "legacy",
                legacyData: data,
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                migratedAt: admin.firestore.FieldValue.serverTimestamp()
            });
            count++;
        }

        // 3. Migrate supportServices -> knowledge (category: 'process')
        const supportServicesSnap = await db.collection('supportServices').get();
        supportServicesSnap.forEach(doc => {
            const data = doc.data();
            const knowledgeRef = db.collection('knowledge').doc(`legacy_support_${doc.id}`);
            batch.set(knowledgeRef, {
                category: "process",
                fact: `Legacy Support Service: ${data.name || doc.id}`,
                status: "candidate",
                evidence: "Migrated from supportServices",
                legacyData: data,
                addedBy: "SLIM-2.5-Migration",
                proposedAt: admin.firestore.FieldValue.serverTimestamp()
            });
            count++;
        });

        // 4. Migrate imageLibrary metadata -> knowledge (category: 'visual')
        const imageLibrarySnap = await db.collection('imageLibrary').get();
        imageLibrarySnap.forEach(doc => {
            const data = doc.data();
            const knowledgeRef = db.collection('knowledge').doc(`legacy_image_${doc.id}`);
            batch.set(knowledgeRef, {
                category: "process",
                fact: `Legacy Image Asset: ${data.url || doc.id}`,
                status: "candidate",
                evidence: "Migrated from imageLibrary",
                legacyData: data,
                addedBy: "SLIM-2.5-Migration",
                proposedAt: admin.firestore.FieldValue.serverTimestamp()
            });
            count++;
        });

        if (count > 0) {
            await batch.commit();
            console.log(`Migration complete. Copied ${count} legacy documents into Hive Mind collections.`);
        } else {
            console.log("No legacy documents found to migrate.");
        }

    } catch (error) {
        console.error("Migration failed:", error);
    }
}

// Allow execution from CLI
if (require.main === module) {
    migrateLegacyToHive().then(() => process.exit(0));
}

module.exports = { migrateLegacyToHive };
