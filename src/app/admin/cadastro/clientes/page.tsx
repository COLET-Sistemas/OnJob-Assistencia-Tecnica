"use client";
import { Loading } from "@/components/LoadingPersonalizado";
import { User } from "lucide-react";
import {
  TableList,
  TableStatusColumn,
  LocationPicker,
} from "@/components/admin/common";
import { useTitle } from "@/context/TitleContext";
import { useToast } from "@/components/admin/ui/ToastContainer";
import { useDataFetch } from "@/hooks";
import type { Cliente } from "@/types/admin/cadastro/clientes";
import { useCallback, useEffect, useState, useRef } from "react";
import { DeleteButton } from "@/components/admin/ui/DeleteButton";
import { EditButton } from "@/components/admin/ui/EditButton";
import PageHeader from "@/components/admin/ui/PageHeader";
import Pagination from "@/components/admin/ui/Pagination";
import { useFilters } from "@/hooks/useFilters";
import { services } from "@/api";
import { MapPin } from "lucide-react";
import LocationButton from "@/components/admin/ui/LocationButton";
import api from "@/api/api";

const { clientesService } = services;

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
  const { showSuccess, showError } = useToast();
  const [expandedClienteId, setExpandedClienteId] = useState<number | null>(
    null
  );
  // Estados para o modal de localização
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);
  const [showLocationModal, setShowLocationModal] = useState(false);

  // Controle de visibilidade do menu de filtros
  const [localShowFilters, setLocalShowFilters] = useState(false);
  // Ref para evitar que o menu reabra durante o recarregamento
  const isReloadingRef = useRef(false);

  // Helper function to safely get client ID
  const getClienteId = useCallback((cliente: Cliente): number => {
    return Number(cliente.id_cliente ?? cliente.id ?? 0);
  }, []);

  useEffect(() => {
    setTitle("Clientes");
  }, [setTitle]);

  const {
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

  // Funções de filtro modificadas para usar estado local
  const handleApplyFilters = () => {
    setLocalShowFilters(false); // Fecha o menu localmente
    isReloadingRef.current = true; // Marca que vamos recarregar
    aplicarFiltros(); // Aplica os filtros através do hook
  };

  const handleClearFilters = () => {
    setLocalShowFilters(false); // Fecha o menu localmente
    isReloadingRef.current = true; // Marca que vamos recarregar
    limparFiltros(); // Limpa os filtros através do hook
  };

  const handleToggleFilters = () => {
    if (!isReloadingRef.current) {
      setLocalShowFilters(!localShowFilters); // Toggle local apenas se não estiver recarregando
    }
    toggleFilters(); // Toggle através do hook
  };

  const fetchClientes = useCallback(async (): Promise<Cliente[]> => {
    // Marcar que estamos recarregando
    isReloadingRef.current = true;

    const params: Record<string, string | number> = {
      nro_pagina: paginacao.paginaAtual,
      qtde_registros: paginacao.registrosPorPagina,
    };

    if (filtrosAplicados.nome) params.nome = filtrosAplicados.nome;
    if (filtrosAplicados.uf) params.uf = filtrosAplicados.uf;
    if (filtrosAplicados.incluir_inativos === "true")
      params.incluir_inativos = "S";

    try {
      const response: ClientesResponse = await clientesService.getAll(params);

      setPaginacao((prev) => ({
        ...prev,
        totalPaginas: response.total_paginas,
        totalRegistros: response.total_registros,
      }));

      return response.dados;
    } finally {
      // Depois de recarregar, permitir mudanças no estado do menu
      setTimeout(() => {
        isReloadingRef.current = false;
      }, 500); // pequeno delay para garantir que a renderização aconteça primeiro
    }
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

  // Effect para garantir que o menu permaneça fechado durante o recarregamento
  useEffect(() => {
    if (isReloadingRef.current) {
      setLocalShowFilters(false);
    }
  }, [clientes]);

  const toggleExpand = useCallback((id: number | string) => {
    console.log("Toggling expansion for client ID:", id);
    setExpandedClienteId((prevId) => {
      const result = prevId === Number(id) ? null : Number(id);
      console.log("Previous expanded ID:", prevId, "New expanded ID:", result);
      return result;
    });
  }, []);

  // Efeito para carregar os contatos quando um cliente é expandido
  useEffect(() => {
    const fetchContacts = async (clientId: number) => {
      if (!clientId || !clientes) {
        return;
      }

      // Verifica se o cliente já tem contatos carregados
      const clienteAtual = clientes.find((c) => getClienteId(c) === clientId);
      if (clienteAtual?.contatos?.length) {
        return; // Contatos já estão carregados
      }

      try {
        const response = await clientesService.getContacts(clientId);

        if (response && response.contatos) {
          // Força uma atualização dos dados para recarregar com os contatos
          await refetch();
        }
      } catch (error) {
        console.error("Erro ao carregar contatos:", error);
        showError(
          "Erro ao carregar contatos",
          "Não foi possível carregar os contatos deste cliente."
        );
      }
    };

    if (expandedClienteId) {
      fetchContacts(expandedClienteId);
    }
  }, [expandedClienteId, clientes, refetch, showError, getClienteId]);

  // Handlers para o LocationButton
  const openLocationModal = useCallback((cliente: Cliente) => {
    setSelectedCliente(cliente);
    setShowLocationModal(true);
  }, []);

  const saveClienteLocation = useCallback(
    async (latitude: number, longitude: number) => {
      if (!selectedCliente) return;

      try {
        const clientId = getClienteId(selectedCliente);

        await api.patch(`/clientes/geo?id=${clientId}`, {
          latitude: Number(latitude),
          longitude: Number(longitude),
        });

        setShowLocationModal(false);
        await refetch(); // Recarrega os dados
        showSuccess(
          "Sucesso",
          "Localização atualizada com sucesso" // Mensagem explícita em vez da resposta
        );
      } catch (error) {
        console.error("Error updating location:", error);
        showError(
          "Erro ao atualizar localização",
          error as Record<string, unknown>
        );
      }
    },
    [selectedCliente, refetch, showSuccess, showError, getClienteId]
  );

  // Recupera o endereço da empresa do localStorage
  const getEnderecoEmpresa = () => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("endereco_empresa") || "";
    }
    return "";
  };

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
        const isExpanded = expandedClienteId === clientId;

        return (
          <button
            className={`px-2.5 py-1.5 border rounded-lg text-xs font-medium flex items-center gap-2 transition-all ${
              hasContatos
                ? isExpanded
                  ? "bg-[var(--primary)]/10 border-[var(--primary)] text-[var(--primary)] shadow-sm"
                  : "bg-[var(--neutral-light-gray)] text-[var(--neutral-graphite)] border-gray-200 hover:bg-[var(--primary)]/5 hover:border-[var(--primary)]/30 cursor-pointer"
                : "bg-gray-50 text-gray-400 border-gray-100 cursor-not-allowed"
            }`}
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              if (hasContatos) {
                console.log("Contact button clicked for client ID:", clientId);
                toggleExpand(clientId);
              }
            }}
            type="button"
            disabled={!hasContatos}
            aria-expanded={isExpanded}
            aria-controls={`contatos-cliente-${clientId}`}
            title={hasContatos ? "Clique para ver os contatos" : "Sem contatos"}
          >
            <User
              size={16}
              className={
                hasContatos
                  ? isExpanded
                    ? "text-[var(--primary)]"
                    : "text-[var(--neutral-graphite)]"
                  : "text-gray-400"
              }
            />
            <span
              className={
                hasContatos
                  ? isExpanded
                    ? "text-[var(--primary)] font-semibold"
                    : "text-[var(--neutral-graphite)]"
                  : "text-gray-400"
              }
            >
              ({contatosCount})
            </span>
            {hasContatos && (
              <span
                className={
                  isExpanded ? "text-[var(--primary)]" : "text-gray-500"
                }
              >
                {isExpanded ? "▲" : "▼"}
              </span>
            )}
          </button>
        );
      },
    },
  ];

  const handleDelete = async (id: number) => {
    try {
      await clientesService.delete(id);
      setLocalShowFilters(false);
      isReloadingRef.current = true;
      showSuccess("Sucesso", "Cliente inativado com sucesso");
      await refetch();
    } catch (error) {
      console.error("Erro ao inativar cliente:", error);

      showError("Erro ao inativar", error as Record<string, unknown>);
    } finally {
      setTimeout(() => {
        isReloadingRef.current = false;
      }, 500);
    }
  };

  const renderActions = (cliente: Cliente) => {
    const clientId = getClienteId(cliente);

    return (
      <div className="flex gap-2">
        {/* Usando o componente LocationButton */}
        <LocationButton
          cliente={cliente}
          onDefineLocation={openLocationModal}
          enderecoEmpresa={getEnderecoEmpresa()}
        />

        <EditButton id={clientId} editRoute="/admin/cadastro/clientes/editar" />
        <DeleteButton
          id={clientId}
          onDelete={handleDelete}
          confirmText="Deseja realmente inativar este cliente?"
          confirmTitle="Inativação de Cliente"
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

  return (
    <>
      <PageHeader
        title="Lista de Clientes"
        config={{
          type: "list",
          itemCount: paginacao.totalRegistros,
          onFilterToggle: handleToggleFilters,
          showFilters: localShowFilters,
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
        keyField="id_cliente"
        columns={columns}
        renderActions={renderActions}
        showFilter={localShowFilters}
        filterOptions={filterOptions}
        filterValues={filtrosPainel}
        onFilterChange={handleFiltroChangeCustom}
        onClearFilters={handleClearFilters}
        onApplyFilters={handleApplyFilters}
        onFilterToggle={handleToggleFilters}
        emptyStateProps={{
          title: "Nenhum cliente encontrado",
          description: "Tente ajustar os filtros ou cadastre um novo cliente.",
        }}
        expandedRowId={expandedClienteId}
        onRowExpand={toggleExpand}
        renderExpandedRow={(cliente) => (
          <div
            id={`contatos-cliente-${getClienteId(cliente)}`}
            className="p-4 bg-gray-50 rounded-lg shadow-inner"
          >
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-sm font-bold text-gray-700">
                Contatos do Cliente
              </h3>
              <span className="text-xs text-gray-500">
                {cliente.contatos?.length || cliente.qtd_contatos || 0}{" "}
                contato(s)
              </span>
            </div>
            {!cliente.contatos || cliente.contatos.length === 0 ? (
              <div className="text-center py-6 text-gray-500">
                {cliente.qtd_contatos && cliente.qtd_contatos > 0 ? (
                  <div className="flex flex-col items-center">
                    <svg
                      className="animate-spin h-6 w-6 text-[var(--primary)] mb-2"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    <p>Carregando contatos...</p>
                  </div>
                ) : (
                  <p>Este cliente não possui contatos registrados.</p>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {cliente.contatos.map((contato) => (
                  <div
                    key={contato.id}
                    className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="flex justify-between">
                      <div className="font-medium text-[var(--primary)] text-lg">
                        {contato.nome || contato.nome_completo}
                      </div>
                      <span
                        className={`px-2 py-0.5 h-fit rounded-full text-xs ${
                          contato.situacao === "A"
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {contato.situacao === "A" ? "Ativo" : "Inativo"}
                      </span>
                    </div>

                    {contato.nome_completo &&
                      contato.nome_completo !== contato.nome && (
                        <div className="text-xs text-gray-500">
                          {contato.nome_completo}
                        </div>
                      )}

                    {contato.cargo && (
                      <div className="text-sm font-medium text-gray-700 mt-2">
                        {contato.cargo}
                      </div>
                    )}

                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <div className="grid gap-2">
                        {contato.telefone && (
                          <div className="flex items-center gap-2 text-sm">
                            <div className="bg-gray-100 p-1.5 rounded-md">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="16"
                                height="16"
                                fill="currentColor"
                                className="text-gray-500"
                                viewBox="0 0 16 16"
                              >
                                <path d="M3.654 1.328a.678.678 0 0 0-1.015-.063L1.605 2.3c-.483.484-.661 1.169-.45 1.77a17.568 17.568 0 0 0 4.168 6.608 17.569 17.569 0 0 0 6.608 4.168c.601.211 1.286.033 1.77-.45l1.034-1.034a.678.678 0 0 0-.063-1.015l-2.307-1.794a.678.678 0 0 0-.58-.122l-2.19.547a1.745 1.745 0 0 1-1.657-.459L5.482 8.062a1.745 1.745 0 0 1-.46-1.657l.548-2.19a.678.678 0 0 0-.122-.58L3.654 1.328zM1.884.511a1.745 1.745 0 0 1 2.612.163L6.29 2.98c.329.423.445.974.315 1.494l-.547 2.19a.678.678 0 0 0 .178.643l2.457 2.457a.678.678 0 0 0 .644.178l2.189-.547a1.745 1.745 0 0 1 1.494.315l2.306 1.794c.829.645.905 1.87.163 2.611l-1.034 1.034c-.74.74-1.846 1.065-2.877.702a18.634 18.634 0 0 1-7.01-4.42 18.634 18.634 0 0 1-4.42-7.009c-.362-1.03-.037-2.137.703-2.877L1.885.511z" />
                              </svg>
                            </div>
                            <a
                              href={`tel:${contato.telefone.replace(
                                /\D/g,
                                ""
                              )}`}
                              className="text-gray-700 hover:text-[var(--primary)]"
                            >
                              {contato.telefone}
                            </a>
                          </div>
                        )}

                        {contato.whatsapp && (
                          <div className="flex items-center gap-2 text-sm">
                            <div className="bg-green-50 p-1.5 rounded-md">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="16"
                                height="16"
                                fill="currentColor"
                                className="text-green-600"
                                viewBox="0 0 16 16"
                              >
                                <path d="M13.601 2.326A7.854 7.854 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.933 7.933 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.898 7.898 0 0 0 13.6 2.326zM7.994 14.521a6.573 6.573 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.557 6.557 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592zm3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.729.729 0 0 0-.529.247c-.182.198-.691.677-.691 1.654 0 .977.71 1.916.81 2.049.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232z" />
                              </svg>
                            </div>
                            <a
                              href={`https://wa.me/${contato.whatsapp.replace(
                                /\D/g,
                                ""
                              )}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-gray-700 hover:text-green-600"
                            >
                              {contato.whatsapp}
                            </a>
                          </div>
                        )}

                        {contato.email && (
                          <div className="flex items-center gap-2 text-sm">
                            <div className="bg-blue-50 p-1.5 rounded-md">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="16"
                                height="16"
                                fill="currentColor"
                                className="text-blue-600"
                                viewBox="0 0 16 16"
                              >
                                <path d="M0 4a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V4Zm2-1a1 1 0 0 0-1 1v.217l7 4.2 7-4.2V4a1 1 0 0 0-1-1H2Zm13 2.383-4.708 2.825L15 11.105V5.383Zm-.034 6.876-5.64-3.471L8 9.583l-1.326-.795-5.64 3.47A1 1 0 0 0 2 13h12a1 1 0 0 0 .966-.741ZM1 11.105l4.708-2.897L1 5.383v5.722Z" />
                              </svg>
                            </div>
                            <a
                              href={`mailto:${contato.email}`}
                              className="text-gray-700 hover:text-blue-600"
                            >
                              {contato.email}
                            </a>
                          </div>
                        )}
                      </div>

                      {contato.recebe_aviso_os && (
                        <div className="mt-3 flex items-center">
                          <span className="bg-blue-100 text-blue-700 px-2 py-1 text-xs rounded-full flex items-center gap-1">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="12"
                              height="12"
                              fill="currentColor"
                              viewBox="0 0 16 16"
                            >
                              <path d="M8 16a2 2 0 0 0 2-2H6a2 2 0 0 0 2 2zm.995-14.901a1 1 0 1 0-1.99 0A5.002 5.002 0 0 0 3 6c0 1.098-.5 6-2 7h14c-1.5-1-2-5.902-2-7 0-2.42-1.72-4.44-4.005-4.901z" />
                            </svg>
                            Recebe avisos de OS
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
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

      {/* Modal de Localização */}
      {selectedCliente && (
        <LocationPicker
          isOpen={showLocationModal}
          onClose={() => setShowLocationModal(false)}
          initialLat={selectedCliente.latitude || null}
          initialLng={selectedCliente.longitude || null}
          address={`${selectedCliente.endereco}, ${selectedCliente.numero}, ${
            selectedCliente.cidade
          }, ${selectedCliente.uf}, ${selectedCliente.cep || ""}`}
          onLocationSelected={saveClienteLocation}
        />
      )}
    </>
  );
};

export default CadastroClientes;
