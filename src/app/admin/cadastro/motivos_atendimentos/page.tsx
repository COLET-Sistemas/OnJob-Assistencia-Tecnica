"use client";
import { Loading } from "@/components/LoadingPersonalizado";
import { TableList, TableStatusColumn } from "@/components/admin/common";
import { useDataFetch } from "@/hooks";
import type { MotivoAtendimento } from "@/types/admin/cadastro/motivos_atendimento";
import { useCallback, useEffect, useState, useRef } from "react";
import { DeleteButton } from "@/components/admin/ui/DeleteButton";
import { EditButton } from "@/components/admin/ui/EditButton";
import PageHeader from "@/components/admin/ui/PageHeader";
import { useMotivosAtendimentoFilters } from "@/hooks/useSpecificFilters";
import { services } from "@/api";
import { useToast } from "@/components/admin/ui/ToastContainer";

const CadastroMotivosAtendimento = () => {
  const { showSuccess, showError } = useToast();
  const [localShowFilters, setLocalShowFilters] = useState(false);
  const isReloadingRef = useRef(false);

  const {
    filtrosPainel,
    filtrosAplicados,
    activeFiltersCount,
    handleFiltroChange,
    limparFiltros,
    aplicarFiltros,
    toggleFilters,
  } = useMotivosAtendimentoFilters();

  const fetchMotivos = useCallback(async () => {
    const params: Record<string, string> = {};
    if (filtrosAplicados.descricao)
      params.descricao = filtrosAplicados.descricao;
    if (filtrosAplicados.incluir_inativos === "true")
      params.incluir_inativos = "S";

    isReloadingRef.current = true;

    try {
      return await services.motivosAtendimentoService.getAll(params);
    } finally {
      setTimeout(() => {
        isReloadingRef.current = false;
      }, 500);
    }
  }, [filtrosAplicados]);

  const {
    data: motivosAtendimento,
    loading,
    refetch,
  } = useDataFetch<MotivoAtendimento[]>(fetchMotivos, [fetchMotivos]);

  useEffect(() => {
    if (isReloadingRef.current) {
      setLocalShowFilters(false);
    }
  }, [motivosAtendimento]);

  const handleApplyFilters = () => {
    setLocalShowFilters(false);
    isReloadingRef.current = true;
    aplicarFiltros();
  };

  const handleClearFilters = () => {
    setLocalShowFilters(false);
    isReloadingRef.current = true;
    limparFiltros();
  };

  const handleToggleFilters = () => {
    if (!isReloadingRef.current) {
      setLocalShowFilters(!localShowFilters);
    }
    toggleFilters();
  };

  const handleDelete = async (id: number) => {
    try {
      await services.motivosAtendimentoService.delete(id);
      setLocalShowFilters(false);
      isReloadingRef.current = true;
      await refetch();
      showSuccess(
        "Inativação realizada!",
        "Motivo de atendimento inativado com sucesso"
      );
    } catch (error) {
      console.error("Erro ao inativar motivo de atendimento:", error);
      showError("Erro ao inativar", error as Record<string, unknown>);
    } finally {
      setTimeout(() => {
        isReloadingRef.current = false;
      }, 500);
    }
  };

  if (loading) {
    return (
      <Loading
        fullScreen={true}
        preventScroll={false}
        text="Carregando motivos de atendimento..."
        size="large"
      />
    );
  }

  const columns = [
    {
      header: "Descrição",
      accessor: "descricao" as keyof MotivoAtendimento,
      render: (motivo: MotivoAtendimento) => (
        <div className="text-sm font-semibold text-gray-900">
          {motivo.descricao}
        </div>
      ),
    },
    {
      header: "Status",
      accessor: "situacao" as keyof MotivoAtendimento,
      render: (motivo: MotivoAtendimento) => (
        <TableStatusColumn status={motivo.situacao} />
      ),
    },
  ];

  const renderActions = (motivo: MotivoAtendimento) => (
    <div className="flex gap-2">
      <EditButton
        id={motivo.id}
        editRoute="/admin/cadastro/motivos_atendimentos/editar"
      />
      <DeleteButton
        id={motivo.id}
        onDelete={handleDelete}
        confirmText="Deseja realmente inativar este motivo de atendimento?"
        confirmTitle="Inativação de Motivo de Atendimento"
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
      placeholder: "Incluir atendimentos inativos",
    },
  ];

  const itemCount = Array.isArray(motivosAtendimento)
    ? motivosAtendimento.length
    : 0;

  return (
    <>
      <PageHeader
        title="Lista de Motivos de Atendimentos"
        config={{
          type: "list",
          itemCount: itemCount,
          onFilterToggle: handleToggleFilters,
          showFilters: localShowFilters,
          activeFiltersCount: activeFiltersCount,
          newButton: {
            label: "Novo Motivo",
            link: "/admin/cadastro/motivos_atendimentos/novo",
          },
        }}
      />
      <TableList
        title="Lista Motivos de Atendimento"
        items={motivosAtendimento || []}
        keyField="id"
        columns={columns}
        renderActions={renderActions}
        showFilter={localShowFilters}
        filterOptions={filterOptions}
        filterValues={filtrosPainel}
        onFilterChange={handleFiltroChange}
        onClearFilters={handleClearFilters}
        onApplyFilters={handleApplyFilters}
        onFilterToggle={handleToggleFilters}
      />
    </>
  );
};

export default CadastroMotivosAtendimento;
