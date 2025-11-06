import React from "react";
import { createPortal } from "react-dom";
import {
  Plus,
  Save,
  X,
  Edit,
  Trash2,
  Package,
  Check,
  Search,
} from "lucide-react";
import type { OSPecaUtilizada } from "@/api/services/ordensServicoService";
import { pecasService } from "@/api/services/pecasService";
import useDebouncedCallback from "@/hooks/useDebouncedCallback";
import type { PecaOriginal, PecaRevisada, PecaCatalogo } from "../types";

const buildOrigemKeyFromOriginal = (peca: PecaOriginal): string => {
  if (peca.id != null) {
    return `id:${peca.id}`;
  }

  if (peca.id_peca != null) {
    return `catalog:${peca.id_peca}`;
  }

  const descricao = (peca.descricao ?? peca.nome ?? "").toLowerCase().trim();
  const quantidade = peca.quantidade ?? 0;
  const fat = peca.id_fat ?? "na";

  return `fat:${fat}:${descricao}:${quantidade}`;
};

type SearchMode = "codigo" | "descricao";

interface CatalogSearchState {
  mode: SearchMode;
  term: string;
  isOpen: boolean;
  isLoading: boolean;
  results: PecaCatalogo[];
  error?: string;
}

const MIN_SEARCH_TERM_LENGTH: Record<SearchMode, number> = {
  codigo: 2,
  descricao: 3,
};

interface PecasTabProps {
  originais: PecaOriginal[];
  revisadas: PecaRevisada[];
  onAccept: (peca: PecaOriginal) => void;
  onAcceptAll: () => void;
  onAdd: () => void;
  onChange: (
    index: number,
    field: keyof OSPecaUtilizada,
    value: number | string
  ) => void;
  onSelectCatalogItem: (index: number, item: PecaCatalogo) => void;
  onEdit: (index: number) => void;
  onSave: (index: number) => void;
  onCancel: (index: number) => void;
  onDelete: (index: number) => void;
  onRestore: (index: number) => void;
}

