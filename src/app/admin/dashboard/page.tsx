'use client'
import { Loading } from '@/components/Loading';
import { useTitle } from '@/context/TitleContext';
import { feedback } from '@/utils/feedback';
import {
    BarChart3,
    Cog,
    Plus,
    UserPlus
} from 'lucide-react';
import { useEffect, useState } from 'react';


interface StatsCard {
    title: string;
    value: string;
    change: string;
    color: string;
}

const statsCards: StatsCard[] = [
    { title: 'Total de OSs', value: '245', change: '+12%', color: 'bg-[#1ABC9C]' },
    { title: 'OSs Abertas', value: '89', change: '+5%', color: 'bg-blue-500' },
    { title: 'Clientes Ativos', value: '156', change: '+8%', color: 'bg-purple-500' },
    { title: 'Equipamentos', value: '423', change: '+15%', color: 'bg-orange-500' }
];

export default function DashboardPage() {
    const { setTitle } = useTitle();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Simulate data loading
        const timer = setTimeout(() => {
            setLoading(false);
            // Show welcome feedback when dashboard loads
            feedback.toast('Dashboard carregado com sucesso!', 'success');
        }, 1000);

        return () => clearTimeout(timer);
    }, []);

    // Configurar o título da página
    useEffect(() => {
        setTitle('Dashboard');
    }, [setTitle]);

    if (loading) {
        return (
            <Loading
                fullScreen={true}
                preventScroll={false}
                text="Carregando dashboard..."
                size="large"
            />
        );
    }

    return (
        <div className="bg-[#F9F7F7] p-1">
            <main className="flex-1 overflow-auto">
                <div className="mb-8">
                    <h2 className="text-3xl font-bold text-gray-800 mb-2">Bem-vindo ao Dashboard!</h2>
                    <p className="text-gray-600">Gerencie todas as operações da sua assistência técnica de forma eficiente.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {statsCards.map((card, index) => (
                        <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-gray-500 text-sm font-medium">{card.title}</p>
                                    <p className="text-3xl font-bold text-gray-800 mt-2">{card.value}</p>
                                    <p className="text-green-500 text-sm font-medium mt-1">{card.change}</p>
                                </div>
                                <div className={`w-12 h-12 ${card.color} rounded-lg flex items-center justify-center`}>
                                    <BarChart3 className="text-white" size={24} />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
                {/* Quick Actions */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <h3 className="text-xl font-semibold text-gray-800 mb-4">Ações Rápidas</h3>
                        <div className="space-y-3">
                            <button className="w-full flex items-center space-x-3 p-3 rounded-lg border border-gray-300 hover:bg-[#1ABC9C] hover:text-white transition-all group">
                                <Plus className="text-gray-600 group-hover:text-white" size={20} />
                                <span className="text-gray-600">Nova Ordem de Serviço</span>
                            </button>
                            <button className="w-full flex items-center space-x-3 p-3 rounded-lg border border-gray-300 hover:bg-[#1ABC9C] hover:text-white transition-all group">
                                <UserPlus className="text-gray-600 group-hover:text-white" size={20} />
                                <span className="text-gray-600">Cadastrar Cliente</span>
                            </button>
                            <button className="w-full flex items-center space-x-3 p-3 rounded-lg border border-gray-300 hover:bg-[#1ABC9C] hover:text-white transition-all group">
                                <Cog className="text-gray-600 group-hover:text-white" size={20} />
                                <span className="text-gray-600">Registrar Equipamento</span>
                            </button>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <h3 className="text-xl font-semibold text-gray-800 mb-4">OSs Recentes</h3>
                        <div className="space-y-3">
                            {[1, 2, 3, 4].map((item) => (
                                <div key={item} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                                    <div>
                                        <p className="font-medium text-gray-800">OS #{String(item).padStart(4, '0')}</p>
                                        <p className="text-sm text-gray-500">Cliente: Empresa ABC Ltda</p>
                                    </div>
                                    <span className="px-3 py-1 bg-[#1ABC9C] text-white text-xs font-medium rounded-full">
                                        Em Andamento
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
// ...