"use client";
import { Loading } from "@/components/LoadingPersonalizado";
import { TableList, TableStatusColumn } from "@/components/admin/common";
import AdminAuthGuard from "@/components/admin/common/AdminAuthGuard";
import { useDataFetch } from "@/hooks";
import { Usuario } from "@/types/admin/cadastro/usuarios";
import { useCallback } from "react";
import { useToast } from "@/components/admin/ui/ToastContainer";
import { DeleteButton } from "@/components/admin/ui/DeleteButton";
import { EditButton } from "@/components/admin/ui/EditButton";
import { ResetPasswordButton } from "@/components/admin/ui/ResetPasswordButton";
import { ActivateButton } from "@/components/admin/ui/ActivateButton";
import PageHeader from "@/components/admin/ui/PageHeader";
import { useFilters } from "@/hooks/useFilters";
import { usuariosService as usuariosAPI } from "@/api/services/usuariosService";
import { ShieldCheck } from "lucide-react";

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
        <div className="flex flex-col leading-tight">
          <span className="text-sm font-semibold text-gray-900">
            {usuario.login}
          </span>
        </div>
      ),
    },
    // Coluna 1 — Acessos (Nome em cima, Email embaixo)
    {
      header: "Acessos",
      accessor: "nome" as keyof Usuario,
      render: (usuario: Usuario) => (
        <div className="flex flex-col leading-tight">
          <span className="text-sm font-semibold text-gray-900 pb-1">
            {usuario.nome}
          </span>
          <span className="text-xs text-[var(--neutral-graphite)] flex items-center gap-1.5">
            {usuario.email || "-"}
          </span>
        </div>
      ),
    },

    // Coluna 2 — Perfis (mantém badges)
    {
      header: "Perfis",
      accessor: "perfil_interno" as keyof Usuario,
      render: (usuario: Usuario) => (
        <div className="flex flex-wrap gap-1.5">
          {/* ADMIN */}
          {usuario.administrador && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-medium bg-purple-100 text-purple-800 gap-1">
              <ShieldCheck size={12} />
              Admin
            </span>
          )}

          {/* GESTOR */}
          {usuario.perfil_gestor_assistencia && (
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-medium gap-1 ${
                usuario.permite_cadastros
                  ? "bg-green-100 text-green-800"
                  : "bg-red-100 text-red-800"
              }`}
            >
              Gestor
            </span>
          )}

          {/* INTERNO */}
          {usuario.perfil_interno && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-medium bg-blue-100 text-blue-800">
              Interno
            </span>
          )}

          {/* TÉCNICO PRÓPRIO */}
          {usuario.perfil_tecnico_proprio && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-medium bg-gray-200 text-gray-800">
              Técn Próprio
            </span>
          )}

          {/* TÉCNICO TERCEIRIZADO */}
          {usuario.perfil_tecnico_terceirizado && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-medium bg-amber-100 text-amber-800">
              Técn Terceirizado
            </span>
          )}
        </div>
      ),
    },

    // Coluna 3 — Atividade (Último login em cima, Qtd embaixo)
    {
      header: "Atividade",
      accessor: "ultimo_login" as keyof Usuario,
      render: (usuario: Usuario) => (
        <div className="flex flex-col items-start leading-tight">
          <span className="text-sm text-gray-700">
            {usuario.ultimo_login ?? "-"}
          </span>
          <span className="text-xs text-gray-500">
            {typeof usuario.qtd_logins === "number"
              ? `${usuario.qtd_logins} logins`
              : "-"}
          </span>
        </div>
      ),
    },

    // Coluna 4 — Status (Situação em cima, Senha provisória embaixo se houver)
    {
      header: "SITUAÇÃO",
      accessor: "situacao" as keyof Usuario,
      render: (usuario: Usuario) => (
        <div className="flex flex-col gap-1 leading-tight">
          <span className="status-badge">
            <TableStatusColumn status={String(usuario.situacao)} />
          </span>
          {usuario.senha_provisoria ? (
            <span className="inline-flex w-fit items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-yellow-100 text-yellow-800">
              Senha provisória
            </span>
          ) : null}
        </div>
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

  // Nova função para ativar usuário
  const handleActivate = async (id: number) => {
    try {
      await usuariosAPI.activate(id);
      await refetch();

      showSuccess("Ativação realizada!", "Usuário ativado com sucesso.");
    } catch (error) {
      console.error("Erro ao ativar usuário:", error);

      showError("Erro ao ativar", error as Record<string, unknown>);
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

    updateData(updatedUsuarios);
  };

  const renderActions = (usuario: Usuario) => (
    <div className="flex gap-2">
      <EditButton
        id={usuario.id}
        editRoute="/admin/administracao/usuarios/editar"
        requiresPermission={false}
      />

      {/* Renderizar botão de inativar/ativar baseado no status do usuário */}
      {usuario.situacao === "A" ? (
        // Usuário ativo - mostrar botão de inativar
        <DeleteButton
          id={usuario.id}
          onDelete={handleDelete}
          confirmText="Deseja realmente inativar este usuário?"
          confirmTitle="Inativação de Usuário"
          itemName={`${usuario.nome} (${usuario.login})`}
          requiresPermission={false}
        />
      ) : (
        // Usuário inativo - mostrar botão de ativar
        <ActivateButton
          id={usuario.id}
          onActivate={handleActivate}
          confirmText="Deseja realmente ativar este usuário?"
          confirmTitle="Ativação de Usuário"
          itemName={`${usuario.nome} (${usuario.login})`}
        />
      )}
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
      id: "apenas_tecnicos",
      label: "Apenas Técnicos",
      type: "checkbox" as const,
      placeholder: "Mostrar apenas usuários técnicos",
    },
    {
      id: "incluir_inativos",
      label: "Exibir Inativos",
      type: "checkbox" as const,
      placeholder: "Exibir usuários inativos",
    },
  ];

  const itemCount = usuarios ? usuarios.length : 0;

  return (
    <AdminAuthGuard>
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
            requiresPermission: false,
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
    </AdminAuthGuard>
  );
};

// Estilo para ajustar o badge de status
// O badge ocupará apenas o tamanho do texto
// Ajuste conforme necessário
// O escopo do style jsx garante que só afete esta página
<style jsx>{`
  .status-badge :global(.table-status-column) {
    display: inline-flex;
    width: auto;
    min-width: unset;
    padding: 2px 8px;
    font-size: 11px;
    border-radius: 6px;
    align-items: center;
  }
  .status-badge {
    width: fit-content;
    min-width: unset;
    display: inline-flex;
  }
`}</style>;

export default CadastroUsuario;
