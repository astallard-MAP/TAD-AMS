const admin = require('firebase-admin');
admin.initializeApp({
  projectId: 'c4h-wesbite'
});
const db = admin.firestore();

async function purgeTestLeads() {
  console.log("Purge initiated...");
  const leadsSnap = await db.collection('leads').get();
  console.log(`Found ${leadsSnap.size} total leads.`);
  
  for (const doc of leadsSnap.docs) {
    const data = doc.data();
    const name = `${data.firstName} ${data.surname}`.toLowerCase();
    const address = (data.address || "").toLowerCase();
    
    const isTest = name.includes("test") || 
                   name.includes("jane smith") || 
                   name.includes("john doe") || 
                   address.includes("test st");

    if (isTest) {
      console.log(`Deleting test lead: ${doc.id} (${name})`);
      await doc.ref.delete();
    }
  }
  
  // Also purge test users
  const usersSnap = await db.collection('users').get();
  for (const doc of usersSnap.docs) {
    const email = (doc.data().email || "").toLowerCase();
    if (email.includes("test") || email.includes("example.com")) {
      console.log(`Deleting test user: ${doc.id} (${email})`);
      await doc.ref.delete();
    }
  }

  console.log("Purge complete.");
}

purgeTestLeads().catch(console.error);
