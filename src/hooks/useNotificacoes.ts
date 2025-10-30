import { useState, useEffect, useRef } from "react";
import { notificacoesService } from "@/api/services/notificacoesService";

// Definição do tipo para o cache de notificações
interface NotificacaoAPI {
  id: number;
  titulo: string;
  mensagem: string;
  link?: string;
  data: string;
  lido: boolean;
}

interface NotificacaoCache {
  dados: Array<NotificacaoAPI>;
  timestamp: number;
  pagina_atual: number;
  total_paginas: number;
  nao_lidas: number;
  [key: string]: unknown; // Permite propriedades adicionais retornadas pela API
}

type NotificacoesListResult = Awaited<
  ReturnType<typeof notificacoesService.getNotificacoes>
>;

interface UseNotificacoesOptions {
  skipInitialListLoad?: boolean;
}

/**
 * Hook para gerenciar o estado das notificações no sistema
 * Inicia o polling de notificações após o login e mantém a contagem atualizada
 * - Polling de contagem a cada 40 segundos
 * - Polling de lista completa a cada 10 minutos com cache
 */
export function useNotificacoes(
  options: UseNotificacoesOptions = {}
) {
  const { skipInitialListLoad = false } = options;
  // Agora acompanhamos tanto o total de notificações quanto o número de não lidas
  const [notificacoesCount, setNotificacoesCount] = useState(0); // nao_lidas
  const [totalNotificacoes, setTotalNotificacoes] = useState(0); // total_notificacoes
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Estado para controle de loading da lista completa de notificações
  const [listState, setListState] = useState({
    loading: false,
    error: null as Error | null,
  });

  // Cache para armazenar a lista completa de notificações
  const cacheRef = useRef<NotificacaoCache | null>(null);
  const pendingRequestsRef = useRef<
    Record<string, Promise<NotificacoesListResult | NotificacaoCache | null>>
  >({});
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const CACHE_VALIDITY_MS = 10 * 60 * 1000; // 10 minutos em milissegundos

  // Função para buscar a contagem de notificações
  const fetchNotificacoesCount = async () => {
    // Verifica autenticação antes de fazer a chamada à API
    if (!isAuthenticated()) {
      return { nao_lidas: 0, total_notificacoes: 0 };
    }

    try {
      setLoading(true);
      setError(null);
      const response = await notificacoesService.getNotificacoesCount();

      // Quando a API retorna um objeto vazio ou total_notificacoes = 0, significa que não há notificações
      if (
        Object.keys(response).length === 0 ||
        response.total_notificacoes === 0
      ) {
        setNotificacoesCount(0);
        setTotalNotificacoes(0);
      } else {
        // Atualizar tanto o contador de não lidas quanto o total de notificações
        if (typeof response.nao_lidas === "number") {
          setNotificacoesCount(response.nao_lidas);
        } else {
          setNotificacoesCount(0);
        }

        if (typeof response.total_notificacoes === "number") {
          setTotalNotificacoes(response.total_notificacoes);
        } else {
          setTotalNotificacoes(0);
        }
      }

      return response; // Return the response to allow chaining
    } catch (error) {
      console.error("Erro ao buscar contagem de notificações:", error);
      setError(error instanceof Error ? error : new Error("Erro desconhecido"));
      setNotificacoesCount(0);
      setTotalNotificacoes(0);
      return { nao_lidas: 0, total_notificacoes: 0 }; // Return default values in case of error
    } finally {
      setLoading(false);
    }
  };

  // Função para buscar a lista completa de notificações com suporte a cache
  const fetchNotificacoesList = async (
    pagina: number = 1,
    forceRefresh: boolean = false
  ) => {
    const now = Date.now();
    const cacheIsValid =
      !forceRefresh &&
      cacheRef.current &&
      pagina === 1 &&
      now - cacheRef.current.timestamp < CACHE_VALIDITY_MS;

    if (cacheIsValid && cacheRef.current) {
      setListState((prev) => ({ ...prev, loading: false }));
      return cacheRef.current;
    }

    const requestKey = String(pagina);
    const existingRequest = pendingRequestsRef.current[requestKey];

    if (existingRequest) {
      setListState((prev) => ({ ...prev, loading: true, error: null }));
      return existingRequest;
    }

    setListState((prev) => ({ ...prev, loading: true, error: null }));

    const requestPromise: Promise<
      NotificacoesListResult | NotificacaoCache | null
    > = (async () => {
      try {
        const response = await notificacoesService.getNotificacoes(
          pagina,
          10,
          true
        );

        if (response) {
          if (typeof response.nao_lidas === "number") {
            setNotificacoesCount(response.nao_lidas);
          }
          if (typeof response.total_notificacoes === "number") {
            setTotalNotificacoes(response.total_notificacoes);
          }
        }

        if (pagina === 1 && response && Array.isArray(response.dados)) {
          cacheRef.current = {
            ...response,
            timestamp: Date.now(),
          };

          return cacheRef.current;
        }

        return response;
      } catch (error) {
        console.error("Erro ao buscar lista de notifica????es:", error);
        const errorObj =
          error instanceof Error ? error : new Error("Erro desconhecido");
        setListState((prev) => ({ ...prev, error: errorObj }));
        return null;
      } finally {
        setListState((prev) => ({ ...prev, loading: false }));
        delete pendingRequestsRef.current[requestKey];
      }
    })();

    pendingRequestsRef.current[requestKey] = requestPromise;
    return requestPromise;
  };

  // Verificar se o usuário está autenticado
  const isAuthenticated = () => {
    if (typeof window === "undefined") return false;
    return !!localStorage.getItem("token");
  };

  // Singleton para rastrear se a inicialização já foi feita
  const hasInitializedRef = useRef(false);

  // Efeito para iniciar o polling de notificações quando o componente montar
  // e o usuário estiver autenticado - usando um padrão singleton para evitar múltiplas chamadas
  
  useEffect(() => {
    if (!isAuthenticated() || skipInitialListLoad) {
      return;
    }

    if (!hasInitializedRef.current) {
      hasInitializedRef.current = true;

      fetchNotificacoesList();

      intervalRef.current = setInterval(() => {
        if (isAuthenticated()) {
          fetchNotificacoesList(1, true);
        }
      }, CACHE_VALIDITY_MS);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
        hasInitializedRef.current = false;
      }
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [skipInitialListLoad]);

  // Atualizar manualmente a contagem (útil após marcar como lida)
  const updateCount = (newCount: number, newTotal?: number) => {
    setNotificacoesCount(newCount);
    if (typeof newTotal === "number") {
      setTotalNotificacoes(newTotal);
    }
  };

  // Forçar uma atualização da contagem
  const refreshCount = () => {
    if (isAuthenticated()) {
      fetchNotificacoesCount();
    }
  };

  // Buscar notificações com suporte a cache
  const getNotificacoes = async (
    pagina: number = 1,
    forceRefresh: boolean = false
  ) => {
    if (isAuthenticated()) {
      return await fetchNotificacoesList(pagina, forceRefresh);
    }
    return null;
  };

  return {
    notificacoesCount, // número de notificações não lidas
    totalNotificacoes, // número total de notificações
    loading,
    error,
    listLoading: listState.loading,
    listError: listState.error,
    updateCount,
    refreshCount,
    getNotificacoes, // Nova função exposta para componentes
    fetchNotificacoesCount, // Expor a função diretamente para permitir atualização imediata
  };
}
