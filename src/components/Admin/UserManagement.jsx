import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  UserCheck, 
  UserX,
  Mail,
  Building,
  Calendar
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { getDatabase, updateDatabase } from '@/data/mockData';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    senha: '',
    tipo: 'funcionario',
    departamento: 'Contabilidade',
    ativo: true
  });
  const { toast } = useToast();

  const departamentos = ['Contabilidade', 'Fiscal', 'Recursos Humanos', 'Todos'];

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    const filtered = users.filter(user =>
      user.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.departamento.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredUsers(filtered);
  }, [users, searchTerm]);

  const loadUsers = () => {
    const database = getDatabase();
    setUsers(database.usuarios);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const database = getDatabase();
    
    if (editingUser) {
      // Update existing user
      const updatedUsers = database.usuarios.map(user =>
        user.id === editingUser.id
          ? { ...user, ...formData }
          : user
      );
      
      const updatedDatabase = { ...database, usuarios: updatedUsers };
      updateDatabase(updatedDatabase);
      
      toast({
        title: "Usuário atualizado!",
        description: "As informações do usuário foram atualizadas com sucesso.",
      });
    } else {
      // Create new user
      const newUser = {
        id: Math.max(...database.usuarios.map(u => u.id)) + 1,
        ...formData,
        dataCriacao: new Date().toISOString().split('T')[0]
      };
      
      const updatedDatabase = {
        ...database,
        usuarios: [...database.usuarios, newUser]
      };
      updateDatabase(updatedDatabase);
      
      toast({
        title: "Usuário criado!",
        description: "Novo usuário foi adicionado com sucesso.",
      });
    }
    
    loadUsers();
    resetForm();
    setIsDialogOpen(false);
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setFormData({
      nome: user.nome,
      email: user.email,
      senha: user.senha,
      tipo: user.tipo,
      departamento: user.departamento,
      ativo: user.ativo
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (userId) => {
    const database = getDatabase();
    const updatedUsers = database.usuarios.filter(user => user.id !== userId);
    const updatedDatabase = { ...database, usuarios: updatedUsers };
    updateDatabase(updatedDatabase);
    
    loadUsers();
    toast({
      title: "Usuário removido!",
      description: "O usuário foi removido com sucesso.",
    });
  };

  const toggleUserStatus = (userId) => {
    const database = getDatabase();
    const updatedUsers = database.usuarios.map(user =>
      user.id === userId ? { ...user, ativo: !user.ativo } : user
    );
    const updatedDatabase = { ...database, usuarios: updatedUsers };
    updateDatabase(updatedDatabase);
    
    loadUsers();
    toast({
      title: "Status atualizado!",
      description: "O status do usuário foi alterado com sucesso.",
    });
  };

  const resetForm = () => {
    setFormData({
      nome: '',
      email: '',
      senha: '',
      tipo: 'funcionario',
      departamento: 'Contabilidade',
      ativo: true
    });
    setEditingUser(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold text-white">Gerenciamento de Usuários</h1>
          <p className="text-slate-400">Gerencie usuários do sistema</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
              onClick={resetForm}
            >
              <Plus className="w-4 h-4 mr-2" />
              Novo Usuário
            </Button>
          </DialogTrigger>
          <DialogContent className="glass-effect border-slate-700 text-white">
            <DialogHeader>
              <DialogTitle>
                {editingUser ? 'Editar Usuário' : 'Novo Usuário'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome</Label>
                  <Input
                    id="nome"
                    value={formData.nome}
                    onChange={(e) => setFormData({...formData, nome: e.target.value})}
                    className="bg-slate-800/50 border-slate-600"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="bg-slate-800/50 border-slate-600"
                    required
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="senha">Senha</Label>
                  <Input
                    id="senha"
                    type="password"
                    value={formData.senha}
                    onChange={(e) => setFormData({...formData, senha: e.target.value})}
                    className="bg-slate-800/50 border-slate-600"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tipo">Tipo</Label>
                  <Select value={formData.tipo} onValueChange={(value) => setFormData({...formData, tipo: value})}>
                    <SelectTrigger className="bg-slate-800/50 border-slate-600">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Administrador</SelectItem>
                      <SelectItem value="funcionario">Funcionário</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="departamento">Departamento</Label>
                <Select value={formData.departamento} onValueChange={(value) => setFormData({...formData, departamento: value})}>
                  <SelectTrigger className="bg-slate-800/50 border-slate-600">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {departamentos.map(dept => (
                      <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsDialogOpen(false)}
                  className="border-slate-600"
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit"
                  className="bg-gradient-to-r from-blue-500 to-purple-600"
                >
                  {editingUser ? 'Atualizar' : 'Criar'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </motion.div>

      {/* Search */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="relative"
      >
        <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
        <Input
          placeholder="Buscar usuários..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 bg-slate-800/50 border-slate-600 text-white"
        />
      </motion.div>

      {/* Users Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredUsers.map((user, index) => (
          <motion.div
            key={user.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="glass-effect border-slate-700 card-hover">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                      <span className="text-sm font-semibold text-white">
                        {user.nome.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <CardTitle className="text-lg text-white">{user.nome}</CardTitle>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge variant={user.tipo === 'admin' ? 'default' : 'secondary'}>
                          {user.tipo === 'admin' ? 'Admin' : 'Funcionário'}
                        </Badge>
                        <Badge variant={user.ativo ? 'default' : 'destructive'}>
                          {user.ativo ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-3">
                <div className="flex items-center space-x-2 text-sm text-slate-300">
                  <Mail className="w-4 h-4" />
                  <span>{user.email}</span>
                </div>
                
                <div className="flex items-center space-x-2 text-sm text-slate-300">
                  <Building className="w-4 h-4" />
                  <span>{user.departamento}</span>
                </div>
                
                <div className="flex items-center space-x-2 text-sm text-slate-300">
                  <Calendar className="w-4 h-4" />
                  <span>Criado em {new Date(user.dataCriacao).toLocaleDateString('pt-BR')}</span>
                </div>
                
                <div className="flex justify-between pt-3 border-t border-slate-700">
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(user)}
                      className="border-slate-600 hover:bg-slate-700"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => toggleUserStatus(user.id)}
                      className={`border-slate-600 ${
                        user.ativo 
                          ? 'hover:bg-red-500/20 hover:border-red-500' 
                          : 'hover:bg-green-500/20 hover:border-green-500'
                      }`}
                    >
                      {user.ativo ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                    </Button>
                  </div>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDelete(user.id)}
                    className="border-slate-600 hover:bg-red-500/20 hover:border-red-500"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {filteredUsers.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <p className="text-slate-400 text-lg">Nenhum usuário encontrado</p>
        </motion.div>
      )}
    </div>
  );
};

export default UserManagement;