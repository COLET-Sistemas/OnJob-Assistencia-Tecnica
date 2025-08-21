"use client";
import { Loading } from "@/components/LoadingPersonalizado";
import { TableList } from "@/components/admin/common";
import { useTitle } from "@/context/TitleContext";
import { useDataFetch } from "@/hooks";
import type { UsuarioRegiao } from "@/types/admin/cadastro/usuarios";
import { useCallback, useEffect } from "react";
import { DeleteButton } from "@/components/admin/ui/DeleteButton";
import { EditButton } from "@/components/admin/ui/EditButton";
import PageHeader from "@/components/admin/ui/PageHeader";
import { useUsuariosRegioesFilters } from "@/hooks/useSpecificFilters";
import { usuariosRegioesAPI } from "@/api/api";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar, MapPin } from "lucide-react";

// Define a type for the grouped user with regions
interface UsuarioAgrupado extends UsuarioRegiao {
  regioes: { id_regiao: number; nome_regiao: string }[];
}

const CadastroUsuariosRegioes = () => {
  const { setTitle } = useTitle();

  useEffect(() => {
    setTitle("Técnicos X Regiões");
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
  } = useUsuariosRegioesFilters();

  // Função para formatar a data
  const formatarData = (dataString: string) => {
    try {
      const data = parseISO(dataString);
      return format(data, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
    } catch {
      return dataString;
    }
  };

  const fetchUsuariosRegioes = useCallback(async () => {
    const params: Record<string, string> = {};
    if (filtrosAplicados.nome_usuario)
      params.nome_usuario = filtrosAplicados.nome_usuario;
    if (filtrosAplicados.nome_regiao)
      params.nome_regiao = filtrosAplicados.nome_regiao;
    if (filtrosAplicados.incluir_inativos) params.incluir_inativos = "S";
    return await usuariosRegioesAPI.getAll(params);
  }, [filtrosAplicados]);

  const {
    data: usuariosRegioes,
    loading,
    refetch,
  } = useDataFetch<UsuarioRegiao[]>(fetchUsuariosRegioes, [
    fetchUsuariosRegioes,
  ]);

  const usuariosAgrupados = usuariosRegioes
    ? usuariosRegioes.reduce(
        (
          acc: {
            [key: number]: UsuarioAgrupado;
          },
          item: UsuarioRegiao
        ) => {
          if (!acc[item.id_usuario]) {
            acc[item.id_usuario] = {
              ...item,
              regioes: [
                { id_regiao: item.id_regiao, nome_regiao: item.nome_regiao },
              ],
            };
          } else {
            acc[item.id_usuario].regioes.push({
              id_regiao: item.id_regiao,
              nome_regiao: item.nome_regiao,
            });
          }
          return acc;
        },
        {}
      )
    : {};

  if (loading) {
    return (
      <Loading
        fullScreen={true}
        preventScroll={false}
        text="Carregando técnicos x regiões..."
        size="large"
      />
    );
  }

  const columns = [
    {
      header: "Usuário",
      accessor: "nome_usuario" as keyof UsuarioAgrupado,
      render: (usuario: UsuarioAgrupado) => (
        <div className="text-sm font-semibold text-gray-900">
          {usuario.nome_usuario}
        </div>
      ),
    },
    {
      header: "Regiões",
      accessor: "regioes" as keyof UsuarioAgrupado,
      render: (usuario: UsuarioAgrupado) => (
        <div className="flex flex-wrap gap-2">
          {usuario.regioes.map((regiao) => (
            <span
              key={`${usuario.id_usuario}-${regiao.id_regiao}`}
              className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-medium bg-[var(--secondary-yellow)]/20 text-[var(--dark-navy)] border border-[var(--secondary-yellow)]/30"
            >
              <MapPin
                size={14}
                className="mr-1 text-[var(--secondary-yellow)]"
              />
              {regiao.nome_regiao}
            </span>
          ))}
        </div>
      ),
    },
    {
      header: "Data de Cadastro",
      accessor: "data_cadastro" as keyof UsuarioAgrupado,
      render: (usuario: UsuarioAgrupado) => (
        <div className="text-sm text-[var(--neutral-graphite)] flex items-center gap-1.5">
          <Calendar size={16} className="text-[var(--primary)]" />
          {formatarData(usuario.data_cadastro)}
        </div>
      ),
    },
  ];

  const handleDelete = async (id: number) => {
    try {
      await usuariosRegioesAPI.delete(id);
      await refetch();
    } catch {
      alert("Erro ao excluir usuário região.");
    }
  };

  const renderActions = (usuario: UsuarioAgrupado) => (
    <div className="flex gap-2">
      <EditButton
        id={usuario.id_usuario}
        editRoute="/admin/cadastro/usuarios_regioes/editar"
      />
      <DeleteButton
        id={usuario.id_usuario}
        onDelete={handleDelete}
        confirmText="Deseja realmente excluir este usuário região?"
        confirmTitle="Exclusão de Usuário Região"
        itemName={`${usuario.nome_usuario}`}
      />
    </div>
  );

  const filterOptions = [
    {
      id: "nome_usuario",
      label: "Nome do Usuário",
      type: "text" as const,
      placeholder: "Buscar por nome do usuário...",
    },
    {
      id: "nome_regiao",
      label: "Nome da Região",
      type: "text" as const,
      placeholder: "Buscar por nome da região...",
    },
    {
      id: "incluir_inativos",
      label: "Incluir Inativos",
      type: "checkbox" as const,
    },
  ];

  const itemCount = Object.keys(usuariosAgrupados).length;

  return (
    <>
      <PageHeader
        title="Lista de Técninos Xs Regiões"
        config={{
          type: "list",
          itemCount: itemCount,
          onFilterToggle: toggleFilters,
          showFilters: showFilters,
          activeFiltersCount: activeFiltersCount,
          newButton: {
            label: "Novo Usuário Região",
            link: "/admin/cadastro/usuarios_regioes/novo",
          },
        }}
      />
      <TableList
        title="Lista de Técnicos X Regiões"
        items={Object.values(usuariosAgrupados) as UsuarioAgrupado[]}
        keyField="id_usuario"
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

export default CadastroUsuariosRegioes;
