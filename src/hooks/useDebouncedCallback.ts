import { useRef, useCallback, useEffect } from "react";

/**
 * Hook que permite criar uma versão com debounce de qualquer função callback.
 *
 * @param callback A função a ser executada após o debounce
 * @param delay Tempo em ms para o debounce (padrão: 300ms)
 * @returns Uma versão com debounce da função original
 */
function useDebouncedCallback<Args extends unknown[], Result>(
  callback: (...args: Args) => Result,
  delay = 300
): (...args: Args) => void {
  // Referência para armazenar o timeout atual
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Referência para sempre ter acesso à versão mais recente da callback
  const callbackRef = useRef<(...args: Args) => Result>(callback);

  // Atualiza a referência da callback quando ela mudar
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  // Limpa o timeout quando o componente for desmontado
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Retorna a função com debounce
  return useCallback(
    (...args: Args) => {
      // Limpa o timeout anterior se existir
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Cria um novo timeout
      timeoutRef.current = setTimeout(() => {
        callbackRef.current(...args);
      }, delay);
    },
    [delay]
  );
}

export default useDebouncedCallback;
