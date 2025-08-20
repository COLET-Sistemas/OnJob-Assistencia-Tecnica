import { useState, useCallback, useMemo } from "react";

export interface FiltrosPainel {
  [key: string]: string;
}

export const useFilters = <T extends FiltrosPainel>(initialFilters: T) => {
  const [showFilters, setShowFilters] = useState(false);
  const [filtrosPainel, setFiltrosPainel] = useState<T>(initialFilters);
  const [filtrosAplicados, setFiltrosAplicados] = useState<T>(initialFilters);

  const handleFiltroChange = useCallback((campo: string, valor: string) => {
    setFiltrosPainel((prev) => ({ ...prev, [campo]: valor }));
  }, []);

  const limparFiltros = useCallback(() => {
    setFiltrosPainel(initialFilters);
    setFiltrosAplicados(initialFilters);
    setShowFilters(false);
  }, [initialFilters]);

  const aplicarFiltros = useCallback(() => {
    setFiltrosAplicados({ ...filtrosPainel });
    setShowFilters(false);
  }, [filtrosPainel]);

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
  };
};
