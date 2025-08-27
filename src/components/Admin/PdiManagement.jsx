import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ClipboardCheck, Plus, Edit, Trash2, Loader2, Target, GraduationCap, CheckSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { getAllData, addData, updateData, deleteData } from '@/lib/firebaseService';
import { Badge } from '@/components/ui/badge';

const PdiManagement = () => {
    const [pdis, setPdis] = useState([]);
    const [funcionarios, setFuncionarios] = useState([]);
    const [conteudos, setConteudos] = useState([]); // Treinamentos e Simulados
    const [isLoading, setIsLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingPdi, setEditingPdi] = useState(null);
    const { toast } = useToast();

    const initialFormData = {
        usuarioId: '',
        usuarioNome: '',
        titulo: '',
        descricao: '',
        status: 'Em Andamento',
        metas: []
    };
    const [formData, setFormData] = useState(initialFormData);

    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true);
            const [pdisData, usersData, trainingsData, simuladosData] = await Promise.all([
                getAllData('pdis'),
                getAllData('usuarios'),
                getAllData('treinamentos'),
                getAllData('simulados')
            ]);
            setPdis(pdisData);
            setFuncionarios(usersData.filter(u => u.tipo === 'funcionario' && u.ativo));
            const allConteudos = [
                ...trainingsData.map(t => ({...t, tipo: 'Treinamento'})),
                ...simuladosData.map(s => ({...s, tipo: 'Simulado'}))
            ];
            setConteudos(allConteudos);
            setIsLoading(false);
        };
        loadData();
    }, []);

    const handleOpenDialog = (pdi = null) => {
        if (pdi) {
            setEditingPdi(pdi);
            setFormData(pdi);
        } else {
            setEditingPdi(null);
            setFormData(initialFormData);
        }
        setIsDialogOpen(true);
    };

    const handleDelete = async (pdiId) => {
        if (!window.confirm("Tem certeza que deseja apagar este PDI?")) return;
        await deleteData('pdis', pdiId);
        toast({ title: "PDI apagado com sucesso!" });
        setPdis(prev => prev.filter(p => p.id !== pdiId));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        // Validação para garantir que o funcionário foi selecionado corretamente
        if (!formData.usuarioId || !formData.usuarioNome) {
            toast({ title: "Erro", description: "Por favor, selecione um funcionário.", variant: "destructive" });
            return;
        }

        if (editingPdi) {
            await updateData('pdis', editingPdi.id, formData);
            toast({ title: "PDI atualizado com sucesso!" });
        } else {
            const newPdi = { ...formData, dataCriacao: new Date().toISOString() };
            await addData('pdis', newPdi);
            toast({ title: "PDI criado com sucesso!" });
        }
        setIsDialogOpen(false);
        const pdisData = await getAllData('pdis'); // Recarrega os PDIs
        setPdis(pdisData);
    };

    // --- CORREÇÃO AQUI ---
    // Função dedicada para lidar com a mudança do funcionário, guardando ID e Nome
    const handleFuncionarioChange = (userId) => {
        const funcionario = funcionarios.find(f => String(f.id) === String(userId));
        setFormData({
            ...formData,
            usuarioId: String(userId), // Garante que o ID é uma string
            usuarioNome: funcionario ? funcionario.nome : ''
        });
    };

    // Funções para gerir metas e conteúdos dentro do formulário
    const handleAddMeta = () => {
        setFormData(prev => ({...prev, metas: [...prev.metas, { titulo: '', descricao: '', conteudos: [] }]}));
    };
    const handleRemoveMeta = (index) => {
        setFormData(prev => ({...prev, metas: prev.metas.filter((_, i) => i !== index)}));
    };
    const handleMetaChange = (index, field, value) => {
        const newMetas = [...formData.metas];
        newMetas[index][field] = value;
        setFormData(prev => ({...prev, metas: newMetas}));
    };
    const handleAddConteudo = (metaIndex, conteudoId) => {
        const conteudo = conteudos.find(c => c.id === conteudoId);
        if (!conteudo) return;
        const newMetas = [...formData.metas];
        const newConteudos = newMetas[metaIndex].conteudos || [];
        // Evita adicionar duplicados
        if (newConteudos.some(c => c.id === conteudoId)) return;
        newConteudos.push({ id: conteudo.id, titulo: conteudo.titulo, tipo: conteudo.tipo });
        newMetas[metaIndex].conteudos = newConteudos;
        setFormData(prev => ({...prev, metas: newMetas}));
    };
    const handleRemoveConteudo = (metaIndex, conteudoId) => {
        const newMetas = [...formData.metas];
        newMetas[metaIndex].conteudos = newMetas[metaIndex].conteudos.filter(c => c.id !== conteudoId);
        setFormData(prev => ({...prev, metas: newMetas}));
    };

    if (isLoading) {
        return <div className="flex justify-center items-center h-full"><Loader2 className="h-10 w-10 animate-spin text-blue-500" /></div>;
    }

    return (
        <div className="space-y-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-white">Planos de Desenvolvimento (PDI)</h1>
                    <p className="text-slate-400">Crie e acompanhe planos de carreira individuais.</p>
                </div>
                <Button onClick={() => handleOpenDialog()}><Plus className="w-4 h-4 mr-2" /> Novo PDI</Button>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {pdis.map(pdi => (
                    <motion.div key={pdi.id}>
                        <Card className="glass-effect border-slate-700 card-hover h-full flex flex-col">
                            <CardHeader>
                                <CardTitle className="text-white">{pdi.titulo}</CardTitle>
                                <CardDescription>Para: <span className="font-semibold text-blue-400">{pdi.usuarioNome}</span></CardDescription>
                            </CardHeader>
                            <CardContent className="flex-grow">
                                <p className="text-sm text-slate-300 line-clamp-3">{pdi.descricao}</p>
                                <Badge className="mt-4">{pdi.status}</Badge>
                            </CardContent>
                            <CardFooter className="flex justify-end space-x-2">
                                <Button size="sm" variant="outline" onClick={() => handleOpenDialog(pdi)}><Edit className="w-4 h-4" /></Button>
                                <Button size="sm" variant="destructive" onClick={() => handleDelete(pdi.id)}><Trash2 className="w-4 h-4" /></Button>
                            </CardFooter>
                        </Card>
                    </motion.div>
                ))}
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="glass-effect border-slate-700 text-white max-w-4xl max-h-[90vh] flex flex-col">
                    <DialogHeader><DialogTitle>{editingPdi ? 'Editar' : 'Novo'} PDI</DialogTitle></DialogHeader>
                    <div className="flex-grow overflow-y-auto scrollbar-thin pr-4">
                        <form id="pdiForm" onSubmit={handleSubmit} className="space-y-4">
                            
                            {/* --- SELEÇÃO DE FUNCIONÁRIO CORRIGIDA --- */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label>Funcionário</Label>
                                    {funcionarios.length > 0 ? (
                                        <Select
                                            value={formData.usuarioId}
                                            onValueChange={handleFuncionarioChange}
                                            required
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Selecione..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {funcionarios.map(f => (
                                                    <SelectItem key={f.id} value={String(f.id)}>
                                                        {f.nome}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    ) : (
                                        <p className="text-sm text-gray-400 mt-1">Carregando funcionários...</p>
                                    )}
                                </div>
                                <div>
                                    <Label>Título do PDI</Label>
                                    <Input
                                        value={formData.titulo}
                                        onChange={e => setFormData({ ...formData, titulo: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <Label>Descrição / Objetivo</Label>
                                <Textarea
                                    value={formData.descricao}
                                    onChange={e => setFormData({ ...formData, descricao: e.target.value })}
                                />
                            </div>

                            <div>
                                <Label>Status</Label>
                                <Select
                                    value={formData.status}
                                    onValueChange={val => setFormData({ ...formData, status: val })}
                                >
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Em Andamento">Em Andamento</SelectItem>
                                        <SelectItem value="Concluído">Concluído</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Metas */}
                            <div className="space-y-4 pt-4 border-t border-slate-700">
                                <div className="flex justify-between items-center">
                                    <h3 className="text-lg font-semibold text-white">Metas</h3>
                                    <Button type="button" size="sm" variant="outline" onClick={handleAddMeta}><Plus className="w-4 h-4 mr-2" /> Adicionar Meta</Button>
                                </div>
                                {formData.metas.map((meta, metaIndex) => (
                                    <div key={metaIndex} className="p-4 border border-slate-600 rounded-lg space-y-4 bg-slate-800/50">
                                        <div className="flex justify-between items-center">
                                            <Label>Meta {metaIndex + 1}</Label>
                                            <Button type="button" size="sm" variant="destructive" onClick={() => handleRemoveMeta(metaIndex)}><Trash2 className="w-4 h-4"/></Button>
                                        </div>
                                        <Input placeholder="Título da meta..." value={meta.titulo} onChange={e => handleMetaChange(metaIndex, 'titulo', e.target.value)} required />
                                        <Textarea placeholder="Descrição da meta..." value={meta.descricao} onChange={e => handleMetaChange(metaIndex, 'descricao', e.target.value)} />
                                        
                                        <div className="space-y-2">
                                            <Label>Conteúdos Associados</Label>
                                            <Select onValueChange={val => handleAddConteudo(metaIndex, val)}>
                                                <SelectTrigger><SelectValue placeholder="Adicionar treinamento ou simulado..." /></SelectTrigger>
                                                <SelectContent>
                                                    {conteudos.map(c => <SelectItem key={c.id} value={c.id}>{c.titulo} ({c.tipo})</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                            <div className="space-y-2 pt-2">
                                                {(meta.conteudos || []).map(conteudo => (
                                                    <div key={conteudo.id} className="flex items-center justify-between bg-slate-700/50 p-2 rounded text-sm">
                                                        <div className="flex items-center space-x-2">
                                                            {conteudo.tipo === 'Treinamento' ? <GraduationCap className="w-4 h-4 text-green-400" /> : <CheckSquare className="w-4 h-4 text-blue-400" />}
                                                            <span>{conteudo.titulo}</span>
                                                        </div>
                                                        <Button type="button" size="icon" variant="ghost" className="h-6 w-6" onClick={() => handleRemoveConteudo(metaIndex, conteudo.id)}><Trash2 className="w-4 h-4 text-red-500"/></Button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                        </form>
                    </div>
                    <DialogFooter className="pt-4 border-t border-slate-700">
                        <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                        <Button type="submit" form="pdiForm">{editingPdi ? 'Salvar Alterações' : 'Criar PDI'}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default PdiManagement;
