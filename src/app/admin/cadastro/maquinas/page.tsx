'use client'
import { Loading } from '@/components/loading';
import { useEffect, useState } from 'react';

export default function CadastroMaquinas() {
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Simulate data loading
        const timer = setTimeout(() => {
            setLoading(false);
        }, 1000);

        return () => clearTimeout(timer);
    }, []);

    if (loading) {
        return (
            <Loading
                fullScreen
                text="Carregando cadastro de máquinas..."
                size="large"
            />
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 p-4 pt-6">
            <div className="max-w-7xl mx-auto">
                <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border border-gray-100">
                    <h1 className="text-2xl font-bold text-gray-800">Cadastro de Máquinas</h1>
                    <p className="text-gray-600 mt-2">Gerencie as máquinas do sistema</p>
                </div>

                <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
                    <p>Conteúdo do cadastro de máquinas será implementado aqui.</p>
                </div>
            </div>
        </div>
    );
}
