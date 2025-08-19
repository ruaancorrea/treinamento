import { db } from '@/firebaseConfig';
import { doc, getDoc, setDoc } from "firebase/firestore";

// O nome do documento que irá armazenar toda a sua base de dados no Firestore
const DB_DOCUMENT_NAME = "database";
const DB_COLLECTION_NAME = "main"; // Nome da coleção

// Dados iniciais para popular o banco de dados na primeira vez
export const mockDatabase = {
    usuarios: [
      { id: 1, nome: "Admin Sistema", email: "admin@empresa.com", senha: "123456", tipo: "admin", departamento: "Todos", ativo: true, dataCriacao: "2025-01-01" },
      { id: 2, nome: "João Silva", email: "joao@empresa.com", senha: "123456", tipo: "funcionario", departamento: "Contabilidade", ativo: true, dataCriacao: "2025-01-15" },
      { id: 3, nome: "Maria Oliveira", email: "maria@empresa.com", senha: "123456", tipo: "funcionario", departamento: "Fiscal", ativo: true, dataCriacao: "2025-02-01" },
      { id: 4, nome: "Pedro Martins", email: "pedro@empresa.com", senha: "123456", tipo: "funcionario", departamento: "Contabilidade", ativo: true, dataCriacao: "2025-03-10" }
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
            titulo: 'Onboarding de Novos Colaboradores',
            descricao: 'Tudo o que você precisa saber para começar na NTW.',
            categoriaId: 1,
            conteudos: [ { type: 'video', title: 'Vídeo de Boas-vindas', url: 'https://www.youtube.com/embed/dQw4w9WgXcQ' } ],
            questionario: [ { pergunta: 'Qual o principal valor da empresa?', opcoes: ['Inovação', 'Cliente em primeiro lugar', 'Trabalho em equipe', 'Todos acima'], respostaCorreta: 'Todos acima' } ]
        },
        {
            id: 2,
            titulo: 'Introdução ao Simples Nacional',
            descricao: 'Entenda os conceitos básicos.',
            categoriaId: 2,
            conteudos: [ { type: 'video', title: 'Vídeo Aula', url: 'https://www.youtube.com/embed/dQw4w9WgXcQ' } ],
            questionario: [ { pergunta: 'Qual o limite de faturamento?', opcoes: ['R$ 4.8 milhões', 'R$ 3.6 milhões'], respostaCorreta: 'R$ 4.8 milhões' } ]
        }
    ],
    historico: [
        { id: 1, usuarioId: 2, treinamentoId: 1, concluido: true, notaQuestionario: 100, dataConclusao: '2025-06-18T10:00:00Z' },
        { id: 2, usuarioId: 3, treinamentoId: 1, concluido: true, notaQuestionario: 90, dataConclusao: new Date().toISOString() },
        { id: 3, usuarioId: 3, treinamentoId: 2, concluido: true, notaQuestionario: 95, dataConclusao: new Date().toISOString() },
        { id: 4, usuarioId: 4, treinamentoId: 1, concluido: true, notaQuestionario: 80, dataConclusao: '2025-01-20T15:00:00Z' },
    ],
    trilhas: [],
    
    // --- ESTRUTURA DA BASE DE CONHECIMENTO ATUALIZADA ---
    knowledgeBase: [
        { 
            id: 1, 
            type: 'artigo', // Tipo: Artigo de texto
            categoria: 'Processos Fiscais', 
            titulo: 'Como emitir uma Certidão Negativa de Débitos (CND)?', 
            conteudo: 'O processo para emitir a CND envolve acessar o site da Receita Federal ou do órgão estadual/municipal correspondente, preencher com o CNPJ da empresa e seguir os passos indicados na tela. Geralmente, a emissão é instantânea se não houver pendências. É crucial verificar a validade do documento após a emissão.',
            tags: ['CND', 'Fiscal', 'Certidão'],
            autorNome: 'Admin Sistema',
            dataCriacao: '2025-08-15T10:00:00Z'
        },
        { 
            id: 2, 
            type: 'link_externo', // Tipo: Link para site
            categoria: 'Legislação', 
            titulo: 'Portal do eSocial - Acesso Direto', 
            url: 'https://www.gov.br/esocial/pt-br',
            conteudo: 'Link direto para o portal oficial do eSocial. Use para consultas e downloads de manuais atualizados.',
            tags: ['eSocial', 'Governo', 'Link'],
            autorNome: 'Admin Sistema',
            dataCriacao: '2025-08-16T11:30:00Z'
        },
        { 
            id: 3, 
            type: 'link_treinamento', // Tipo: Link para um treinamento interno
            categoria: 'Treinamento Relacionado', 
            titulo: 'Relembre: Introdução ao Simples Nacional', 
            treinamentoId: 2, // ID do treinamento na lista 'treinamentos'
            conteudo: 'Este é um atalho rápido para o treinamento sobre o Simples Nacional. Ideal para rever conceitos chave antes de atender um cliente.',
            tags: ['Simples Nacional', 'Revisão', 'Treinamento'],
            autorNome: 'Admin Sistema',
            dataCriacao: '2025-08-17T14:00:00Z'
        }
    ]
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
    // Adicionamos a knowledgeBase aqui também para garantir que não quebre se o Firestore demorar
    return { ...mockDatabase, knowledgeBase: mockDatabase.knowledgeBase || [] };
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
