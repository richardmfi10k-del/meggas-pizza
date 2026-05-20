// src/firebase.js
// ⚠️ REEMPLAZA estos valores con los de tu proyecto en Firebase Console
// Instrucciones: https://console.firebase.google.com → Crear proyecto → Agregar app web

import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyATipeF2-sePr15g3MWItUnqiwZWWoZn18",
  authDomain: "meggas-pizza.firebaseapp.com",
  projectId: "meggas-pizza",
  storageBucket: "meggas-pizza.firebasestorage.app",
  messagingSenderId: "135910620658",
  appId: "1:135910620658:web:6097b51641ba8da8ae7f6b"
};


const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export default app;
