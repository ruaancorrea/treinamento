import React from 'react';
import { motion } from 'framer-motion';
import { FileUp, Database, Download, FileDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { getDatabase } from '@/data/mockData';

const Settings = () => {
    const { toast } = useToast();

    const handleBackup = () => {
        const database = getDatabase();
        const dataStr = JSON.stringify(database, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
        
        const exportFileDefaultName = 'bd.json';
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();

        toast({
            title: "Backup Realizado",
            description: "O arquivo bd.json foi baixado com sucesso.",
        });
    };
    
    const handleImport = () => {
        toast({
            title: "🚧 Funcionalidade em desenvolvimento",
            description: "A importação de dados estará disponível em breve.",
        });
    };
    
    const handleImportUsers = () => {
        toast({
            title: "🚧 Funcionalidade em desenvolvimento",
            description: "A importação de usuários via CSV estará disponível em breve.",
        });
    };
    
    const settingsCards = [
        {
            title: "Backup dos Dados",
            description: "Faça o download de um backup completo dos dados da aplicação (bd.json).",
            icon: Download,
            action: handleBackup,
            buttonText: "Fazer Backup",
            color: "blue"
        },
        {
            title: "Importar Dados",
            description: "Importe dados de um arquivo bd.json para restaurar um backup.",
            icon: FileUp,
            action: handleImport,
            buttonText: "Importar Dados",
            color: "green"
        },
        {
            title: "Importar Usuários (CSV)",
            description: "Importe uma lista de usuários a partir de um arquivo CSV.",
            icon: FileDown,
            action: handleImportUsers,
            buttonText: "Importar CSV",
            color: "purple"
        },
    ];

    return (
        <div className="space-y-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <h1 className="text-3xl font-bold text-white">Configurações</h1>
                <p className="text-slate-400">Gerencie as configurações gerais da plataforma.</p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {settingsCards.map((card, index) => {
                    const Icon = card.icon;
                    return (
                        <motion.div key={card.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 * (index + 1) }}>
                            <Card className="glass-effect border-slate-700 card-hover h-full flex flex-col">
                                <CardHeader>
                                    <div className="flex items-center gap-4">
                                        <div className={`p-3 rounded-lg bg-gradient-to-r from-${card.color}-500 to-${card.color}-600`}>
                                            <Icon className="h-6 w-6 text-white" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-lg text-white">{card.title}</CardTitle>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="flex-grow flex flex-col justify-between">
                                    <CardDescription className="text-slate-300 mb-4">{card.description}</CardDescription>
                                    <Button onClick={card.action} className={`w-full bg-${card.color}-600 hover:bg-${card.color}-700`}>
                                        {card.buttonText}
                                    </Button>
                                </CardContent>
                            </Card>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
};

export default Settings;