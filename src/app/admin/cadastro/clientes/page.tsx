"use client";
import { Loading } from "@/components/LoadingPersonalizado";
import { TableList, TableStatusColumn } from "@/components/admin/common";
import { useTitle } from "@/context/TitleContext";
import { useDataFetch } from "@/hooks";
import type { Cliente } from "@/types/admin/cadastro/clientes";
import { useCallback, useEffect, useState } from "react";
import { DeleteButton } from "@/components/admin/ui/DeleteButton";
import { EditButton } from "@/components/admin/ui/EditButton";
import PageHeader from "@/components/admin/ui/PageHeader";
import Pagination from "@/components/admin/ui/Pagination";
import { useFilters } from "@/hooks/useFilters";
import { clientesAPI } from "@/api/api";
import { MapPin } from "lucide-react";

// Interface dos filtros específicos para clientes
interface ClientesFilters {
  nome: string;
  uf: string;
  incluir_inativos: string;
  [key: string]: string;
}

const INITIAL_CLIENTES_FILTERS: ClientesFilters = {
  nome: "",
  uf: "",
  incluir_inativos: "",
};

interface PaginacaoInfo {
  paginaAtual: number;
  totalPaginas: number;
  totalRegistros: number;
  registrosPorPagina: number;
}

interface ClientesResponse {
  dados: Cliente[];
  total_paginas: number;
  total_registros: number;
}

