import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDgnNEceAFttgH3VLLwg0mJrM7deBFJa58",
  authDomain: "pdf-printer-d8c05.firebaseapp.com",
  projectId: "pdf-printer-d8c05",
  storageBucket: "pdf-printer-d8c05.appspot.com",
  messagingSenderId: "877966687709",
  appId: "1:877966687709:web:b0d2925f678ec074c3ca34"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);