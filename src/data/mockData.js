// Mock database - In production, this would be replaced with actual database
export const mockDatabase = {
  usuarios: [
    {
      id: 1,
      nome: "Admin Sistema",
      email: "admin@empresa.com",
      senha: "123456",
      tipo: "admin",
      departamento: "Todos",
      ativo: true,
      dataCriacao: "2025-01-01"
    },
    {
      id: 2,
      nome: "João Silva",
      email: "joao@empresa.com",
      senha: "123456",
      tipo: "funcionario",
      departamento: "Contabilidade",
      ativo: true,
      dataCriacao: "2025-01-15"
    },
    {
      id: 3,
      nome: "Maria Santos",
      email: "maria@empresa.com",
      senha: "123456",
      tipo: "funcionario",
      departamento: "Fiscal",
      ativo: true,
      dataCriacao: "2025-02-01"
    }
  ],
  categorias: [
    { id: 1, nome: "Gestta", cor: "#3b82f6" },
    { id: 2, nome: "Domínio", cor: "#8b5cf6" },
    { id: 3, nome: "Obrigações Legais", cor: "#06b6d4" },
    { id: 4, nome: "Procedimentos", cor: "#10b981" }
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
      descricao: "Treinamento básico para utilização do sistema Gestta, abordando funcionalidades principais e navegação.",
      video: "https://www.youtube.com/embed/dQw4w9WgXcQ",
      categoriaId: 1,
      departamento: "Todos",
      arquivosComplementares: ["manual_gestta.pdf", "guia_rapido.pdf"],
      perguntas: [
        {
          pergunta: "Qual é a função principal do módulo de tarefas no Gestta?",
          opcoes: ["Gerenciar clientes", "Controlar tarefas e prazos", "Emitir notas fiscais"],
          respostaCorreta: 1
        },
        {
          pergunta: "Como acessar o relatório de produtividade?",
          opcoes: ["Menu Relatórios > Produtividade", "Menu Principal > Dashboard", "Menu Configurações"],
          respostaCorreta: 0
        }
      ],
      dataPublicacao: "2025-01-10",
      dataExpiracao: null,
      obrigatorio: true,
      ativo: true
    },
    {
      id: 2,
      titulo: "Domínio Público - Procedimentos",
      descricao: "Procedimentos para lidar com questões de domínio público na contabilidade empresarial.",
      video: "https://www.youtube.com/embed/dQw4w9WgXcQ",
      categoriaId: 2,
      departamento: "Contabilidade",
      arquivosComplementares: ["dominio_publico_guia.pdf"],
      perguntas: [
        {
          pergunta: "Quando um bem entra em domínio público?",
          opcoes: ["Após 50 anos", "Após 70 anos", "Imediatamente"],
          respostaCorreta: 1
        }
      ],
      dataPublicacao: "2025-01-15",
      dataExpiracao: "2025-12-31",
      obrigatorio: false,
      ativo: true
    },
    {
      id: 3,
      titulo: "Obrigações Fiscais Mensais",
      descricao: "Calendário e procedimentos para cumprimento das obrigações fiscais mensais.",
      video: "https://www.youtube.com/embed/dQw4w9WgXcQ",
      categoriaId: 3,
      departamento: "Fiscal",
      arquivosComplementares: ["calendario_fiscal.pdf", "checklist_mensal.xlsx"],
      perguntas: [
        {
          pergunta: "Qual o prazo para entrega da DCTF?",
          opcoes: ["Dia 15", "Dia 20", "Último dia útil"],
          respostaCorreta: 0
        }
      ],
      dataPublicacao: "2025-02-01",
      dataExpiracao: null,
      obrigatorio: true,
      ativo: true
    }
  ],
  historico: [
    {
      id: 1,
      usuarioId: 2,
      treinamentoId: 1,
      concluido: true,
      dataConclusao: "2025-02-10",
      notaQuestionario: 10,
      tempoAssistido: 1800 // em segundos
    },
    {
      id: 2,
      usuarioId: 3,
      treinamentoId: 1,
      concluido: false,
      dataConclusao: null,
      notaQuestionario: null,
      tempoAssistido: 900
    },
    {
      id: 3,
      usuarioId: 2,
      treinamentoId: 2,
      concluido: true,
      dataConclusao: "2025-02-12",
      notaQuestionario: 8,
      tempoAssistido: 2400
    }
  ],
  // --- NOVA SEÇÃO ADICIONADA ---
  trilhas: [
    {
      id: 1,
      titulo: "Integração Novos Colaboradores",
      descricao: "Trilha essencial para todos os novos funcionários da empresa.",
      departamento: "Todos",
      ativo: true,
      treinamentos: [1, 2] // IDs dos treinamentos em ordem
    },
    {
      id: 2,
      titulo: "Especialista Fiscal",
      descricao: "Aprofunde seus conhecimentos na área fiscal.",
      departamento: "Fiscal",
      ativo: true,
      treinamentos: [3]
    }
  ]
};

// Utility functions for localStorage management
export const getFromStorage = (key) => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  } catch (error) {
    console.error('Error getting from storage:', error);
    return null;
  }
};

export const saveToStorage = (key, data) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    return true;
  } catch (error) {
    console.error('Error saving to storage:', error);
    return false;
  }
};

// Initialize database in localStorage if not exists
export const initializeDatabase = () => {
  const existingData = getFromStorage('trainingDatabase');
  if (!existingData) {
    saveToStorage('trainingDatabase', mockDatabase);
  } else if (!existingData.trilhas) { // Adiciona a seção de trilhas se não existir
    existingData.trilhas = mockDatabase.trilhas;
    saveToStorage('trainingDatabase', existingData);
  }
  return getFromStorage('trainingDatabase');
};

// Database operations
export const getDatabase = () => {
  return getFromStorage('trainingDatabase') || mockDatabase;
};

export const updateDatabase = (newData) => {
  return saveToStorage('trainingDatabase', newData);
};
