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
    where,
    updateDoc
} from "firebase/firestore";

const PAGE_SIZE = 10; // Reduzimos um pouco para equilibrar as duas buscas

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
 * (VERSÃO FINAL E OTIMIZADA COM PAGINAÇÃO REAL)
 * Busca treinamentos para o usuário com paginação, usando duas queries separadas.
 */
export const getPaginatedTrainingsForUser = async (userDepartment, options = {}) => {
    const { lastVisibleDept = null, lastVisibleTodos = null } = options;
    
    try {
        const trainingsRef = collection(db, 'treinamentos');
        
        // Query 1: Para o departamento específico do usuário
        const deptBaseQuery = query(
            trainingsRef,
            where('ativo', '==', true),
            where('departamento', '==', userDepartment),
            orderBy('dataPublicacao', 'desc'),
            limit(PAGE_SIZE)
        );
        const deptQuery = lastVisibleDept ? query(deptBaseQuery, startAfter(lastVisibleDept)) : deptBaseQuery;

        // Query 2: Para o departamento "Todos"
        const todosBaseQuery = query(
            trainingsRef,
            where('ativo', '==', true),
            where('departamento', '==', 'Todos'),
            orderBy('dataPublicacao', 'desc'),
            limit(PAGE_SIZE)
        );
        const todosQuery = lastVisibleTodos ? query(todosBaseQuery, startAfter(lastVisibleTodos)) : todosBaseQuery;

        // Executa as duas buscas em paralelo
        const [deptSnapshot, todosSnapshot] = await Promise.all([
            getDocs(deptQuery),
            getDocs(todosQuery)
        ]);

        // Junta os resultados
        const trainingsData = [];
        deptSnapshot.forEach(doc => trainingsData.push({ id: doc.id, ...doc.data() }));
        todosSnapshot.forEach(doc => trainingsData.push({ id: doc.id, ...doc.data() }));
        
        // Pega os últimos documentos de cada busca para a próxima página
        const newLastVisibleDept = deptSnapshot.docs.length > 0 ? deptSnapshot.docs[deptSnapshot.docs.length - 1] : null;
        const newLastVisibleTodos = todosSnapshot.docs.length > 0 ? todosSnapshot.docs[todosSnapshot.docs.length - 1] : null;

        return {
            data: trainingsData,
            lastVisibleDept: newLastVisibleDept,
            lastVisibleTodos: newLastVisibleTodos
        };

    } catch (error) {
        console.error(`Erro ao buscar treinamentos paginados:`, error);
        return { data: [], lastVisibleDept: null, lastVisibleTodos: null };
    }
};


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
        const docRef = doc(db, collectionName, String(docId));
        await setDoc(docRef, data, { merge: true });
    } catch (error) {
        console.error(`Erro ao atualizar documento em ${collectionName}:`, error);
    }
};

export const resetUserData = async (userId) => {
    try {
        const stringUserId = String(userId);

        const resultadosQuery = query(collection(db, 'resultadosSimulados'), where('usuarioId', '==', userId));
        const resultadosSnapshot = await getDocs(resultadosQuery);
        for (const doc of resultadosSnapshot.docs) {
            await deleteDoc(doc.ref);
        }

        const historicoQuery = query(collection(db, 'historico'), where('usuarioId', '==', userId));
        const historicoSnapshot = await getDocs(historicoQuery);
        for (const doc of historicoSnapshot.docs) {
            await deleteDoc(doc.ref);
        }

        const userRef = doc(db, 'usuarios', stringUserId);
        await updateDoc(userRef, {
            titulo: 'Iniciante',
            medalhas: []
        });

    } catch (error) {
        console.error(`Erro ao zerar dados do usuário ${userId}:`, error);
        throw new Error("Não foi possível zerar o desempenho do usuário.");
    }
};

export const deleteData = async (collectionName, docId) => {
    try {
        await deleteDoc(doc(db, collectionName, String(docId)));
    } catch (error) {
        console.error(`Erro ao deletar documento em ${collectionName}:`, error);
    }
};
