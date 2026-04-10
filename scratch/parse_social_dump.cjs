const fs = require('fs');

try {
    const raw = fs.readFileSync('scratch/social_dump.json', 'utf8').replace(/^\uFEFF/, '');
    const data = JSON.parse(raw);
    const documents = data.documents;

    if (!documents) {
        console.log("No documents found in dump.");
        process.exit(1);
    }

    console.log("--- SCANNING FOR SUCCESSFUL PLATFORM IDENTIFIERS ---");
    let results = [];

    documents.forEach(doc => {
        const fields = doc.fields;
        if (!fields) return;

        const published = fields.published && fields.published.booleanValue === true;
        
        // Extract Meta IDs
        let fbId = null;
        let igId = null;

        if (fields.fbPostId && fields.fbPostId.stringValue) fbId = fields.fbPostId.stringValue;
        if (fields.igMediaId && fields.igMediaId.stringValue) igId = fields.igMediaId.stringValue;

        // Check metaResult if present
        if (fields.metaResult && fields.metaResult.mapValue && fields.metaResult.mapValue.fields) {
            const m = fields.metaResult.mapValue.fields;
            if (m.fb && m.fb.mapValue && m.fb.mapValue.fields && m.fb.mapValue.fields.id) {
                fbId = m.fb.mapValue.fields.id.stringValue;
            }
            if (m.ig && m.ig.mapValue && m.ig.mapValue.fields && m.ig.mapValue.fields.id) {
                igId = m.ig.mapValue.fields.id.stringValue;
            }
        }

        if (published && (fbId || igId)) {
            results.push({
                town: fields.town ? fields.town.stringValue : 'Unknown',
                timestamp: fields.timestamp ? fields.timestamp.timestampValue : 'Unknown',
                fbId,
                igId
            });
        }
    });

    // Sort by timestamp desc
    results.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    results.slice(0, 3).forEach((r, i) => {
        console.log(`\n[Post ${i+1}]`);
        console.log(`Town: ${r.town}`);
        console.log(`Timestamp: ${new Date(r.timestamp).toLocaleString('en-GB')}`);
        console.log(`Facebook Post ID: ${r.fbId || 'N/A'}`);
        console.log(`Instagram Media ID: ${r.igId || 'N/A'}`);
    });

} catch (err) {
    console.error("Error:", err);
}
