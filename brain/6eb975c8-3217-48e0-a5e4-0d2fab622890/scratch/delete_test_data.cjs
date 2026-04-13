const admin = require('firebase-admin');
admin.initializeApp({
  projectId: 'c4h-wesbite'
});
const db = admin.firestore();

async function deleteTestData() {
  console.log("Deleting test data...");
  
  // 1. Delete most recent 3 leads
  const leadsSnap = await db.collection('leads').orderBy('createdAt', 'desc').limit(3).get();
  for (const doc of leadsSnap.docs) {
    console.log(`Deleting lead: ${doc.id} (${doc.data().firstName})`);
    await doc.ref.delete();
  }

  // 2. Delete most recent 3 users (but NOT the admin)
  const usersSnap = await db.collection('users').orderBy('createdAt', 'desc').limit(10).get();
  let deletedUsers = 0;
  for (const doc of usersSnap.docs) {
    if (doc.id !== "Djh7uHK2yZYHC4Ta4xhbguaCJVl1" && deletedUsers < 3) {
      console.log(`Deleting user: ${doc.id} (${doc.data().email})`);
      await doc.ref.delete();
      deletedUsers++;
    }
  }

  console.log("Cleanup complete.");
}

deleteTestData().catch(console.error);
