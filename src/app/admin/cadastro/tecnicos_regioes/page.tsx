"use client";
import { Loading } from "@/components/LoadingPersonalizado";
import { TableList } from "@/components/admin/common";
import { useTitle } from "@/context/TitleContext";
import { useDataFetch } from "@/hooks";
import { useEffect, useCallback } from "react";
import { DeleteButton } from "@/components/admin/ui/DeleteButton";
import { EditButton } from "@/components/admin/ui/EditButton";
import PageHeader from "@/components/admin/ui/PageHeader";
import { useUsuariosRegioesFilters } from "@/hooks/useSpecificFilters";
import { usuariosRegioesAPI, usuariosAPI, regioesAPI } from "@/api/api";
import { MapPin } from "lucide-react";

// Novo tipo refletindo o retorno da API
interface UsuarioComRegioes {
  id_usuario: number;
  nome_usuario: string;
  regioes: {
    id_regiao: number;
    nome_regiao: string;
    data_cadastro: string;
  }[];
}

interface OpcaoSelect {
  value: string;
  label: string;
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

  // Buscar lista de técnicos
  // Definindo tipo para usuário retornado pela API
  interface UsuarioAPI {
    id_usuario: number;
    nome_usuario: string;
    // outros campos se necessário
  }

  const { data: tecnicos, loading: loadingTecnicos } = useDataFetch<
    OpcaoSelect[]
  >(async () => {
    const res: UsuarioAPI[] = await usuariosAPI.getAll({
      incluir_inativos: "S",
      apenas_tecnicos: "S",
    });
    return res.map((u: UsuarioAPI) => ({
      value: String(u.id_usuario),
      label: u.nome_usuario,
    }));
  }, []);

  // Definindo tipo para região retornada pela API
  interface RegiaoAPI {
    id_regiao: number;
    nome_regiao: string;
    // outros campos se necessário
  }

  const { data: regioes, loading: loadingRegioes } = useDataFetch<
    OpcaoSelect[]
  >(async () => {
    const res: RegiaoAPI[] = await regioesAPI.getAll();
    return res.map((r: RegiaoAPI) => ({
      value: String(r.id_regiao),
      label: r.nome_regiao,
    }));
  }, []);

  const fetchUsuariosRegioes = useCallback(async () => {
    const params: Record<string, string> = {};
    if (filtrosAplicados.id_usuario) {
      params.id_usuario = filtrosAplicados.id_usuario;
    }
    if (filtrosAplicados.id_regiao) {
      params.id_regiao = filtrosAplicados.id_regiao;
    }
    return await usuariosRegioesAPI.getAll(params);
  }, [filtrosAplicados]);

  const {
    data: usuariosRegioes,
    loading,
    refetch,
  } = useDataFetch<UsuarioComRegioes[]>(fetchUsuariosRegioes, [
    fetchUsuariosRegioes,
  ]);

  if (loading || loadingTecnicos || loadingRegioes) {
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
      accessor: "nome_usuario" as keyof UsuarioComRegioes,
      render: (usuario: UsuarioComRegioes) => (
        <div className="text-sm font-semibold text-gray-900">
          {usuario.nome_usuario}
        </div>
      ),
    },
    {
      header: "Regiões",
      accessor: "regioes" as keyof UsuarioComRegioes,
      render: (usuario: UsuarioComRegioes) => (
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
  ];

  const handleDelete = async (id: number) => {
    try {
      await usuariosRegioesAPI.delete(id);
      await refetch();
    } catch {
      alert("Erro ao excluir usuário região.");
    }
  };

  const renderActions = (usuario: UsuarioComRegioes) => (
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

  // filtros agora são selects
  const filterOptions = [
    {
      id: "id_usuario",
      label: "Técnico",
      type: "select" as const,
      options: tecnicos ?? [],
      placeholder: "Selecione um técnico...",
    },
    {
      id: "id_regiao",
      label: "Região",
      type: "select" as const,
      options: regioes ?? [],
      placeholder: "Selecione uma região...",
    },
  ];

  // Ordena a lista por nome_usuario (case insensitive)
  const usuariosRegioesOrdenados = (usuariosRegioes ?? [])
    .slice()
    .sort((a, b) =>
      a.nome_usuario.localeCompare(b.nome_usuario, "pt-BR", {
        sensitivity: "base",
      })
    );

  const itemCount = usuariosRegioesOrdenados.length;

  return (
    <>
      <PageHeader
        title="Lista de Técninos X Regiões"
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
        items={usuariosRegioesOrdenados}
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
