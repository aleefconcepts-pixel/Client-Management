import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDBhoA7DO0YvDw4Ch6scERbkI0GVw7o17U",
  authDomain: "client-management-d34e8.firebaseapp.com",
  projectId: "client-management-d34e8",
  storageBucket: "client-management-d34e8.firebasestorage.app",
  messagingSenderId: "563365315162",
  appId: "1:563365315162:web:7d82d94c4df229ac21ce63",
  measurementId: "G-Q4M3L8CDR3"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore and export it
export const db = getFirestore(app);
