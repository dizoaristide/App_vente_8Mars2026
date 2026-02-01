// client/src/firebase-config.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// REMPLACEZ CECI PAR VOS PROPRES CLÉS (Copiées depuis la console Firebase)
const firebaseConfig = {
  apiKey: "AIzaSyALtapx5eUlb-fy-7CnFOKsWqm0BY9DwGE", 
  authDomain: "gestion-pagne.firebaseapp.com",
  projectId: "gestion-pagne",
  storageBucket: "gestion-pagne.firebasestorage.app",
  messagingSenderId: "395159995436",
  appId: "1:395159995436:web:5cb888ed33c82555317d89"
};

// Initialisation de Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);