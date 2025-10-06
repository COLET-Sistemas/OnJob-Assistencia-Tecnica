import { useState, useCallback, useMemo, useEffect } from "react";

export interface FiltrosPainel {
  [key: string]: string;
}

export interface FilterState<T extends FiltrosPainel> {
  showMenu: boolean;
  panelFilters: T;
  appliedFilters: T;
}

export const useFilters = <T extends FiltrosPainel>(
  initialFilters: T,
  storageKey?: string
) => {
  // Chave padrão usando o nome das propriedades do objeto de filtros
  const defaultStorageKey = useMemo(() => {
    return `filters_${Object.keys(initialFilters).sort().join("_")}`;
  }, [initialFilters]);

  // Usa a chave fornecida ou a chave padrão
  const sessionKey = storageKey || defaultStorageKey;
  const filterStateKey = `${sessionKey}_state`;

  // Carrega o estado completo dos filtros da sessão
  const loadFilterStateFromSession = useCallback((): FilterState<T> => {
    if (typeof window === "undefined") {
      return {
        showMenu: false, // Sempre iniciar fechado no servidor
        panelFilters: initialFilters,
        appliedFilters: initialFilters,
      };
    }

    try {
      // Forçar menu fechado para essa sessão
      // Cria uma flag específica para controlar se o menu deve estar fechado ao recarregar
      const forceMenuClosed =
        sessionStorage.getItem("force_menu_closed") === "true";
      if (forceMenuClosed) {
        // Limpa a flag após ser usada
        sessionStorage.removeItem("force_menu_closed");
      }

      const savedFilterState = sessionStorage.getItem(filterStateKey);
      if (savedFilterState) {
        const state = JSON.parse(savedFilterState);
        // Se a flag de forçar menu fechado estiver ativa, sobrescreve o estado salvo
        if (forceMenuClosed) {
          return {
            ...state,
            showMenu: false,
          };
        }
        return state;
      }

      // Se não existe o estado completo, tenta carregar só os filtros (compatibilidade)
      const savedFilters = sessionStorage.getItem(sessionKey);
      if (savedFilters) {
        const filters = JSON.parse(savedFilters);
        return {
          showMenu: false, // Sempre iniciar fechado ao carregar só os filtros
          panelFilters: filters,
          appliedFilters: filters,
        };
      }

      return {
        showMenu: false,
        panelFilters: initialFilters,
        appliedFilters: initialFilters,
      };
    } catch (error) {
      console.error("Erro ao carregar estado dos filtros da sessão:", error);
      return {
        showMenu: false,
        panelFilters: initialFilters,
        appliedFilters: initialFilters,
      };
    }
  }, [initialFilters, sessionKey, filterStateKey]);

  // Carrega o estado inicial da sessão
  const initialState = loadFilterStateFromSession();

  // Sempre inicia com o menu fechado para evitar problemas após recarregamentos
  const [showFilters, setShowFilters] = useState(false);
  const [filtrosPainel, setFiltrosPainel] = useState<T>(
    initialState.panelFilters
  );
  const [filtrosAplicados, setFiltrosAplicados] = useState<T>(
    initialState.appliedFilters
  );

  // Efeito para garantir que o menu está fechado após aplicar/limpar filtros
  useEffect(() => {
    // Verifica se devemos manter o menu fechado
    if (
      typeof window !== "undefined" &&
      document.body.getAttribute("data-filter-menu-closed") === "true"
    ) {
      // Força o menu fechado
      setShowFilters(false);

      // Limpa o atributo após um tempo para permitir a interação normal
      const timer = setTimeout(() => {
        document.body.removeAttribute("data-filter-menu-closed");
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [filtrosAplicados]); // Executa quando os filtros aplicados mudam

  // Salva o estado completo dos filtros na sessão sempre que algum estado muda
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        // Sempre salva com menu fechado após aplicar filtros
        const menuState =
          document.body.getAttribute("data-filter-menu-closed") === "true"
            ? false
            : showFilters;

        const filterState: FilterState<T> = {
          showMenu: menuState,
          panelFilters: filtrosPainel,
          appliedFilters: filtrosAplicados,
        };
        sessionStorage.setItem(filterStateKey, JSON.stringify(filterState));

        // Mantém compatibilidade com o código antigo
        sessionStorage.setItem(sessionKey, JSON.stringify(filtrosAplicados));
      } catch (error) {
        console.error("Erro ao salvar estado dos filtros na sessão:", error);
      }
    }
  }, [
    filtrosAplicados,
    filtrosPainel,
    showFilters,
    sessionKey,
    filterStateKey,
  ]);

  const handleFiltroChange = useCallback((campo: string, valor: string) => {
    setFiltrosPainel((prev) => ({ ...prev, [campo]: valor }));
  }, []);

  const limparFiltros = useCallback(() => {
    // Limpa os filtros e força menu fechado de forma síncrona
    setFiltrosPainel(initialFilters);
    setFiltrosAplicados(initialFilters);
    setShowFilters(false);

    // Remove os filtros da sessão ao limpar
    if (typeof window !== "undefined") {
      try {
        // Remove os filtros antigos
        sessionStorage.removeItem(filterStateKey);
        sessionStorage.removeItem(sessionKey);

        // Salva novo estado com filtros iniciais e menu fechado
        const newState: FilterState<T> = {
          showMenu: false, // Sempre fechado
          panelFilters: initialFilters,
          appliedFilters: initialFilters,
        };
        sessionStorage.setItem(filterStateKey, JSON.stringify(newState));

        // Garante que o menu não vai reabrir durante o ciclo
        document.body.setAttribute("data-filter-menu-closed", "true");
      } catch (error) {
        console.error("Erro ao remover filtros da sessão:", error);
      }
    }
  }, [initialFilters, sessionKey, filterStateKey]);

  const aplicarFiltros = useCallback(() => {
    // Aplica os filtros e força menu fechado de forma síncrona
    setFiltrosAplicados({ ...filtrosPainel });
    setShowFilters(false);

    // Salva apenas os filtros aplicados na sessão
    if (typeof window !== "undefined") {
      try {
        // Salva o estado atual sem menu aberto
        const filterState: FilterState<T> = {
          showMenu: false, // Sempre fechado
          panelFilters: filtrosPainel,
          appliedFilters: filtrosPainel,
        };
        sessionStorage.setItem(filterStateKey, JSON.stringify(filterState));
        sessionStorage.setItem(sessionKey, JSON.stringify(filtrosPainel));

        // Garante que o menu não vai reabrir durante o ciclo
        document.body.setAttribute("data-filter-menu-closed", "true");
      } catch (error) {
        console.error("Erro ao salvar estado dos filtros na sessão:", error);
      }
    }
  }, [filtrosPainel, filterStateKey, sessionKey]);

  const toggleFilters = useCallback(() => {
    setShowFilters((prev) => !prev);
  }, []);

  const closeFilters = useCallback(() => {
    setShowFilters(false);
  }, []);

  const activeFiltersCount = useMemo(
    () =>
      Object.values(filtrosAplicados).filter((value) => value.trim()).length,
    [filtrosAplicados]
  );

  const hasFiltersChanged = useMemo(
    () => JSON.stringify(filtrosPainel) !== JSON.stringify(filtrosAplicados),
    [filtrosPainel, filtrosAplicados]
  );

  // Função para forçar o fechamento do menu durante recarregamentos
  const forceMenuClosedOnNextLoad = useCallback(() => {
    if (typeof window !== "undefined") {
      try {
        // Fecha o menu diretamente
        setShowFilters(false);

        // Marca que devemos manter o menu fechado durante este ciclo
        document.body.setAttribute("data-filter-menu-closed", "true");

        // Salva o estado com menu fechado
        const filterState: FilterState<T> = {
          showMenu: false,
          panelFilters: filtrosPainel,
          appliedFilters: filtrosAplicados,
        };
        sessionStorage.setItem(filterStateKey, JSON.stringify(filterState));
      } catch (error) {
        console.error("Erro ao definir menu fechado:", error);
      }
    }
  }, [filtrosPainel, filtrosAplicados, filterStateKey]);

  return {
    // Estados
    showFilters,
    filtrosPainel,
    filtrosAplicados,
    activeFiltersCount,
    hasFiltersChanged,

    // Ações
    handleFiltroChange,
    limparFiltros,
    aplicarFiltros,
    toggleFilters,
    closeFilters,
    forceMenuClosedOnNextLoad,
    setShowFilters, // Expor setShowFilters para controle direto
  };
};
