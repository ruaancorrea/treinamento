import React, { createContext, useContext, useState, useEffect } from 'react';
import { doc, onSnapshot } from "firebase/firestore";
import { db } from '@/firebaseConfig';
import { updateDatabase, mockDatabase } from '@/data/mockData';

// 1. Cria o contexto que vai guardar os dados
const DatabaseContext = createContext();

// 2. Cria o "Provedor" que vai gerenciar e distribuir os dados
export const DatabaseProvider = ({ children }) => {
  const [database, setDatabase] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Referência para o nosso documento único no Firestore
    const docRef = doc(db, "main", "database");

    // onSnapshot é a mágica: ele "ouve" as mudanças no documento em tempo real
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        // Se o documento existe, atualiza nosso estado com os novos dados
        setDatabase(docSnap.data());
      } else {
        // Se não existe (primeiro uso), cria ele com os dados mock
        console.log("Nenhum banco de dados encontrado. Criando um novo...");
        updateDatabase(mockDatabase);
      }
      setLoading(false);
    }, (error) => {
      console.error("Erro ao ouvir o banco de dados:", error);
      setLoading(false);
    });

    // Função de limpeza: para de ouvir quando o componente é desmontado
    return () => unsubscribe();
  }, []);

  return (
    <DatabaseContext.Provider value={{ database, loading }}>
      {children}
    </DatabaseContext.Provider>
  );
};

// 3. Cria um hook customizado para facilitar o uso dos dados nos componentes
export const useDatabase = () => {
  return useContext(DatabaseContext);
};
