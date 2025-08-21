"use client";
import { Loading } from "@/components/LoadingPersonalizado";
import { TableList, TableStatusColumn } from "@/components/admin/common";
import { useTitle } from "@/context/TitleContext";
import { useDataFetch } from "@/hooks";
import type { Peca } from "@/types/admin/cadastro/pecas";
import { useCallback, useEffect, useState } from "react";
import { DeleteButton } from "@/components/admin/ui/DeleteButton";
import { EditButton } from "@/components/admin/ui/EditButton";
import PageHeader from "@/components/admin/ui/PageHeader";
import Pagination from "@/components/admin/ui/Pagination";
import { useFilters } from "@/hooks/useFilters";
import { pecasAPI } from "@/api/api";
import { Package } from "lucide-react";

// Interface dos filtros específicos para peças
interface PecasFilters {
  codigo: string;
  descricao: string;
  incluir_inativos: string;
  [key: string]: string;
}

const INITIAL_PECAS_FILTERS: PecasFilters = {
  codigo: "",
  descricao: "",
  incluir_inativos: "",
};

interface PaginacaoInfo {
  paginaAtual: number;
  totalPaginas: number;
  totalRegistros: number;
  registrosPorPagina: number;
}

interface PecasResponse {
  dados: Peca[];
  total_paginas: number;
  total_registros: number;
}

const CadastroPecas = () => {
  const { setTitle } = useTitle();

  useEffect(() => {
    setTitle("Peças");
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
  } = useFilters(INITIAL_PECAS_FILTERS);

  const [paginacao, setPaginacao] = useState<PaginacaoInfo>({
    paginaAtual: 1,
    totalPaginas: 1,
    totalRegistros: 0,
    registrosPorPagina: 25,
  });

  const fetchPecas = useCallback(async (): Promise<Peca[]> => {
    const params: Record<string, string | number> = {
      nro_pagina: paginacao.paginaAtual,
      qtde_registros: paginacao.registrosPorPagina,
    };

    if (filtrosAplicados.codigo) params.codigo = filtrosAplicados.codigo;
    if (filtrosAplicados.descricao)
      params.descricao = filtrosAplicados.descricao;
    if (filtrosAplicados.incluir_inativos === "true")
      params.incluir_inativos = "S";

    const response: PecasResponse = await pecasAPI.getAll(params);

    setPaginacao((prev) => ({
      ...prev,
      totalPaginas: response.total_paginas,
      totalRegistros: response.total_registros,
    }));

    return response.dados;
  }, [filtrosAplicados, paginacao.paginaAtual, paginacao.registrosPorPagina]);

  const {
    data: pecas,
    loading,
    refetch,
  } = useDataFetch<Peca[]>(fetchPecas, [fetchPecas]);

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
        text="Carregando peças..."
        size="large"
      />
    );
  }

  const columns = [
    {
      header: "Código",
      accessor: "codigo_peca" as keyof Peca,
      render: (peca: Peca) => (
        <div className="text-sm text-gray-900 flex items-center gap-2">
          <Package size={16} className="text-[var(--primary)]" />
          {peca.codigo_peca}
        </div>
      ),
    },
    {
      header: "Descrição",
      accessor: "descricao" as keyof Peca,
      render: (peca: Peca) => (
        <div className="text-sm text-gray-900">{peca.descricao}</div>
      ),
    },
    {
      header: "Tipo de Peça",
      accessor: "tipo_peca" as keyof Peca,
      render: (peca: Peca) => (
        <div className="text-sm text-gray-900">{peca.tipo_peca}</div>
      ),
    },
    {
      header: "Unidade de Medida",
      accessor: "unidade_medida" as keyof Peca,
      render: (peca: Peca) => (
        <span className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-medium bg-[var(--secondary-yellow)]/20 text-[var(--dark-navy)] border border-[var(--secondary-yellow)]/30">
          {peca.unidade_medida}
        </span>
      ),
    },
    {
      header: "Status",
      accessor: "situacao" as keyof Peca,
      render: (peca: Peca) => <TableStatusColumn status={peca.situacao} />,
    },
  ];

  const handleDelete = async (id: number) => {
    try {
      await pecasAPI.delete(id);
      await refetch();
    } catch {
      alert("Erro ao excluir essa peça.");
    }
  };

  const renderActions = (peca: Peca) => (
    <div className="flex gap-2">
      <EditButton id={peca.id} editRoute="/admin/cadastro/pecas/editar" />
      <DeleteButton
        id={peca.id}
        onDelete={handleDelete}
        confirmText="Deseja realmente excluir esta peça?"
        confirmTitle="Exclusão de Peça"
        itemName={`${peca.codigo_peca}`}
      />
    </div>
  );

  const handleFiltroChangeCustom = (campo: string, valor: string) => {
    // Converter código para maiúsculo
    if (campo === "codigo" && typeof valor === "string") {
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
      id: "incluir_inativos",
      label: "Incluir Inativos",
      type: "checkbox" as const,
    },
  ];

  return (
    <>
      <PageHeader
        title="Lista de Peças"
        config={{
          type: "list",
          itemCount: paginacao.totalRegistros,
          onFilterToggle: toggleFilters,
          showFilters: showFilters,
          activeFiltersCount: activeFiltersCount,
          newButton: {
            label: "Nova Peça",
            link: "/admin/cadastro/pecas/novo",
          },
        }}
      />
      <TableList
        title="Lista de Peças"
        items={pecas || []}
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
          title: "Nenhuma peça encontrada",
          description: "Comece cadastrando uma nova peça.",
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

export default CadastroPecas;
