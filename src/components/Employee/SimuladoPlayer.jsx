import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/contexts/AuthContext';
import { addData, getAllData } from '@/lib/firebaseService';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/firebaseConfig';
import { Award, Target } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

// --- LÓGICA DE GAMIFICAÇÃO ---
const getTitleByScore = (score) => {
    if (score >= 95) return 'Mestre do Conhecimento';
    if (score >= 85) return 'Especialista';
    if (score >= 70) return 'Conhecedor';
    if (score >= 50) return 'Aprendiz';
    return 'Iniciante';
};

const SimuladoPlayer = ({ simulado, onFinish }) => {
    const { user } = useAuth();
    const { toast } = useToast();
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [selectedAnswers, setSelectedAnswers] = useState({});
    const [showResults, setShowResults] = useState(false);
    const [score, setScore] = useState(0);

    const currentQuestion = simulado.perguntas[currentQuestionIndex];
    const progressValue = ((currentQuestionIndex + 1) / simulado.perguntas.length) * 100;

    const handleSelectAnswer = (questionIndex, answerIndex) => {
        setSelectedAnswers(prev => ({ ...prev, [questionIndex]: answerIndex }));
    };

    const handleNextQuestion = () => {
        if (currentQuestionIndex < simulado.perguntas.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
        } else {
            calculateResults();
            setShowResults(true);
        }
    };

    const calculateResults = async () => {
        let correctAnswers = 0;
        simulado.perguntas.forEach((pergunta, index) => {
            if (selectedAnswers[index] === pergunta.respostaCorreta) {
                correctAnswers++;
            }
        });
        
        const finalScore = (correctAnswers / simulado.perguntas.length) * 100;
        setScore(finalScore);

        const newResult = {
            usuarioId: user.id, usuarioNome: user.nome, simuladoId: simulado.id,
            simuladoTitulo: simulado.titulo, pontuacao: finalScore, acertos: correctAnswers,
            totalPerguntas: simulado.perguntas.length, dataConclusao: new Date().toISOString()
        };
        
        await addData('resultadosSimulados', newResult);
        await updateUserAchievements(finalScore);
    };

    const updateUserAchievements = async (currentSimuladoScore) => {
        try {
            if (!user || !user.id) return;

            const userRef = doc(db, 'usuarios', String(user.id));
            const userSnap = await getDoc(userRef);
            if (!userSnap.exists()) return;

            const userData = userSnap.data();
            
            // --- LÓGICA DE CONTAGEM CORRIGIDA ---
            // 1. Busca a lista completa e atualizada de TODOS os resultados do usuário
            const allResultsData = await getAllData('resultadosSimulados');
            const allUserResults = allResultsData.filter(r => r.usuarioId === user.id);

            const newMedals = new Set(userData.medalhas || []);
            
            // Regra 1: Primeiro Simulado
            if (allUserResults.length > 0 && !newMedals.has("Primeiro Simulado")) {
                newMedals.add("Primeiro Simulado");
            }
            // Regra 2: Perfeccionista
            if (currentSimuladoScore === 100 && !newMedals.has("Perfeccionista")) {
                toast({ title: "Nova Conquista!", description: "Você ganhou a medalha 'Perfeccionista'!" });
                newMedals.add("Perfeccionista");
            }
            // Regra 3: Maratonista
            if (allUserResults.length >= 5 && !newMedals.has("Maratonista")) {
                toast({ title: "Nova Conquista!", description: "Você ganhou a medalha 'Maratonista'!" });
                newMedals.add("Maratonista");
            }
            // Regra 4: Dedicado
            if (allUserResults.length >= 10 && !newMedals.has("Dedicado")) {
                toast({ title: "Nova Conquista!", description: "Você ganhou a medalha 'Dedicado'!" });
                newMedals.add("Dedicado");
            }

            // Calcula o novo score médio e o novo título
            const totalScore = allUserResults.reduce((acc, r) => acc + r.pontuacao, 0);
            const averageScore = totalScore / allUserResults.length;
            const newTitle = getTitleByScore(averageScore);

            if (userData.titulo !== newTitle) {
                 toast({ title: "Promoção!", description: `O seu título foi atualizado para '${newTitle}'!` });
            }

            await updateDoc(userRef, {
                medalhas: Array.from(newMedals),
                titulo: newTitle
            });

        } catch (error) {
            console.error("Erro ao atualizar conquistas:", error);
        }
    };

    if (showResults) {
        return (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
                <Card className="glass-effect border-slate-700 text-white w-full max-w-3xl mx-auto">
                    <CardHeader className="text-center">
                        <Award className="w-16 h-16 mx-auto text-yellow-400" />
                        <CardTitle className="text-3xl mt-4">Simulado Concluído!</CardTitle>
                        <CardDescription className="text-slate-400">{simulado.titulo}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="text-center">
                            <p className="text-lg text-slate-300">A sua pontuação final foi:</p>
                            <p className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">{score.toFixed(0)}%</p>
                            <p className="text-slate-400 mt-2">
                                Você acertou {Object.values(selectedAnswers).reduce((acc, val, idx) => acc + (val === simulado.perguntas[idx].respostaCorreta ? 1 : 0), 0)} de {simulado.perguntas.length} perguntas.
                            </p>
                        </div>
                        <div className="space-y-4 max-h-60 overflow-y-auto pr-2">
                            {simulado.perguntas.map((pergunta, index) => (
                                <div key={index} className="p-3 bg-slate-800/50 rounded-lg">
                                    <p className="font-semibold">{index + 1}. {pergunta.pergunta}</p>
                                    <p className={`text-sm mt-1 ${selectedAnswers[index] === pergunta.respostaCorreta ? 'text-green-400' : 'text-red-400'}`}>
                                        Sua resposta: {pergunta.opcoes[selectedAnswers[index]]}
                                        {selectedAnswers[index] !== pergunta.respostaCorreta && <span className="text-slate-400"> | Correta: {pergunta.opcoes[pergunta.respostaCorreta]}</span>}
                                    </p>
                                </div>
                            ))}
                        </div>
                        <Button onClick={onFinish} className="w-full bg-gradient-to-r from-blue-500 to-purple-600">Voltar para a Lista de Simulados</Button>
                    </CardContent>
                </Card>
            </motion.div>
        );
    }

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Card className="glass-effect border-slate-700 text-white w-full max-w-3xl mx-auto">
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <div>
                            <CardTitle className="text-2xl">{simulado.titulo}</CardTitle>
                            <CardDescription className="text-slate-400">Pergunta {currentQuestionIndex + 1} de {simulado.perguntas.length}</CardDescription>
                        </div>
                        <Target className="w-8 h-8 text-blue-400" />
                    </div>
                    <Progress value={progressValue} className="mt-4" />
                </CardHeader>
                <CardContent className="space-y-6">
                    <p className="text-lg font-semibold text-slate-200">{currentQuestion.pergunta}</p>
                    <RadioGroup
                        value={selectedAnswers[currentQuestionIndex]?.toString()}
                        onValueChange={(value) => handleSelectAnswer(currentQuestionIndex, parseInt(value))}
                        className="space-y-3"
                    >
                        {currentQuestion.opcoes.map((opcao, index) => (
                            <Label key={index} className="flex items-center p-4 rounded-lg border border-slate-700 hover:bg-slate-800/50 transition-colors cursor-pointer has-[:checked]:bg-blue-500/20 has-[:checked]:border-blue-500">
                                <RadioGroupItem value={index.toString()} id={`q${currentQuestionIndex}o${index}`} className="mr-3" />
                                {opcao}
                            </Label>
                        ))}
                    </RadioGroup>
                    <Button 
                        onClick={handleNextQuestion} 
                        disabled={selectedAnswers[currentQuestionIndex] === undefined}
                        className="w-full bg-gradient-to-r from-blue-500 to-purple-600"
                    >
                        {currentQuestionIndex < simulado.perguntas.length - 1 ? 'Próxima Pergunta' : 'Finalizar e Ver Resultado'}
                    </Button>
                </CardContent>
            </Card>
        </motion.div>
    );
};

export default SimuladoPlayer;
