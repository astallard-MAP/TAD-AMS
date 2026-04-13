
const admin = require('firebase-admin');
admin.initializeApp({
  projectId: 'c4h-wesbite'
});
const db = admin.firestore();

async function findTestProfile() {
  console.log("Searching for test profiles...");
  const profiles = await db.collection('userProfiles').limit(3).get();
  profiles.forEach(doc => {
    console.log(`Profile: ${doc.id} =>`, JSON.stringify(doc.data()));
  });
  
  const properties = await db.collection('properties').limit(3).get();
  properties.forEach(doc => {
    console.log(`Property: ${doc.id} =>`, JSON.stringify(doc.data()));
  });

  const leads = await db.collection('leads').limit(3).get();
  leads.forEach(doc => {
    console.log(`Lead: ${doc.id} =>`, JSON.stringify(doc.data()));
  });
}

findTestProfile().catch(console.error);
