const admin = require('firebase-admin');

// Initialize with default credentials
admin.initializeApp({
    projectId: "c4h-wesbite"
});

const db = admin.firestore();

const towns = ["Southend-on-Sea", "Basildon", "Leigh-on-Sea", "Stanford-le-Hope", "Grays", "Canvey Island", "Rayleigh", "Rochford"];

async function run() {
    const today = new Date();
    
    for (let i = 1; i <= 180; i++) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        
        const dd = String(d.getDate()).padStart(2, '0');
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const yyyy = d.getFullYear();
        
        const dateStr = `cashforhouses${dd}${mm}${yyyy}`;
        const town = towns[Math.floor(Math.random() * towns.length)];
        
        const htmlContent = `
        <!DOCTYPE html>
        <html lang="en-GB">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Property Market Update: ${town} | Cash 4 Houses</title>
            <link rel="stylesheet" href="/style.css">
        </head>
        <body style="padding: 40px; font-family: 'Inter', sans-serif;">
            <div style="max-width: 800px; margin: 0 auto; background: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
                <a href="/archive.html" style="color: #64748b; text-decoration: none;">&larr; Back to Archive</a>
                <h1 style="color: #0f172a; margin-top: 20px;">Cash 4 Houses: Buying in ${town}</h1>
                <p style="color: #475569;">Published on ${dd}/${mm}/${yyyy}</p>
                <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;">
                <p style="font-size: 1.1rem; line-height: 1.8; color: #334155;">
                    The property market in ${town} continues to see strong demand from cash buyers. At Cash 4 Houses, we are actively looking for properties in this area, regardless of condition.
                </p>
                <p style="font-size: 1.1rem; line-height: 1.8; color: #334155;">
                    If you are facing financial difficulties, dealing with probate, or simply need a fast, guaranteed sale without the hassle of traditional estate agents, we can help.
                </p>
                <div style="margin-top: 40px;">
                    <a href="/get-offer.html" style="background: #EB287A; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">Get Your Cash Offer Today</a>
                </div>
            </div>
        </body>
        </html>`;

        await db.collection("seoPages").doc(dateStr).set({
            html: htmlContent,
            date: dateStr,
            town: town,
            timestamp: admin.firestore.Timestamp.fromDate(d)
        });
        
        if (i % 30 === 0) console.log(`Created ${i} historical pages...`);
    }
    console.log("Successfully retro-filled 180 days of archive pages.");
    process.exit(0);
}

run().catch(console.error);
