import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Search, Loader2, CheckSquare, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { getPaginatedData, getAllData } from '@/lib/firebaseService';
import { useAuth } from '@/contexts/AuthContext';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const SimuladoList = ({ onStartSimulado }) => {
    const [allSimulados, setAllSimulados] = useState([]);
    const [userResults, setUserResults] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [lastVisible, setLastVisible] = useState(null);
    const [hasMore, setHasMore] = useState(true);
    const [isLoading, setIsLoading] = useState(true);
    const { user } = useAuth();

    useEffect(() => {
        const loadData = async () => {
            if (!user) return;
            setIsLoading(true);
            const [simuladosData, resultadosData] = await Promise.all([
                getAllData('simulados'), // Carregamos todos para facilitar a lógica de filtro
                getAllData('resultadosSimulados')
            ]);
            
            setAllSimulados(simuladosData.filter(s => s.ativo));
            setUserResults(resultadosData.filter(r => r.usuarioId === user.id));
            setIsLoading(false);
        };
        loadData();
    }, [user]);

    const simuladosComStatus = useMemo(() => {
        return allSimulados
            .filter(s => s.titulo.toLowerCase().includes(searchTerm.toLowerCase()))
            .map(simulado => {
                const userAttempts = userResults.filter(r => r.simuladoId === simulado.id);
                const { regraTentativa, limiteTentativas } = simulado;
                
                let canAttempt = true;
                let reason = "";

                if (regraTentativa === 'once' && userAttempts.length >= 1) {
                    canAttempt = false;
                    reason = "Você já completou este simulado.";
                } else if (regraTentativa === 'monthly') {
                    const now = new Date();
                    const lastAttempt = userAttempts.sort((a, b) => new Date(b.dataConclusao) - new Date(a.dataConclusao))[0];
                    if (lastAttempt) {
                        const lastAttemptDate = new Date(lastAttempt.dataConclusao);
                        if (lastAttemptDate.getMonth() === now.getMonth() && lastAttemptDate.getFullYear() === now.getFullYear()) {
                            canAttempt = false;
                            reason = "Disponível novamente no próximo mês.";
                        }
                    }
                } else if (regraTentativa === 'specific_amount' && userAttempts.length >= limiteTentativas) {
                    canAttempt = false;
                    reason = `Limite de ${limiteTentativas} tentativas atingido.`;
                }

                return { ...simulado, canAttempt, reason, attemptCount: userAttempts.length };
            });
    }, [allSimulados, userResults, searchTerm]);

    if (isLoading) {
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

            <TooltipProvider>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {simuladosComStatus.map((simulado) => (
                        <motion.div key={simulado.id}>
                            <Card className="glass-effect border-slate-700 card-hover h-full flex flex-col">
                                <CardHeader>
                                    <CardTitle className="text-lg text-white mb-1">{simulado.titulo}</CardTitle>
                                    <p className="text-sm text-slate-400">{simulado.categoria}</p>
                                </CardHeader>
                                <CardContent className="flex-grow">
                                    <p className="text-sm text-slate-300 line-clamp-3">{simulado.descricao}</p>
                                </CardContent>
                                <CardFooter className="flex justify-between items-center">
                                    <span className="text-xs text-slate-500">Tentativas: {simulado.attemptCount}</span>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            {/* O div é necessário para o tooltip funcionar em botões desativados */}
                                            <div> 
                                                <Button 
                                                    onClick={() => onStartSimulado(simulado)} 
                                                    disabled={!simulado.canAttempt}
                                                    className="bg-gradient-to-r from-blue-500 to-purple-600 disabled:opacity-50"
                                                >
                                                    {simulado.canAttempt ? 'Iniciar Simulado' : <Lock className="w-4 h-4" />}
                                                </Button>
                                            </div>
                                        </TooltipTrigger>
                                        {!simulado.canAttempt && <TooltipContent><p>{simulado.reason}</p></TooltipContent>}
                                    </Tooltip>
                                </CardFooter>
                            </Card>
                        </motion.div>
                    ))}
                </div>
            </TooltipProvider>
        </div>
    );
};

export default SimuladoList;
