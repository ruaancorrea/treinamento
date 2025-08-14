// Base de dados inicial usada como fallback
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
  treinamentos: [
    {
      id: 1,
      titulo: "Introdução ao Sistema Gestta",
      descricao: "Treinamento básico para utilização do sistema Gestta.",
      video: "https://www.youtube.com/embed/dQw4w9WgXcQ",
      categoriaId: 1,
      departamento: "Todos",
      arquivosComplementares: ["manual_gestta.pdf"],
      perguntas: [
        { pergunta: "Qual a função do Gestta?", opcoes: ["Gerenciar tarefas", "Emitir notas", "Fazer café"], respostaCorreta: 0 }
      ],
      dataPublicacao: "2025-01-10",
      dataExpiracao: null,
      obrigatorio: true,
      ativo: true
    }
  ],
  historico: [],
  trilhas: []
};

// --- FUNÇÕES DE INTERAÇÃO COM O LOCALSTORAGE (A PARTE IMPORTANTE) ---

// Função para obter dados do localStorage
const getFromStorage = (key) => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  } catch (error) {
    console.error('Erro ao ler do localStorage:', error);
    return null;
  }
};

// Função para guardar dados no localStorage
const saveToStorage = (key, data) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    return true;
  } catch (error) {
    console.error('Erro ao guardar no localStorage:', error);
    return false;
  }
};

// Função para inicializar a base de dados
export const initializeDatabase = () => {
  const existingData = getFromStorage('trainingDatabase');
  if (!existingData) {
    saveToStorage('trainingDatabase', mockDatabase);
  }
  return getFromStorage('trainingDatabase');
};

// Função para obter a base de dados completa
export const getDatabase = () => {
  return getFromStorage('trainingDatabase') || mockDatabase;
};

// --- ESTA É A FUNÇÃO CORRIGIDA ---
// Função para atualizar e GUARDAR a base de dados completa
export const updateDatabase = (newData) => {
  // A linha abaixo estava em falta ou incorreta, impedindo que os dados fossem guardados
  return saveToStorage('trainingDatabase', newData);
};