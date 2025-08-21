"use client";
import { Loading } from "@/components/LoadingPersonalizado";
import { TableList, TableStatusColumn } from "@/components/admin/common";
import { useTitle } from "@/context/TitleContext";
import { useDataFetch } from "@/hooks";
import type { TipoPeca } from "@/types/admin/cadastro/tipos_pecas";
import { useCallback, useEffect, useState } from "react";

// Extensão do tipo TipoPeca para incluir codigo_erp
interface TipoPecaExtended extends TipoPeca {
  codigo_erp: string;
}
import { DeleteButton } from "@/components/admin/ui/DeleteButton";
import { EditButton } from "@/components/admin/ui/EditButton";
import PageHeader from "@/components/admin/ui/PageHeader";
import Pagination from "@/components/admin/ui/Pagination";
import { useFilters } from "@/hooks/useFilters";
import { tiposPecasAPI } from "@/api/api";

// Interface dos filtros específicos para tipos de peças
interface TiposPecasFilters {
  codigo_erp: string;
  descricao: string;
  incluir_inativos: string;
  [key: string]: string;
}

const INITIAL_TIPOS_PECAS_FILTERS: TiposPecasFilters = {
  codigo_erp: "",
  descricao: "",
  incluir_inativos: "",
};

interface PaginacaoInfo {
  paginaAtual: number;
  totalPaginas: number;
  totalRegistros: number;
  registrosPorPagina: number;
}

interface TiposPecasResponse {
  dados: Array<{
    id: number;
    codigo_erp: string;
    descricao: string;
    situacao: string;
    // outros campos se houver
  }>;
  total_paginas: number;
  total_registros: number;
}

const CadastroTiposPecas = () => {
  const { setTitle } = useTitle();

  useEffect(() => {
    setTitle("Tipos de Peças");
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
  } = useFilters(INITIAL_TIPOS_PECAS_FILTERS);

  const [paginacao, setPaginacao] = useState<PaginacaoInfo>({
    paginaAtual: 1,
    totalPaginas: 1,
    totalRegistros: 0,
    registrosPorPagina: 25,
  });

  const fetchTiposPecas = useCallback(async (): Promise<TipoPecaExtended[]> => {
    const params: Record<string, string | number> = {
      nro_pagina: paginacao.paginaAtual,
      qtde_registros: paginacao.registrosPorPagina,
    };

    if (filtrosAplicados.codigo_erp)
      params.codigo_erp = filtrosAplicados.codigo_erp;
    if (filtrosAplicados.descricao)
      params.descricao = filtrosAplicados.descricao;
    if (filtrosAplicados.incluir_inativos === "true")
      params.incluir_inativos = "S";

    const response: TiposPecasResponse = await tiposPecasAPI.getAll(params);

    setPaginacao((prev) => ({
      ...prev,
      totalPaginas: response.total_paginas,
      totalRegistros: response.total_registros,
    }));

    // Mapear os dados para o formato esperado pela tabela
    return response.dados.map((item) => ({
      id_tipo_peca: item.id,
      codigo_erp: item.codigo_erp,
      descricao: item.descricao,
      situacao: item.situacao as "A" | "I",
    }));
  }, [filtrosAplicados, paginacao.paginaAtual, paginacao.registrosPorPagina]);

  const {
    data: tiposPecas,
    loading,
    refetch,
  } = useDataFetch<TipoPecaExtended[]>(fetchTiposPecas, [fetchTiposPecas]);

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
        text="Carregando tipos de peças..."
        size="large"
      />
    );
  }

  const columns = [
    {
      header: "Código ERP",
      accessor: "codigo_erp" as keyof TipoPecaExtended,
      render: (tipoPeca: TipoPecaExtended) => (
        <div className="text-sm font-semibold text-gray-900">
          {tipoPeca.codigo_erp}
        </div>
      ),
    },
    {
      header: "Descrição",
      accessor: "descricao" as keyof TipoPecaExtended,
      render: (tipoPeca: TipoPecaExtended) => (
        <div className="text-sm text-gray-900">{tipoPeca.descricao}</div>
      ),
    },
    {
      header: "Status",
      accessor: "situacao" as keyof TipoPecaExtended,
      render: (tipoPeca: TipoPecaExtended) => (
        <TableStatusColumn status={tipoPeca.situacao} />
      ),
    },
  ];

  const handleDelete = async (id: number) => {
    try {
      await tiposPecasAPI.delete(id);
      await refetch();
    } catch {
      alert("Erro ao excluir tipo de peça.");
    }
  };

  const renderActions = (tipoPeca: TipoPecaExtended) => (
    <div className="flex gap-2">
      <EditButton
        id={tipoPeca.id_tipo_peca}
        editRoute="/admin/cadastro/tipos_pecas/editar"
      />
      <DeleteButton
        id={tipoPeca.id_tipo_peca}
        onDelete={handleDelete}
        confirmText="Deseja realmente excluir este tipo de peça?"
        confirmTitle="Exclusão de Tipo de Peça"
        itemName={`${tipoPeca.descricao}`}
      />
    </div>
  );

  const handleFiltroChangeCustom = (campo: string, valor: string) => {
    // Converter código ERP para maiúsculo
    if (campo === "codigo_erp" && typeof valor === "string") {
      valor = valor.toUpperCase();
    }

    // Converter checkbox para string
    if (campo === "incluir_inativos") {
      valor = valor === "true" ? "true" : "";
    }

    handleFiltroChange(campo, valor);
  };

  const filterOptions = [
    {
      id: "codigo_erp",
      label: "Código ERP",
      type: "text" as const,
      placeholder: "Digite o código ERP...",
    },
    {
      id: "descricao",
      label: "Descrição",
      type: "text" as const,
      placeholder: "Digite a descrição do tipo de peça...",
    },
    {
      id: "incluir_inativos",
      label: "Incluir Inativos",
      type: "checkbox" as const,
      placeholder: "Incluir tipos peças inativas",
    },
  ];

  return (
    <>
      <PageHeader
        title="Lista de Tipos de Peças"
        config={{
          type: "list",
          itemCount: paginacao.totalRegistros,
          onFilterToggle: toggleFilters,
          showFilters: showFilters,
          activeFiltersCount: activeFiltersCount,
          newButton: {
            label: "Novo Tipo de Peça",
            link: "/admin/cadastro/tipos_pecas/novo",
          },
        }}
      />
      <TableList
        title="Lista de Tipos de Peças"
        items={tiposPecas || []}
        keyField="id_tipo_peca"
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
          title: "Nenhum tipo de peça encontrado",
          description: "Comece cadastrando um novo tipo de peça.",
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

export default CadastroTiposPecas;
