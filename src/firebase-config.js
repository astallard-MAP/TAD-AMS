// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";

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

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);

export { app, analytics, db };
