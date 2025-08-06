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

    const fetchData = async () => {
        setLoading(true);
        try {
            const result = await fetchFunction();
            setData(result);
            setError(null);
        } catch (err) {
            console.error('Error fetching data:', err);
            setError(err instanceof Error ? err : new Error('An unknown error occurred'));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
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
