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

/**
 * Busca todos os documentos de uma coleção.
 */
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

/**
 * Busca TODOS os treinamentos disponíveis para um utilizador.
 */
export const getTrainingsForUser = async (userDepartment) => {
    try {
        const trainingsRef = collection(db, 'treinamentos');
        const deptQuery = query(trainingsRef, where('ativo', '==', true), where('departamento', '==', userDepartment));
        const allDeptsQuery = query(trainingsRef, where('ativo', '==', true), where('departamento', '==', 'Todos'));
        const [deptSnapshot, allDeptsSnapshot] = await Promise.all([getDocs(deptQuery), getDocs(allDeptsQuery)]);
        const trainingsMap = new Map();
        deptSnapshot.forEach((doc) => trainingsMap.set(doc.id, { id: doc.id, ...doc.data() }));
        allDeptsSnapshot.forEach((doc) => trainingsMap.set(doc.id, { id: doc.id, ...doc.data() }));
        return Array.from(trainingsMap.values());
    } catch (error) {
        console.error(`Erro ao buscar treinamentos para o utilizador:`, error);
        return [];
    }
};

/**
 * Busca documentos de uma coleção com paginação e ordenação customizada.
 */
export const getPaginatedData = async (collectionName, options) => {
    // --- CORREÇÃO AQUI ---
    // Garante que 'options' seja sempre um objeto, mesmo que nada seja passado.
    // Isto evita o erro 'Cannot read properties of null'.
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
 * Adiciona um novo documento a uma coleção.
 */
export const addData = async (collectionName, data) => {
    try {
        const docRef = await addDoc(collection(db, collectionName), data);
        return docRef.id;
    } catch (error) {
        console.error(`Erro ao adicionar documento em ${collectionName}:`, error);
        return null;
    }
};

/**
 * Atualiza um documento existente em uma coleção.
 */
export const updateData = async (collectionName, docId, data) => {
    try {
        const docRef = doc(db, collectionName, docId);
        await setDoc(docRef, data, { merge: true });
    } catch (error) {
        console.error(`Erro ao atualizar documento em ${collectionName}:`, error);
    }
};

/**
 * Deleta um documento de uma coleção.
 */
export const deleteData = async (collectionName, docId) => {
    try {
        await deleteDoc(doc(db, collectionName, docId));
    } catch (error) {
        console.error(`Erro ao deletar documento em ${collectionName}:`, error);
    }
};