const fs = require('fs');

try {
    const raw = fs.readFileSync('scratch/comm_dump.json', 'utf8').replace(/^\uFEFF/, '');
    const data = JSON.parse(raw);
    const documents = data.documents;

    if (!documents) {
        console.log("No documents found in comm dump.");
        process.exit(1);
    }

    console.log("--- SCANNING COMMUNICATION LOGS FOR SUCCESSFUL POSTS ---");
    let results = [];

    documents.forEach(doc => {
        const fields = doc.fields;
        if (!fields) return;

        const summary = fields.summary ? fields.summary.stringValue : '';
        const timestamp = fields.timestamp ? fields.timestamp.timestampValue : '';

        // Looking for strings like "Facebook ID: 123456"
        const fbMatch = summary.match(/Facebook ID:\s*(\d+)/i);
        const igMatch = summary.match(/Instagram ID:\s*(\d+(_\d+)?)/i);

        if (fbMatch || igMatch) {
            results.push({
                summary,
                timestamp,
                fbId: fbMatch ? fbMatch[1] : 'N/A',
                igId: igMatch ? igMatch[1] : 'N/A'
            });
        }
    });

    results.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    results.slice(0, 3).forEach((r, i) => {
        console.log(`\n[Log Entry ${i+1}]`);
        console.log(`Timestamp: ${new Date(r.timestamp).toLocaleString('en-GB')}`);
        console.log(`Summary: ${r.summary}`);
    });

} catch (err) {
    console.error("Error:", err);
}
