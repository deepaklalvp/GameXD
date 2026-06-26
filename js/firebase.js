// Firebase SDK
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

// Replace with your Firebase config
const firebaseConfig = {
      apiKey: "AIzaSyCXDVWAt77XZfT3cwe2QQjvL-B9D7S7Tpo",
      authDomain: "gamexd-9e9a6.firebaseapp.com",
      projectId: "gamexd-9e9a6",
      storageBucket: "gamexd-9e9a6.firebasestorage.app",
      messagingSenderId: "667582393492",
      appId: "1:667582393492:web:4cc98499573e39a476d881",
      measurementId: "G-5FFP2085XW"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export Auth & Firestore
export const auth = getAuth(app);
export const db = getFirestore(app);
