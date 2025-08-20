"use client";
import { Loading } from "@/components/Loading";
import { TableList, TableStatusColumn } from "@/components/admin/common";
import { useTitle } from "@/context/TitleContext";
import { useDataFetch } from "@/hooks";
import type { TipoPeca } from "@/types/admin/cadastro/tipos_pecas";
import { useCallback, useEffect } from "react";
import { DeleteButton } from "@/components/admin/ui/DeleteButton";
import { EditButton } from "@/components/admin/ui/EditButton";
import PageHeader from "@/components/admin/ui/PageHeader";
import { useTiposPecasFilters } from "@/hooks/useSpecificFilters";
import { tiposPecasAPI } from "@/api/api";

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
  } = useTiposPecasFilters();

  const fetchTiposPecas = useCallback(async () => {
    const params: Record<string, string> = {};
    if (filtrosAplicados.descricao)
      params.descricao = filtrosAplicados.descricao;
    if (filtrosAplicados.incluir_inativos === "true")
      params.incluir_inativos = "S";

    const response = await tiposPecasAPI.getAll(params);
    return response.tipos_pecas; 
  }, [filtrosAplicados]);

  const {
    data: tiposPecas,
    loading,
    refetch,
  } = useDataFetch<TipoPeca[]>(fetchTiposPecas, [fetchTiposPecas]);

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
      header: "Descrição",
      accessor: "descricao" as keyof TipoPeca,
      render: (tipoPeca: TipoPeca) => (
        <div className="text-sm font-semibold text-gray-900">
          {tipoPeca.descricao}
        </div>
      ),
    },
    {
      header: "Status",
      accessor: "situacao" as keyof TipoPeca,
      render: (tipoPeca: TipoPeca) => (
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

  const renderActions = (tipoPeca: TipoPeca) => (
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

  const filterOptions = [
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

  const itemCount = tiposPecas ? tiposPecas.length : 0;

  return (
    <>
      <PageHeader
        title="Lista de Tipos de Peças"
        config={{
          type: "list",
          itemCount: itemCount,
          onFilterToggle: toggleFilters,
          showFilters: showFilters,
          activeFiltersCount: activeFiltersCount,
          newButton: {
            label: "Novo Tipo",
            link: "/admin/cadastro/tipos_pecas/novo",
          },
        }}
      />
      <TableList
        title="Lista Tipos de Peças"
        items={tiposPecas || []}
        keyField="id_tipo_peca"
        columns={columns}
        renderActions={renderActions}
        showFilter={showFilters}
        filterOptions={filterOptions}
        filterValues={filtrosPainel}
        onFilterChange={handleFiltroChange}
        onClearFilters={limparFiltros}
        onApplyFilters={aplicarFiltros}
        onFilterToggle={toggleFilters}
      />
    </>
  );
};

export default CadastroTiposPecas;
