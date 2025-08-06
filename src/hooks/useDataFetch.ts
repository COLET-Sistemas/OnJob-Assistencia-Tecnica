'use client'

import React, { useEffect, useState } from 'react';

/**
 * A custom hook for loading data from an API with loading state management
 * 
 * @param fetchFunction - The function to call to fetch data
 * @param dependencies - Optional array of dependencies that will trigger a refetch when changed
 * @param initialData - Optional initial data
 * @returns Object with data, loading state, error state, and refetch function
 */
const useDataFetch = <T>(
    fetchFunction: () => Promise<T>,
    dependencies: React.DependencyList = [],
    initialData?: T
) => {
    const [data, setData] = useState<T | undefined>(initialData);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<Error | null>(null);
    // Adicionando ref para evitar chamadas duplicadas
    const isMounted = React.useRef(false);
    const isFirstRender = React.useRef(true);

    const fetchData = async () => {
        // Evitar múltiplas chamadas no mesmo ciclo de renderização
        if (loading) return;

        setLoading(true);
        try {
            console.log('useDataFetch: Chamando fetchFunction...');
            const result = await fetchFunction();
            if (isMounted.current) {
                setData(result);
                setError(null);
            }
        } catch (err) {
            console.error('Error fetching data:', err);
            if (isMounted.current) {
                setError(err instanceof Error ? err : new Error('An unknown error occurred'));
            }
        } finally {
            if (isMounted.current) {
                setLoading(false);
            }
        }
    };

    // Efetuar apenas uma chamada na montagem inicial
    useEffect(() => {
        isMounted.current = true;

        // No primeiro render, sempre fazer a chamada
        if (isFirstRender.current) {
            console.log('useDataFetch: Primeira renderização, carregando dados...');
            isFirstRender.current = false;
            setLoading(true);
            fetchFunction()
                .then(result => {
                    if (isMounted.current) {
                        setData(result);
                        setError(null);
                    }
                })
                .catch(err => {
                    console.error('Error fetching data:', err);
                    if (isMounted.current) {
                        setError(err instanceof Error ? err : new Error('An unknown error occurred'));
                    }
                })
                .finally(() => {
                    if (isMounted.current) {
                        setLoading(false);
                    }
                });
        }

        return () => {
            isMounted.current = false;
        };
    }, [fetchFunction]);

    // Efetuar chamadas quando as dependências mudarem (exceto na primeira renderização)
    useEffect(() => {
        // Pular a primeira execução, pois já está sendo tratada acima
        if (isFirstRender.current) return;

        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, dependencies);

    return {
        data,
        loading,
        error,
        refetch: fetchData
    };
};

export default useDataFetch;
