import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Search, Filter, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { getPaginatedTrainingsForUser, getAllData } from '@/lib/firebaseService';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/firebaseConfig';
import TrainingCard from '@/components/Employee/TrainingCard';
import TrainingDialog from '@/components/Employee/TrainingDialog';

const TrainingList = () => {
    const [allTrainings, setAllTrainings] = useState([]);
    const [filteredTrainings, setFilteredTrainings] = useState([]);
    const [categories, setCategories] = useState([]);
    const [userProgress, setUserProgress] = useState({});
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [selectedTraining, setSelectedTraining] = useState(null);
    const { user } = useAuth();

    // Estados para a paginação dupla
    const [lastVisibleDept, setLastVisibleDept] = useState(null);
    const [lastVisibleTodos, setLastVisibleTodos] = useState(null);
    const [hasMore, setHasMore] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [isInitialLoad, setIsInitialLoad] = useState(true);

    const fetchTrainings = async (isLoadMore = false) => {
        if (isLoading || !user) return;
        setIsLoading(true);

        const result = await getPaginatedTrainingsForUser(
            user.departamento,
            {
                lastVisibleDept: isLoadMore ? lastVisibleDept : null,
                lastVisibleTodos: isLoadMore ? lastVisibleTodos : null,
            }
        );

        if (result.data.length > 0) {
            // Usa um Map para juntar os resultados e remover duplicados
            const trainingsMap = new Map(isLoadMore ? allTrainings.map(t => [t.id, t]) : []);
            result.data.forEach(t => trainingsMap.set(t.id, t));
            
            const updatedTrainings = Array.from(trainingsMap.values())
              .sort((a, b) => new Date(b.dataPublicacao) - new Date(a.dataPublicacao));
              
            setAllTrainings(updatedTrainings);
            
            setLastVisibleDept(result.lastVisibleDept);
            setLastVisibleTodos(result.lastVisibleTodos);
        }

        // Se ambas as buscas não trouxerem mais nada, desativa o botão
        if (!result.lastVisibleDept && !result.lastVisibleTodos) {
            setHasMore(false);
        }
        
        setIsLoading(false);
    };
    
    const loadInitialData = async () => {
        if (!user) return;
        setIsInitialLoad(true);
        try {
            const [categoriesData, historicoSnapshot] = await Promise.all([
                getAllData('categorias'),
                getDocs(query(collection(db, 'historico'), where('usuarioId', '==', user.id)))
            ]);

            setCategories(categoriesData);
            const progress = {};
            historicoSnapshot.forEach(doc => {
                progress[doc.data().treinamentoId.toString()] = { id: doc.id, ...doc.data() };
            });
            setUserProgress(progress);

            await fetchTrainings(false);

        } catch (error) {
            console.error("Erro ao carregar dados iniciais:", error);
        } finally {
            setIsInitialLoad(false);
        }
    };

    useEffect(() => {
        if (user) {
            loadInitialData();
        }
    }, [user]);

    useEffect(() => {
        let filtered = allTrainings;
        
        if (searchTerm) {
            filtered = filtered.filter(training =>
                training.titulo.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }
        
        if (selectedCategory !== 'all') {
            filtered = filtered.filter(training => 
                training.categoriaId.toString() === selectedCategory
            );
        }
        
        setFilteredTrainings(filtered);
    }, [allTrainings, searchTerm, selectedCategory]);
    
    const handleTrainingComplete = async () => {
        setSelectedTraining(null);
        // Apenas atualiza o progresso para evitar recarregar a lista toda
        const historicoSnapshot = await getDocs(query(collection(db, 'historico'), where('usuarioId', '==', user.id)));
        const progress = {};
        historicoSnapshot.forEach(doc => {
            progress[doc.data().treinamentoId.toString()] = { id: doc.id, ...doc.data() };
        });
        setUserProgress(prev => ({ ...prev, ...progress }));
    };

    if (isInitialLoad) {
        return <div className="flex justify-center items-center h-full"><Loader2 className="h-10 w-10 animate-spin text-blue-500" /></div>;
    }

    return (
        <div className="space-y-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <h1 className="text-3xl font-bold text-white">Meus Treinamentos</h1>
                <p className="text-slate-400">Acesse os seus treinamentos disponíveis.</p>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="flex flex-col sm:flex-row gap-4"
            >
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <Input
                        placeholder="Buscar nos treinamentos carregados..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 bg-slate-800/50 border-slate-600 text-white"
                    />
                </div>
                
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="w-full sm:w-48 bg-slate-800/50 border-slate-600">
                        <Filter className="w-4 h-4 mr-2" />
                        <SelectValue placeholder="Categoria" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todas as categorias</SelectItem>
                        {categories.map(category => (
                            <SelectItem key={category.id} value={category.id.toString()}>
                                {category.nome}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredTrainings.map((training, index) => (
                    <TrainingCard
                        key={training.id}
                        training={training}
                        userProgress={userProgress[training.id.toString()]}
                        categories={categories}
                        onStartTraining={() => setSelectedTraining(training)}
                        index={index}
                    />
                ))}
            </div>

            {filteredTrainings.length === 0 && !isLoading && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12">
                    <BookOpen className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                    <p className="text-slate-400 text-lg">Nenhum treinamento encontrado.</p>
                </motion.div>
            )}

            {hasMore && (
                <div className="text-center mt-8">
                    <Button onClick={() => fetchTrainings(true)} disabled={isLoading}>
                        {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Carregando...</> : 'Carregar Mais Treinamentos'}
                    </Button>
                </div>
            )}

            {selectedTraining && (
                <TrainingDialog
                    training={selectedTraining}
                    isOpen={!!selectedTraining}
                    onClose={() => setSelectedTraining(null)}
                    onComplete={handleTrainingComplete}
                />
            )}
        </div>
    );
};

export default TrainingList;