const CadastroClientes = () => {
  const { setTitle } = useTitle();
  const [expandedClienteId, setExpandedClienteId] = useState<number | null>(
    null
  );

  // Helper function to safely get client ID
  const getClienteId = (cliente: Cliente): number => {
    return cliente.id_cliente ?? cliente.id ?? 0;
  };

  useEffect(() => {
    setTitle("Clientes");
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
  } = useFilters(INITIAL_CLIENTES_FILTERS);

  const [paginacao, setPaginacao] = useState<PaginacaoInfo>({
    paginaAtual: 1,
    totalPaginas: 1,
    totalRegistros: 0,
    registrosPorPagina: 25,
  });

  const fetchClientes = useCallback(async (): Promise<Cliente[]> => {
    const params: Record<string, string | number> = {
      nro_pagina: paginacao.paginaAtual,
      qtde_registros: paginacao.registrosPorPagina,
    };

    if (filtrosAplicados.nome) params.nome = filtrosAplicados.nome;
    if (filtrosAplicados.uf) params.uf = filtrosAplicados.uf;
    if (filtrosAplicados.incluir_inativos === "true")
      params.incluir_inativos = "S";

    const response: ClientesResponse = await clientesAPI.getAll(params);

    setPaginacao((prev) => ({
      ...prev,
      totalPaginas: response.total_paginas,
      totalRegistros: response.total_registros,
    }));

    return response.dados;
  }, [filtrosAplicados, paginacao.paginaAtual, paginacao.registrosPorPagina]);

  const {
    data: clientes,
    loading,
    refetch,
  } = useDataFetch<Cliente[]>(fetchClientes, [fetchClientes]);

  const handlePageChange = useCallback((novaPagina: number) => {
    setPaginacao((prev) => ({ ...prev, paginaAtual: novaPagina }));
  }, []);

  const handleRecordsPerPageChange = useCallback((novoValor: number) => {
    setPaginacao((prev) => ({
      ...prev,
      registrosPorPagina: novoValor,
      paginaAtual: 1,
    }));
  }, []);

  useEffect(() => {
    setPaginacao((prev) => ({ ...prev, paginaAtual: 1 }));
  }, [filtrosAplicados]);

  const toggleExpand = useCallback((id: number | string) => {
    setExpandedClienteId((prevId) => {
      const result = prevId === id ? null : Number(id);
      return result;
    });
  }, []);

  if (loading) {
    return (
      <Loading
        fullScreen={true}
        preventScroll={false}
        text="Carregando clientes..."
        size="large"
      />
    );
  }

  const columns = [
    {
      header: "Cliente",
      accessor: "nome_fantasia" as keyof Cliente,
      render: (cliente: Cliente) => (
        <div className="text-sm text-gray-900 flex items-center gap-2">
          <div>
            <div className="font-semibold">{cliente.nome_fantasia}</div>
            <div className="text-xs text-gray-500 mt-0.5">
              {cliente.razao_social}
            </div>
          </div>
        </div>
      ),
    },
    {
      header: "Endereço",
      accessor: "cidade" as keyof Cliente,
      render: (cliente: Cliente) => {
        const hasValidCoordinates =
          cliente.latitude !== undefined &&
          cliente.latitude !== null &&
          cliente.latitude !== 0 &&
          String(cliente.latitude) !== "0" &&
          String(cliente.latitude) !== "";
        return (
          <div>
            {hasValidCoordinates ? (
              <a
                href={`https://www.google.com/maps/place/${cliente.latitude},${cliente.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-[var(--primary)] flex items-center gap-1.5 hover:underline"
              >
                <MapPin size={16} className="text-[var(--primary)]" />
                {cliente.endereco}, {cliente.numero}
                {cliente.complemento && ` - ${cliente.complemento}`}
              </a>
            ) : (
              <div className="text-sm text-[var(--neutral-graphite)] flex items-center gap-1.5">
                <MapPin size={16} className="text-gray-400" />
                {cliente.endereco}, {cliente.numero}
                {cliente.complemento && ` - ${cliente.complemento}`}
              </div>
            )}
            <div className="text-xs text-gray-500 mt-0.5">
              {cliente.bairro} - {cliente.cep}
            </div>
          </div>
        );
      },
    },
    {
      header: "Cidade/UF",
      accessor: "cidade" as keyof Cliente,
      render: (cliente: Cliente) => {
        return (
          <div>
            <div className="text-sm text-[var(--neutral-graphite)] flex items-center gap-1.5">
              {cliente.cidade}, {cliente.uf}
            </div>
            <div className="text-xs text-gray-500 mt-0.5">
              {cliente.regiao?.nome_regiao}
            </div>
          </div>
        );
      },
    },
    {
      header: "Status",
      accessor: "situacao" as keyof Cliente,
      render: (cliente: Cliente) => (
        <TableStatusColumn status={cliente.situacao} />
      ),
    },
    {
      header: "Contatos",
      accessor: "id" as keyof Cliente,
      render: (cliente: Cliente) => {
        const contatosCount =
          cliente.qtd_contatos ?? cliente.contatos?.length ?? 0;
        const hasContatos = contatosCount > 0;
        const clientId = getClienteId(cliente);

        return (
          <button
            className={`px-2 py-1.5 border border-gray-100 rounded-lg text-xs font-medium flex items-center gap-2 transition-colors ${
              hasContatos
                ? "bg-[var(--neutral-light-gray)] text-[var(--neutral-graphite)] hover:bg-[var(--neutral-light-gray)]/80 cursor-pointer"
                : "bg-gray-50 text-gray-400 cursor-not-allowed"
            }`}
            onClick={(e) => {
              e.stopPropagation();
              if (hasContatos) {
                toggleExpand(clientId);
              }
            }}
            type="button"
            disabled={!hasContatos}
          >
            {/* <User
              size={16}
              className={
                hasContatos ? "text-[var(--neutral-graphite)]" : "text-gray-400"
              }
            /> */}
            <span
              className={
                hasContatos ? "text-[var(--primary)]" : "text-gray-400"
              }
            >
              ({contatosCount})
            </span>
            {hasContatos && (
              <span className="text-[var(--primary)]">
                {expandedClienteId === clientId ? "▲" : "▼"}
              </span>
            )}
          </button>
        );
      },
    },
  ];

  const handleDelete = async (id: number) => {
    try {
      await clientesAPI.delete(id);
      await refetch();
    } catch {
      alert("Erro ao excluir este cliente.");
    }
  };

  const renderActions = (cliente: Cliente) => {
    const clientId = getClienteId(cliente);

    return (
      <div className="flex gap-2">
        <EditButton id={clientId} editRoute="/admin/cadastro/clientes/editar" />
        <DeleteButton
          id={clientId}
          onDelete={handleDelete}
          confirmText="Deseja realmente excluir este cliente?"
          confirmTitle="Exclusão de Cliente"
          itemName={`${cliente.nome_fantasia || cliente.razao_social}`}
        />
      </div>
    );
  };

  const handleFiltroChangeCustom = (campo: string, valor: string) => {
    // Converter checkbox para string
    if (campo === "incluir_inativos") {
      valor = valor === "true" ? "true" : "";
    }

    handleFiltroChange(campo, valor);
  };

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
      label: "Nome/Razão Social",
      type: "text" as const,
      placeholder: "Digite o nome ou razão social...",
    },
    {
      id: "uf",
      label: "UF",
      type: "select" as const,
      options: ufOptions,
    },
    {
      id: "incluir_inativos",
      label: "Incluir Inativos",
      type: "checkbox" as const,
      placeholder: "Incluir clientes inativos",
    },
  ];

  // Function to render expanded contacts
  const renderExpandedRow = (cliente: Cliente) => {
    if (!cliente.contatos) return null;

    return (
      <div className="border-t border-[var(--primary)]/10 pt-4 px-2">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {cliente.contatos.map((contato) => (
            <div
              key={contato.id_contato}
              className="border border-gray-100 rounded-xl p-3 bg-white shadow-sm hover:shadow-md transition-all transform hover:-translate-y-1"
            >
              <div className="flex justify-between items-center pb-1.5 border-b border-gray-100">
                <div className="font-semibold text-gray-900 truncate">
                  {contato.nome_completo || contato.nome}
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <div
                      className={`w-2.5 h-2.5 rounded-full ${
                        contato.situacao === "A" ? "bg-green-500" : "bg-red-500"
                      }`}
                    ></div>
                    <span
                      className={`text-xs font-medium ${
                        contato.situacao === "A"
                          ? "text-green-700"
                          : "text-red-700"
                      }`}
                    >
                      {contato.situacao === "A" ? "Ativo" : "Inativo"}
                    </span>
                  </div>
                  {contato.recebe_aviso_os ? (
                    <div className="flex items-center gap-1">
                      <div className="w-2.5 h-2.5 rounded-full bg-yellow-400"></div>
                      <span className="text-xs font-medium text-yellow-700">
                        Aviso OS
                      </span>
                    </div>
                  ) : null}
                </div>
              </div>
              <div className="pt-3">
                <div className="flex flex-wrap gap-2">
                  {contato.telefone && (
                    <div className="text-sm bg-gray-50 px-3 py-1.5 rounded-md flex items-center gap-2 border border-gray-100 hover:bg-gray-100 transition-colors">
                      <svg
                        className="w-4 h-4 text-[var(--primary)] flex-shrink-0"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                      </svg>
                      <span className="truncate max-w-[140px] text-gray-700">
                        {contato.telefone}
                      </span>
                    </div>
                  )}

                  {contato.whatsapp && (
                    <a
                      href={`https://wa.me/${contato.whatsapp.replace(
                        /\D/g,
                        ""
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm bg-[var(--secondary-green)]/5 px-3 py-1.5 rounded-md flex items-center gap-2 border border-[var(--secondary-green)]/20 hover:bg-[var(--secondary-green)]/10 transition-colors"
                    >
                      <svg
                        className="w-4 h-4 text-[var(--secondary-green)] flex-shrink-0"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
                      </svg>
                      <span className="truncate max-w-[140px] text-gray-700">
                        {contato.whatsapp}
                      </span>
                    </a>
                  )}

                  {contato.email && (
                    <a
                      href={`mailto:${contato.email}`}
                      className="text-sm bg-blue-50 px-3 py-1.5 rounded-md flex items-center gap-2 border border-blue-100 hover:bg-blue-100 hover:text-blue-600 transition-colors"
                    >
                      <svg
                        className="w-4 h-4 text-blue-500 flex-shrink-0"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                        <polyline points="22,6 12,13 2,6"></polyline>
                      </svg>
                      <span className="truncate max-w-[180px] text-gray-700">
                        {contato.email}
                      </span>
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <>
      <PageHeader
        title="Lista de Clientes"
        config={{
          type: "list",
          itemCount: paginacao.totalRegistros,
          onFilterToggle: toggleFilters,
          showFilters: showFilters,
          activeFiltersCount: activeFiltersCount,
          newButton: {
            label: "Novo Cliente",
            link: "/admin/cadastro/clientes/novo",
          },
        }}
      />
      <TableList
        title="Lista de Clientes"
        items={clientes || []}
        keyField="id"
        columns={columns}
        renderActions={renderActions}
        renderExpandedRow={renderExpandedRow}
        expandedRowId={expandedClienteId}
        onRowExpand={toggleExpand}
        showFilter={showFilters}
        filterOptions={filterOptions}
        filterValues={filtrosPainel}
        onFilterChange={handleFiltroChangeCustom}
        onClearFilters={limparFiltros}
        onApplyFilters={aplicarFiltros}
        onFilterToggle={toggleFilters}
        emptyStateProps={{
          title: "Nenhum cliente encontrado",
          description: "Comece cadastrando um novo cliente.",
        }}
      />
      <Pagination
        currentPage={paginacao.paginaAtual}
        totalPages={paginacao.totalPaginas}
        totalRecords={paginacao.totalRegistros}
        recordsPerPage={paginacao.registrosPorPagina}
        onPageChange={handlePageChange}
        onRecordsPerPageChange={handleRecordsPerPageChange}
        recordsPerPageOptions={[10, 20, 25, 50, 100]}
        showRecordsPerPage={true}
      />
    </>
  );
};

export default CadastroClientes;
