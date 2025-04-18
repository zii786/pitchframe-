// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCJq9qhMJlKISOtQNTidfg-5JYyAiyrhhM",
  authDomain: "pitchframe-6967a.firebaseapp.com",
  projectId: "pitchframe-6967a",
  storageBucket: "pitchframe-6967a.firebasestorage.app",
  messagingSenderId: "801200566992",
  appId: "1:801200566992:web:9dc20d8ad085577eb724d5"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Get Auth and Firestore instances
const auth = getAuth(app);
const db = getFirestore(app);

// Export the auth and db objects
export { auth, db };

// Make auth and db available globally
window.auth = auth;
window.db = db;