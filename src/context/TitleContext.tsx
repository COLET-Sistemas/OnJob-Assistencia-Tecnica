'use client'

import { createContext, ReactNode, useContext, useState } from 'react';

// Define the context type
interface TitleContextType {
    title: string;
    setTitle: (title: string) => void;
}

// Create the context with default values
const TitleContext = createContext<TitleContextType>({
    title: 'Dashboard',
    setTitle: () => { },
});

// Create the provider component
interface TitleProviderProps {
    children: ReactNode;
}

export const TitleProvider = ({ children }: TitleProviderProps) => {
    const [title, setTitle] = useState('Dashboard');

    return (
        <TitleContext.Provider value={{ title, setTitle }}>
            {children}
        </TitleContext.Provider>
    );
};

// Custom hook to use the title context
export const useTitle = () => useContext(TitleContext);
