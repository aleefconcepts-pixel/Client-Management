import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Secure Firebase Configuration with Environment Variables and safe defaults
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDBhoA7DO0YvDw4Ch6scERbkI0GVw7o17U",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "client-management-d34e8.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "client-management-d34e8",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "client-management-d34e8.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "563365315162",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:563365315162:web:7d82d94c4df229ac21ce63",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-Q4M3L8CDR3"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore and export it
export const db = getFirestore(app);
