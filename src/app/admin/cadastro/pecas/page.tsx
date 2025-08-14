"use client";
import { pecasAPI } from "@/api/api";
import { Loading } from "@/components/Loading";
import {
  ActionButton,
  DataTable,
  ListContainer,
  ListHeader,
  StatusBadge,
  FilterPanel,
} from "@/components/admin/common";
import { useTitle } from "@/context/TitleContext";
import type { Peca } from "@/types/admin/cadastro/pecas";
import { Edit2, Package, Trash2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

interface PaginacaoInfo {
  paginaAtual: number;
  totalPaginas: number;
  totalRegistros: number;
  registrosPorPagina: number;
}

const CadastroPecas = () => {
  const { setTitle } = useTitle();
  const [pecas, setPecas] = useState<Peca[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingData, setLoadingData] = useState(false);
  const [paginacao, setPaginacao] = useState<PaginacaoInfo>({
    paginaAtual: 1,
    totalPaginas: 1,
    totalRegistros: 0,
    registrosPorPagina: 20,
  });

  // Estado para controle de exclusão
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const paginacaoRef = useRef(paginacao);
  const dadosCarregados = useRef(false);

  useEffect(() => {
    paginacaoRef.current = paginacao;
  }, [paginacao]);

  useEffect(() => {
    setTitle("Peças");
  }, [setTitle]);

  // Filtros de busca
  const [showFilters, setShowFilters] = useState(false);
  const [filtros, setFiltros] = useState({
    codigo: "",
    descricao: "",
    status: false,
  });

  const carregarPecas = useCallback(
    async (
      pagina: number = 1,
      registrosPorPagina?: number,
      filtrosParam = filtros
    ) => {
      if (!dadosCarregados.current) {
        setLoading(true);
      } else {
        setLoadingData(true);
      }

      const registrosPorPaginaAtual =
        registrosPorPagina !== undefined
          ? registrosPorPagina
          : paginacaoRef.current.registrosPorPagina;

      try {
        const response = await pecasAPI.getAll({
          nro_pagina: pagina,
          qtde_registros: registrosPorPaginaAtual,
          codigo: filtrosParam.codigo || undefined,
          descricao: filtrosParam.descricao || undefined,
          incluir_inativos: filtrosParam.status ? "S" : undefined,
        });

        setPecas(response.dados);
        setPaginacao({
          paginaAtual: pagina,
          totalPaginas: response.total_paginas,
          totalRegistros: response.total_registros,
          registrosPorPagina: registrosPorPaginaAtual,
        });
      } catch (error) {
        console.error("Erro ao carregar peças:", error);
        setPecas([]);
        setPaginacao({
          paginaAtual: 1,
          totalPaginas: 1,
          totalRegistros: 0,
          registrosPorPagina: registrosPorPaginaAtual,
        });
      } finally {
        setLoading(false);
        setLoadingData(false);
      }
    },
    [filtros]
  );
  // Handlers de filtro
  const handleFiltroChange = (campo: string, valor: string | boolean) => {
    let newValue = valor;
    if (campo === "codigo" && typeof valor === "string") {
      newValue = valor.toUpperCase();
    }
    setFiltros((prev) => ({
      ...prev,
      [campo]: campo === "status" ? !!valor : newValue,
    }));
  };

  const limparFiltros = () => {
    setFiltros({ codigo: "", descricao: "", status: false });
    carregarPecas(1, undefined, { codigo: "", descricao: "", status: false });
    setShowFilters(false);
  };

  const aplicarTodosFiltros = () => {
    carregarPecas(1, undefined, filtros);
    setShowFilters(false);
  };

  // Função para mudar de página
  const mudarPagina = useCallback(
    (novaPagina: number) => {
      if (novaPagina < 1 || novaPagina > paginacao.totalPaginas) return;
      carregarPecas(novaPagina, undefined, filtros);
    },
    [paginacao.totalPaginas, carregarPecas, filtros]
  );

  useEffect(() => {
    if (!dadosCarregados.current) {
      carregarPecas(1, undefined, filtros);
      dadosCarregados.current = true;
    }
  }, [carregarPecas, filtros]);

  if (loading) {
    return (
      <Loading
        fullScreen={true}
        preventScroll={false}
        text="Carregando peças..."
        size="large"
      />
    );
  }

  // Estado para controle de exclusão

  // Função para deletar peça
  const handleDelete = async (id: number) => {
    if (!window.confirm("Tem certeza que deseja excluir esta peça?")) return;
    setDeletingId(id);
    try {
      await import("@/api/api").then((mod) =>
        mod.default.delete(`/pecas?id=${id}`)
      );
      await carregarPecas(
        paginacao.paginaAtual,
        paginacao.registrosPorPagina,
        filtros
      );
    } catch {
      alert("Erro ao excluir peça.");
    } finally {
      setDeletingId(null);
    }
  };

  // Definindo a função para renderizar as ações para cada item
  const renderActions = (peca: Peca) => (
    <div className="flex gap-2">
      <ActionButton
        href={`/admin/cadastro/pecas/editar/${peca.id}`}
        icon={<Edit2 size={14} />}
        label="Editar"
        variant="secondary"
      />
      <ActionButton
        onClick={() => handleDelete(peca.id)}
        icon={<Trash2 size={14} />}
        label={deletingId === peca.id ? "Excluindo..." : "Excluir"}
        variant="secondary"
      />
    </div>
  );

  // Definindo as colunas da tabela
  const columns = [
    {
      header: "Código",
      accessor: (peca: Peca) => (
        <div className="text-sm text-gray-900 flex items-center gap-2">
          <Package size={16} className="text-[var(--primary)]" />
          {peca.codigo_peca}
        </div>
      ),
    },
    {
      header: "Descrição",
      accessor: (peca: Peca) => (
        <div className="text-sm text-gray-900">{peca.descricao}</div>
      ),
    },
    {
      header: "Unidade de Medida",
      accessor: (peca: Peca) => (
        <span className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-medium bg-[var(--secondary-yellow)]/20 text-[var(--dark-navy)] border border-[var(--secondary-yellow)]/30">
          {peca.unidade_medida}
        </span>
      ),
    },
    {
      header: "Status",
      accessor: (peca: Peca) => (
        <StatusBadge
          status={peca.situacao}
          mapping={{
            A: {
              label: "Ativo",
              className:
                "bg-[var(--secondary-green)]/20 text-[var(--dark-navy)] border border-[var(--secondary-green)]/30",
            },
            I: {
              label: "Inativo",
              className: "bg-red-50 text-red-700 border border-red-100",
            },
          }}
        />
      ),
    },
  ];

  // Filtros disponíveis
  const filterOptions = [
    {
      id: "codigo",
      label: "Código",
      type: "text" as const,
      placeholder: "Digite o código da peça...",
    },
    {
      id: "descricao",
      label: "Descrição",
      type: "text" as const,
      placeholder: "Digite a descrição da peça...",
    },
    {
      id: "status",
      label: "Incluir peças inativas",
      type: "checkbox" as const,
    },
  ];

  // Contador de filtros ativos
  const activeFiltersCount = Object.values(filtros).filter(Boolean).length;

  return (
    <ListContainer>
      <ListHeader
        title="Lista de Peças"
        itemCount={pecas.length}
        newButtonLink="/admin/cadastro/pecas/novo"
        newButtonLabel="Nova Peça"
        showFilters={showFilters}
        onFilterToggle={() => setShowFilters(!showFilters)}
        activeFiltersCount={activeFiltersCount}
      />

      {showFilters && (
        <FilterPanel
          title="Filtros Avançados"
          pageName="Peças"
          filterOptions={filterOptions}
          filterValues={{ ...filtros, status: filtros.status ? "true" : "" }}
          onFilterChange={handleFiltroChange}
          onClearFilters={limparFiltros}
          onApplyFilters={aplicarTodosFiltros}
          onClose={() => setShowFilters(false)}
        />
      )}

      <div className="relative">
        {loadingData && (
          <div className="absolute inset-0 bg-white/70 z-10 rounded-lg">
            <Loading
              fullScreen={false}
              preventScroll={false}
              text="Atualizando lista..."
              size="medium"
              className="h-full"
            />
          </div>
        )}

        <DataTable
          columns={[
            ...columns,
            {
              header: "Ações",
              accessor: (peca: Peca) => renderActions(peca),
            },
          ]}
          data={pecas}
          keyField="id"
          emptyStateProps={{
            title: "Nenhuma peça encontrada",
            description: "Comece cadastrando uma nova peça.",
          }}
        />
      </div>

      {paginacao.totalPaginas > 1 && (
        <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6 mt-4 rounded-lg shadow-sm">
          <div className="flex flex-1 justify-between sm:hidden">
            <button
              onClick={() => mudarPagina(paginacao.paginaAtual - 1)}
              disabled={paginacao.paginaAtual === 1}
              className={`relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium ${
                paginacao.paginaAtual === 1
                  ? "text-gray-300 cursor-not-allowed"
                  : "text-gray-700 hover:bg-gray-50"
              }`}
            >
              Anterior
            </button>
            <button
              onClick={() => mudarPagina(paginacao.paginaAtual + 1)}
              disabled={paginacao.paginaAtual === paginacao.totalPaginas}
              className={`relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium ${
                paginacao.paginaAtual === paginacao.totalPaginas
                  ? "text-gray-300 cursor-not-allowed"
                  : "text-gray-700 hover:bg-gray-50"
              }`}
            >
              Próxima
            </button>
          </div>
          <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
            <div className="flex items-center">
              <p className="text-sm text-gray-700 mr-6">
                Mostrando{" "}
                <span className="font-medium">
                  {Math.min(
                    (paginacao.paginaAtual - 1) * paginacao.registrosPorPagina +
                      1,
                    paginacao.totalRegistros
                  )}
                </span>{" "}
                a{" "}
                <span className="font-medium">
                  {Math.min(
                    paginacao.paginaAtual * paginacao.registrosPorPagina,
                    paginacao.totalRegistros
                  )}
                </span>{" "}
                de{" "}
                <span className="font-medium">{paginacao.totalRegistros}</span>{" "}
                resultados
              </p>
              <div className="flex items-center">
                <span className="text-sm text-gray-700 mr-2">Exibir:</span>
                <select
                  className="rounded-md border border-gray-300 py-1.5 px-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)]"
                  value={paginacao.registrosPorPagina}
                  onChange={(e) => {
                    const novoValor = parseInt(e.target.value);
                    setPaginacao((prev) => ({
                      ...prev,
                      registrosPorPagina: novoValor,
                    }));
                    carregarPecas(1, novoValor, filtros);
                  }}
                >
                  {[10, 20, 25, 50, 100].map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <nav
              className="isolate inline-flex -space-x-px rounded-md shadow-sm"
              aria-label="Paginação"
            >
              <button
                onClick={() => mudarPagina(paginacao.paginaAtual - 1)}
                disabled={paginacao.paginaAtual === 1}
                className={`relative inline-flex items-center rounded-l-md px-2 py-2 ${
                  paginacao.paginaAtual === 1
                    ? "text-gray-300 cursor-not-allowed"
                    : "text-gray-500 hover:bg-gray-50"
                } focus:z-20 focus:outline-offset-0`}
              >
                <span className="sr-only">Anterior</span>
                <svg
                  className="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>

              {Array.from(
                { length: Math.min(5, paginacao.totalPaginas) },
                (_, i) => {
                  // Lógica para mostrar as páginas próximas da atual
                  let pageNum;
                  if (paginacao.totalPaginas <= 5) {
                    pageNum = i + 1;
                  } else if (paginacao.paginaAtual <= 3) {
                    pageNum = i + 1;
                  } else if (
                    paginacao.paginaAtual >=
                    paginacao.totalPaginas - 2
                  ) {
                    pageNum = paginacao.totalPaginas - 4 + i;
                  } else {
                    pageNum = paginacao.paginaAtual - 2 + i;
                  }

                  return (
                    <button
                      key={pageNum}
                      onClick={() => mudarPagina(pageNum)}
                      aria-current={
                        paginacao.paginaAtual === pageNum ? "page" : undefined
                      }
                      className={`relative z-10 inline-flex items-center px-4 py-2 text-sm font-semibold cursor-pointer ${
                        paginacao.paginaAtual === pageNum
                          ? "bg-[var(--primary)] text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]"
                          : "text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0"
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                }
              )}

              <button
                onClick={() => mudarPagina(paginacao.paginaAtual + 1)}
                disabled={paginacao.paginaAtual === paginacao.totalPaginas}
                className={`relative inline-flex items-center rounded-r-md px-2 py-2 ${
                  paginacao.paginaAtual === paginacao.totalPaginas
                    ? "text-gray-300 cursor-not-allowed"
                    : "text-gray-500 hover:bg-gray-50"
                } focus:z-20 focus:outline-offset-0`}
              >
                <span className="sr-only">Próxima</span>
                <svg
                  className="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </nav>
          </div>
        </div>
      )}
    </ListContainer>
  );
};

export default CadastroPecas;
