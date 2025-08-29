"use client";
import { Loading } from "@/components/LoadingPersonalizado";
import { TableList, TableStatusColumn } from "@/components/admin/common";
import { useTitle } from "@/context/TitleContext";
import { useDataFetch } from "@/hooks";
import type { MotivoAtendimento } from "@/types/admin/cadastro/motivos_atendimento";
import { useCallback, useEffect, useState, useRef } from "react";
import { DeleteButton } from "@/components/admin/ui/DeleteButton";
import { EditButton } from "@/components/admin/ui/EditButton";
import PageHeader from "@/components/admin/ui/PageHeader";
import { useMotivosFilters } from "@/hooks/useSpecificFilters";
import { motivosAtendimentoAPI } from "@/api/api";
import { useToast } from "@/components/admin/ui/ToastContainer";

const CadastroMotivosAtendimento = () => {
  const { setTitle } = useTitle();
  const { showSuccess, showError } = useToast();
  // Adicionar um estado local para controlar a visibilidade do filtro
  const [localShowFilters, setLocalShowFilters] = useState(false);
  // Ref para evitar que o menu reabra durante o recarregamento
  const isReloadingRef = useRef(false);

  useEffect(() => {
    setTitle("Motivos de Atendimentos");
  }, [setTitle]);

  const {
    filtrosPainel,
    filtrosAplicados,
    activeFiltersCount,
    handleFiltroChange,
    limparFiltros,
    aplicarFiltros,
    toggleFilters,
  } = useMotivosFilters();

  // Remova este effect pois queremos controlar o estado local independentemente
  // useEffect(() => {
  //   setLocalShowFilters(showFilters);
  // }, [showFilters]);

  const fetchMotivos = useCallback(async () => {
    const params: Record<string, string> = {};
    if (filtrosAplicados.descricao)
      params.descricao = filtrosAplicados.descricao;
    if (filtrosAplicados.incluir_inativos === "true")
      params.incluir_inativos = "S";

    // Marcar que estamos recarregando
    isReloadingRef.current = true;

    try {
      return await motivosAtendimentoAPI.getAll(params);
    } finally {
      // Depois de recarregar, permitir mudanças no estado do menu
      setTimeout(() => {
        isReloadingRef.current = false;
      }, 500); // pequeno delay para garantir que a renderização aconteça primeiro
    }
  }, [filtrosAplicados]);

  const {
    data: motivosAtendimento,
    loading,
    refetch,
  } = useDataFetch<MotivoAtendimento[]>(fetchMotivos, [fetchMotivos]);

  // Effect para garantir que o menu permaneça fechado durante o recarregamento
  useEffect(() => {
    if (isReloadingRef.current) {
      setLocalShowFilters(false);
    }
  }, [motivosAtendimento]);

  // Funções de filtro modificadas para usar estado local
  const handleApplyFilters = () => {
    setLocalShowFilters(false); // Fecha o menu localmente
    isReloadingRef.current = true; // Marca que vamos recarregar
    aplicarFiltros(); // Aplica os filtros através do hook
  };

  const handleClearFilters = () => {
    setLocalShowFilters(false); // Fecha o menu localmente
    isReloadingRef.current = true; // Marca que vamos recarregar
    limparFiltros(); // Limpa os filtros através do hook
  };

  const handleToggleFilters = () => {
    if (!isReloadingRef.current) {
      setLocalShowFilters(!localShowFilters); // Toggle local apenas se não estiver recarregando
    }
    toggleFilters(); // Toggle através do hook
  };

  const handleDelete = async (id: number) => {
    try {
      const response = await motivosAtendimentoAPI.delete(id);
      setLocalShowFilters(false); // Garante que o menu esteja fechado após a exclusão
      isReloadingRef.current = true; // Marca que vamos recarregar
      await refetch();
      showSuccess("Inativação realizada!", response);
    } catch (error) {
      console.error("Erro ao excluir motivo de atendimento:", error);
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
        confirmText="Deseja realmente excluir este motivo de atendimento?"
        confirmTitle="Exclusão de Motivo de Atendimento"
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

  const itemCount = motivosAtendimento ? motivosAtendimento.length : 0;

  return (
    <>
      <PageHeader
        title="Lista de Motivos de Atendimentos"
        config={{
          type: "list",
          itemCount: itemCount,
          onFilterToggle: handleToggleFilters,
          showFilters: localShowFilters, // Use o estado local para controlar a visibilidade
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
        showFilter={localShowFilters} // Use o estado local para controlar a visibilidade
        filterOptions={filterOptions}
        filterValues={filtrosPainel}
        onFilterChange={handleFiltroChange}
        onClearFilters={handleClearFilters} // Use a função local modificada
        onApplyFilters={handleApplyFilters} // Use a função local modificada
        onFilterToggle={handleToggleFilters} // Use a função local modificada
      />
    </>
  );
};

export default CadastroMotivosAtendimento;
