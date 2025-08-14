import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  BookOpen, 
  TrendingUp, 
  Award,
  Clock,
  CheckCircle,
  AlertCircle,
  BarChart3
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getDatabase } from '@/data/mockData';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalUsuarios: 0,
    usuariosAtivos: 0,
    totalTreinamentos: 0,
    treinamentosObrigatorios: 0,
    totalConclusoes: 0,
    taxaConclusao: 0,
    treinamentosVencendo: 0
  });

  const [recentActivity, setRecentActivity] = useState([]);

  useEffect(() => {
    const database = getDatabase();
    
    // Calculate statistics
    const totalUsuarios = database.usuarios.length;
    const usuariosAtivos = database.usuarios.filter(u => u.ativo).length;
    const totalTreinamentos = database.treinamentos.filter(t => t.ativo).length;
    const treinamentosObrigatorios = database.treinamentos.filter(t => t.obrigatorio && t.ativo).length;
    const totalConclusoes = database.historico.filter(h => h.concluido).length;
    const totalPossiveisConclusoes = database.usuarios.filter(u => u.tipo === 'funcionario').length * totalTreinamentos;
    const taxaConclusao = totalPossiveisConclusoes > 0 ? Math.round((totalConclusoes / totalPossiveisConclusoes) * 100) : 0;
    
    // Check for expiring trainings (within 30 days)
    const today = new Date();
    const thirtyDaysFromNow = new Date(today.getTime() + (30 * 24 * 60 * 60 * 1000));
    const treinamentosVencendo = database.treinamentos.filter(t => {
      if (!t.dataExpiracao) return false;
      const expDate = new Date(t.dataExpiracao);
      return expDate <= thirtyDaysFromNow && expDate >= today;
    }).length;

    setStats({
      totalUsuarios,
      usuariosAtivos,
      totalTreinamentos,
      treinamentosObrigatorios,
      totalConclusoes,
      taxaConclusao,
      treinamentosVencendo
    });

    // Get recent activity
    const recent = database.historico
      .filter(h => h.concluido)
      .sort((a, b) => new Date(b.dataConclusao) - new Date(a.dataConclusao))
      .slice(0, 5)
      .map(h => {
        const usuario = database.usuarios.find(u => u.id === h.usuarioId);
        const treinamento = database.treinamentos.find(t => t.id === h.treinamentoId);
        return {
          ...h,
          nomeUsuario: usuario?.nome || 'Usuário não encontrado',
          tituloTreinamento: treinamento?.titulo || 'Treinamento não encontrado'
        };
      });

    setRecentActivity(recent);
  }, []);

  const statCards = [
    {
      title: "Total de Usuários",
      value: stats.totalUsuarios,
      description: `${stats.usuariosAtivos} ativos`,
      icon: Users,
      color: "from-blue-500 to-blue-600"
    },
    {
      title: "Treinamentos",
      value: stats.totalTreinamentos,
      description: `${stats.treinamentosObrigatorios} obrigatórios`,
      icon: BookOpen,
      color: "from-green-500 to-green-600"
    },
    {
      title: "Taxa de Conclusão",
      value: `${stats.taxaConclusao}%`,
      description: `${stats.totalConclusoes} concluídos`,
      icon: TrendingUp,
      color: "from-purple-500 to-purple-600"
    },
    {
      title: "Vencendo em Breve",
      value: stats.treinamentosVencendo,
      description: "Próximos 30 dias",
      icon: AlertCircle,
      color: "from-orange-500 to-red-500"
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-2"
      >
        <h1 className="text-3xl font-bold text-white">Dashboard Administrativo</h1>
        <p className="text-slate-400">Visão geral da Central de Treinamento</p>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="glass-effect border-slate-700 card-hover">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-slate-200">
                    {stat.title}
                  </CardTitle>
                  <div className={`p-2 rounded-lg bg-gradient-to-r ${stat.color}`}>
                    <Icon className="h-4 w-4 text-white" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">{stat.value}</div>
                  <p className="text-xs text-slate-400 mt-1">{stat.description}</p>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="glass-effect border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <CheckCircle className="w-5 h-5 mr-2 text-green-500" />
                Atividade Recente
              </CardTitle>
              <CardDescription className="text-slate-400">
                Últimos treinamentos concluídos
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {recentActivity.length > 0 ? (
                recentActivity.map((activity, index) => (
                  <motion.div
                    key={activity.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + index * 0.1 }}
                    className="flex items-center space-x-3 p-3 rounded-lg bg-slate-800/30"
                  >
                    <div className="w-8 h-8 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center">
                      <Award className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">
                        {activity.nomeUsuario}
                      </p>
                      <p className="text-xs text-slate-400 truncate">
                        {activity.tituloTreinamento}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-400">
                        {new Date(activity.dataConclusao).toLocaleDateString('pt-BR')}
                      </p>
                      <p className="text-xs text-green-400">
                        Nota: {activity.notaQuestionario}/10
                      </p>
                    </div>
                  </motion.div>
                ))
              ) : (
                <p className="text-slate-400 text-center py-4">
                  Nenhuma atividade recente
                </p>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="glass-effect border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <BarChart3 className="w-5 h-5 mr-2 text-blue-500" />
                Ações Rápidas
              </CardTitle>
              <CardDescription className="text-slate-400">
                Acesso rápido às principais funcionalidades
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full p-3 text-left rounded-lg bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30 hover:border-blue-400 transition-colors"
                onClick={() => {
                  // This would navigate to users section
                  console.log('Navigate to users');
                }}
              >
                <div className="flex items-center space-x-3">
                  <Users className="w-5 h-5 text-blue-400" />
                  <div>
                    <p className="text-sm font-medium text-white">Gerenciar Usuários</p>
                    <p className="text-xs text-slate-400">Adicionar, editar ou desativar usuários</p>
                  </div>
                </div>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full p-3 text-left rounded-lg bg-gradient-to-r from-green-500/20 to-blue-500/20 border border-green-500/30 hover:border-green-400 transition-colors"
                onClick={() => {
                  // This would navigate to trainings section
                  console.log('Navigate to trainings');
                }}
              >
                <div className="flex items-center space-x-3">
                  <BookOpen className="w-5 h-5 text-green-400" />
                  <div>
                    <p className="text-sm font-medium text-white">Novo Treinamento</p>
                    <p className="text-xs text-slate-400">Criar um novo treinamento</p>
                  </div>
                </div>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full p-3 text-left rounded-lg bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 hover:border-purple-400 transition-colors"
                onClick={() => {
                  // This would navigate to reports section
                  console.log('Navigate to reports');
                }}
              >
                <div className="flex items-center space-x-3">
                  <BarChart3 className="w-5 h-5 text-purple-400" />
                  <div>
                    <p className="text-sm font-medium text-white">Ver Relatórios</p>
                    <p className="text-xs text-slate-400">Análise detalhada de desempenho</p>
                  </div>
                </div>
              </motion.button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;