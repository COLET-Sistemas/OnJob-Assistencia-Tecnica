"use client";
import { Loading } from "@/components/LoadingPersonalizado";
import { TableList, TableStatusColumn } from "@/components/admin/common";
import { useTitle } from "@/context/TitleContext";
import { useDataFetch } from "@/hooks";
import type { Maquina } from "@/types/admin/cadastro/maquinas";
import { useCallback, useEffect, useState } from "react";
import { DeleteButton } from "@/components/admin/ui/DeleteButton";
import { EditButton } from "@/components/admin/ui/EditButton";
import PageHeader from "@/components/admin/ui/PageHeader";
import Pagination from "@/components/admin/ui/Pagination";
import { useFilters } from "@/hooks/useFilters";
import { maquinasAPI } from "@/api/api";

interface MaquinasFilters {
  numero_serie: string;
  modelo: string;
  descricao: string;
  incluir_inativos: string;
  [key: string]: string;
}

const INITIAL_MAQUINAS_FILTERS: MaquinasFilters = {
  numero_serie: "",
  modelo: "",
  descricao: "",
  incluir_inativos: "",
};

interface PaginacaoInfo {
  paginaAtual: number;
  totalPaginas: number;
  totalRegistros: number;
  registrosPorPagina: number;
}

interface MaquinasResponse {
  dados: Maquina[];
  total_paginas: number;
  total_registros: number;
  pagina_atual: number;
  registros_por_pagina: number;
}

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
  } = useFilters(INITIAL_MAQUINAS_FILTERS);

  const [paginacao, setPaginacao] = useState<PaginacaoInfo>({
    paginaAtual: 1,
    totalPaginas: 1,
    totalRegistros: 0,
    registrosPorPagina: 25,
  });

  const fetchMaquinas = useCallback(async (): Promise<Maquina[]> => {
    const params: Record<string, string | number> = {
      nro_pagina: paginacao.paginaAtual,
      qtde_registros: paginacao.registrosPorPagina,
    };

    // Adiciona os filtros
    if (
      filtrosAplicados.numero_serie &&
      filtrosAplicados.numero_serie.trim() !== ""
    ) {
      params.numero_serie = filtrosAplicados.numero_serie.trim();
    }
    if (filtrosAplicados.modelo && filtrosAplicados.modelo.trim() !== "") {
      params.modelo = filtrosAplicados.modelo.trim();
    }
    if (
      filtrosAplicados.descricao &&
      filtrosAplicados.descricao.trim() !== ""
    ) {
      params.descricao = filtrosAplicados.descricao.trim();
    }
    if (filtrosAplicados.incluir_inativos === "true") {
      params.incluir_inativos = "S";
    }

    let response: MaquinasResponse | Maquina[];

    if (filtrosAplicados.incluir_inativos === "true") {
      response = await maquinasAPI.getAllWithInactive(params);
    } else {
      response = await maquinasAPI.getAll(params);
    }

    if (response && typeof response === "object" && "dados" in response) {
      const paginatedResponse = response as MaquinasResponse;

      setPaginacao((prev) => ({
        ...prev,
        totalPaginas: paginatedResponse.total_paginas || 1,
        totalRegistros: paginatedResponse.total_registros || 0,
      }));

      return paginatedResponse.dados || [];
    } else {
      // Fallback para o formato antigo
      const maquinasArray = response as Maquina[];

      setPaginacao((prev) => ({
        ...prev,
        totalRegistros: maquinasArray?.length || 0,
      }));

      return maquinasArray || [];
    }
  }, [filtrosAplicados, paginacao.paginaAtual, paginacao.registrosPorPagina]);

  const {
    data: maquinas,
    loading,
    refetch,
  } = useDataFetch<Maquina[]>(fetchMaquinas, [fetchMaquinas]);

  const handlePageChange = useCallback((novaPagina: number) => {
    setPaginacao((prev) => ({ ...prev, paginaAtual: novaPagina }));
  }, []);

  const handleRecordsPerPageChange = useCallback((novoValor: number) => {
    setPaginacao((prev) => ({
      ...prev,
      registrosPorPagina: novoValor,
      paginaAtual: 1,
    }));
  }, []);

  useEffect(() => {
    setPaginacao((prev) => ({ ...prev, paginaAtual: 1 }));
  }, [filtrosAplicados]);

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
        <div className="flex items-start gap-2">
          <div className="flex flex-col">
            <div className=" text-gray-900">
              <span className="font-bold text-sm">{maquina.numero_serie}</span>
              {" -  "}
              <span className=" text-xs">{maquina.modelo}</span>
            </div>
            <div className="text-sm font-bold text-gray-600 mt-1 line-clamp-1">
              {maquina.descricao}
            </div>
          </div>
        </div>
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
      await refetch();
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

  const handleFiltroChangeCustom = (campo: string, valor: string) => {
    if (campo === "incluir_inativos") {
      valor = valor === "true" ? "true" : "";
    }

    handleFiltroChange(campo, valor);
  };

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
      placeholder: "Incluir máquinas inativas",
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

      <TableList
        title="Lista de Máquinas"
        items={maquinas || []}
        keyField="id"
        columns={columns}
        renderActions={renderActions}
        showFilter={showFilters}
        filterOptions={filterOptions}
        filterValues={filtrosPainel}
        onFilterChange={handleFiltroChangeCustom}
        onClearFilters={limparFiltros}
        onApplyFilters={aplicarFiltros}
        onFilterToggle={toggleFilters}
        emptyStateProps={{
          title: "Nenhuma máquina encontrada",
          description: "Comece cadastrando uma nova máquina.",
        }}
      />

      <Pagination
        currentPage={paginacao.paginaAtual}
        totalPages={paginacao.totalPaginas}
        totalRecords={paginacao.totalRegistros}
        recordsPerPage={paginacao.registrosPorPagina}
        onPageChange={handlePageChange}
        onRecordsPerPageChange={handleRecordsPerPageChange}
        recordsPerPageOptions={[10, 20, 25, 50, 100]}
        showRecordsPerPage={true}
      />
    </>
  );
};

export default CadastroMaquinas;
