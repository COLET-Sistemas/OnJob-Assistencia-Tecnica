"use client";
import { Loading } from "@/components/LoadingPersonalizado";
import { TableList, TableStatusColumn } from "@/components/admin/common";
import { useTitle } from "@/context/TitleContext";
import { useDataFetch } from "@/hooks";
import { Usuario } from "@/types/admin/cadastro/usuarios";
import { useCallback, useEffect } from "react";
import { DeleteButton } from "@/components/admin/ui/DeleteButton";
import { EditButton } from "@/components/admin/ui/EditButton";
import PageHeader from "@/components/admin/ui/PageHeader";
import { useFilters } from "@/hooks/useFilters";
import { usuariosAPI } from "@/api/api";
import { Mail, ShieldCheck } from "lucide-react";

// Interface dos filtros específicos para usuários
interface UsuariosFilters {
  [key: string]: string;
  nome: string;
  login: string;
  email: string;
  incluir_inativos: string;
}

const INITIAL_USUARIOS_FILTERS: UsuariosFilters = {
  nome: "",
  login: "",
  email: "",
  incluir_inativos: "",
};

const CadastroUsuario = () => {
  const { setTitle } = useTitle();

  useEffect(() => {
    setTitle("Usuários");
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
  } = useFilters(INITIAL_USUARIOS_FILTERS);

  const fetchUsuarios = useCallback(async () => {
    const params: Record<string, string> = {};
    if (filtrosAplicados.nome) params.nome = filtrosAplicados.nome;
    if (filtrosAplicados.login) params.login = filtrosAplicados.login;
    if (filtrosAplicados.email) params.email = filtrosAplicados.email;
    if (filtrosAplicados.incluir_inativos === "true")
      params.incluir_inativos = "S";

    return await usuariosAPI.getAll(params);
  }, [filtrosAplicados]);

  const {
    data: usuarios,
    loading,
    refetch,
  } = useDataFetch<Usuario[]>(fetchUsuarios, [fetchUsuarios]);

  if (loading) {
    return (
      <Loading
        fullScreen={true}
        preventScroll={false}
        text="Carregando usuários..."
        size="large"
      />
    );
  }

  const columns = [
    {
      header: "Login",
      accessor: "login" as keyof Usuario,
      render: (usuario: Usuario) => (
        <div className="text-sm font-semibold text-gray-900">
          {usuario.login}
        </div>
      ),
    },
    {
      header: "Nome",
      accessor: "nome" as keyof Usuario,
      render: (usuario: Usuario) => (
        <div className="text-sm font-medium text-gray-700">{usuario.nome}</div>
      ),
    },
    {
      header: "Email",
      accessor: "email" as keyof Usuario,
      render: (usuario: Usuario) => (
        <div className="text-sm text-[var(--neutral-graphite)] flex items-center gap-1.5">
          <Mail size={16} className="text-[var(--primary)]" />
          {usuario.email}
        </div>
      ),
    },
    {
      header: "Perfis",
      accessor: "perfil_interno" as keyof Usuario,
      render: (usuario: Usuario) => (
        <div className="flex flex-wrap gap-1.5">
          {usuario.perfil_interno && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-medium bg-blue-100 text-blue-800">
              Interno
            </span>
          )}
          {usuario.perfil_gestor_assistencia && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-medium bg-purple-100 text-purple-800">
              Gestor
            </span>
          )}
          {usuario.perfil_tecnico_proprio && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-medium bg-green-100 text-green-800">
              Técnico próprio
            </span>
          )}
          {usuario.perfil_tecnico_terceirizado && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-medium bg-amber-100 text-amber-800">
              Técnico terceirizado
            </span>
          )}
          {usuario.administrador && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-medium bg-red-100 text-red-800 gap-1">
              <ShieldCheck size={12} />
              Admin
            </span>
          )}
        </div>
      ),
    },
    {
      header: "Status",
      accessor: "situacao" as keyof Usuario,
      render: (usuario: Usuario) => (
        <TableStatusColumn status={usuario.situacao} />
      ),
    },
  ];

  const handleDelete = async (id: number) => {
    try {
      await usuariosAPI.delete(id);
      await refetch();
    } catch {
      alert("Erro ao excluir usuário.");
    }
  };

  const renderActions = (usuario: Usuario) => (
    <div className="flex gap-2">
      <EditButton id={usuario.id} editRoute="/admin/cadastro/usuarios/editar" />
      <DeleteButton
        id={usuario.id}
        onDelete={handleDelete}
        confirmText="Deseja realmente excluir este usuário?"
        confirmTitle="Exclusão de Usuário"
        itemName={`${usuario.nome} (${usuario.login})`}
      />
    </div>
  );

  const filterOptions = [
    {
      id: "nome",
      label: "Nome",
      type: "text" as const,
      placeholder: "Buscar por nome...",
    },
    {
      id: "login",
      label: "Login",
      type: "text" as const,
      placeholder: "Buscar por login...",
    },
    {
      id: "email",
      label: "Email",
      type: "text" as const,
      placeholder: "Buscar por email...",
    },
    {
      id: "incluir_inativos",
      label: "Incluir Inativos",
      type: "checkbox" as const,
      placeholder: "Incluir usuários inativos",
    },
  ];

  const itemCount = usuarios ? usuarios.length : 0;

  return (
    <>
      <PageHeader
        title="Lista de Usuários"
        config={{
          type: "list",
          itemCount: itemCount,
          onFilterToggle: toggleFilters,
          showFilters: showFilters,
          activeFiltersCount: activeFiltersCount,
          newButton: {
            label: "Novo Usuário",
            link: "/admin/cadastro/usuarios/novo",
          },
        }}
      />
      <TableList
        title="Lista de Usuários"
        items={usuarios || []}
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

export default CadastroUsuario;
