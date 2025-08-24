// Firebase initialization and exports
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDSk8LUtvpfOBKOuX2uDyTGo1jZte0jKuM",
  authDomain: "healthcareappbackend.firebaseapp.com",
  projectId: "healthcareappbackend",
  storageBucket: "healthcareappbackend.firebasestorage.app",
  messagingSenderId: "557899942025",
  appId: "1:557899942025:web:bba6eadb626433ef7e1e58"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
