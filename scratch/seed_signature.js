const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccountKey.json");

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

const signatureTemplate = {
  name: "Global Email Signature",
  subject: "N/A - Signature Only",
  content: `
<div style="margin-top: 30px; font-family: 'Inter', system-ui, -apple-system, sans-serif; color: #1e293b; line-height: 1.6; border-top: 1px solid #e2e8f0; padding-top: 20px;">
    <p style="margin: 0; font-weight: 700; font-size: 1.1rem; color: #1e293b;">Andrew Stallard</p>
    <p style="margin: 0; color: #EB287A; font-weight: 600; font-size: 0.9rem;">Managing Director | Cash 4 Houses</p>
    
    <div style="margin-top: 15px; font-size: 0.9rem;">
        <p style="margin: 2px 0;"><i class="fas fa-phone"></i> <strong>Tel:</strong> 01704 416 323</p>
        <p style="margin: 2px 0;"><i class="fas fa-envelope"></i> <strong>E:</strong> <a href="mailto:andy@cash4houses.co.uk" style="color: #EB287A; text-decoration: none;">andy@cash4houses.co.uk</a></p>
    </div>

    <div style="margin-top: 20px;">
        <p style="margin: 0 0 10px 0; font-weight: 700; font-size: 0.9rem; color: #475569;">Feeling social then follow us!</p>
        <div style="display: flex; gap: 15px; align-items: center;">
            <a href="https://www.facebook.com/Cash4Houses.co" style="text-decoration: none;">
                <img src="https://img.icons8.com/color/48/facebook-new.png" width="28" height="28" alt="Facebook">
            </a>
            <a href="https://www.instagram.com/cash.4houses/" style="text-decoration: none;">
                <img src="https://img.icons8.com/color/48/instagram-new--v1.png" width="28" height="28" alt="Instagram">
            </a>
        </div>
    </div>

    <div style="margin-top: 30px; padding: 20px; background: #f8fafc; border-radius: 8px; font-size: 0.75rem; color: #64748b; font-style: italic; border-left: 4px solid #e2e8f0;">
        <p style="margin: 0 0 10px 0;">This document, including any attachments to it, contains information that is private and confidential and should be read only by persons to whom it is addressed.</p>
        <p style="margin: 0 0 10px 0;">This document is sent for information purposes only and shall not have the effect of creating a contract. No person should rely upon its contents.</p>
        <p style="margin: 0 0 10px 0;">Any views or opinions presented are solely those of the author and do not necessarily represent those of Cash 4 Houses who shall not be under any liability in damages or otherwise for any reliance that may be placed upon such views by any person.</p>
        <p style="margin: 0;">If you have received this e-mail in error, please notify the sender(s) immediately by telephone. Please also destroy and delete the message from your computer.</p>
    </div>
</div>
  `,
  version: 1,
  history: [],
  updatedAt: admin.firestore.FieldValue.serverTimestamp()
};

async function seedSignature() {
  try {
    await db.collection("emailTemplates").doc("globalSignature").set(signatureTemplate);
    console.log("Global Signature Template seeded successfully.");
    process.exit(0);
  } catch (err) {
    console.error("Seed failed:", err);
    process.exit(1);
  }
}

seedSignature();
