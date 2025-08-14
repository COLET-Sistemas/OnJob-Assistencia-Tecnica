"use client";
import { Loading } from "@/components/Loading";
import {
  ActionButton,
  ListHeader,
  TableList,
  TableStatusColumn,
} from "@/components/admin/common";
import { useTitle } from "@/context/TitleContext";
import { useDataFetch } from "@/hooks";
import type { MotivoPendencia } from "@/types/admin/cadastro/motivos_pendencia";
import { Edit2, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

const CadastroMotivosPendencia = () => {
  const { setTitle } = useTitle();

  useEffect(() => {
    setTitle("Motivos de Pendência");
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

    const api = (await import("@/api/api")).default;
    let dados: MotivoPendencia[] = await api.get("/motivos_pendencia_os", {
      params,
    });
    if (!Array.isArray(dados)) {
      if (typeof dados === "object" && dados !== null) {
        dados = Object.values(dados);
      } else {
        dados = [];
      }
    }
    return dados;
  }, [filtrosAplicados]);

  const {
    data: motivos,
    loading,
    refetch,
  } = useDataFetch<MotivoPendencia[]>(fetchMotivos, [fetchMotivos]);
  const [deletingId, setDeletingId] = useState<number | null>(null);

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
    if (!window.confirm("Tem certeza que deseja excluir este motivo?")) return;
    setDeletingId(id);
    try {
      await import("@/api/api").then((mod) =>
        mod.default.delete(`/motivos_pendencia_os?id=${id}`)
      );
      await refetch();
    } catch {
      alert("Erro ao excluir motivo.");
    } finally {
      setDeletingId(null);
    }
  };

  const renderActions = (motivo: MotivoPendencia) => (
    <div className="flex gap-2">
      <ActionButton
        href={`/admin/cadastro/motivos_pendencias/editar/${motivo.id}`}
        icon={<Edit2 size={14} />}
        label="Editar"
        variant="secondary"
      />
      <ActionButton
        onClick={() => handleDelete(motivo.id)}
        icon={<Trash2 size={14} />}
        label={deletingId === motivo.id ? "Excluindo..." : "Excluir"}
        variant="secondary"
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

  return (
    <TableList
      title="Lista Motivos de Pendência"
      items={motivos || []}
      keyField="id"
      columns={columns}
      renderActions={renderActions}
      newItemLink="/admin/cadastro/motivos_pendencias/novo"
      newItemLabel="Novo Motivo"
      showFilter={showFilters}
      filterOptions={filterOptions}
      filterValues={filtrosPainel}
      onFilterChange={handleFiltroChange}
      onClearFilters={limparFiltros}
      onApplyFilters={aplicarFiltros}
      onFilterToggle={() => setShowFilters(!showFilters)}
      customHeader={
        <ListHeader
          title="Lista Motivos de Pendência"
          itemCount={motivos?.length || 0}
          onFilterToggle={() => setShowFilters(!showFilters)}
          showFilters={showFilters}
          newButtonLink="/admin/cadastro/motivos_pendencias/novo"
          newButtonLabel="Novo Motivo"
          activeFiltersCount={activeFiltersCount}
        />
      }
    />
  );
};

export default CadastroMotivosPendencia;
