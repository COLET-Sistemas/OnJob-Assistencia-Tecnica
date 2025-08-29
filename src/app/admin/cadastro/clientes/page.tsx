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
import { clientesAPI } from "@/api/api";
import { MapPin } from "lucide-react";
import LocationButton from "@/components/admin/ui/LocationButton"; // Importa o componente
import api from "@/api/api";

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
      const response: ClientesResponse = await clientesAPI.getAll(params);

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
    setExpandedClienteId((prevId) => {
      const result = prevId === id ? null : Number(id);
      return result;
    });
  }, []);

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

        const response = await api.patch(`/clientes/geo?id=${clientId}`, {
          latitude: Number(latitude),
          longitude: Number(longitude),
        });

        setShowLocationModal(false);
        await refetch(); // Recarrega os dados
        showSuccess(
          "Sucesso",
          response // Passa a resposta diretamente, o ToastContainer extrai a mensagem
        );
      } catch (error) {
        console.error("Error updating location:", error);
        showError(
          "Erro ao atualizar localização",
          error as Record<string, unknown>
        );
      }
    },
    [selectedCliente, refetch, showSuccess, showError]
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
            <User
              size={16}
              className={
                hasContatos ? "text-[var(--neutral-graphite)]" : "text-gray-400"
              }
            />
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
      const response = await clientesAPI.delete(id);
      setLocalShowFilters(false); // Garante que o menu esteja fechado após a exclusão
      isReloadingRef.current = true; // Marca que vamos recarregar
      showSuccess(
        "Sucesso",
        response // Passa a resposta diretamente, o ToastContainer extrai a mensagem
      );
      await refetch();
    } catch (error) {
      console.error("Erro ao excluir cliente:", error);

      showError(
        "Erro ao excluir",
        error as Record<string, unknown> // Passa o erro diretamente, o ToastContainer extrai a mensagem
      );
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
        keyField="id"
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
