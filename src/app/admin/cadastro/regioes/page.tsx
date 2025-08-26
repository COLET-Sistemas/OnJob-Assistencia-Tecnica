"use client";
import { Loading } from "@/components/LoadingPersonalizado";
import { TableList, TableStatusColumn } from "@/components/admin/common";
import { useTitle } from "@/context/TitleContext";
import { useDataFetch } from "@/hooks";
import type { Regiao } from "@/types/admin/cadastro/regioes";
import { useCallback, useEffect } from "react";
import { DeleteButton } from "@/components/admin/ui/DeleteButton";
import { EditButton } from "@/components/admin/ui/EditButton";
import PageHeader from "@/components/admin/ui/PageHeader";
import { useRegioesFilters } from "@/hooks/useSpecificFilters";
import { regioesAPI } from "@/api/api";
import { MapPin } from "lucide-react";
import { useToast } from "@/components/admin/ui/ToastContainer";

const CadastroRegioes = () => {
  const { setTitle } = useTitle();
  const { showSuccess, showError } = useToast();

  useEffect(() => {
    setTitle("Regiões");
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
  } = useRegioesFilters();

  const fetchRegioes = useCallback(async () => {
    const params: Record<string, string> = {};
    if (filtrosAplicados.nome) params.nome = filtrosAplicados.nome;
    if (filtrosAplicados.uf) params.uf = filtrosAplicados.uf;
    if (filtrosAplicados.atendida_empresa === "true") {
      params.atendida_empresa = "true";
    } else if (filtrosAplicados.atendida_empresa === "false") {
      params.atendida_empresa = "false";
    }
    if (filtrosAplicados.incluir_inativos === "true")
      params.incluir_inativos = "S";

    return await regioesAPI.getAll(params);
  }, [filtrosAplicados]);

  const {
    data: regioes,
    loading,
    refetch,
  } = useDataFetch<Regiao[]>(fetchRegioes, [fetchRegioes]);

  if (loading) {
    return (
      <Loading
        fullScreen={true}
        preventScroll={false}
        text="Carregando regiões..."
        size="large"
      />
    );
  }

  // Estado vazio customizado para regiões
  const emptyStateProps = {
    title: "Nenhuma região cadastrada",
    description: "Você ainda não possui regiões cadastradas no sistema.",
    icon: (
      <div className="bg-[var(--primary)]/5 p-5 rounded-full inline-flex mb-5 shadow-inner">
        <MapPin size={36} className="text-[var(--primary)]" />
      </div>
    ),
  };

  const columns = [
    {
      header: "Nome da Região",
      accessor: "nome" as keyof Regiao,
      render: (regiao: Regiao) => (
        <div className="text-sm font-medium text-gray-900 flex items-center gap-2.5">
          {regiao.nome}
        </div>
      ),
    },
    {
      header: "Descrição",
      accessor: "descricao" as keyof Regiao,
      render: (regiao: Regiao) => (
        <span
          className="text-sm text-gray-600 line-clamp-1"
          title={regiao.descricao}
        >
          {regiao.descricao || "-"}
        </span>
      ),
    },
    {
      header: "UF",
      accessor: "uf" as keyof Regiao,
      render: (regiao: Regiao) => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-[var(--secondary-yellow)]/10 text-[var(--dark-navy)] border border-[var(--secondary-yellow)]/20">
          {regiao.uf}
        </span>
      ),
    },
    {
      header: "Atendida",
      accessor: "atendida_empresa" as keyof Regiao,
      render: (regiao: Regiao) => (
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium ${
            regiao.atendida_empresa
              ? "bg-[var(--secondary-green)]/10 text-green-800 border border-green-200"
              : "bg-red-50 text-red-700 border border-red-100"
          }`}
        >
          {regiao.atendida_empresa ? "Sim" : "Não"}
        </span>
      ),
    },
    {
      header: "Status",
      accessor: "situacao" as keyof Regiao,
      render: (regiao: Regiao) => (
        <TableStatusColumn status={regiao.situacao} />
      ),
    },
  ];

  const handleDelete = async (id: number) => {
    try {
      const response = await regioesAPI.delete(id);
      await refetch();

      showSuccess(
        "Exclusão realizada!",
        response // Passa a resposta diretamente, o ToastContainer extrai a mensagem
      );
    } catch (error) {
      console.error("Erro ao excluir região:", error);

      showError(
        "Erro ao excluir",
        error as Record<string, unknown> // Passa o erro diretamente, o ToastContainer extrai a mensagem
      );
    }
  };

  const renderActions = (regiao: Regiao) => (
    <div className="flex gap-2">
      <EditButton id={regiao.id} editRoute="/admin/cadastro/regioes/editar" />
      <DeleteButton
        id={regiao.id}
        onDelete={handleDelete}
        confirmText="Deseja realmente excluir esta região?"
        confirmTitle="Exclusão de Região"
        itemName={`${regiao.nome}`}
      />
    </div>
  );

  const ufOptions = [
    { value: "", label: "Todas" },
    { value: "AC", label: "AC" },
    { value: "AL", label: "AL" },
    { value: "AP", label: "AP" },
    { value: "AM", label: "AM" },
    { value: "BA", label: "BA" },
    { value: "CE", label: "CE" },
    { value: "DF", label: "DF" },
    { value: "ES", label: "ES" },
    { value: "GO", label: "GO" },
    { value: "MA", label: "MA" },
    { value: "MT", label: "MT" },
    { value: "MS", label: "MS" },
    { value: "MG", label: "MG" },
    { value: "PA", label: "PA" },
    { value: "PB", label: "PB" },
    { value: "PR", label: "PR" },
    { value: "PE", label: "PE" },
    { value: "PI", label: "PI" },
    { value: "RJ", label: "RJ" },
    { value: "RN", label: "RN" },
    { value: "RS", label: "RS" },
    { value: "RO", label: "RO" },
    { value: "RR", label: "RR" },
    { value: "SC", label: "SC" },
    { value: "SP", label: "SP" },
    { value: "SE", label: "SE" },
    { value: "TO", label: "TO" },
  ];

  const filterOptions = [
    {
      id: "nome",
      label: "Nome",
      type: "text" as const,
      placeholder: "Buscar por nome...",
    },
    {
      id: "uf",
      label: "UF",
      type: "select" as const,
      options: ufOptions,
    },
    {
      id: "atendida_empresa",
      label: "Atendida pela empresa",
      type: "select" as const,
      options: [
        { value: "", label: "Todos" },
        { value: "true", label: "Sim" },
        { value: "false", label: "Não" },
      ],
    },
    {
      id: "incluir_inativos",
      label: "Incluir Inativos",
      type: "checkbox" as const,
      placeholder: "Incluir regiões inativas",
    },
  ];

  const itemCount = regioes ? regioes.length : 0;

  return (
    <>
      <PageHeader
        title="Lista de Regiões"
        config={{
          type: "list",
          itemCount: itemCount,
          onFilterToggle: toggleFilters,
          showFilters: showFilters,
          activeFiltersCount: activeFiltersCount,
          newButton: {
            label: "Nova Região",
            link: "/admin/cadastro/regioes/novo",
          },
        }}
      />
      <TableList
        title="Lista de Regiões"
        items={regioes || []}
        keyField="id"
        columns={columns}
        renderActions={renderActions}
        emptyStateProps={emptyStateProps}
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

export default CadastroRegioes;