const PecasTab: React.FC<PecasTabProps> = ({
  originais,
  revisadas,
  onAccept,
  onAcceptAll,
  onAdd,
  onChange,
  onSelectCatalogItem,
  onEdit,
  onSave,
  onCancel,
  onDelete,
  onRestore,
}) => {
  const revisadasKeys = React.useMemo(() => {
    const keys = new Set<string>();

    revisadas.forEach((peca) => {
      if (peca.origemIdPeca != null) {
        keys.add(String(peca.origemIdPeca));
      } else if (peca.id != null) {
        keys.add(`id:${peca.id}`);
      }
    });

    return keys;
  }, [revisadas]);

  const allOriginaisAccepted =
    originais.length > 0 &&
    originais.every((peca) =>
      revisadasKeys.has(buildOrigemKeyFromOriginal(peca))
    );

  const canAcceptAll = originais.length > 0 && !allOriginaisAccepted;

  const originalByKey = React.useMemo(() => {
    const map = new Map<string, PecaOriginal>();

    originais.forEach((peca) => {
      const key = buildOrigemKeyFromOriginal(peca);
      map.set(key, peca);
      if (peca.id != null) {
        map.set(`id:${peca.id}`, peca);
      }
      if (peca.id_peca != null) {
        map.set(`catalog:${peca.id_peca}`, peca);
      }
    });

    return map;
  }, [originais]);

  const [searchStates, setSearchStates] = React.useState<
    Record<number, CatalogSearchState>
  >({});

  const clearSearchState = React.useCallback((rowIndex: number) => {
    setSearchStates((prev) => {
      if (!(rowIndex in prev)) {
        return prev;
      }

      const next = { ...prev };
      delete next[rowIndex];
      return next;
    });
  }, []);

  React.useEffect(() => {
    setSearchStates((prev) => {
      let mutated = false;
      const next: Record<number, CatalogSearchState> = {};

      revisadas.forEach((peca, index) => {
        if (peca.isEditing && prev[index]) {
          next[index] = prev[index];
        } else if (!peca.isEditing && prev[index]) {
          mutated = true;
        }
      });

      if (!mutated && Object.keys(prev).length === Object.keys(next).length) {
        return prev;
      }

      return next;
    });
  }, [revisadas]);

  const anchorRefs = React.useRef<Map<string, HTMLDivElement | null>>(
    new Map()
  );
  const registerAnchor = React.useCallback(
    (key: string, el: HTMLDivElement | null) => {
      if (el) {
        anchorRefs.current.set(key, el);
      } else {
        anchorRefs.current.delete(key);
      }
    },
    []
  );

  const [isPortalReady, setIsPortalReady] = React.useState(false);
  const [, setPortalTick] = React.useState(0);

  React.useEffect(() => {
    if (typeof window === "undefined" || typeof document === "undefined") {
      return;
    }

    setIsPortalReady(true);
  }, []);

  const hasOpenDropdown = React.useMemo(
    () => Object.values(searchStates).some((state) => state.isOpen),
    [searchStates]
  );

  React.useEffect(() => {
    if (!isPortalReady || !hasOpenDropdown) {
      return;
    }

    const handleReposition = () => {
      setPortalTick((prev) => (prev + 1) % Number.MAX_SAFE_INTEGER);
    };

    window.addEventListener("scroll", handleReposition, true);
    window.addEventListener("resize", handleReposition);

    return () => {
      window.removeEventListener("scroll", handleReposition, true);
      window.removeEventListener("resize", handleReposition);
    };
  }, [hasOpenDropdown, isPortalReady]);

  const debouncedFetchCatalog = useDebouncedCallback(
    async (rowIndex: number, term: string, mode: SearchMode) => {
      try {
        const params: Record<string, string | number | boolean> = {
          qtde_registros: mode === "codigo" ? 1 : 20,
          nro_pagina: 1,
        };

        if (mode === "codigo") {
          params.codigo = term;
        } else {
          params.descricao = term;
        }

        const response = await pecasService.getAll(params);
        const options: PecaCatalogo[] =
          response.dados?.map((item) => ({
            id: item.id,
            codigo: item.codigo_peca,
            descricao: item.descricao,
            unidade_medida: item.unidade_medida,
          })) ?? [];

        if (mode === "codigo") {
          const match = options[0];

          setSearchStates((prev) => {
            const current = prev[rowIndex];
            if (!current || current.term !== term || current.mode !== mode) {
              return prev;
            }

            if (match) {
              const next = { ...prev };
              delete next[rowIndex];
              return next;
            }

            return {
              ...prev,
              [rowIndex]: {
                ...current,
                isOpen: false,
                isLoading: false,
                results: [],
                error: "Código Peça não encontrado",
              },
            };
          });

          if (match) {
            onSelectCatalogItem(rowIndex, match);
          }

          return;
        }

        setSearchStates((prev) => {
          const current = prev[rowIndex];
          if (!current || current.term !== term || current.mode !== mode) {
            return prev;
          }

          return {
            ...prev,
            [rowIndex]: {
              ...current,
              isOpen: true,
              isLoading: false,
              results: options,
              error:
                options.length === 0
                  ? current.error ?? "Nenhuma Peça encontrada."
                  : undefined,
            },
          };
        });
      } catch (error) {
        console.error("Erro ao buscar Peças no catálogo:", error);
        if (mode === "codigo") {
          setSearchStates((prev) => {
            const current = prev[rowIndex];
            if (!current || current.term !== term || current.mode !== mode) {
              return prev;
            }

            return {
              ...prev,
              [rowIndex]: {
                ...current,
                isOpen: false,
                isLoading: false,
                results: [],
                error: "Código de peça não encontrado.",
              },
            };
          });
          return;
        }

        setSearchStates((prev) => {
          const current = prev[rowIndex];
          if (!current || current.term !== term || current.mode !== mode) {
            return prev;
          }

          return {
            ...prev,
            [rowIndex]: {
              ...current,
              isOpen: true,
              isLoading: false,
              results: [],
              error: "Erro ao buscar Peças. Tente novamente.",
            },
          };
        });
      }
    },
    400
  );

  const handleTriggerCatalogSearch = React.useCallback(
    (rowIndex: number, mode: SearchMode, rawTerm: string) => {
      const term = rawTerm.trim();
      const minLength = MIN_SEARCH_TERM_LENGTH[mode];

      if (term.length < minLength) {
        clearSearchState(rowIndex);
        return;
      }

      setSearchStates((prev) => {
        const existing = prev[rowIndex];
        const isListMode = mode === "descricao";
        const nextState: CatalogSearchState = {
          mode,
          term,
          isOpen: isListMode,
          isLoading: true,
          results:
            isListMode &&
            existing &&
            existing.mode === mode &&
            existing.term === term
              ? existing.results
              : [],
          error: undefined,
        };

        if (
          existing &&
          existing.mode === nextState.mode &&
          existing.term === nextState.term &&
          existing.isOpen &&
          existing.isLoading
        ) {
          return prev;
        }

        return {
          ...prev,
          [rowIndex]: nextState,
        };
      });

      debouncedFetchCatalog(rowIndex, term, mode);
    },
    [clearSearchState, debouncedFetchCatalog]
  );

  const handleSelectCatalog = React.useCallback(
    (rowIndex: number, item: PecaCatalogo) => {
      onSelectCatalogItem(rowIndex, item);
      clearSearchState(rowIndex);
    },
    [clearSearchState, onSelectCatalogItem]
  );

  const renderSearchResults = (rowIndex: number, anchor: SearchMode) => {
    if (!isPortalReady) {
      return null;
    }

    const state = searchStates[rowIndex];
    if (!state || !state.isOpen || state.mode !== anchor) {
      return null;
    }

    const anchorKey = `${rowIndex}-${anchor}`;
    const anchorElement = anchorRefs.current.get(anchorKey);

    if (!anchorElement) {
      return null;
    }

    const rect = anchorElement.getBoundingClientRect();
    const dropdownStyle: React.CSSProperties = {
      position: "absolute",
      top: rect.bottom + window.scrollY + 4,
      left: rect.left + window.scrollX,
      width: rect.width,
      zIndex: 99999,
    };

    if (state.isLoading || state.error || state.results.length === 0) {
      const message = state.isLoading
        ? "Buscando Peças..."
        : state.error ?? "Nenhuma Peça encontrada.";

      const dropdown = (
        <div
          className="rounded-md border border-gray-200 bg-white shadow-2xl"
          style={dropdownStyle}
        >
          <div className="px-3 py-2 text-sm text-gray-500">{message}</div>
        </div>
      );

      return createPortal(dropdown, document.body);
    }

    const dropdown = (
      <div
        className="max-h-60 overflow-y-auto rounded-md border border-gray-200 bg-white shadow-2xl"
        style={dropdownStyle}
      >
        {state.results.map((item) => (
          <button
            type="button"
            key={`${item.id}-${item.codigo}`}
            className="group flex w-full flex-col gap-0.5 px-3 py-2 text-left text-sm text-gray-700 hover:bg-[var(--primary)] hover:text-white"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => handleSelectCatalog(rowIndex, item)}
          >
            <span className="font-medium group-hover:text-white">
              {item.codigo}
            </span>
            <span className="text-xs group-hover:text-white">
              {item.descricao}
            </span>
            <span className="text-[10px] uppercase text-gray-400 group-hover:text-white">
              Unidade: {item.unidade_medida}
            </span>
          </button>
        ))}
      </div>
    );

    return createPortal(dropdown, document.body);
  };

  const resolveOrigemKey = (peca: PecaRevisada): string | null => {
    if (typeof peca.origemIdPeca === "string") {
      return peca.origemIdPeca;
    }

    if (typeof peca.origemIdPeca === "number") {
      return `id:${peca.origemIdPeca}`;
    }

    if (typeof peca.id === "number") {
      return `id:${peca.id}`;
    }

    if (typeof peca.id_peca === "number") {
      return `catalog:${peca.id_peca}`;
    }

    return null;
  };

  const getOriginalDescricao = React.useCallback(
    (peca: PecaRevisada): string | null => {
      if (typeof peca.descricaoOriginal === "string") {
        const trimmed = peca.descricaoOriginal.trim();
        if (trimmed.length > 0) {
          return trimmed;
        }
      }

      const key = resolveOrigemKey(peca);
      if (key) {
        const original = originalByKey.get(key);
        if (original) {
          const descricao = original.descricao ?? original.nome ?? "";
          const trimmed = descricao.trim();
          return trimmed.length > 0 ? trimmed : null;
        }
      }

      return null;
    },
    [originalByKey]
  );

  const getOriginalCodigo = React.useCallback(
    (peca: PecaRevisada): string | null => {
      if (typeof peca.codigoOriginal === "string") {
        const trimmed = peca.codigoOriginal.trim();
        if (trimmed.length > 0) {
          return trimmed;
        }
      }

      const key = resolveOrigemKey(peca);
      if (key) {
        const original = originalByKey.get(key);
        if (original?.codigo) {
          const trimmed = original.codigo.trim();
          if (trimmed.length > 0) {
            return trimmed;
          }
        }
      }

      return null;
    },
    [originalByKey]
  );

  return (
    <div className="p-6 space-y-8">
      <section>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Peças informadas pelo Técnico
          </h3>

          {originais.length > 0 && (
            <button
              className={`inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md border transition ${
                canAcceptAll
                  ? "border-[var(--primary)] text-[var(--primary)] hover:bg-[var(--primary)] hover:text-white"
                  : "border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed"
              }`}
              onClick={() => {
                if (canAcceptAll) {
                  onAcceptAll();
                }
              }}
              disabled={!canAcceptAll}
            >
              <Check className="h-4 w-4" />
              Aceitar todos
            </button>
          )}
        </div>

        {originais.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    FAT
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Código
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Descrição
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Qtd / Unidade_medida
                  </th>
                  <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200 overflow-visible">
                {originais.map((peca, index) => {
                  const origemKey = buildOrigemKeyFromOriginal(peca);
                  const isAccepted = revisadasKeys.has(origemKey);

                  return (
                    <tr key={peca.id ?? peca.id_peca ?? index}>
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                        #{peca.id_fat ?? "-"}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                        {peca.codigo || "-"}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                        {peca.descricao ?? peca.nome ?? "-"}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                        <span className="font-medium text-gray-700">
                          {peca.quantidade}
                        </span>
                        <span className="ml-2 text-xs text-gray-500 uppercase">
                          {peca.unidade_medida || "-"}
                        </span>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          className={`inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-md border transition ${
                            isAccepted
                              ? "border-green-200 bg-green-50 text-green-700 cursor-default"
                              : "border-[var(--primary)] text-[var(--primary)] hover:bg-[var(--primary)] hover:text-white"
                          }`}
                          onClick={() => {
                            if (!isAccepted) {
                              onAccept(peca);
                            }
                          }}
                          disabled={isAccepted}
                        >
                          <Check className="h-4 w-4" />
                          {isAccepted ? "Aceito" : "Aceitar"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-6 bg-gray-50 rounded-md">
            <Package className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-500">
              Nenhuma Peça informada pelo Técnico.
            </p>
          </div>
        )}
      </section>

      <section>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Peças revisadas
          </h3>

          <button
            className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-[var(--primary)] hover:bg-[var(--primary)]/90"
            onClick={onAdd}
          >
            <Plus className="h-4 w-4 mr-1" />
            Adicionar
          </button>
        </div>

        {revisadas.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    FAT
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Código
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Descrição
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Qtd / Unidade_medida
                  </th>
                  <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {revisadas.map((peca, index) => {
                  const codigoAtual = (peca.codigo ?? "").trim();
                  const possuiCodigo = codigoAtual.length > 0;
                  const originalDescricao = getOriginalDescricao(peca);
                  const originalCodigo = getOriginalCodigo(peca);
                  const unidadeMedidaAtual = (peca.unidade_medida ?? "").trim();
                  const isCatalogSelection = typeof peca.id_peca === "number";
                  const requiresManualCodigo =
                    !isCatalogSelection || !possuiCodigo;
                  const canSearchCodigo =
                    codigoAtual.length >= MIN_SEARCH_TERM_LENGTH.codigo;
                  const searchState = searchStates[index];
                  const codigoSearchState =
                    searchState?.mode === "codigo" ? searchState : undefined;
                  const showCodigoSearchError =
                    Boolean(codigoSearchState && codigoSearchState.error) &&
                    Boolean(codigoSearchState && !codigoSearchState.isLoading);

                  return (
                    <tr
                      key={peca.id ?? peca.origemIdPeca ?? index}
                      className={peca.isDeleted ? "bg-red-50" : undefined}
                    >
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                        #{peca.id_fat ?? "-"}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                        {peca.isEditing ? (
                          <div>
                            <div className="flex items-start gap-2">
                              <div
                                className="relative w-40"
                                ref={(el) =>
                                  registerAnchor(`${index}-codigo`, el)
                                }
                              >
                                <input
                                  type="text"
                                  className={`w-full border rounded-md px-2 py-1 ${
                                    possuiCodigo
                                      ? "border-gray-300"
                                      : "border-red-400 focus:border-red-500"
                                  }`}
                                  value={peca.codigo ?? ""}
                                  onChange={(e) => {
                                    const value = e.target.value;
                                    onChange(index, "codigo", value);
                                    clearSearchState(index);
                                  }}
                                  placeholder="Código"
                                />
                                {renderSearchResults(index, "codigo")}
                                {originalCodigo &&
                                  originalCodigo.trim().length > 0 &&
                                  originalCodigo.trim() !== codigoAtual && (
                                    <p className="mt-1 text-xs text-gray-500">
                                      Código informado pelo Técnico:{" "}
                                      <span className="font-medium text-gray-600">
                                        {originalCodigo}
                                      </span>
                                    </p>
                                  )}
                              </div>
                              {requiresManualCodigo && (
                                <button
                                  type="button"
                                  className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-gray-300 bg-white text-gray-500 hover:border-[var(--primary)] hover:text-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50"
                                  onClick={() =>
                                    handleTriggerCatalogSearch(
                                      index,
                                      "codigo",
                                      peca.codigo ?? ""
                                    )
                                  }
                                  disabled={!canSearchCodigo}
                                  title={
                                    canSearchCodigo
                                      ? "Buscar código no catálogo"
                                      : "Informe ao menos 2 caracteres para buscar"
                                  }
                                  aria-label="Buscar código no catálogo"
                                >
                                  <Search className="h-4 w-4" />
                                </button>
                              )}
                            </div>
                            {showCodigoSearchError && (
                              <p className="mt-1 text-xs text-red-500">
                                {codigoSearchState?.error ?? ""}
                              </p>
                            )}
                          </div>
                        ) : possuiCodigo ? (
                          <div className="flex flex-col">
                            <span>{peca.codigo}</span>
                            {originalCodigo &&
                              originalCodigo.trim().length > 0 &&
                              originalCodigo.trim() !== codigoAtual && (
                                <span className="text-xs text-gray-400">
                                  Técnico: {originalCodigo}
                                </span>
                              )}
                          </div>
                        ) : (
                          <span className="text-xs font-medium text-red-500">
                            Obrigatório
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                        {peca.isEditing ? (
                          <div
                            className="relative"
                            ref={(el) =>
                              registerAnchor(`${index}-descricao`, el)
                            }
                          >
                            <input
                              type="text"
                              className="w-full border border-gray-300 rounded-md px-2 py-1"
                              value={peca.descricao ?? ""}
                              onChange={(e) => {
                                const value = e.target.value;
                                onChange(index, "descricao", value);
                                handleTriggerCatalogSearch(
                                  index,
                                  "descricao",
                                  value
                                );
                              }}
                              placeholder="Descrição"
                            />
                            {renderSearchResults(index, "descricao")}
                            {originalDescricao &&
                              originalDescricao.trim().length > 0 &&
                              originalDescricao.trim() !==
                                (peca.descricao ?? "").trim() && (
                                <p className="mt-1 text-xs text-gray-500">
                                  Texto do Técnico:{" "}
                                  <span className="font-medium text-gray-600">
                                    {originalDescricao}
                                  </span>
                                </p>
                              )}
                          </div>
                        ) : (
                          <div className="flex flex-col">
                            <span>{peca.descricao ?? "-"}</span>
                            {originalDescricao &&
                              originalDescricao.trim().length > 0 &&
                              originalDescricao.trim() !==
                                (peca.descricao ?? "").trim() && (
                                <span className="text-xs text-gray-400">
                                  Texto do Técnico: {originalDescricao}
                                </span>
                              )}
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                        {peca.isEditing ? (
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                className="w-20 border border-gray-300 rounded-md px-2 py-1"
                                value={peca.quantidade ?? 0}
                                onChange={(e) =>
                                  onChange(
                                    index,
                                    "quantidade",
                                    Number(e.target.value)
                                  )
                                }
                                min={1}
                              />
                              {isCatalogSelection ? (
                                <span className="inline-flex items-center rounded-md border border-gray-200 bg-gray-50 px-2 py-1 text-xs font-medium uppercase text-gray-600">
                                  {unidadeMedidaAtual || "-"}
                                </span>
                              ) : (
                                <input
                                  type="text"
                                  className="w-24 border border-gray-300 rounded-md px-2 py-1 uppercase"
                                  value={peca.unidade_medida ?? ""}
                                  onChange={(e) =>
                                    onChange(
                                      index,
                                      "unidade_medida",
                                      e.target.value
                                    )
                                  }
                                  placeholder="Unid."
                                />
                              )}
                            </div>
                            {isCatalogSelection && (
                              <span className="text-[11px] uppercase text-gray-400">
                                Unidade definida pelo catálogo
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-sm text-gray-900">
                            <span className="font-medium text-gray-700">
                              {peca.quantidade}
                            </span>
                            <span className="ml-2 text-xs text-gray-500 uppercase">
                              {unidadeMedidaAtual.length > 0
                                ? unidadeMedidaAtual
                                : "s/ unidade_medida"}
                            </span>
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-right text-sm font-medium">
                        {peca.isDeleted ? (
                          <button
                            className="text-green-600 hover:text-green-900"
                            onClick={() => onRestore(index)}
                          >
                            Restaurar
                          </button>
                        ) : peca.isEditing ? (
                          <div className="flex gap-2 justify-end">
                            <button
                              className={`text-green-600 hover:text-green-900 ${
                                possuiCodigo
                                  ? ""
                                  : "opacity-40 cursor-not-allowed hover:text-green-600"
                              }`}
                              onClick={() => {
                                if (possuiCodigo) {
                                  onSave(index);
                                }
                              }}
                              disabled={!possuiCodigo}
                              title={
                                possuiCodigo
                                  ? undefined
                                  : "Informe o Código antes de salvar"
                              }
                            >
                              <Save className="h-4 w-4" />
                            </button>
                            <button
                              className="text-red-600 hover:text-red-900"
                              onClick={() => onCancel(index)}
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex gap-2 justify-end">
                            <button
                              className="text-blue-600 hover:text-blue-900"
                              onClick={() => onEdit(index)}
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              className="text-red-600 hover:text-red-900"
                              onClick={() => onDelete(index)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-6 bg-gray-50 rounded-md">
            <Package className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-500">Nenhuma Peça revisada.</p>
            <button
              className="mt-2 text-[var(--primary)] hover:underline text-sm"
              onClick={onAdd}
            >
              Adicionar Peça
            </button>
          </div>
        )}
      </section>
    </div>
  );
};

export default PecasTab;
