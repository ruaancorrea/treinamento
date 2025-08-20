import React from 'react';
import { motion } from 'framer-motion';
import { Play, Clock, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
// --- MUDANÇA PRINCIPAL ---
// Importamos as funções do novo serviço
import { updateData } from '@/lib/firebaseService';
import { useToast } from "@/components/ui/use-toast";


const TrainingCard = ({ training, userProgress, categories, onStartTraining, index }) => {
    const { user } = useAuth();
    const { toast } = useToast(); // Adicionado para dar feedback ao usuário

    const getCategoryProp = (categoryId, prop) => {
        const category = categories.find(c => c.id === categoryId);
        if (prop === 'nome') return category?.nome || 'N/A';
        if (prop === 'cor') return category?.cor || '#3b82f6';
        return null;
    };

    const getStatus = () => {
        if (!userProgress) return 'not-started';
        return userProgress.concluido ? 'completed' : 'in-progress';
    };

    const status = getStatus();

    // --- FUNÇÃO REFATORADA ---
    const handleRetake = async (e) => {
        e.stopPropagation(); // Impede que o card seja clicado ao mesmo tempo
        
        if (!user || !training || !userProgress) return;

        try {
            // Prepara os dados para resetar o progresso
            const resetProgress = {
                concluido: false,
                dataConclucao: null,
                notaQuestionario: null,
                tempoAssistido: 0
            };

            // Usa a nova função 'updateData' para atualizar o documento na coleção 'historico'
            await updateData('historico', userProgress.id, resetProgress);

            toast({
                title: "Progresso resetado!",
                description: `Você pode refazer o treinamento "${training.titulo}" agora.`,
            });
            // Idealmente, a lista de treinamentos deveria ser recarregada aqui,
            // ou o estado do userProgress atualizado localmente.
            // Por enquanto, o usuário pode começar o treinamento novamente.
        } catch (error) {
            console.error("Erro ao tentar refazer o treinamento:", error);
            toast({
                title: "Erro",
                description: "Não foi possível resetar o progresso.",
                variant: "destructive"
            });
        }
    };

    const getProgressPercentage = () => {
        if (status === 'completed') return 100;
        if (status === 'in-progress' && userProgress?.tempoAssistido && training?.duracao) {
            return Math.min(99, Math.round((userProgress.tempoAssistido / training.duracao) * 100));
        }
        return 0;
    };

    const progressPercentage = getProgressPercentage();

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
        >
            <Card className="glass-effect border-slate-700 card-hover h-full flex flex-col">
                <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                        <div className="flex-1">
                            <CardTitle className="text-lg text-white mb-2">{training.titulo}</CardTitle>
                            <div className="flex items-center space-x-2 mb-2">
                                <Badge style={{ backgroundColor: getCategoryProp(training.categoriaId, 'cor') }} className="text-white">
                                    {getCategoryProp(training.categoriaId, 'nome')}
                                </Badge>
                                {training.obrigatorio && <Badge variant="destructive">Obrigatório</Badge>}
                            </div>
                        </div>
                        <div className="flex flex-col items-center">
                            {status === 'completed' && <CheckCircle className="w-6 h-6 text-green-500" />}
                            {status === 'in-progress' && <Clock className="w-6 h-6 text-yellow-500" />}
                            {status === 'not-started' && training.obrigatorio && <AlertCircle className="w-6 h-6 text-red-500" />}
                        </div>
                    </div>
                </CardHeader>
                
                <CardContent className="space-y-4 flex-grow flex flex-col justify-end">
                    <p className="text-sm text-slate-300 line-clamp-3 flex-grow">{training.descricao}</p>
                    
                    {(status === 'in-progress' || status === 'completed') && userProgress && (
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-400">Progresso</span>
                                <span className="text-white">{progressPercentage}%</span>
                            </div>
                            <div className="w-full bg-slate-700 rounded-full h-2">
                                <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${progressPercentage}%` }} />
                            </div>
                            {status === 'completed' && userProgress.notaQuestionario !== null && (
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-slate-400">Nota:</span>
                                    <span className="text-green-400 font-semibold">{userProgress.notaQuestionario}/10</span>
                                </div>
                            )}
                        </div>
                    )}
                    
                    <div className="pt-4 border-t border-slate-700 flex items-center space-x-2">
                         <Button
                            onClick={onStartTraining}
                            className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                          >
                            <Play className="w-4 h-4 mr-2" />
                            {status === 'completed' ? 'Ver Novamente' : (status === 'in-progress' ? 'Continuar' : 'Iniciar')}
                          </Button>

                          {status === 'completed' && (
                            <Button
                              onClick={handleRetake}
                              variant="outline"
                              className="border-slate-600 hover:bg-slate-700"
                              title="Refazer Treinamento"
                            >
                              <RefreshCw className="w-4 h-4" />
                            </Button>
                          )}
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
};

export default TrainingCard;
