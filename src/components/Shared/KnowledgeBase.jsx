import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, FileText, Link as LinkIcon, GraduationCap, Loader2 } from 'lucide-react';
import { getPaginatedData } from '@/lib/firebaseService';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';

const KnowledgeBase = () => {
    const [articles, setArticles] = useState([]);
    const [lastVisible, setLastVisible] = useState(null);
    const [hasMore, setHasMore] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [isInitialLoad, setIsInitialLoad] = useState(true);
    
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedArticle, setSelectedArticle] = useState(null);

    const fetchArticles = async (isLoadMore = false) => {
        if (isLoading) return;
        setIsLoading(true);

        // --- CORREÇÃO AQUI ---
        // Agora passamos um objeto de opções, como a função espera.
        const options = {
            lastVisible: isLoadMore ? lastVisible : null,
            orderByField: "dataCriacao",
            orderDirection: "desc"
        };
        const result = await getPaginatedData('knowledgeBase', options);
        
        if (result.data.length > 0) {
            setArticles(prev => isLoadMore ? [...prev, ...result.data] : result.data);
            setLastVisible(result.lastVisible);
        }
        
        if (result.data.length < 15) {
            setHasMore(false);
        }
        
        setIsLoading(false);
        if(isInitialLoad) setIsInitialLoad(false);
    };

    useEffect(() => {
        fetchArticles();
    }, []);

    const filteredArticles = articles.filter(article => {
        const term = searchTerm.toLowerCase();
        return (
            article.titulo.toLowerCase().includes(term) ||
            article.conteudo.toLowerCase().includes(term) ||
            article.categoria.toLowerCase().includes(term) ||
            (article.tags && article.tags.some(tag => tag.toLowerCase().includes(term)))
        );
    });

    const getTypeIcon = (type) => {
        if (type === 'link_externo') return <LinkIcon className="h-5 w-5 text-purple-400" />;
        if (type === 'link_treinamento') return <GraduationCap className="h-5 w-5 text-blue-400" />;
        return <FileText className="h-5 w-5 text-green-400" />;
    };

    const renderCardAction = (article) => {
        if (article.type === 'link_externo') {
            return <a href={article.url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">Acessar Link Externo</a>;
        }
        if (article.type === 'link_treinamento') {
            return <span className="text-blue-400 cursor-pointer hover:underline">Ver Treinamento</span>;
        }
        return <button onClick={() => setSelectedArticle(article)} className="text-blue-400 hover:underline">Ler Artigo Completo</button>;
    };

    if (isInitialLoad) {
        return (
            <div className="flex justify-center items-center h-full">
                <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-white">Central de Conhecimento</h1>
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <Input 
                    placeholder="Pesquisar nos artigos carregados..." 
                    className="pl-10 bg-slate-800/50 border-slate-600"
                    value={searchTerm} 
                    onChange={e => setSearchTerm(e.target.value)} 
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredArticles.map((article, index) => (
                    <motion.div 
                        key={article.id} 
                        initial={{ opacity: 0, y: 20 }} 
                        animate={{ opacity: 1, y: 0 }} 
                        transition={{ delay: index * 0.05 }}
                    >
                        <Card className="glass-effect h-full flex flex-col border-slate-700">
                            <CardHeader>
                                <div className="flex items-center gap-3">
                                    {getTypeIcon(article.type)}
                                    <CardTitle className="text-white text-lg">{article.titulo}</CardTitle>
                                </div>
                                <CardDescription>{article.categoria}</CardDescription>
                            </CardHeader>
                            <CardContent className="flex-grow">
                                <p className="text-slate-300 text-sm line-clamp-3">{article.conteudo}</p>
                            </CardContent>
                            <CardFooter className="flex-col items-start gap-4">
                                <div className="flex flex-wrap gap-2 h-6">
                                    {article.tags?.map(tag => <Badge key={tag} variant="secondary">{tag}</Badge>)}
                                </div>
                                <div className="w-full flex justify-between items-center text-xs text-slate-500 pt-2">
                                    <span>{renderCardAction(article)}</span>
                                    <span>{new Date(article.dataCriacao).toLocaleDateString()} por {article.autorNome}</span>
                                </div>
                            </CardFooter>
                        </Card>
                    </motion.div>
                ))}
            </div>

            {filteredArticles.length === 0 && !isLoading && (
                <div className="text-center py-12 text-slate-500">
                    <p>Nenhum artigo encontrado.</p>
                </div>
            )}

            {hasMore && (
                <div className="text-center mt-8">
                    <Button onClick={() => fetchArticles(true)} disabled={isLoading}>
                        {isLoading ? (
                            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Carregando...</>
                        ) : (
                            'Carregar Mais'
                        )}
                    </Button>
                </div>
            )}

            <Dialog open={!!selectedArticle} onOpenChange={() => setSelectedArticle(null)}>
                <DialogContent className="bg-slate-900 border-slate-700 text-white">
                    <DialogHeader>
                        <DialogTitle className="text-2xl">{selectedArticle?.titulo}</DialogTitle>
                        <DialogDescription>{selectedArticle?.categoria}</DialogDescription>
                    </DialogHeader>
                    <div className="py-4 text-slate-300 whitespace-pre-wrap">{selectedArticle?.conteudo}</div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default KnowledgeBase;