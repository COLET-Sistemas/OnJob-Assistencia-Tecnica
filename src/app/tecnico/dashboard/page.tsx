'use client'
import { Loading } from '@/components/loading';
import { useEffect, useState } from 'react';

export default function TecnicoDashboard() {
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
                text="Carregando dashboard técnico..."
                size="large"
            />
        );
    }

    return (
        <main style={{ padding: '2rem' }}>
            <h1>Dashboard Técnico</h1>
            <p>Bem-vindo ao painel do técnico!</p>
        </main>
    );
}
