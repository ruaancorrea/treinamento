import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { FileUp, Download, FileDown, AlertTriangle } from 'lucide-react';
import Papa from 'papaparse';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { getDatabase, updateDatabase } from '@/data/mockData';

// Objeto para mapear cores a classes completas do Tailwind
const colorClasses = {
    blue: { gradient: 'from-blue-500 to-blue-600', bg: 'bg-blue-600', hoverBg: 'hover:bg-blue-700' },
    green: { gradient: 'from-green-500 to-green-600', bg: 'bg-green-600', hoverBg: 'hover:bg-green-700' },
    purple: { gradient: 'from-purple-500 to-purple-600', bg: 'bg-purple-600', hoverBg: 'hover:bg-purple-700' },
    red: { gradient: 'from-red-500 to-orange-600', bg: 'bg-red-600', hoverBg: 'hover:bg-red-700' } // Cor para a nova opção
};

const Settings = () => {
    const { toast } = useToast();
    const jsonInputRef = useRef(null);
    const csvInputRef = useRef(null);

    const handleBackup = () => {
        const database = getDatabase();
        const dataStr = JSON.stringify(database, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
        const exportFileDefaultName = 'bd.json';
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
        toast({ title: "Backup Realizado", description: "O arquivo bd.json foi baixado com sucesso." });
    };

    const handleImportClick = () => {
        jsonInputRef.current?.click();
    };

    const handleJsonFileChange = (event) => {
        const file = event.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target?.result);
                updateDatabase(data);
                toast({ title: "✅ Importação Concluída", description: "Os dados do arquivo bd.json foram restaurados." });
            } catch (error) {
                toast({ title: "❌ Erro na Importação", description: "O arquivo selecionado não é um JSON válido.", variant: "destructive" });
            }
        };
        reader.readAsText(file);
        event.target.value = '';
    };
    
    const handleImportUsersClick = () => {
        csvInputRef.current?.click();
    };

    const handleCsvFileChange = (event) => {
        const file = event.target.files?.[0];
        if (!file) return;
        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                try {
                    const newUsers = results.data;
                    const db = getDatabase();
                    const newIdStart = Math.max(...db.usuarios.map(u => u.id), 0) + 1;
                    const usersToAdd = newUsers.map((u, index) => ({...u, id: newIdStart + index, ativo: true, dataCriacao: new Date().toISOString().split('T')[0]}));
                    db.usuarios = [...db.usuarios, ...usersToAdd]; 
                    updateDatabase(db);
                    toast({ title: "✅ Importação de Usuários Concluída", description: `${newUsers.length} usuários foram importados do CSV.` });
                } catch (error) {
                    toast({ title: "❌ Erro na Importação do CSV", description: "Não foi possível processar os dados do arquivo.", variant: "destructive" });
                }
            },
            error: (err) => toast({ title: "❌ Erro ao ler o arquivo CSV", description: err.message, variant: "destructive" })
        });
        event.target.value = '';
    };

    const handleResetData = () => {
        if (window.confirm("ATENÇÃO: Esta ação irá apagar todos os dados locais (usuários, treinamentos, etc.) e restaurar a aplicação para o estado inicial. Deseja continuar?")) {
            localStorage.removeItem('trainingDatabase');
            toast({
                title: "Dados Resetados!",
                description: "A aplicação será recarregada com os dados padrão.",
            });
            setTimeout(() => {
                window.location.reload();
            }, 1500);
        }
    };

    const settingsCards = [
        { 
            title: "Backup dos Dados", 
            description: "Faça o download de um backup completo dos dados (bd.json).", 
            icon: Download, 
            action: handleBackup, 
            buttonText: "Fazer Backup", 
            color: "blue" 
        },
        { 
            title: "Importar Dados (JSON)", 
            description: "Importe dados de um arquivo bd.json para restaurar um backup.", 
            icon: FileUp, 
            action: handleImportClick, 
            buttonText: "Importar JSON", 
            color: "green" 
        },
        { 
            title: "Importar Usuários (CSV)", 
            description: "Importe uma lista de usuários a partir de um arquivo CSV.", 
            icon: FileDown, 
            action: handleImportUsersClick, 
            buttonText: "Importar CSV", 
            color: "purple" 
        },
        { 
            title: "Resetar Dados da Aplicação", 
            description: "Se a aplicação estiver com problemas, esta ação restaura os dados padrão.", 
            icon: AlertTriangle, 
            action: handleResetData, 
            buttonText: "Resetar Dados", 
            color: "red" 
        }
    ];

    return (
        <div className="space-y-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <h1 className="text-3xl font-bold text-white">Configurações</h1>
                <p className="text-slate-400">Gerencie as configurações gerais da plataforma.</p>
            </motion.div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {settingsCards.map((card, index) => {
                    const Icon = card.icon;
                    const colors = colorClasses[card.color] || colorClasses.blue;
                    return (
                        <motion.div key={card.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 * (index + 1) }}>
                            <Card className="glass-effect border-slate-700 card-hover h-full flex flex-col">
                                <CardHeader>
                                    <div className="flex items-center gap-4">
                                        <div className={`p-3 rounded-lg bg-gradient-to-r ${colors.gradient}`}>
                                            <Icon className="h-6 w-6 text-white" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-lg text-white">{card.title}</CardTitle>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="flex-grow flex flex-col justify-between">
                                    <CardDescription className="text-slate-300 mb-4">{card.description}</CardDescription>
                                    <Button onClick={card.action} className={`w-full ${colors.bg} ${colors.hoverBg}`}>
                                        {card.buttonText}
                                    </Button>
                                </CardContent>
                            </Card>
                        </motion.div>
                    );
                })}
            </div>
            <input type="file" ref={jsonInputRef} onChange={handleJsonFileChange} accept="application/json" style={{ display: 'none' }} />
            <input type="file" ref={csvInputRef} onChange={handleCsvFileChange} accept=".csv" style={{ display: 'none' }} />
        </div>
    );
};

export default Settings;