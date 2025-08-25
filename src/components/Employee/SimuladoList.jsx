import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Loader2, CheckSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { getPaginatedData } from '@/lib/firebaseService';

// A prop agora é 'onStartSimulado' para comunicar com o App.jsx
const SimuladoList = ({ onStartSimulado }) => {
    const [allSimulados, setAllSimulados] = useState([]);
    const [filteredSimulados, setFilteredSimulados] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [lastVisible, setLastVisible] = useState(null);
    const [hasMore, setHasMore] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [isInitialLoad, setIsInitialLoad] = useState(true);

    const fetchSimulados = async (isLoadMore = false) => {
        if (isLoading) return;
        setIsLoading(true);

        const result = await getPaginatedData('simulados', { 
            lastVisible: isLoadMore ? lastVisible : null,
            orderByField: "dataCriacao",
            orderDirection: "desc",
        });
        
        const activeSimulados = result.data.filter(s => s.ativo);

        if (activeSimulados.length > 0) {
            setAllSimulados(prev => isLoadMore ? [...prev, ...activeSimulados] : activeSimulados);
            setLastVisible(result.lastVisible);
        }

        if (result.data.length < 15) { // PAGE_SIZE
            setHasMore(false);
        }
        setIsLoading(false);
    };

    useEffect(() => {
        setIsInitialLoad(true);
        fetchSimulados().then(() => setIsInitialLoad(false));
    }, []);

    useEffect(() => {
        setFilteredSimulados(
            allSimulados.filter(s => s.titulo.toLowerCase().includes(searchTerm.toLowerCase()))
        );
    }, [allSimulados, searchTerm]);

    if (isInitialLoad) {
        return <div className="flex justify-center items-center h-full"><Loader2 className="h-10 w-10 animate-spin text-blue-500" /></div>;
    }

    return (
        <div className="space-y-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <h1 className="text-3xl font-bold text-white">Simulados Disponíveis</h1>
                <p className="text-slate-400">Teste os seus conhecimentos e ganhe pontos.</p>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <Input 
                        placeholder="Buscar por título do simulado..." 
                        value={searchTerm} 
                        onChange={e => setSearchTerm(e.target.value)} 
                        className="pl-10 bg-slate-800/50 border-slate-600"
                    />
                </div>
            </motion.div>

            {filteredSimulados.length === 0 && !isLoading ? (
                 <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12">
                    <CheckSquare className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                    <p className="text-slate-400 text-lg">Nenhum simulado encontrado no momento.</p>
                </motion.div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredSimulados.map((simulado) => (
                        <motion.div key={simulado.id}>
                            <Card className="glass-effect border-slate-700 card-hover h-full flex flex-col">
                                <CardHeader>
                                    <CardTitle className="text-lg text-white mb-1">{simulado.titulo}</CardTitle>
                                    <p className="text-sm text-slate-400">{simulado.categoria}</p>
                                </CardHeader>
                                <CardContent className="flex-grow">
                                    <p className="text-sm text-slate-300 line-clamp-3">{simulado.descricao}</p>
                                </CardContent>
                                <CardFooter className="flex justify-end">
                                    {/* A função onStartSimulado é chamada aqui para iniciar o jogo */}
                                    <Button onClick={() => onStartSimulado(simulado)} className="bg-gradient-to-r from-blue-500 to-purple-600">
                                        Iniciar Simulado
                                    </Button>
                                </CardFooter>
                            </Card>
                        </motion.div>
                    ))}
                </div>
            )}

            {hasMore && (
                <div className="text-center mt-8">
                    <Button onClick={() => fetchSimulados(true)} disabled={isLoading}>
                        {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Carregando...</> : 'Carregar Mais'}
                    </Button>
                </div>
            )}
        </div>
    );
};

export default SimuladoList;
