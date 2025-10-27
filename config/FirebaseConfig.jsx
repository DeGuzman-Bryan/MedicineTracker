// config/FirebaseConfig.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAb4nki_g1hYhZRaTVe_ymVbVe6dhpzji0",
  authDomain: "medicinetracker-fea84.firebaseapp.com",
  projectId: "medicinetracker-fea84",
  storageBucket: "medicinetracker-fea84.appspot.com",
  messagingSenderId: "298214109367",
  appId: "1:298214109367:web:f410e9bda981840139dd32",
  measurementId: "G-QY1RFG0168",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export Auth and Firestore instances
export const auth = getAuth(app);
export const db = getFirestore(app);
