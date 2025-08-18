// src/contexts/DatabaseContext.jsx

import React, { createContext, useContext, useState, useEffect } from 'react';
import { doc, onSnapshot } from "firebase/firestore";
import { db } from '@/firebaseConfig';
import { updateDatabase } from '@/data/mockData';

// 1. Cria o contexto
const DatabaseContext = createContext();

// 2. Cria o "Provedor"
export const DatabaseProvider = ({ children }) => {
  const [database, setDatabase] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const docRef = doc(db, "main", "database");

    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        setDatabase(docSnap.data());
      } else {
        console.warn("Documento do banco de dados não encontrado no Firestore.");
        setDatabase(null); 
      }
      setLoading(false);
    }, (error) => {
      console.error("Erro ao ouvir o banco de dados:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // --- INÍCIO DA CORREÇÃO ---
  // A função `retakeTraining` precisa ser definida aqui.
  const retakeTraining = (userId, trainingId) => {
    if (database && database.historico) {
      const historyIndex = database.historico.findIndex(h => h.usuarioId === userId && h.treinamentoId === trainingId);

      if (historyIndex !== -1) {
        const updatedHistorico = [...database.historico];
        updatedHistorico[historyIndex] = {
          ...updatedHistorico[historyIndex],
          concluido: false,
          dataConclusao: null,
          notaQuestionario: null,
          tempoAssistido: 0,
        };
        
        updateDatabase({ ...database, historico: updatedHistorico });
      }
    }
  };
  // --- FIM DA CORREÇÃO ---

  return (
    // Agora a função `retakeTraining` existe e pode ser passada no value.
    <DatabaseContext.Provider value={{ database, loading, retakeTraining }}>
      {children}
    </DatabaseContext.Provider>
  );
};

// 3. Cria um hook customizado
export const useDatabase = () => {
  const context = useContext(DatabaseContext);
  if (!context) {
    throw new Error("useDatabase must be used within a DatabaseProvider");
  }
  return context;
};