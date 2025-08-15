// src/firebaseConfig.js

import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage"; // 1. Adicionado import do Storage

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBKPk8NyeQWn1Aygwf8q36cRxpC2AR-Leo",
  authDomain: "central-treinamento.firebaseapp.com",
  projectId: "central-treinamento",
  // A linha abaixo é a mais importante para o Storage funcionar
  storageBucket: "central-treinamento.appspot.com",
  messagingSenderId: "205424196328",
  appId: "1:205424196328:web:9caf94e132c3768091a75d"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Exporta as instâncias dos serviços que vamos usar
export const db = getFirestore(app);
export const storage = getStorage(app); // 2. Exportando a instância do Storage