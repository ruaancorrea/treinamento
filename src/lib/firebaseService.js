import { db } from '@/firebaseConfig';
import { 
    collection, 
    doc, 
    getDocs, 
    addDoc, 
    setDoc, 
    deleteDoc, 
    query, 
    orderBy, 
    limit, 
    startAfter,
    where
} from "firebase/firestore";

const PAGE_SIZE = 15;

// --- As funções getAllData e getPaginatedData não mudam ---
export const getAllData = async (collectionName) => {
    try {
        const querySnapshot = await getDocs(collection(db, collectionName));
        const data = [];
        querySnapshot.forEach((doc) => {
            data.push({ id: doc.id, ...doc.data() });
        });
        return data;
    } catch (error) {
        console.error(`Erro ao buscar dados de ${collectionName}:`, error);
        return [];
    }
};

export const getPaginatedData = async (collectionName, options) => {
    const safeOptions = options || {};
    const { lastVisible = null, orderByField = "dataCriacao", orderDirection = "desc" } = safeOptions;
    
    try {
        const baseQuery = query(
            collection(db, collectionName), 
            orderBy(orderByField, orderDirection), 
            limit(PAGE_SIZE)
        );
        const q = lastVisible ? query(baseQuery, startAfter(lastVisible)) : baseQuery;
        const querySnapshot = await getDocs(q);
        
        const data = [];
        querySnapshot.forEach((doc) => {
            data.push({ id: doc.id, ...doc.data() });
        });
        
        const newLastVisible = querySnapshot.docs.length > 0 
            ? querySnapshot.docs[querySnapshot.docs.length - 1] 
            : null;

        return { data, lastVisible: newLastVisible };
    } catch (error) {
        console.error(`Erro ao buscar dados paginados de ${collectionName}:`, error);
        return { data: [], lastVisible: null };
    }
};


/**
 * (VERSÃO PLANO C - SEM ÍNDICES)
 * Esta função lê todos os treinamentos ativos e filtra no código.
 * É menos eficiente e mais custosa, mas não requer índices.
 * A paginação é simulada no lado do cliente.
 */
export const getPaginatedTrainingsForUser = async (userDepartment, options = {}) => {
    console.warn("Atenção: Usando modo de busca de treinamentos não otimizado (Plano C).");
    const { page = 1 } = options; 
    
    try {
        const trainingsRef = collection(db, 'treinamentos');
        
        // 1. Busca TODOS os treinamentos que estão ativos.
        const q = query(trainingsRef, where('ativo', '==', true));
        const querySnapshot = await getDocs(q);

        const allActiveTrainings = [];
        querySnapshot.forEach(doc => {
            allActiveTrainings.push({ id: doc.id, ...doc.data() });
        });

        // 2. Filtra no código para o departamento do usuário + "Todos".
        const userVisibleTrainings = allActiveTrainings.filter(
            training => training.departamento === userDepartment || training.departamento === 'Todos'
        );

        // 3. Ordena por data no código.
        userVisibleTrainings.sort((a, b) => new Date(b.dataPublicacao) - new Date(a.dataPublicacao));
        
        // 4. Simula a paginação. Esta lógica foi removida para simplificar,
        //    pois carregar tudo de uma vez é a premissa deste plano.
        //    Vamos retornar tudo e a lógica de "Carregar Mais" será desativada.
        
        return { data: userVisibleTrainings, lastVisible: null }; // Retorna null para desativar o "Carregar mais".

    } catch (error) {
        // Este erro não deverá ser de índice.
        console.error(`Erro ao buscar treinamentos (Plano C):`, error);
        return { data: [], lastVisible: null };
    }
};


// --- Funções de Escrita (ADD, UPDATE, DELETE) - Sem alterações ---
export const addData = async (collectionName, data) => {
    try {
        const docRef = await addDoc(collection(db, collectionName), data);
        return docRef.id;
    } catch (error) {
        console.error(`Erro ao adicionar documento em ${collectionName}:`, error);
        return null;
    }
};

export const updateData = async (collectionName, docId, data) => {
    try {
        const docRef = doc(db, collectionName, docId);
        await setDoc(docRef, data, { merge: true });
    } catch (error) {
        console.error(`Erro ao atualizar documento em ${collectionName}:`, error);
    }
};

export const deleteData = async (collectionName, docId) => {
    try {
        await deleteDoc(doc(db, collectionName, docId));
    } catch (error) {
        console.error(`Erro ao deletar documento em ${collectionName}:`, error);
    }
};