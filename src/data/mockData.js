import { db } from '@/firebaseConfig';
import { doc, getDoc, setDoc } from "firebase/firestore";

// O nome do documento que irá armazenar toda a sua base de dados no Firestore
const DB_DOCUMENT_NAME = "database";
const DB_COLLECTION_NAME = "main"; // Nome da coleção

// Dados iniciais para popular o banco de dados na primeira vez
export const mockDatabase = {
    usuarios: [
      { id: 1, nome: "Admin Sistema", email: "admin@empresa.com", senha: "123456", tipo: "admin", departamento: "Todos", ativo: true, dataCriacao: "2025-01-01" },
      { id: 2, nome: "João Silva", email: "joao@empresa.com", senha: "123456", tipo: "funcionario", departamento: "Contabilidade", ativo: true, dataCriacao: "2025-01-15" }
    ],
    categorias: [
      { id: 1, nome: "Gestta", cor: "#3b82f6" },
      { id: 2, nome: "Domínio", cor: "#8b5cf6" }
    ],
    departamentos: [
      { id: 1, nome: "Contabilidade" },
      { id: 2, nome: "Fiscal" },
      { id: 3, nome: "Recursos Humanos" },
      { id: 4, nome: "Todos" }
    ],
    treinamentos: [],
    historico: [],
    trilhas: []
};


// Armazenaremos uma cópia local para evitar múltiplas leituras
let localDatabaseCache = null;

/**
 * Função para inicializar e/ou obter a base de dados do Firestore.
 * Se não existir, ela cria uma a partir do mock inicial.
 */
export const initializeDatabase = async () => {
    const docRef = doc(db, DB_COLLECTION_NAME, DB_DOCUMENT_NAME);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
        console.log("Banco de dados carregado do Firestore.");
        localDatabaseCache = docSnap.data();
    } else {
        console.log("Nenhum banco de dados encontrado. Criando um novo no Firestore.");
        await setDoc(docRef, mockDatabase);
        localDatabaseCache = mockDatabase;
    }
    return localDatabaseCache;
};

/**
 * Retorna a cópia local da base de dados.
 * Garante que os componentes tenham acesso síncrono aos dados após o carregamento inicial.
 */
export const getDatabase = () => {
  if (!localDatabaseCache) {
    console.warn("A base de dados ainda não foi inicializada. Usando dados mock temporariamente.");
    return mockDatabase;
  }
  return localDatabaseCache;
};

/**
 * Atualiza a base de dados completa no Firestore e na cópia local.
 */
export const updateDatabase = async (newData) => {
  try {
    const docRef = doc(db, DB_COLLECTION_NAME, DB_DOCUMENT_NAME);
    await setDoc(docRef, newData);
    localDatabaseCache = newData; // Atualiza o cache local
    console.log("Banco de dados atualizado no Firestore.");
    return true;
  } catch (error) {
    console.error("Erro ao atualizar o banco de dados no Firestore:", error);
    return false;
  }
};