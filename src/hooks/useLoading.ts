import { useState, useCallback } from "react";

/**
 * Hook para gerenciar estados de carregamento
 * @returns Um objeto com funções e estado para controle de loading
 */
export const useLoading = (initialState = false) => {
  const [isLoading, setIsLoading] = useState(initialState);

  const startLoading = useCallback(() => {
    setIsLoading(true);
  }, []);

  const stopLoading = useCallback(() => {
    setIsLoading(false);
  }, []);

  /**
   * Executa uma função assíncrona enquanto mostra o estado de carregamento
   * @param asyncFunction Função assíncrona a ser executada
   * @returns O resultado da função assíncrona
   */
  const withLoading = useCallback(
    async <T>(asyncFunction: () => Promise<T>): Promise<T> => {
      try {
        startLoading();
        return await asyncFunction();
      } finally {
        stopLoading();
      }
    },
    [startLoading, stopLoading]
  );

  return {
    isLoading,
    startLoading,
    stopLoading,
    withLoading,
  };
};
