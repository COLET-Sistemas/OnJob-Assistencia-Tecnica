"use client";
import { Loading } from "@/components/Loading";
import { TableList, TableStatusColumn } from "@/components/admin/common";
import { useTitle } from "@/context/TitleContext";
import { useDataFetch } from "@/hooks";
import type { MotivoAtendimento } from "@/types/admin/cadastro/motivos_atendimento";
import { useCallback, useEffect, useState } from "react";
import { DeleteButton } from "@/components/admin/ui/DeleteButton";
import { EditButton } from "@/components/admin/ui/EditButton";
import PageHeader from "@/components/admin/ui/PageHeader";

const CadastroMotivosAtendimento = () => {
  const { setTitle } = useTitle();

  useEffect(() => {
    setTitle("Motivos de Atendimento");
  }, [setTitle]);

  const [showFilters, setShowFilters] = useState(false);
  const [filtrosPainel, setFiltrosPainel] = useState<{
    descricao: string;
    incluir_inativos: string;
  }>({ descricao: "", incluir_inativos: "" });
  const [filtrosAplicados, setFiltrosAplicados] = useState<{
    descricao: string;
    incluir_inativos: string;
  }>({ descricao: "", incluir_inativos: "" });

  const handleFiltroChange = useCallback((campo: string, valor: string) => {
    setFiltrosPainel((prev) => ({ ...prev, [campo]: valor }));
  }, []);

  const limparFiltros = useCallback(() => {
    setFiltrosPainel({ descricao: "", incluir_inativos: "" });
  }, []);

  const aplicarFiltros = useCallback(() => {
    setFiltrosAplicados({ ...filtrosPainel });
    setShowFilters(false);
  }, [filtrosPainel]);

  const fetchMotivos = useCallback(async () => {
    const params: Record<string, string> = {};
    if (filtrosAplicados.descricao)
      params.descricao = filtrosAplicados.descricao;
    if (filtrosAplicados.incluir_inativos === "true")
      params.incluir_inativos = "S";
    return await import("@/api/api").then((mod) =>
      mod.default.get("/motivos_atendimento", { params })
    );
  }, [filtrosAplicados]);

  const {
    data: motivosAtendimento,
    loading,
    refetch,
  } = useDataFetch<MotivoAtendimento[]>(fetchMotivos, [fetchMotivos]);

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

  const handleDelete = async (id: number) => {
    try {
      await import("@/api/api").then((mod) =>
        mod.default.delete(`/motivos_atendimento?id=${id}`)
      );
      await refetch();
    } catch {
      alert("Erro ao excluir motivo.");
    }
  };

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
    },
  ];

  const activeFiltersCount =
    Object.values(filtrosAplicados).filter(Boolean).length;

  const itemCount = motivosAtendimento ? motivosAtendimento.length : 0;

  return (
    <>
      <PageHeader
        title="Motivos de Atendimentos"
        config={{
          type: "list",
          itemCount: itemCount,
          onFilterToggle: () => setShowFilters(!showFilters),
          showFilters: showFilters,
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
        showFilter={showFilters}
        filterOptions={filterOptions}
        filterValues={filtrosPainel}
        onFilterChange={handleFiltroChange}
        onClearFilters={limparFiltros}
        onApplyFilters={aplicarFiltros}
        onFilterToggle={() => setShowFilters(!showFilters)}
      />
    </>
  );
};

export default CadastroMotivosAtendimento;
