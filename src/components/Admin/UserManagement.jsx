import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, Edit, Trash2, UserCheck, UserX, Mail, Building, Calendar, Loader2, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { getPaginatedData, addData, updateData, deleteData, getAllData, resetUserData } from '@/lib/firebaseService';

const UserManagement = () => {
    const [allUsers, setAllUsers] = useState([]);
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [formData, setFormData] = useState({});
    const { toast } = useToast();

    const [lastVisible, setLastVisible] = useState(null);
    const [hasMore, setHasMore] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [isInitialLoad, setIsInitialLoad] = useState(true);

    const initialFormData = {
        nome: '', email: '', senha: '', tipo: 'funcionario', departamento: '', ativo: true
    };

    const resetForm = (depts) => {
        const defaultDept = depts.length > 0 ? depts[0].nome : '';
        setFormData({ ...initialFormData, departamento: defaultDept });
        setEditingUser(null);
    };

    const fetchUsers = async (isLoadMore = false) => {
        if (isLoading) return;
        setIsLoading(true);
        const result = await getPaginatedData('usuarios', { lastVisible: isLoadMore ? lastVisible : null });
        
        if (result.data.length > 0) {
            setAllUsers(prev => isLoadMore ? [...prev, ...result.data] : result.data);
            setLastVisible(result.lastVisible);
        }
        
        if (result.data.length < 15) {
            setHasMore(false);
        }
        
        setIsLoading(false);
    };

    useEffect(() => {
        const loadInitialData = async () => {
            setIsInitialLoad(true);
            const depts = await getAllData('departamentos');
            setDepartments(depts);
            resetForm(depts);
            await fetchUsers();
            setIsInitialLoad(false);
        };
        loadInitialData();
    }, []);

    useEffect(() => {
        const filtered = allUsers.filter(user =>
            user.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (user.departamento && user.departamento.toLowerCase().includes(searchTerm.toLowerCase()))
        );
        setFilteredUsers(filtered);
    }, [allUsers, searchTerm]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (editingUser) {
            const dataToUpdate = { ...formData };
            if (!dataToUpdate.senha) {
                delete dataToUpdate.senha;
            }
            await updateData('usuarios', editingUser.id, dataToUpdate);
            toast({ title: "Usuário atualizado!" });
        } else {
            const newUser = { ...formData, dataCriacao: new Date().toISOString() };
            await addData('usuarios', newUser);
            toast({ title: "Usuário criado!" });
        }
        
        setIsDialogOpen(false);
        await fetchUsers();
    };

    const handleEdit = (user) => {
        setEditingUser(user);
        setFormData({
            nome: user.nome, email: user.email, senha: '',
            tipo: user.tipo, departamento: user.departamento, ativo: user.ativo
        });
        setIsDialogOpen(true);
    };

    const handleDelete = async (userId) => {
        if (!window.confirm("Tem certeza que deseja remover este usuário?")) return;
        await deleteData('usuarios', userId);
        toast({ title: "Usuário removido!" });
        setAllUsers(prev => prev.filter(user => user.id !== userId));
    };

    const toggleUserStatus = async (user) => {
        const newStatus = !user.ativo;
        await updateData('usuarios', user.id, { ativo: newStatus });
        toast({ title: "Status atualizado!" });
        setAllUsers(prevUsers => prevUsers.map(u => u.id === user.id ? { ...u, ativo: newStatus } : u));
    };

    // --- NOVA FUNÇÃO PARA ZERAR O DESEMPENHO ---
    const handleReset = async (user) => {
        if (!window.confirm(`Tem certeza que deseja ZERAR TODO O DESEMPENHO do usuário "${user.nome}"? Esta ação não pode ser desfeita.`)) return;
        
        try {
            await resetUserData(user.id);
            toast({ title: "Desempenho zerado!", description: `Todos os dados de progresso de ${user.nome} foram removidos.` });
        } catch (error) {
            toast({ title: "Erro", description: error.message, variant: "destructive" });
        }
    };

    if (isInitialLoad) {
        return <div className="flex justify-center items-center h-full"><Loader2 className="h-10 w-10 animate-spin text-blue-500" /></div>;
    }

    return (
        <div className="space-y-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-white">Gerenciamento de Usuários</h1>
                    <p className="text-slate-400">Gerencie usuários do sistema</p>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-gradient-to-r from-blue-500 to-purple-600" onClick={() => resetForm(departments)}>
                            <Plus className="w-4 h-4 mr-2" /> Novo Usuário
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="glass-effect border-slate-700 text-white">
                        <DialogHeader><DialogTitle>{editingUser ? 'Editar' : 'Novo'} Usuário</DialogTitle></DialogHeader>
                        <form id="userForm" onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2"><Label htmlFor="nome">Nome</Label><Input id="nome" value={formData.nome} onChange={(e) => setFormData({...formData, nome: e.target.value})} className="bg-slate-800/50" required /></div>
                                <div className="space-y-2"><Label htmlFor="email">Email</Label><Input id="email" type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="bg-slate-800/50" required /></div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2"><Label htmlFor="senha">Senha</Label><Input id="senha" type="password" placeholder={editingUser ? 'Deixe em branco para não alterar' : ''} onChange={(e) => setFormData({...formData, senha: e.target.value})} className="bg-slate-800/50" required={!editingUser} /></div>
                                <div className="space-y-2"><Label htmlFor="tipo">Tipo</Label><Select value={formData.tipo} onValueChange={(value) => setFormData({...formData, tipo: value})}><SelectTrigger className="bg-slate-800/50"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="admin">Administrador</SelectItem><SelectItem value="funcionario">Funcionário</SelectItem></SelectContent></Select></div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="departamento">Departamento</Label>
                                <Select value={formData.departamento} onValueChange={(value) => setFormData({...formData, departamento: value})}>
                                    <SelectTrigger className="bg-slate-800/50"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                                    <SelectContent>
                                        {departments.map(dept => (<SelectItem key={dept.id} value={dept.nome}>{dept.nome}</SelectItem>))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </form>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="border-slate-600">Cancelar</Button>
                            <Button type="submit" form="userForm" className="bg-gradient-to-r from-blue-500 to-purple-600">{editingUser ? 'Atualizar' : 'Criar'}</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input placeholder="Buscar nos usuários carregados..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 bg-slate-800/50 border-slate-600" />
            </motion.div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredUsers.map((user, index) => (
                    <motion.div key={user.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }}>
                        <Card className="glass-effect border-slate-700 card-hover">
                            <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-3">
                                        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center"><span className="text-sm font-semibold text-white">{user.nome.charAt(0)}</span></div>
                                        <div>
                                            <CardTitle className="text-lg text-white">{user.nome}</CardTitle>
                                            <div className="flex items-center space-x-2 mt-1">
                                                <Badge variant={user.tipo === 'admin' ? 'default' : 'secondary'}>{user.tipo === 'admin' ? 'Admin' : 'Funcionário'}</Badge>
                                                <Badge variant={user.ativo ? 'default' : 'destructive'}>{user.ativo ? 'Ativo' : 'Inativo'}</Badge>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="flex items-center space-x-2 text-sm text-slate-300"><Mail className="w-4 h-4" /><span>{user.email}</span></div>
                                <div className="flex items-center space-x-2 text-sm text-slate-300"><Building className="w-4 h-4" /><span>{user.departamento}</span></div>
                                <div className="flex items-center space-x-2 text-sm text-slate-300"><Calendar className="w-4 h-4" /><span>Criado em {new Date(user.dataCriacao).toLocaleDateString('pt-BR')}</span></div>
                                <div className="flex justify-between pt-3 border-t border-slate-700">
                                    <div className="flex space-x-2">
                                        <Button size="sm" variant="outline" onClick={() => handleEdit(user)} className="border-slate-600 hover:bg-slate-700"><Edit className="w-4 h-4" /></Button>
                                        <Button size="sm" variant="outline" onClick={() => toggleUserStatus(user)} className={`border-slate-600 ${user.ativo ? 'hover:bg-red-500/20 hover:border-red-500' : 'hover:bg-green-500/20 hover:border-green-500'}`}>{user.ativo ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}</Button>
                                        {/* --- BOTÃO PARA ZERAR DESEMPENHO --- */}
                                        <Button size="sm" variant="outline" onClick={() => handleReset(user)} className="border-slate-600 hover:bg-yellow-500/20 hover:border-yellow-500" title="Zerar Desempenho"><RotateCcw className="w-4 h-4" /></Button>
                                    </div>
                                    <Button size="sm" variant="outline" onClick={() => handleDelete(user.id)} className="border-slate-600 hover:bg-red-500/20 hover:border-red-500"><Trash2 className="w-4 h-4" /></Button>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                ))}
            </div>

            {hasMore && (
                <div className="text-center mt-8">
                    <Button onClick={() => fetchUsers(true)} disabled={isLoading}>
                        {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Carregando...</> : 'Carregar Mais Usuários'}
                    </Button>
                </div>
            )}
        </div>
    );
};

export default UserManagement;
