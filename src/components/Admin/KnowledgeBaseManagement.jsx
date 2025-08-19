import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { PlusCircle, Edit, Trash2, FileText, Link as LinkIcon, GraduationCap } from 'lucide-react';
import { getDatabase, updateDatabase } from '@/data/mockData';
import { Button } from '@/components/ui/button';
import { useToast } from "@/components/ui/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';

const KnowledgeBaseManagement = () => {
    const { user } = useAuth();
    const [dbData, setDbData] = useState({ articles: [], trainings: [] });
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [currentArticle, setCurrentArticle] = useState(null);
    const [articleType, setArticleType] = useState('artigo');
    const { toast } = useToast();

    useEffect(() => {
        const db = getDatabase();
        setDbData({
            articles: db.knowledgeBase || [],
            trainings: db.treinamentos || []
        });
    }, []);

    const openDialog = (article = null) => {
        setCurrentArticle(article);
        setArticleType(article ? article.type : 'artigo');
        setIsDialogOpen(true);
    };

    const handleSaveArticle = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const articleData = {
            id: currentArticle?.id || new Date().getTime(),
            type: articleType,
            titulo: formData.get('titulo'),
            categoria: formData.get('categoria'),
            conteudo: formData.get('conteudo'),
            tags: formData.get('tags')?.split(',').map(tag => tag.trim()) || [],
            autorNome: user.nome,
            dataCriacao: new Date().toISOString(),
        };

        if (articleType === 'link_externo') {
            articleData.url = formData.get('url');
        } else if (articleType === 'link_treinamento') {
            articleData.treinamentoId = parseInt(formData.get('treinamentoId'));
        }

        const db = getDatabase();
        const updatedArticles = currentArticle
            ? db.knowledgeBase.map(a => a.id === articleData.id ? articleData : a)
            : [...(db.knowledgeBase || []), articleData];

        await updateDatabase({ ...db, knowledgeBase: updatedArticles });
        setDbData(prev => ({ ...prev, articles: updatedArticles }));
        toast({ title: "Sucesso!", description: "Postagem salva." });
        setIsDialogOpen(false);
    };
    
    // ... (handleDeleteArticle permanece o mesmo)

    const getTypeIcon = (type) => {
        if (type === 'link_externo') return <LinkIcon className="h-4 w-4 text-purple-400" />;
        if (type === 'link_treinamento') return <GraduationCap className="h-4 w-4 text-blue-400" />;
        return <FileText className="h-4 w-4 text-green-400" />;
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
                    <div key={article.id} className="grid grid-cols-5 items-center p-4 border-b border-slate-700/50">
                        <div className="col-span-2 flex items-center gap-2">
                            {getTypeIcon(article.type)}
                            <span className="text-white font-medium">{article.titulo}</span>
                        </div>
                        <div className="text-slate-400">{article.categoria}</div>
                        <div className="text-slate-500 text-xs">{new Date(article.dataCriacao).toLocaleDateString()}</div>
                        <div className="flex justify-end gap-2">
                             <Button variant="ghost" size="icon" onClick={() => openDialog(article)}><Edit className="h-4 w-4" /></Button>
                             {/* ...botão de deletar... */}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
export default KnowledgeBaseManagement;
