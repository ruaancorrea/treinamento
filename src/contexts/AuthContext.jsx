import React, { createContext, useContext, useState, useEffect } from 'react';
// --- MUDANÇA PRINCIPAL ---
import { db } from '@/firebaseConfig';
import { collection, query, where, getDocs } from 'firebase/firestore';

const AuthContext = createContext();

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Esta parte continua igual, pois verifica se o usuário já está logado no navegador
        const savedUser = localStorage.getItem('currentUser');
        if (savedUser) {
            setUser(JSON.parse(savedUser));
        }
        setLoading(false);
    }, []);

    // --- FUNÇÃO REFATORADA ---
    const login = async (email, senha) => {
        try {
            // 1. Cria uma consulta para buscar o usuário pelo email na coleção 'usuarios'
            const usersRef = collection(db, 'usuarios');
            const q = query(usersRef, where("email", "==", email));
            
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                return { success: false, error: 'Credenciais inválidas ou usuário não encontrado' };
            }

            // 2. Pega o primeiro usuário encontrado (email deve ser único)
            const userDoc = querySnapshot.docs[0];
            const foundUser = { id: userDoc.id, ...userDoc.data() };

            // 3. Verifica a senha e se o usuário está ativo
            // ATENÇÃO: Salvar senhas em texto plano é uma falha grave de segurança.
            // O ideal é migrar para o Firebase Authentication no futuro.
            if (foundUser.senha === senha && foundUser.ativo) {
                const userWithoutPassword = { ...foundUser };
                delete userWithoutPassword.senha;
                
                setUser(userWithoutPassword);
                localStorage.setItem('currentUser', JSON.stringify(userWithoutPassword));
                return { success: true, user: userWithoutPassword };
            } else {
                return { success: false, error: 'Credenciais inválidas ou usuário inativo' };
            }

        } catch (error) {
            console.error("Erro no login:", error);
            return { success: false, error: 'Ocorreu um erro no servidor. Tente novamente.' };
        }
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('currentUser');
    };

    const isAdmin = () => {
        return user?.tipo === 'admin';
    };

    const value = {
        user,
        login,
        logout,
        isAdmin,
        loading
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};
