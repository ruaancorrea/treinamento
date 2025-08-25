import React, { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, Award, CheckCircle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { addData, updateData } from '@/lib/firebaseService';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/firebaseConfig';
import YouTube from 'react-youtube';

const QuizView = ({ training, onQuizComplete }) => {
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [answers, setAnswers] = useState([]);

    const handleAnswer = (answerIndex) => {
        const newAnswers = [...answers, answerIndex];
        setAnswers(newAnswers);
        
        if (currentQuestion < training.perguntas.length - 1) {
            setCurrentQuestion(currentQuestion + 1);
        } else {
            let correctAnswers = 0;
            training.perguntas.forEach((question, index) => {
                if (newAnswers[index] === question.respostaCorreta) {
                    correctAnswers++;
                }
            });
            const score = Math.round((correctAnswers / training.perguntas.length) * 10);
            onQuizComplete(score);
        }
    };

    const question = training.perguntas[currentQuestion];
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">
                    Questionário - Pergunta {currentQuestion + 1} de {training.perguntas.length}
                </h3>
                <div className="w-32 bg-slate-700 rounded-full h-2">
                    <div 
                        className="bg-blue-500 h-2 rounded-full"
                        style={{ width: `${((currentQuestion + 1) / training.perguntas.length) * 100}%` }}
                    />
                </div>
            </div>
            <div className="space-y-4">
                <h4 className="text-xl text-white">{question.pergunta}</h4>
                <div className="space-y-3">
                    {question.opcoes.map((option, index) => (
                        <Button
                            key={index}
                            variant="outline"
                            onClick={() => handleAnswer(index)}
                            className="w-full text-left justify-start p-4 h-auto border-slate-600 hover:bg-slate-700"
                        >
                            <span className="mr-3 w-6 h-6 rounded-full bg-slate-600 flex items-center justify-center text-sm">{String.fromCharCode(65 + index)}</span>
                            {option}
                        </Button>
                    ))}
                </div>
            </div>
        </div>
    );
};


const TrainingDialog = ({ training, isOpen, onClose, onComplete }) => {
    const [showQuiz, setShowQuiz] = useState(false);
    const [videoCompleted, setVideoCompleted] = useState(false);
    const playerRef = useRef(null);
    const { toast } = useToast();
    const { user } = useAuth();

    const getYouTubeVideoId = (url) => {
        if (!url) return null;
        try {
            const urlObj = new URL(url);
            if (urlObj.hostname === 'youtu.be') return urlObj.pathname.slice(1);
            if (urlObj.hostname.includes('youtube.com')) return urlObj.searchParams.get('v');
        } catch (error) { return null; }
        return null;
    };
    
    const videoId = getYouTubeVideoId(training?.video);
    const isYouTube = !!videoId;

    const findOrCreateProgress = async () => {
        const q = query(
            collection(db, 'historico'),
            where('usuarioId', '==', user.id),
            where('treinamentoId', '==', training.id)
        );
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
            const doc = querySnapshot.docs[0];
            return { id: doc.id, ...doc.data() };
        }
        return null;
    };

    const onYouTubePlayerStateChange = (event) => {
        if (event.data === 0) { // Vídeo terminou
            setVideoCompleted(true);
        }
    };
    
    const completeTraining = async (score) => {
        const existingProgress = await findOrCreateProgress();
        const completionData = {
            concluido: true, 
            dataConclusao: new Date().toISOString(),
            notaQuestionario: score, // A nota já são os pontos
            pontosGanhos: score // <-- NOVO: Campo unificado para pontos
        };

        if (existingProgress) {
            await updateData('historico', existingProgress.id, completionData);
        } else {
            const newProgress = {
                usuarioId: user.id, treinamentoId: training.id, ...completionData
            };
            await addData('historico', newProgress);
        }
        
        toast({ title: "Treinamento concluído!", description: score !== null ? `Parabéns! Você ganhou ${score} pontos.` : `Você concluiu o treinamento.` });
        setShowQuiz(false);
        onComplete();
    };

    const startQuiz = () => {
        // Se não houver perguntas, conclui com uma pontuação padrão (ex: 5 pontos)
        if (!training?.perguntas || training.perguntas.length === 0) {
            completeTraining(5); 
            return;
        }
        setShowQuiz(true);
    };

    const downloadFile = (file) => {
        if (file && file.url) {
            window.open(file.url, '_blank');
        } else {
            toast({ title: "Erro", description: "Não foi possível encontrar o URL do arquivo.", variant: "destructive" });
        }
    };

    const handleClose = () => {
        setShowQuiz(false);
        onClose();
    };

    const hasQuestions = training?.perguntas && training.perguntas.length > 0;

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="glass-effect border-slate-700 text-white max-w-4xl max-h-[90vh] overflow-y-auto scrollbar-thin">
                <DialogHeader>
                    <DialogTitle className="text-xl">{training?.titulo}</DialogTitle>
                </DialogHeader>
                {!showQuiz ? (
                    <div className="space-y-6">
                        <div className="relative pt-[56.25%] bg-slate-800 rounded-lg overflow-hidden">
                            {isOpen && training?.video ? (
                                isYouTube ? (
                                    <YouTube
                                        videoId={videoId}
                                        className="absolute top-0 left-0 w-full h-full"
                                        opts={{ width: '100%', height: '100%' }}
                                        onStateChange={onYouTubePlayerStateChange}
                                    />
                                ) : (
                                    <iframe
                                        src={training.video}
                                        title={training.titulo}
                                        className="absolute top-0 left-0 w-full h-full"
                                        frameBorder="0"
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                        allowFullScreen
                                    ></iframe>
                                )
                            ) : (
                                <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center"><p>URL de vídeo inválida.</p></div>
                            )}
                        </div>
                        <div className="space-y-4">
                            <p className="text-slate-300">{training?.descricao}</p>
                            {(training?.arquivosComplementares || []).length > 0 && (
                                <div>
                                    <h3 className="text-lg font-semibold text-white mb-2">Arquivos Complementares</h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                        {training.arquivosComplementares.map((file, index) => (
                                            <Button key={index} variant="outline" onClick={() => downloadFile(file)} className="justify-start border-slate-600 hover:bg-slate-700">
                                                <Download className="w-4 h-4 mr-2" /> {file.name}
                                            </Button>
                                        ))}
                                    </div>
                                </div>
                            )}
                            <div className="flex justify-end">
                                {hasQuestions ? (
                                    <Button 
                                        onClick={startQuiz} 
                                        disabled={isYouTube && !videoCompleted} 
                                        className="bg-gradient-to-r from-green-500 to-blue-500 disabled:opacity-50"
                                    >
                                        <Award className="w-4 h-4 mr-2" /> Fazer Questionário
                                    </Button>
                                ) : (
                                    // Atribui 5 pontos pela conclusão de um treinamento sem questionário
                                    <Button 
                                        onClick={() => completeTraining(5)} 
                                        disabled={isYouTube && !videoCompleted} 
                                        className="bg-gradient-to-r from-green-500 to-blue-500 disabled:opacity-50"
                                    >
                                        <CheckCircle className="w-4 h-4 mr-2" /> Concluir Treinamento
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                ) : (
                    <QuizView training={training} onQuizComplete={completeTraining} />
                )}
            </DialogContent>
        </Dialog>
    );
};

export default TrainingDialog;

