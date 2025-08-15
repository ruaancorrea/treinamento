// src/firebaseConfig.js

import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBKPk8NyeQWn1Aygwf8q36cRxpC2AR-Leo",
  authDomain: "central-treinamento.firebaseapp.com",
  projectId: "central-treinamento",
  storageBucket: "central-treinamento.firebasestorage.app",
  messagingSenderId: "205424196328",
  appId: "1:205424196328:web:9caf94e132c3768091a75d"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Exporta a instância do Firestore para ser usada em outros arquivos
export const db = getFirestore(app);