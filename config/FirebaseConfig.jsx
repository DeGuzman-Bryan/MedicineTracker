// config/FirebaseConfig.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from "firebase/firestore";

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
// 2. Initialize the Firebase App (Declare this ONLY ONCE)
export const app = initializeApp(firebaseConfig);

// 3. Initialize Auth using the app instance above
export const auth = getAuth(app);

// 4. Initialize Firestore with Persistence (Offline Support)
// We use initializeFirestore instead of getFirestore(app)
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  })
});