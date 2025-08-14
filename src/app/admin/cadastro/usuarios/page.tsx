"use client";

import { usuariosAPI } from "@/api/api";
import { Loading } from "@/components/Loading";
import {
  ActionButton,
  TableList,
  TableStatusColumn,
  ListHeader,
} from "@/components/admin/common";
import { useTitle } from "@/context/TitleContext";
import { useDataFetch } from "@/hooks";
import { Usuario } from "@/types/admin/cadastro/usuarios";
import { Mail, ShieldCheck, Trash2 } from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import { EditButton } from "@/components/admin/ui/EditButton";

const CadastroUsuario = () => {
  const { setTitle } = useTitle();

  // Configurar o título da página
  useEffect(() => {
    setTitle("Usuários");
  }, [setTitle]);

  // Filtros
  const [showFilters, setShowFilters] = useState(false);
  const [filtrosPainel, setFiltrosPainel] = useState({
    nome: "",
    login: "",
    email: "",
    incluir_inativos: "",
  });
  const [filtrosAplicados, setFiltrosAplicados] = useState({
    nome: "",
    login: "",
    email: "",
    incluir_inativos: "",
  });

  const handleFiltroChange = useCallback((campo: string, valor: string) => {
    setFiltrosPainel((prev) => ({ ...prev, [campo]: valor }));
  }, []);

  const limparFiltros = useCallback(() => {
    setFiltrosPainel({ nome: "", login: "", email: "", incluir_inativos: "" });
  }, []);

  const aplicarFiltros = useCallback(() => {
    setFiltrosAplicados({ ...filtrosPainel });
    setShowFilters(false);
  }, [filtrosPainel]);

  // Buscar usuários com filtros
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

  // Estado para exclusão
  const [deletingId, setDeletingId] = useState<number | null>(null);

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

  // Definir as colunas da tabela
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

  // Função de exclusão
  const handleDelete = async (id: number) => {
    if (!window.confirm("Tem certeza que deseja excluir este usuário?")) return;
    setDeletingId(id);
    try {
      await usuariosAPI.delete(id);
      await refetch();
    } catch {
      alert("Erro ao excluir usuário.");
    } finally {
      setDeletingId(null);
    }
  };

  const renderActions = (usuario: Usuario) => (
    <div className="flex gap-2">
      <EditButton id={usuario.id} editRoute="/admin/cadastro/usuarios/editar" />
      <ActionButton
        onClick={() => handleDelete(usuario.id)}
        icon={<Trash2 size={14} />}
        label={deletingId === usuario.id ? "Excluindo..." : "Excluir"}
        variant="secondary"
      />
    </div>
  );

  // Opções de filtro
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
    },
  ];

  const activeFiltersCount =
    Object.values(filtrosAplicados).filter(Boolean).length;

  return (
    <TableList
      title="Lista de Usuários"
      items={usuarios || []}
      keyField="id"
      columns={columns}
      renderActions={renderActions}
      newItemLink="/admin/cadastro/usuarios/novo"
      newItemLabel="Novo Usuário"
      showFilter={showFilters}
      filterOptions={filterOptions}
      filterValues={filtrosPainel}
      onFilterChange={handleFiltroChange}
      onClearFilters={limparFiltros}
      onApplyFilters={aplicarFiltros}
      onFilterToggle={() => setShowFilters(!showFilters)}
      customHeader={
        <ListHeader
          title="Lista de Usuários"
          itemCount={usuarios?.length || 0}
          onFilterToggle={() => setShowFilters(!showFilters)}
          showFilters={showFilters}
          newButtonLink="/admin/cadastro/usuarios/novo"
          newButtonLabel="Novo Usuário"
          activeFiltersCount={activeFiltersCount}
        />
      }
    />
  );
};

export default CadastroUsuario;
