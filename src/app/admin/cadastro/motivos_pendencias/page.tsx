"use client";
import { Loading } from "@/components/LoadingPersonalizado";
import { TableList, TableStatusColumn } from "@/components/admin/common";
import { useTitle } from "@/context/TitleContext";
import { useDataFetch } from "@/hooks";
import type { MotivoPendencia } from "@/types/admin/cadastro/motivos_pendencia";
import { useCallback, useEffect } from "react";
import { DeleteButton } from "@/components/admin/ui/DeleteButton";
import { EditButton } from "@/components/admin/ui/EditButton";
import PageHeader from "@/components/admin/ui/PageHeader";
import { useMotivosFilters } from "../../../../hooks/useSpecificFilters";
import { motivosPendenciaAPI } from "@/api/api";
import { useToast } from "@/components/admin/ui/ToastContainer";

const CadastroMotivosPendencia = () => {
  const { setTitle } = useTitle();
  const { showSuccess, showError } = useToast();

  useEffect(() => {
    setTitle("Motivos de Pendências");
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
  } = useMotivosFilters();

  const fetchMotivos = useCallback(async () => {
    const params: Record<string, string> = {};
    if (filtrosAplicados.descricao)
      params.descricao = filtrosAplicados.descricao;
    if (filtrosAplicados.incluir_inativos === "true")
      params.incluir_inativos = "S";
    return await motivosPendenciaAPI.getAll(params);
  }, [filtrosAplicados]);

  const {
    data: motivos,
    loading,
    refetch,
  } = useDataFetch<MotivoPendencia[]>(fetchMotivos, [fetchMotivos]);

  if (loading) {
    return (
      <Loading
        fullScreen={true}
        preventScroll={false}
        text="Carregando motivos de pendência..."
        size="large"
      />
    );
  }

  const columns = [
    {
      header: "Descrição",
      accessor: "descricao" as keyof MotivoPendencia,
      render: (motivo: MotivoPendencia) => (
        <div className="text-sm font-semibold text-gray-900">
          {motivo.descricao}
        </div>
      ),
    },
    {
      header: "Status",
      accessor: "situacao" as keyof MotivoPendencia,
      render: (motivo: MotivoPendencia) => (
        <TableStatusColumn status={motivo.situacao} />
      ),
    },
  ];

  const handleDelete = async (id: number) => {
    try {
      const response = await motivosPendenciaAPI.delete(id);
      await refetch();

      showSuccess(
        "Exclusão realizada!",
        response // Passa a resposta diretamente, o ToastContainer extrai a mensagem
      );
    } catch (error) {
      console.error("Erro ao excluir motivo de pendência:", error);

      showError(
        "Erro ao excluir",
        error as Record<string, unknown> // Passa o erro diretamente, o ToastContainer extrai a mensagem
      );
    }
  };

  const renderActions = (motivo: MotivoPendencia) => (
    <div className="flex gap-2">
      <EditButton
        id={motivo.id}
        editRoute="/admin/cadastro/motivos_pendencias/editar"
      />
      <DeleteButton
        id={motivo.id}
        onDelete={handleDelete}
        confirmText="Deseja realmente excluir este motivo de pendência?"
        confirmTitle="Exclusão de Motivo de Pendência"
        itemName={`${motivo.descricao}`}
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
      placeholder: "Incluir pendências inativas",
    },
  ];

  const itemCount = motivos ? motivos.length : 0;

  return (
    <>
      <PageHeader
        title="Lista de Motivos de Pendências"
        config={{
          type: "list",
          itemCount: itemCount,
          onFilterToggle: toggleFilters,
          showFilters: showFilters,
          activeFiltersCount: activeFiltersCount,
          newButton: {
            label: "Novo Motivo",
            link: "/admin/cadastro/motivos_pendencias/novo",
          },
        }}
      />
      <TableList
        title="Lista Motivos de Pendência"
        items={motivos || []}
        keyField="id"
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

export default CadastroMotivosPendencia;
