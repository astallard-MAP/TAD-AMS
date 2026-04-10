const { google } = require("googleapis");
console.log("Attempting to discover mybusiness API...");
try {
  const mybusiness = google.mybusiness('v4');
  console.log("Success! mybusiness v4 found.");
} catch (e) {
  console.log("Failed: " + e.message);
}
try {
  const mybusiness = google.mybusinessplaces('v1');
  console.log("Success! mybusinessplaces v1 found.");
} catch (e) {
  console.log("Failed: " + e.message);
}
