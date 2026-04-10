import admin from "firebase-admin";

if (!admin.apps.length) {
    admin.initializeApp({
        projectId: "c4h-wesbite"
    });
}

const db = admin.firestore();

async function getSuccessfulPosts() {
    try {
        const snap = await db.collection("socialPosts")
            .where("published", "==", true)
            .orderBy("timestamp", "desc")
            .limit(10)
            .get();

        if (snap.empty) {
            console.log("No published posts found.");
            return;
        }

        console.log("--- SUCCESSFUL POST IDENTIFIERS ---");
        let count = 0;
        snap.forEach(doc => {
            const d = doc.data();
            // Check if it was reported as successful in metaStatus or result
            // The user says "reported as 'Successful' in the portal logs"
            const fbId = d.fbPostId || (d.metaResult && d.metaResult.fb && d.metaResult.fb.id);
            const igId = d.igMediaId || (d.metaResult && d.metaResult.ig && d.metaResult.ig.id);
            
            if (fbId || igId) {
                console.log(`\n[Post ${++count}]`);
                console.log(`Town: ${d.town}`);
                console.log(`Timestamp: ${d.timestamp.toDate().toLocaleString('en-GB')}`);
                console.log(`Facebook Post ID: ${fbId || 'N/A'}`);
                console.log(`Instagram Media ID: ${igId || 'N/A'}`);
                if (count >= 3) return;
            }
        });
    } catch (err) {
        console.error("Query Error:", err);
    }
}

getSuccessfulPosts();
