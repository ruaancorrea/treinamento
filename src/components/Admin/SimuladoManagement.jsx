import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, Edit, Trash2, Loader2, Repeat } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getPaginatedData, addData, updateData, deleteData } from '@/lib/firebaseService';

const SimuladoManagement = () => {
    const [allSimulados, setAllSimulados] = useState([]);
    const [filteredSimulados, setFilteredSimulados] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingSimulado, setEditingSimulado] = useState(null);
    const [lastVisible, setLastVisible] = useState(null);
    const [hasMore, setHasMore] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [isInitialLoad, setIsInitialLoad] = useState(true);
    
    const initialFormData = {
        titulo: '', descricao: '', categoria: '', ativo: true, perguntas: [],
        regraTentativa: 'unlimited', // unlimited, once, monthly, specific_amount
        limiteTentativas: 1
    };
    
    const [formData, setFormData] = useState(initialFormData);
    const { toast } = useToast();

    const fetchSimulados = async (isLoadMore = false) => {
        if (isLoading) return;
        setIsLoading(true);
        const result = await getPaginatedData('simulados', { 
            lastVisible: isLoadMore ? lastVisible : null,
            orderByField: "dataCriacao",
            orderDirection: "desc"
        });
        if (result.data.length > 0) {
            setAllSimulados(prev => isLoadMore ? [...prev, ...result.data] : result.data);
            setLastVisible(result.lastVisible);
        }
        if (result.data.length < 15) setHasMore(false);
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

    const resetForm = () => {
        setFormData(initialFormData);
        setEditingSimulado(null);
    };

    const handleEdit = (simulado) => {
        setEditingSimulado(simulado);
        // Garante que os campos novos tenham valores padrão se não existirem no documento antigo
        const dataToEdit = {
            ...initialFormData,
            ...simulado
        };
        setFormData(dataToEdit);
        setIsFormOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (formData.perguntas.length === 0) {
            toast({ title: "Erro", description: "O simulado precisa ter pelo menos uma pergunta.", variant: "destructive" });
            return;
        }

        const dataToSave = {
            ...formData,
            limiteTentativas: Number(formData.limiteTentativas)
        };

        if (editingSimulado) {
            await updateData('simulados', editingSimulado.id, dataToSave);
            toast({ title: "Simulado atualizado!" });
        } else {
            const newSimulado = { ...dataToSave, dataCriacao: new Date().toISOString() };
            await addData('simulados', newSimulado);
            toast({ title: "Simulado criado!" });
        }
        setIsFormOpen(false);
        await fetchSimulados();
    };

    const handleDelete = async (simuladoId) => {
        if (!window.confirm("Tem certeza que deseja remover este simulado?")) return;
        await deleteData('simulados', simuladoId);
        toast({ title: "Simulado removido!" });
        setAllSimulados(prev => prev.filter(s => s.id !== simuladoId));
    };

    const handleAddQuestion = () => setFormData(prev => ({ ...prev, perguntas: [...(prev.perguntas || []), { pergunta: '', opcoes: ['', '', '', ''], respostaCorreta: null }] }));
    const handleRemoveQuestion = (index) => setFormData(prev => ({ ...prev, perguntas: prev.perguntas.filter((_, i) => i !== index) }));
    const handleQuestionChange = (qIndex, value) => { const newQuestions = [...formData.perguntas]; newQuestions[qIndex].pergunta = value; setFormData({ ...formData, perguntas: newQuestions }); };
    const handleOptionChange = (qIndex, oIndex, value) => { const newQuestions = [...formData.perguntas]; newQuestions[qIndex].opcoes[oIndex] = value; setFormData({ ...formData, perguntas: newQuestions }); };
    const handleCorrectAnswerChange = (qIndex, oIndex) => { const newQuestions = [...formData.perguntas]; newQuestions[qIndex].respostaCorreta = oIndex; setFormData({ ...formData, perguntas: newQuestions }); };

    if (isInitialLoad) {
        return <div className="flex justify-center items-center h-full"><Loader2 className="h-10 w-10 animate-spin text-blue-500" /></div>;
    }

    return (
        <div className="space-y-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex justify-between items-center">
                 <div>
                    <h1 className="text-3xl font-bold text-white">Gerenciamento de Simulados</h1>
                    <p className="text-slate-400">Crie e edite avaliações de conhecimento.</p>
                </div>
                <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                    <DialogTrigger asChild><Button className="bg-gradient-to-r from-blue-500 to-purple-600" onClick={resetForm}><Plus className="w-4 h-4 mr-2" /> Novo Simulado</Button></DialogTrigger>
                    <DialogContent className="glass-effect border-slate-700 text-white max-w-4xl max-h-[90vh] flex flex-col">
                        <DialogHeader><DialogTitle>{editingSimulado ? 'Editar' : 'Novo'} Simulado</DialogTitle></DialogHeader>
                        <form id="simuladoForm" onSubmit={handleSubmit} className="space-y-4 overflow-y-auto scrollbar-thin pr-4">
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2"><Label>Título</Label><Input value={formData.titulo} onChange={e => setFormData({...formData, titulo: e.target.value})} className="bg-slate-800/50" required /></div>
                                <div className="space-y-2"><Label>Categoria</Label><Input value={formData.categoria} onChange={e => setFormData({...formData, categoria: e.target.value})} placeholder="Ex: Sistemas Internos, Segurança" className="bg-slate-800/50" required /></div>
                            </div>
                            <div className="space-y-2"><Label>Descrição</Label><Textarea value={formData.descricao} onChange={e => setFormData({...formData, descricao: e.target.value})} className="bg-slate-800/50" /></div>
                            <div className="flex items-center space-x-2"><Switch id="ativo" checked={formData.ativo} onCheckedChange={checked => setFormData({...formData, ativo: checked})} /><Label htmlFor="ativo">Ativo (visível para funcionários)</Label></div>
                            
                            {/* --- NOVOS CAMPOS DE REGRAS --- */}
                            <div className="pt-4 border-t border-slate-700 grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Regra de Tentativas</Label>
                                    <Select value={formData.regraTentativa} onValueChange={value => setFormData({...formData, regraTentativa: value})}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="unlimited">Tentativas Ilimitadas</SelectItem>
                                            <SelectItem value="once">Apenas uma vez</SelectItem>
                                            <SelectItem value="monthly">Uma vez por mês</SelectItem>
                                            <SelectItem value="specific_amount">Número específico de vezes</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                {formData.regraTentativa === 'specific_amount' && (
                                    <div className="space-y-2">
                                        <Label>Limite de Tentativas</Label>
                                        <Input type="number" min="1" value={formData.limiteTentativas} onChange={e => setFormData({...formData, limiteTentativas: e.target.value})} />
                                    </div>
                                )}
                            </div>

                            <div className="space-y-4 pt-4 border-t border-slate-700">
                                <div className="flex justify-between items-center"><h3 className="text-lg font-semibold text-white">Questionário</h3><Button type="button" size="sm" onClick={handleAddQuestion}><Plus className="w-4 h-4 mr-2" /> Adicionar Pergunta</Button></div>
                                {(formData.perguntas || []).map((q, qIndex) => (<div key={qIndex} className="p-4 border border-slate-700 rounded-lg space-y-3 bg-slate-800/30"><div className="flex justify-between items-center"><Label>Pergunta {qIndex + 1}</Label><Button type="button" size="sm" variant="destructive" onClick={() => handleRemoveQuestion(qIndex)}><Trash2 className="w-4 h-4"/></Button></div><Textarea placeholder="Digite a pergunta..." value={q.pergunta} onChange={(e) => handleQuestionChange(qIndex, e.target.value)} required/><RadioGroup value={q.respostaCorreta?.toString()} onValueChange={(value) => handleCorrectAnswerChange(qIndex, parseInt(value))}>{q.opcoes.map((opt, oIndex) => (<div key={oIndex} className="flex items-center gap-2"><RadioGroupItem value={oIndex.toString()} id={`q${qIndex}o${oIndex}`} /><Input placeholder={`Opção ${oIndex + 1}`} value={opt} onChange={(e) => handleOptionChange(qIndex, oIndex, e.target.value)} required /></div>))}</RadioGroup></div>))}
                            </div>
                        </form>
                        <DialogFooter className="pt-4 border-t border-slate-700">
                            <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)} className="border-slate-600">Cancelar</Button>
                            <Button type="submit" form="simuladoForm" className="bg-gradient-to-r from-blue-500 to-purple-600">{editingSimulado ? 'Salvar' : 'Criar'}</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}><div className="relative"><Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" /><Input placeholder="Buscar por título..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10 bg-slate-800/50 border-slate-600" /></div></motion.div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">{filteredSimulados.map((simulado) => (<motion.div key={simulado.id}><Card className="glass-effect border-slate-700 card-hover h-full flex flex-col"><CardHeader><CardTitle className="text-lg text-white mb-1">{simulado.titulo}</CardTitle><p className="text-sm text-slate-400">{simulado.categoria}</p></CardHeader><CardContent className="flex-grow"><p className="text-sm text-slate-300 line-clamp-3">{simulado.descricao}</p></CardContent><CardFooter className="flex justify-between items-center"><span className="text-xs text-slate-400 flex items-center"><Repeat className="w-3 h-3 mr-1.5" /> {simulado.regraTentativa || 'Ilimitado'}</span><div className="flex space-x-2"><Button size="sm" variant="outline" className="border-slate-600" onClick={() => handleEdit(simulado)}><Edit className="w-4 h-4" /></Button><Button size="sm" variant="destructive" onClick={() => handleDelete(simulado.id)}><Trash2 className="w-4 h-4" /></Button></div></CardFooter></Card></motion.div>))}</div>
            {hasMore && (<div className="text-center mt-8"><Button onClick={() => fetchSimulados(true)} disabled={isLoading}>{isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Carregando...</> : 'Carregar Mais'}</Button></div>)}
        </div>
    );
};

export default SimuladoManagement;
