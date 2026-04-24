import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
// FIX: Import getFirestore instead of initializeFirestore
import { getFirestore } from "firebase/firestore";

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
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// FIX: Use standard getFirestore. 
// This bypasses the buggy local cache completely so your writes won't crash.
export const db = getFirestore(app);