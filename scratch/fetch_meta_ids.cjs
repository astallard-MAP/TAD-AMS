const admin = require("firebase-admin");

if (!admin.apps.length) {
    admin.initializeApp({
        projectId: "c4h-wesbite"
    });
}

const db = admin.firestore();

async function getRecentPostIds() {
    try {
        const snap = await db.collection("socialPosts")
            .where("published", "==", true)
            .orderBy("timestamp", "desc")
            .limit(3)
            .get();

        if (snap.empty) {
            console.log("No successful posts found.");
            return;
        }

        console.log("--- RECENT SUCCESSFUL META POSTS ---");
        snap.forEach(doc => {
            const data = doc.id + ": " + JSON.stringify(data.metaResult || data.result);
            // Wait, I should just print the IDs clearly
            const d = doc.data();
            console.log(`\nTown: ${d.town}`);
            console.log(`Timestamp: ${d.timestamp.toDate().toLocaleString('en-GB')}`);
            console.log(`Facebook ID: ${d.fbPostId || (d.metaResult && d.metaResult.fb && d.metaResult.fb.id) || 'N/A'}`);
            console.log(`Instagram ID: ${d.igMediaId || (d.metaResult && d.metaResult.ig && d.metaResult.ig.id) || 'N/A'}`);
        });
    } catch (err) {
        console.error("Query Error:", err);
    }
}

getRecentPostIds();
