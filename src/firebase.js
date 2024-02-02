import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBVoGkL5QTUBKvZa2s-UYjeAs8UOXQzQkI",
    authDomain: "schedule-app-763cd.firebaseapp.com",
    projectId: "schedule-app-763cd",
    storageBucket: "schedule-app-763cd.appspot.com",
    messagingSenderId: "820780212647",
    appId: "1:820780212647:web:3622afb5b9b3f0f10ed682",
    measurementId: "G-G2K5N8SF73"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { app, auth, db, storage };
