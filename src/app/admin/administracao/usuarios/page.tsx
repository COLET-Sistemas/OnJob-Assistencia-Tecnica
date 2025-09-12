"use client";
import { Loading } from "@/components/LoadingPersonalizado";
import { TableList, TableStatusColumn } from "@/components/admin/common";
import { useDataFetch } from "@/hooks";
import { Usuario } from "@/types/admin/cadastro/usuarios";
import { useCallback } from "react";
import { useToast } from "@/components/admin/ui/ToastContainer";
import { DeleteButton } from "@/components/admin/ui/DeleteButton";
import { EditButton } from "@/components/admin/ui/EditButton";
import { ResetPasswordButton } from "@/components/admin/ui/ResetPasswordButton";
import PageHeader from "@/components/admin/ui/PageHeader";
import { useFilters } from "@/hooks/useFilters";
import { usuariosService as usuariosAPI } from "@/api/services/usuariosService";
import { Mail, ShieldCheck } from "lucide-react";

// Interface dos filtros específicos para usuários
interface UsuariosFilters {
  [key: string]: string;
  nome: string;
  login: string;
  email: string;
  incluir_inativos: string;
  apenas_tecnicos: string;
}

const INITIAL_USUARIOS_FILTERS: UsuariosFilters = {
  nome: "",
  login: "",
  email: "",
  incluir_inativos: "",
  apenas_tecnicos: "",
};

const CadastroUsuario = () => {
  const { showSuccess, showError } = useToast();

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
    if (filtrosAplicados.apenas_tecnicos === "true")
      params.apenas_tecnicos = "S";

    try {
      const response = await usuariosAPI.getAll(params);

      // Se response é o próprio array (como no exemplo do usuário)
      if (Array.isArray(response)) {
        return response;
      }

      // Se response tem o formato { dados: Usuario[] } (como definido no service)
      if (response && response.dados) {
        return response.dados;
      }

      // Fallback para array vazio se a resposta não estiver no formato esperado
      return [];
    } catch (error) {
      console.error("Erro ao buscar usuários:", error);
      return [];
    }
  }, [filtrosAplicados]);

  const {
    data: usuarios,
    loading,
    refetch,
    updateData,
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
      header: "Senha",
      accessor: "senha_provisoria" as keyof Usuario,
      render: (usuario: Usuario) => (
        <>
          {usuario.senha_provisoria ? (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-medium bg-yellow-100 text-yellow-800">
              Provisória
            </span>
          ) : (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-medium bg-green-100 text-green-800">
              Definitiva
            </span>
          )}
        </>
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

      showSuccess("Inativação realizada!", "Usuário inativado com sucesso.");
    } catch (error) {
      console.error("Erro ao inativar usuário:", error);

      showError("Erro ao inativar", error as Record<string, unknown>);
    }
  };

  // Função para atualizar um usuário específico na lista
  const updateUserInList = (userId: number, updates: Partial<Usuario>) => {
    if (!usuarios) return;

    const updatedUsuarios = usuarios.map((user) => {
      if (user.id === userId) {
        return { ...user, ...updates };
      }
      return user;
    });

    // Força uma atualização da interface sem realizar uma nova chamada à API
    // Isso substitui os dados no hook useDataFetch sem fazer um novo GET
    updateData(updatedUsuarios);
  };

  const renderActions = (usuario: Usuario) => (
    <div className="flex gap-2">
      <EditButton
        id={usuario.id}
        editRoute="/admin/administracao/usuarios/editar"
      />
      <DeleteButton
        id={usuario.id}
        onDelete={handleDelete}
        confirmText="Deseja realmente inativar este usuário?"
        confirmTitle="Inativação de Usuário"
        itemName={`${usuario.nome} (${usuario.login})`}
      />
      <ResetPasswordButton
        id={usuario.id}
        userName={usuario.nome}
        userLogin={usuario.login}
        onUpdateUser={(updates) => updateUserInList(usuario.id, updates)}
      />
    </div>
  );

  const filterOptions = [
    {
      id: "incluir_inativos",
      label: "Incluir Inativos",
      type: "checkbox" as const,
      placeholder: "Incluir usuários inativos",
    },
    {
      id: "apenas_tecnicos",
      label: "Apenas Técnicos",
      type: "checkbox" as const,
      placeholder: "Mostrar apenas usuários técnicos",
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
            link: "/admin/administracao/usuarios/novo",
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
