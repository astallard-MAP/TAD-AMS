const fs = require('fs');

let content = fs.readFileSync('functions/index.js', 'utf8');

content = content.replace(
`exports.dailyMarketAnalysis = onSchedule({ region: "europe-west4", 
  schedule: "0 8 * * *", 
  timeZone: "Europe/London",`,
`exports.dailyMarketAnalysis = onSchedule({ region: "europe-west4", 
  schedule: "0 8 * * *", 
  timeZone: "Europe/London",
  memory: "2GiB",
  timeoutSeconds: 300,`
);

content = content.replace(
`exports.portalSentinel = onSchedule({ region: "europe-west4",
    schedule: "every 2 hours",
    timeZone: "Europe/London",
    memory: "1GiB"`,
`exports.portalSentinel = onSchedule({ region: "europe-west4",
    schedule: "every 2 hours",
    timeZone: "Europe/London",
    memory: "2GiB",
    timeoutSeconds: 300`
);

content = content.replace(
`exports.generateDailySpotlight = onSchedule({ region: "europe-west4", 
    schedule: "0 0 * * *", 
    timeZone: "Europe/London", 
    memory: "1GiB"`,
`exports.generateDailySpotlight = onSchedule({ region: "europe-west4", 
    schedule: "0 0 * * *", 
    timeZone: "Europe/London", 
    memory: "2GiB",
    timeoutSeconds: 300`
);

content = content.replace(
`exports.seoSubmissionAgent = onSchedule({ region: "europe-west4",
    schedule: "30 23 * * *", // 11:30 pm every day
    timeZone: "Europe/London",
    memory: "512MiB"`,
`exports.seoSubmissionAgent = onSchedule({ region: "europe-west4",
    schedule: "30 23 * * *", // 11:30 pm every day
    timeZone: "Europe/London",
    memory: "1GiB",
    timeoutSeconds: 120`
);

content = content.replace(
`exports.socialMediaSentinel = onSchedule({ region: "europe-west4",
    schedule: "every 4 hours",
    timeZone: "Europe/London",
    memory: "1GiB"`,
`exports.socialMediaSentinel = onSchedule({ region: "europe-west4",
    schedule: "every 4 hours",
    timeZone: "Europe/London",
    memory: "2GiB",
    timeoutSeconds: 300`
);

content = content.replace(
`exports.dailyMobileAudit = onSchedule({ region: "europe-west4",
    schedule: "0 18 * * *", // 6:00 pm every day
    timeZone: "Europe/London",
    memory: "1GiB"`,
`exports.dailyMobileAudit = onSchedule({ region: "europe-west4",
    schedule: "0 18 * * *", // 6:00 pm every day
    timeZone: "Europe/London",
    memory: "2GiB",
    timeoutSeconds: 300`
);

content = content.replace(
`exports.weeklyPerformanceDigest = onSchedule({ region: "europe-west4",
    schedule: "0 8 * * 1", // 8 AM Monday
    timeZone: "Europe/London",`,
`exports.weeklyPerformanceDigest = onSchedule({ region: "europe-west4",
    schedule: "0 8 * * 1", // 8 AM Monday
    timeZone: "Europe/London",
    memory: "2GiB",
    timeoutSeconds: 300,`
);

content = content.replace(
`exports.autonomousSEOGenerator = onSchedule({ region: "europe-west4",
    schedule: "0 23 * * *", 
    timeZone: "Europe/London",
    memory: "1GiB"`,
`exports.autonomousSEOGenerator = onSchedule({ region: "europe-west4",
    schedule: "0 23 * * *", 
    timeZone: "Europe/London",
    memory: "2GiB",
    timeoutSeconds: 300`
);

content = content.replace(
`exports.generateDailyTestimonial = onSchedule({ region: "europe-west4",
    schedule: "45 23 * * *", 
    timeZone: "Europe/London",
    memory: "512MiB",`,
`exports.generateDailyTestimonial = onSchedule({ region: "europe-west4",
    schedule: "45 23 * * *", 
    timeZone: "Europe/London",
    memory: "2GiB",
    timeoutSeconds: 300,`
);

fs.writeFileSync('functions/index.js', content);
console.log("Updated functions/index.js successfully.");
