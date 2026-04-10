const { google } = require("googleapis");

for (const key of Object.keys(google)) {
    try {
        if (typeof google[key] === 'function') {
            const instance = google[key]({ version: 'v1' });
            if (instance.locations && instance.locations.localPosts) {
                console.log(`FOUND! API: ${key}, Version: v1`);
            }
            const instanceV4 = google[key]({ version: 'v4' });
            if (instanceV4.locations && instanceV4.locations.localPosts) {
                console.log(`FOUND! API: ${key}, Version: v4`);
            }
        }
    } catch (e) {}
}
