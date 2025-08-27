import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ClipboardCheck, Loader2, Target, GraduationCap, CheckSquare, CheckCircle, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { getAllData } from '@/lib/firebaseService';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/firebaseConfig';

const PdiView = () => {
    const { user } = useAuth();
    const [pdi, setPdi] = useState(null);
    const [userProgress, setUserProgress] = useState({ historico: [], resultados: [] });
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadPdiData = async () => {
            if (!user || !user.id) return;
            setIsLoading(true);

            // --- CORREÇÃO AQUI ---
            // A busca agora compara o ID do usuário como uma string, que é o formato correto.
            const pdiQuery = query(collection(db, 'pdis'), where('usuarioId', '==', String(user.id)));
            
            const historicoQuery = query(collection(db, 'historico'), where('usuarioId', '==', user.id), where('concluido', '==', true));
            const resultadosQuery = query(collection(db, 'resultadosSimulados'), where('usuarioId', '==', user.id));

            const [pdiSnapshot, historicoSnapshot, resultadosSnapshot] = await Promise.all([
                getDocs(pdiQuery),
                getDocs(historicoQuery),
                getDocs(resultadosQuery)
            ]);
            
            if (!pdiSnapshot.empty) {
                const pdiDoc = pdiSnapshot.docs[0];
                setPdi({ id: pdiDoc.id, ...pdiDoc.data() });
            }

            const historicoData = [];
            historicoSnapshot.forEach(doc => historicoData.push({ id: doc.id, ...doc.data() }));

            const resultadosData = [];
            resultadosSnapshot.forEach(doc => resultadosData.push({ id: doc.id, ...doc.data() }));

            setUserProgress({
                historico: historicoData,
                resultados: resultadosData
            });

            setIsLoading(false);
        };
        loadPdiData();
    }, [user]);

    const pdiComProgresso = useMemo(() => {
        if (!pdi) return null;

        const completedConteudos = new Set([
            ...userProgress.historico.map(h => h.treinamentoId),
            ...userProgress.resultados.map(r => r.simuladoId)
        ]);

        let totalConteudos = 0;
        let completedConteudosCount = 0;

        const metasComProgresso = pdi.metas.map(meta => {
            const conteudosComProgresso = meta.conteudos.map(conteudo => {
                const isCompleted = completedConteudos.has(conteudo.id);
                if (isCompleted) {
                    completedConteudosCount++;
                }
                totalConteudos++;
                return { ...conteudo, isCompleted };
            });
            return { ...meta, conteudos: conteudosComProgresso };
        });
        
        const overallProgress = totalConteudos > 0 ? (completedConteudosCount / totalConteudos) * 100 : 0;

        return { ...pdi, metas: metasComProgresso, progress: overallProgress };

    }, [pdi, userProgress]);

    if (isLoading) {
        return <div className="flex justify-center items-center h-full"><Loader2 className="h-10 w-10 animate-spin text-blue-500" /></div>;
    }

    if (!pdiComProgresso) {
        return (
            <div className="text-center py-12">
                <ClipboardCheck className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                <h1 className="text-2xl font-bold text-white">Nenhum Plano de Desenvolvimento</h1>
                <p className="text-slate-400 mt-2">Ainda não foi criado um PDI para si. Fale com o seu gestor.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <h1 className="text-3xl font-bold text-white">Meu Plano de Desenvolvimento</h1>
                <p className="text-slate-400">{pdiComProgresso.titulo}</p>
            </motion.div>

            <Card className="glass-effect border-slate-700">
                <CardHeader>
                    <CardTitle>Progresso Geral</CardTitle>
                    <div className="flex items-center gap-4 pt-2">
                        <div className="w-full bg-slate-700 rounded-full h-2.5">
                            <div className="bg-blue-500 h-2.5 rounded-full" style={{ width: `${pdiComProgresso.progress}%` }}></div>
                        </div>
                        <span className="text-sm font-semibold text-white">{Math.round(pdiComProgresso.progress)}%</span>
                    </div>
                </CardHeader>
            </Card>

            {pdiComProgresso.metas.map((meta, index) => (
                <motion.div key={index} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: (index + 1) * 0.1 }}>
                    <Card className="glass-effect border-slate-700">
                        <CardHeader>
                            <div className="flex items-center space-x-3">
                                <Target className="w-6 h-6 text-purple-400" />
                                <div>
                                    <CardTitle className="text-white">{meta.titulo}</CardTitle>
                                    <CardDescription>{meta.descricao}</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-3 pt-4 border-t border-slate-700">
                            {meta.conteudos.map(conteudo => (
                                <div key={conteudo.id} className="flex items-center space-x-3 p-3 bg-slate-800/50 rounded-lg">
                                    {conteudo.isCompleted ? <CheckCircle className="w-5 h-5 text-green-500" /> : <Clock className="w-5 h-5 text-slate-500" />}
                                    {conteudo.tipo === 'Treinamento' ? <GraduationCap className="w-5 h-5 text-green-400" /> : <CheckSquare className="w-5 h-5 text-blue-400" />}
                                    <span className={`flex-1 ${conteudo.isCompleted ? 'text-slate-400 line-through' : 'text-white'}`}>{conteudo.titulo}</span>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </motion.div>
            ))}
        </div>
    );
};

export default PdiView;
