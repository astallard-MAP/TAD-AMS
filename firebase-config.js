// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics, isSupported, logEvent } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { getStorage } from "firebase/storage";
import { getFunctions } from "firebase/functions";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCLiBVflUaUA7tqdUOfxRb4DkXzLAeEmlI",
  authDomain: "c4h-wesbite.firebaseapp.com",
  projectId: "c4h-wesbite",
  storageBucket: "c4h-wesbite.firebasestorage.app",
  messagingSenderId: "1089937234221",
  appId: "1:1089937234221:web:c30911a247155132ab1ba4",
  measurementId: "G-VN391ZERB0"
};

// Initialise Firebase
const app = initializeApp(firebaseConfig);

// Resilient Analytics Initialisation
let analytics = null;
isSupported().then(yes => {
    if (yes) {
        try {
            analytics = getAnalytics(app);
        } catch (e) {
            console.warn("Analytics blocked or failed to initialise:", e.message);
        }
    }
}).catch(() => { /* Silent fail */ });
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);
const functions = getFunctions(app);

// New: Auth State Resolution Promise for data synchronisation
const authReady = new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
        resolve(user);
        unsubscribe();
    });
});

export { app, analytics, db, auth, storage, functions, authReady, logEvent };
