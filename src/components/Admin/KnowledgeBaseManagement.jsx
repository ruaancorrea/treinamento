import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { PlusCircle, Edit, Trash2, FileText, Link as LinkIcon, GraduationCap, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from '@/contexts/AuthContext';
// --- MUDANÇA PRINCIPAL ---
import { addData, updateData, deleteData } from '@/lib/firebaseService';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/firebaseConfig';

// Função auxiliar para buscar todos os documentos de uma coleção
const getAllData = async (collectionName) => {
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

const KnowledgeBaseManagement = () => {
    const { user } = useAuth();
    const [dbData, setDbData] = useState({ articles: [], trainings: [] });
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [currentArticle, setCurrentArticle] = useState(null);
    const [articleType, setArticleType] = useState('artigo');
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();

    const loadData = async () => {
        setIsLoading(true);
        const articlesData = await getAllData('knowledgeBase');
        const trainingsData = await getAllData('treinamentos');
        setDbData({
            articles: articlesData.sort((a, b) => new Date(b.dataCriacao) - new Date(a.dataCriacao)),
            trainings: trainingsData
        });
        setIsLoading(false);
    };

    useEffect(() => {
        loadData();
    }, []);

    const openDialog = (article = null) => {
        setCurrentArticle(article);
        setArticleType(article ? article.type : 'artigo');
        setIsDialogOpen(true);
    };

    // --- FUNÇÃO REFATORADA ---
    const handleSaveArticle = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const articleData = {
            type: articleType,
            titulo: formData.get('titulo'),
            categoria: formData.get('categoria'),
            conteudo: formData.get('conteudo'),
            tags: formData.get('tags')?.split(',').map(tag => tag.trim()).filter(tag => tag) || [],
            autorNome: user.nome,
            dataCriacao: currentArticle?.dataCriacao || new Date().toISOString(),
        };

        if (articleType === 'link_externo') {
            articleData.url = formData.get('url');
        } else if (articleType === 'link_treinamento') {
            articleData.treinamentoId = parseInt(formData.get('treinamentoId'));
        }

        if (currentArticle) {
            await updateData('knowledgeBase', currentArticle.id, articleData);
            toast({ title: "Sucesso!", description: "Postagem atualizada." });
        } else {
            await addData('knowledgeBase', articleData);
            toast({ title: "Sucesso!", description: "Postagem criada." });
        }
        
        await loadData();
        setIsDialogOpen(false);
    };
    
    // --- FUNÇÃO REFATORADA ---
    const handleDeleteArticle = async (articleId) => {
        if (!window.confirm("Tem certeza que deseja excluir esta postagem?")) return;
        await deleteData('knowledgeBase', articleId);
        await loadData();
        toast({ title: "Sucesso!", description: "Postagem excluída." });
    };

    const getTypeIcon = (type) => {
        if (type === 'link_externo') return <LinkIcon className="h-4 w-4 text-purple-400" />;
        if (type === 'link_treinamento') return <GraduationCap className="h-4 w-4 text-blue-400" />;
        return <FileText className="h-4 w-4 text-green-400" />;
    }

    if (isLoading) {
        return <div className="flex justify-center items-center h-full"><Loader2 className="h-10 w-10 animate-spin text-blue-500" /></div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-white">Gerenciar Conhecimento</h1>
                <Button onClick={() => openDialog()}><PlusCircle className="mr-2 h-4 w-4" /> Nova Postagem</Button>
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="bg-slate-900 border-slate-700 text-white">
                    <DialogHeader>
                        <DialogTitle>{currentArticle ? 'Editar Postagem' : 'Nova Postagem'}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSaveArticle} className="space-y-4">
                        <Label>Tipo de Postagem</Label>
                        <Select value={articleType} onValueChange={setArticleType}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="artigo">Artigo de Texto</SelectItem>
                                <SelectItem value="link_externo">Link Externo</SelectItem>
                                <SelectItem value="link_treinamento">Atalho para Treinamento</SelectItem>
                            </SelectContent>
                        </Select>
                        
                        <Input name="titulo" placeholder="Título da postagem" defaultValue={currentArticle?.titulo} required />
                        <Input name="categoria" placeholder="Categoria (Ex: Fiscal, Legislação)" defaultValue={currentArticle?.categoria} required />
                        
                        {articleType === 'link_externo' && <Input name="url" placeholder="URL do link externo" defaultValue={currentArticle?.url} required />}
                        {articleType === 'link_treinamento' && (
                            <Select name="treinamentoId" defaultValue={currentArticle?.treinamentoId?.toString()}>
                                <SelectTrigger><SelectValue placeholder="Selecione um treinamento" /></SelectTrigger>
                                <SelectContent>{dbData.trainings.map(t => <SelectItem key={t.id} value={t.id.toString()}>{t.titulo}</SelectItem>)}</SelectContent>
                            </Select>
                        )}
                        
                        <Textarea name="conteudo" placeholder="Descrição ou conteúdo do artigo..." defaultValue={currentArticle?.conteudo} required />
                        <Input name="tags" placeholder="Tags separadas por vírgula (Ex: eSocial, prazo, guia)" defaultValue={currentArticle?.tags?.join(', ')} />

                        <DialogFooter>
                            <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                            <Button type="submit">Salvar</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <div className="bg-slate-800/50 border border-slate-700 rounded-lg">
                {dbData.articles.map(article => (
                    <div key={article.id} className="grid grid-cols-5 items-center p-4 border-b border-slate-700/50 last:border-b-0">
                        <div className="col-span-2 flex items-center gap-2">
                            {getTypeIcon(article.type)}
                            <span className="text-white font-medium truncate pr-2">{article.titulo}</span>
                        </div>
                        <div className="text-slate-400 truncate pr-2">{article.categoria}</div>
                        <div className="text-slate-500 text-xs">{new Date(article.dataCriacao).toLocaleDateString()}</div>
                        <div className="flex justify-end gap-2">
                             <Button variant="ghost" size="icon" onClick={() => openDialog(article)}><Edit className="h-4 w-4" /></Button>
                             <Button variant="ghost" size="icon" onClick={() => handleDeleteArticle(article.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
export default KnowledgeBaseManagement;
