import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Firebase configuration
// این مقادیر رو از Firebase Console بگیرید
const firebaseConfig = {
    apiKey: "AIzaSyBFhL7wiM3kRb77mPT4yHHFcnA3tiZNmTE",
    authDomain: "behrad-productivity.firebaseapp.com",
    projectId: "behrad-productivity",
    storageBucket: "behrad-productivity.firebasestorage.app",
    messagingSenderId: "422525510641",
    appId: "1:422525510641:web:3576cc8b5b23a82a3bda50",
    measurementId: "G-WEY7L5W7L0"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

export default app;
