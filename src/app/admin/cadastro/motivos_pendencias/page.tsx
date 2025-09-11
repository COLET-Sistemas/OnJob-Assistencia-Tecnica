"use client";
import { Loading } from "@/components/LoadingPersonalizado";
import { TableList, TableStatusColumn } from "@/components/admin/common";
import { useDataFetch } from "@/hooks";
import type { MotivoPendencia } from "@/types/admin/cadastro/motivos_pendencia";
import { useCallback, useEffect, useState, useRef } from "react";
import { DeleteButton } from "@/components/admin/ui/DeleteButton";
import { EditButton } from "@/components/admin/ui/EditButton";
import PageHeader from "@/components/admin/ui/PageHeader";
import { useMotivosPendenciaFilters } from "@/hooks/useSpecificFilters";
import { services } from "@/api";
import { useToast } from "@/components/admin/ui/ToastContainer";

const CadastroMotivosPendencia = () => {
  const { showSuccess, showError } = useToast();
  const [localShowFilters, setLocalShowFilters] = useState(false);
  const isReloadingRef = useRef(false);

  const {
    showFilters,
    filtrosPainel,
    filtrosAplicados,
    activeFiltersCount,
    handleFiltroChange,
    limparFiltros,
    aplicarFiltros,
    toggleFilters,
  } = useMotivosPendenciaFilters();

  // Sincronizar estado local com o estado do hook quando não estiver recarregando
  useEffect(() => {
    if (!isReloadingRef.current) {
      setLocalShowFilters(showFilters);
    }
  }, [showFilters]);

  const fetchMotivos = useCallback(async () => {
    isReloadingRef.current = true;
    const params: Record<string, string> = {};
    if (filtrosAplicados.descricao)
      params.descricao = filtrosAplicados.descricao;
    if (filtrosAplicados.incluir_inativos === "true")
      params.incluir_inativos = "S";
    return await services.motivosPendenciaService.getAll(params);
  }, [filtrosAplicados]);

  const {
    data: motivos,
    loading,
    refetch,
  } = useDataFetch<MotivoPendencia[]>(fetchMotivos, [fetchMotivos]);

  // Resetar o flag de recarregamento quando os dados são carregados
  useEffect(() => {
    if (!loading && isReloadingRef.current) {
      isReloadingRef.current = false;
    }
  }, [loading]);

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
      await services.motivosPendenciaService.delete(id);
      await refetch();

      showSuccess(
        "Inativação realizada!",
        "Motivo de pendência inativado com sucesso."
      );
    } catch (error) {
      console.error("Erro ao inativar motivo de pendência:", error);

      showError("Erro ao inativar", error as Record<string, unknown>);
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
        confirmText="Deseja realmente inativar este motivo de pendência?"
        confirmTitle="Inativação de Motivo de Pendência"
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

  const handleLocalToggleFilters = () => {
    setLocalShowFilters((prev) => !prev);
    toggleFilters();
  };

  const handleLocalApplyFilters = () => {
    setLocalShowFilters(false);
    aplicarFiltros();
  };

  const handleLocalClearFilters = () => {
    setLocalShowFilters(false);
    limparFiltros();
  };

  const itemCount = motivos ? motivos.length : 0;

  return (
    <>
      <PageHeader
        title="Lista de Motivos de Pendências"
        config={{
          type: "list",
          itemCount: itemCount,
          onFilterToggle: handleLocalToggleFilters,
          showFilters: localShowFilters,
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
        showFilter={localShowFilters}
        filterOptions={filterOptions}
        filterValues={filtrosPainel}
        onFilterChange={handleFiltroChange}
        onClearFilters={handleLocalClearFilters}
        onApplyFilters={handleLocalApplyFilters}
        onFilterToggle={handleLocalToggleFilters}
        emptyStateProps={{
          title: "Nenhum motivo pendência encontrada",
          description:
            "Tente ajustar os filtros ou cadastre um novo motivo pendência.",
        }}
      />
    </>
  );
};

export default CadastroMotivosPendencia;
