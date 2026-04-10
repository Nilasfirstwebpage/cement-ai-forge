import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// TODO: Replace with your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyD6aB6aKBL2DljI5CGybd83QLp4ZDtdTRA",
  authDomain: "cementop-a5407.firebaseapp.com",
  projectId: "cementop-a5407",
  storageBucket: "cementop-a5407.firebasestorage.app",
  messagingSenderId: "384766074374",
  appId: "1:384766074374:web:231432d150f3d1c4732d87",
  measurementId: "G-41776ZRZ6E"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };