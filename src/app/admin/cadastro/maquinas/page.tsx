"use client";
import { Loading } from "@/components/LoadingPersonalizado";
import { TableList, TableStatusColumn } from "@/components/admin/common";
import { useTitle } from "@/context/TitleContext";
import type { Maquina, MaquinaResponse } from "@/types/admin/cadastro/maquinas";
import { useCallback, useEffect, useState } from "react";
import { DeleteButton } from "@/components/admin/ui/DeleteButton";
import { EditButton } from "@/components/admin/ui/EditButton";
import PageHeader from "@/components/admin/ui/PageHeader";
import { useMaquinasFilters } from "@/hooks/useSpecificFilters";
import { maquinasAPI } from "@/api/api";

// Helper function to consistently format dates on both server and client
const formatDate = (dateString: string): string => {
  if (!dateString) return "-";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "-";
  return `${date.getDate().toString().padStart(2, "0")}/${(date.getMonth() + 1)
    .toString()
    .padStart(2, "0")}/${date.getFullYear()}`;
};

const CadastroMaquinas = () => {
  const { setTitle } = useTitle();
  const [maquinas, setMaquinas] = useState<Maquina[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingData, setLoadingData] = useState(false);

  // Estado para controle de paginação
  const [paginacao, setPaginacao] = useState({
    paginaAtual: 1,
    registrosPorPagina: 20,
    totalPaginas: 1,
    totalRegistros: 0,
  });

  useEffect(() => {
    setTitle("Máquinas");
  }, [setTitle]);

  const {
    showFilters,
    filtrosPainel,
    filtrosAplicados,
    activeFiltersCount,
    handleFiltroChange,
    limparFiltros,
    aplicarFiltros,
    toggleFilters,
  } = useMaquinasFilters();

  const carregarMaquinas = useCallback(
    async (
      filtrosParam = filtrosAplicados,
      pagina = paginacao.paginaAtual,
      limite = paginacao.registrosPorPagina
    ) => {
      if (pagina === 1 && limite === paginacao.registrosPorPagina) {
        setLoading(true);
      } else {
        setLoadingData(true);
      }

      try {
        const params: Record<string, string | number> = {
          qtde_registros: limite,
          nro_pagina: pagina,
        };

        // Adiciona os filtros
        if (
          filtrosParam.numero_serie &&
          filtrosParam.numero_serie.trim() !== ""
        ) {
          params.numero_serie = filtrosParam.numero_serie.trim();
        }
        if (filtrosParam.modelo && filtrosParam.modelo.trim() !== "") {
          params.modelo = filtrosParam.modelo.trim();
        }
        if (filtrosParam.descricao && filtrosParam.descricao.trim() !== "") {
          params.descricao = filtrosParam.descricao.trim();
        }

        let response: MaquinaResponse | Maquina[];
        if (filtrosParam.incluir_inativos === "true") {
          params.incluir_inativos = "S";
          response = await maquinasAPI.getAllWithInactive(params);
        } else {
          response = await maquinasAPI.getAll(params);
        }

        // Verifica se a resposta tem o formato paginado
        if (response && typeof response === "object" && "dados" in response) {
          const paginatedResponse = response as MaquinaResponse;
          setMaquinas(paginatedResponse.dados || []);

          setPaginacao({
            paginaAtual: paginatedResponse.pagina_atual || pagina,
            registrosPorPagina:
              paginatedResponse.registros_por_pagina || limite,
            totalPaginas: paginatedResponse.total_paginas || 1,
            totalRegistros: paginatedResponse.total_registros || 0,
          });
        } else {
          // Fallback para o formato antigo
          const maquinasArray = response as Maquina[];
          setMaquinas(maquinasArray || []);
          setPaginacao((prev) => ({
            ...prev,
            totalRegistros: maquinasArray?.length || 0,
          }));
        }
      } catch (error) {
        console.error("Erro ao carregar máquinas:", error);
        setMaquinas([]);
      } finally {
        setLoading(false);
        setLoadingData(false);
      }
    },
    [filtrosAplicados, paginacao.paginaAtual, paginacao.registrosPorPagina]
  );

  // Carregamento inicial e quando filtros são aplicados
  useEffect(() => {
    carregarMaquinas(filtrosAplicados, 1);
  }, [filtrosAplicados, carregarMaquinas]);

  // Carregamento inicial
  useEffect(() => {
    carregarMaquinas();
  }, []);

  // Handler para mudar a página
  const mudarPagina = useCallback(
    (novaPagina: number) => {
      if (novaPagina < 1 || novaPagina > paginacao.totalPaginas) return;
      carregarMaquinas(filtrosAplicados, novaPagina);
    },
    [filtrosAplicados, paginacao.totalPaginas, carregarMaquinas]
  );

  // Handler customizado para aplicar filtros
  const handleAplicarFiltros = useCallback(() => {
    aplicarFiltros();
    // carregarMaquinas será chamado automaticamente pelo useEffect quando filtrosAplicados mudar
  }, [aplicarFiltros]);

  // Handler customizado para limpar filtros
  const handleLimparFiltros = useCallback(() => {
    limparFiltros();
    // carregarMaquinas será chamado automaticamente pelo useEffect quando filtrosAplicados mudar
  }, [limparFiltros]);

  if (loading) {
    return (
      <Loading
        fullScreen={true}
        preventScroll={false}
        text="Carregando máquinas..."
        size="large"
      />
    );
  }

  const columns = [
    {
      header: "Máquina",
      accessor: "numero_serie" as keyof Maquina,
      render: (maquina: Maquina) => (
        <div className="flex flex-col">
          <div className="text-sm font-semibold text-gray-900">
            {maquina.numero_serie}
          </div>
          <div
            className="text-xs text-gray-600 mt-1 max-w-[200px] line-clamp-1"
            title={maquina.descricao}
          >
            {maquina.descricao || "-"}
          </div>
        </div>
      ),
    },
    {
      header: "Modelo",
      accessor: "modelo" as keyof Maquina,
      render: (maquina: Maquina) => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-[var(--secondary-yellow)]/10 text-[var(--dark-navy)] border border-[var(--secondary-yellow)]/20">
          {maquina.modelo}
        </span>
      ),
    },
    {
      header: "Cliente Atual",
      accessor: "cliente_atual" as keyof Maquina,
      render: (maquina: Maquina) => (
        <span className="text-sm text-gray-600">
          {maquina.cliente_atual?.nome_fantasia || "-"}
        </span>
      ),
    },
    {
      header: "Data 1ª Venda",
      accessor: "data_1a_venda" as keyof Maquina,
      render: (maquina: Maquina) => (
        <span className="text-sm text-gray-600">
          {formatDate(maquina.data_1a_venda)}
        </span>
      ),
    },
    {
      header: "Nota Fiscal",
      accessor: "nota_fiscal_venda" as keyof Maquina,
      render: (maquina: Maquina) => (
        <span className="text-sm text-gray-600 font-medium">
          {maquina.nota_fiscal_venda || "-"}
        </span>
      ),
    },
    {
      header: "Data Final Garantia",
      accessor: "data_final_garantia" as keyof Maquina,
      render: (maquina: Maquina) => (
        <span className="text-sm text-gray-600">
          {formatDate(maquina.data_final_garantia)}
        </span>
      ),
    },
    {
      header: "Status",
      accessor: "situacao" as keyof Maquina,
      render: (maquina: Maquina) => (
        <TableStatusColumn status={maquina.situacao} />
      ),
    },
  ];

  const handleDelete = async (id: number) => {
    try {
      await maquinasAPI.delete(id);
      await carregarMaquinas();
    } catch {
      alert("Erro ao excluir máquina.");
    }
  };

  const renderActions = (maquina: Maquina) => (
    <div className="flex gap-2">
      <EditButton id={maquina.id} editRoute="/admin/cadastro/maquinas/editar" />
      <DeleteButton
        id={maquina.id}
        onDelete={handleDelete}
        confirmText="Deseja realmente excluir esta máquina?"
        confirmTitle="Exclusão de Máquina"
        itemName={`${maquina.numero_serie} - ${
          maquina.descricao || "Sem descrição"
        }`}
      />
    </div>
  );

  const filterOptions = [
    {
      id: "numero_serie",
      label: "Número de Série",
      type: "text" as const,
      placeholder: "Buscar por número de série...",
    },
    {
      id: "modelo",
      label: "Modelo",
      type: "text" as const,
      placeholder: "Buscar por modelo...",
    },
    {
      id: "descricao",
      label: "Descrição",
      type: "text" as const,
      placeholder: "Buscar por descrição...",
    },
    {
      id: "incluir_inativos",
      label: "Incluir Inativos",
      type: "checkbox" as const,
    },
  ];

  return (
    <>
      <PageHeader
        title="Lista de Máquinas"
        config={{
          type: "list",
          itemCount: paginacao.totalRegistros,
          onFilterToggle: toggleFilters,
          showFilters: showFilters,
          activeFiltersCount: activeFiltersCount,
          newButton: {
            label: "Nova Máquina",
            link: "/admin/cadastro/maquinas/novo",
          },
        }}
      />

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

        <TableList
          title="Lista de Máquinas"
          items={maquinas || []}
          keyField="id"
          columns={columns}
          renderActions={renderActions}
          showFilter={showFilters}
          filterOptions={filterOptions}
          filterValues={filtrosPainel}
          onFilterChange={handleFiltroChange}
          onClearFilters={handleLimparFiltros}
          onApplyFilters={handleAplicarFiltros}
          onFilterToggle={toggleFilters}
        />

        {/* Paginação */}
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
                      (paginacao.paginaAtual - 1) *
                        paginacao.registrosPorPagina +
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
                  <span className="font-medium">
                    {paginacao.totalRegistros}
                  </span>{" "}
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
                      carregarMaquinas(filtrosAplicados, 1, novoValor);
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
                            ? "bg-[var(--primary)] text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]"
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
      </div>
    </>
  );
};

export default CadastroMaquinas;
