"use client";
import { regioesAPI } from "@/api/api";
import { Loading } from "@/components/Loading";
import {
  ActionButton,
  TableList,
  TableStatusColumn,
  FilterPanel,
} from "@/components/admin/common";
import ListHeader from "@/components/admin/common/ListHeader";
import { useTitle } from "@/context/TitleContext";
import { useDataFetch } from "@/hooks";
import type { Regiao } from "@/types/admin/cadastro/regioes";
import { Edit2, MapPin, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

const CadastroRegioes = () => {
  const { setTitle } = useTitle();
  // Estado para controle de exclusão
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Configurar o título da página
  useEffect(() => {
    setTitle("Regiões");
  }, [setTitle]);

  // Filtros
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [filters, setFilters] = useState({
    nome: "",
    uf: "",
    atendida_empresa: "", // "" = Todos, "true" = Sim, "false" = Não
    incluir_inativos: "",
  });
  // Estado para controle de exclusão
  // Estado para filtros aplicados
  const [appliedFilters, setAppliedFilters] = useState({
    nome: "",
    uf: "",
    atendida_empresa: "", // "" = Todos, "true" = Sim, "false" = Não
    incluir_inativos: "",
  });

  // Função para buscar dados com filtros
  const fetchRegioes = () => {
    const params: Record<string, string> = {};
    if (appliedFilters.nome) params.nome = appliedFilters.nome;
    if (appliedFilters.uf) params.uf = appliedFilters.uf;
    if (appliedFilters.atendida_empresa === "true") {
      params.atendida_empresa = "true";
    } else if (appliedFilters.atendida_empresa === "false") {
      params.atendida_empresa = "false";
    }
    // Só aplica incluir_inativos se o filtro estiver ativo
    if (appliedFilters.incluir_inativos === "true") {
      params.incluir_inativos = "S";
    }
    return regioesAPI.getAll(params);
  };

  const { data: regioes, loading } = useDataFetch<Regiao[]>(fetchRegioes, [
    appliedFilters,
  ]);
  // UFs para o select (pode ser ajustado conforme necessário)
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

  // Opções de filtro para o FilterPanel
  const filterOptions = [
    {
      id: "nome",
      label: "Nome",
      type: "text" as const,
      placeholder: "Filtrar por nome",
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
      label: "Incluir inativos",
      type: "checkbox" as const,
    },
  ];
  // Renderizar painel de filtros
  const renderFilterPanel = () =>
    showFilterPanel && (
      <FilterPanel
        title="Filtros"
        pageName="Regiões"
        filterOptions={filterOptions}
        filterValues={filters}
        onFilterChange={(key, value) =>
          setFilters((f) => ({ ...f, [key]: value }))
        }
        onClearFilters={() =>
          setFilters({
            nome: "",
            uf: "",
            atendida_empresa: "",
            incluir_inativos: "",
          })
        }
        onClose={() => setShowFilterPanel(false)}
        onApplyFilters={() => setAppliedFilters(filters)}
      />
    );

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

  // Definir as colunas da tabela
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
      header: "Situação",
      accessor: "situacao" as keyof Regiao,
      render: (regiao: Regiao) => (
        <TableStatusColumn
          status={regiao.situacao}
          mapping={{
            A: {
              label: "Ativo",
              className:
                "bg-[var(--secondary-green)]/10 text-green-800 border border-green-200",
            },
            I: {
              label: "Inativo",
              className: "bg-red-50 text-red-700 border border-red-100",
            },
          }}
        />
      ),
    },
    {
      header: "Data Cadastro",
      accessor: "data_cadastro" as keyof Regiao,
      render: (regiao: Regiao) => (
        <span className="text-xs text-gray-500">
          {regiao.data_cadastro
            ? regiao.data_cadastro.replace(/:\d{2}$/, "")
            : "-"}
        </span>
      ),
    },
  ];

  // Estado para controle de exclusão

  // Função para deletar região
  const handleDelete = async (id: number) => {
    if (!window.confirm("Tem certeza que deseja excluir esta região?")) return;
    setDeletingId(id);
    try {
      await import("@/api/api").then((mod) =>
        mod.default.delete(`/regioes?id=${id}`)
      );
      // Atualiza a lista após exclusão
      window.location.reload();
    } catch {
      alert("Erro ao excluir região.");
    } finally {
      setDeletingId(null);
    }
  };

  // Renderizar as ações para cada item
  const renderActions = (regiao: Regiao) => (
    <div className="flex gap-2">
      <ActionButton
        href={`/admin/cadastro/regioes/editar/${regiao.id}`}
        icon={<Edit2 size={14} />}
        label="Editar"
        variant="secondary"
      />
      <ActionButton
        onClick={() => handleDelete(regiao.id)}
        icon={<Trash2 size={14} />}
        label={deletingId === regiao.id ? "Excluindo..." : "Excluir"}
        variant="secondary"
      />
    </div>
  );

  // Contar filtros ativos (exceto os vazios)
  const activeFiltersCount = Object.values(filters).filter(
    (value) => value && value !== ""
  ).length;

  return (
    <>
      {renderFilterPanel()}
      <TableList
        title="Lista de Regiões"
        items={regioes || []}
        keyField="id"
        columns={columns}
        renderActions={renderActions}
        emptyStateProps={emptyStateProps}
        customHeader={
          <ListHeader
            title="Lista de Regiões"
            itemCount={regioes?.length || 0}
            onFilterToggle={() => setShowFilterPanel((v) => !v)}
            showFilters={showFilterPanel}
            newButtonLink="/admin/cadastro/regioes/novo"
            newButtonLabel="Nova Região"
            activeFiltersCount={activeFiltersCount}
          />
        }
      />
    </>
  );
};

export default CadastroRegioes;
