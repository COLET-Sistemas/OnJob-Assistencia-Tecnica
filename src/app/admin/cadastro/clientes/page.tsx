"use client";
import { Loading } from "@/components/LoadingPersonalizado";
import {
  User,
  Plus,
  MapPin,
  Settings,
  Filter,
  Trash2,
  Pencil,
} from "lucide-react";
import {
  TableList,
  TableStatusColumn,
  LocationPicker,
} from "@/components/admin/common";
import { useTitle } from "@/context/TitleContext";
import { useToast } from "@/components/admin/ui/ToastContainer";
import { useDataFetch } from "@/hooks";
import type { Cliente, ClienteMaquina } from "@/types/admin/cadastro/clientes";
import type { Regiao } from "@/types/admin/cadastro/regioes";
import { useCallback, useEffect, useState, useRef } from "react";
import { DeleteButton } from "@/components/admin/ui/DeleteButton";
import { EditButton } from "@/components/admin/ui/EditButton";
import Pagination from "@/components/admin/ui/Pagination";
import { useFilters } from "@/hooks/useFilters";
import { services } from "@/api";
import { useCadastroPermission } from "@/hooks/useCadastroPermission";
import LocationButton from "@/components/admin/ui/LocationButton";
import api from "@/api/api";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import ConfirmModal from "@/components/admin/ui/ConfirmModal";

const { clientesService, maquinasService } = services;

interface ClientesFilters {
  nome: string;
  uf: string;
  incluir_inativos: string;
  id_regiao: string;
  [key: string]: string;
}

const INITIAL_CLIENTES_FILTERS: ClientesFilters = {
  nome: "",
  uf: "",
  incluir_inativos: "",
  id_regiao: "",
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

type ExpandedSection = "contatos" | "maquinas";

const CadastroClientes = () => {
  const { setTitle } = useTitle();
  const { showSuccess, showError } = useToast();
  const { hasPermission: canManageCadastros } = useCadastroPermission();
  const cadastroDeniedMessage = "Restrito ao seu perfil.";
  const router = useRouter();
  const searchParams = useSearchParams();
  const [expandedState, setExpandedState] = useState<{
    id: number | null;
    section: ExpandedSection | null;
  }>({
    id: null,
    section: null,
  });
  const expandedClienteId = expandedState.id;
  const expandedSection = expandedState.section;
  // Estados para o modal de localização
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [regioes, setRegioes] = useState<Regiao[]>([]);

  // Estados para o modal de confirmação de inativação de contato
  const [showInactivateModal, setShowInactivateModal] = useState(false);
  const [selectedContactId, setSelectedContactId] = useState<number | null>(
    null
  );
  const [isInactivating, setIsInactivating] = useState(false);
  const [selectedContactName, setSelectedContactName] = useState("");

  // Controle de visibilidade do menu de filtros
  const [localShowFilters, setLocalShowFilters] = useState(false);
  // Ref para evitar que o menu reabra durante o recarregamento
  const isReloadingRef = useRef(false);

  // Helper function to safely get client ID
  const getClienteId = useCallback((cliente: Cliente): number => {
    return Number(cliente.id_cliente ?? cliente.id ?? 0);
  }, []);

  const getSectionDomId = useCallback(
    (clienteId: number, section: ExpandedSection) =>
      `${section}-cliente-${clienteId}`,
    []
  );

  const getSituacaoLabel = (situacao?: string) => {
    if (!situacao) {
      return "-";
    }

    const normalized = situacao.toUpperCase();
    if (normalized === "A") {
      return "Ativa";
    }
    if (normalized === "I") {
      return "Inativa";
    }

    return situacao;
  };

  // Armazenar o ID do cliente que deve ser expandido
  const clienteIdToExpandRef = useRef<number | null>(null);
  const [focusedClienteId, setFocusedClienteId] = useState<number | null>(null);
  const focusClienteIdParam = searchParams.get("focusClienteId");

  useEffect(() => {
    setTitle("Clientes");

    // Verificar se há um cliente para verificar automaticamente
    if (typeof window !== "undefined") {
      try {
        const clienteIdToExpand = sessionStorage.getItem("expandClienteId");
        if (clienteIdToExpand) {
          // Remover o item da sessionStorage para não expandir novamente em futuras visitas
          sessionStorage.removeItem("expandClienteId");
          // Armazenar o ID para uso posterior quando os clientes forem carregados
          clienteIdToExpandRef.current = Number(clienteIdToExpand);
        }
      } catch (error) {
        console.error("Erro ao verificar cliente para expandir:", error);
      }
    }
  }, [setTitle]);

  useEffect(() => {
    if (!focusClienteIdParam) {
      return;
    }

    const parsedId = Number(focusClienteIdParam);
    if (Number.isNaN(parsedId)) {
      return;
    }

    setFocusedClienteId(parsedId);
    clienteIdToExpandRef.current = parsedId;

    if (typeof window !== "undefined") {
      const currentUrl = new URL(window.location.href);
      currentUrl.searchParams.delete("focusClienteId");
      const nextSearch = currentUrl.searchParams.toString();
      const nextPath = nextSearch
        ? `${currentUrl.pathname}?${nextSearch}`
        : currentUrl.pathname;
      router.replace(nextPath, { scroll: false });
    }
  }, [focusClienteIdParam, router]);

  useEffect(() => {
    const carregarRegioes = async () => {
      try {
        const listaRegioes = await services.regioesService.getAll();
        setRegioes(listaRegioes);
      } catch (error) {
        console.error("Erro ao carregar regiões:", error);
        showError(
          "Erro ao carregar regiões",
          "Não foi possí­vel carregar a lista de regiões para o filtro."
        );
      }
    };

    carregarRegioes();
  }, [showError]);

  const {
    filtrosPainel,
    filtrosAplicados,
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

  const handleApplyFilters = () => {
    setLocalShowFilters(false);
    isReloadingRef.current = true;
    setFocusedClienteId(null);
    clienteIdToExpandRef.current = null;
    setExpandedState({ id: null, section: null });
    aplicarFiltros();
  };

  const handleClearFilters = () => {
    setLocalShowFilters(false);
    isReloadingRef.current = true;
    setFocusedClienteId(null);
    clienteIdToExpandRef.current = null;
    setExpandedState({ id: null, section: null });
    limparFiltros();
  };

  const handleToggleFilters = () => {
    if (!isReloadingRef.current) {
      setLocalShowFilters(!localShowFilters);
    }
    toggleFilters();
  };

  const fetchClientes = useCallback(async (): Promise<Cliente[]> => {
    // Marcar que estamos recarregando
    isReloadingRef.current = true;

    try {
      if (focusedClienteId !== null) {
        const response = await clientesService.getById(focusedClienteId);
        const clientesEncontrados = response?.dados ?? [];

        setPaginacao((prev) => ({
          ...prev,
          paginaAtual: 1,
          totalPaginas: clientesEncontrados.length > 0 ? 1 : 0,
          totalRegistros: clientesEncontrados.length,
        }));

        return clientesEncontrados;
      }

      const params: Record<string, string | number> = {
        nro_pagina: paginacao.paginaAtual,
        qtde_registros: paginacao.registrosPorPagina,
      };

      if (filtrosAplicados.nome) params.nome = filtrosAplicados.nome;
      if (filtrosAplicados.uf) params.uf = filtrosAplicados.uf;
      if (filtrosAplicados.id_regiao) {
        params.id_regiao = filtrosAplicados.id_regiao;
      }
      if (filtrosAplicados.incluir_inativos === "true") {
        params.incluir_inativos = "S";
      }

      const response: ClientesResponse = await clientesService.getAll(params);

      setPaginacao((prev) => ({
        ...prev,
        totalPaginas: response.total_paginas,
        totalRegistros: response.total_registros,
      }));

      return response.dados;
    } finally {
      setTimeout(() => {
        isReloadingRef.current = false;
      }, 500);
    }
  }, [
    focusedClienteId,
    filtrosAplicados,
    paginacao.paginaAtual,
    paginacao.registrosPorPagina,
  ]);

  const {
    data: clientes,
    loading,
    refetch,
    updateData,
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

    // Verificar se existe um cliente para expandir apÃ³s os dados serem carregados
    if (clienteIdToExpandRef.current && clientes && clientes.length > 0) {
      const clienteId = clienteIdToExpandRef.current;
      const cliente = clientes.find((c) => getClienteId(c) === clienteId);

      if (cliente) {
        setExpandedState({ id: clienteId, section: "contatos" });

        // Pequeno delay para garantir que a interface foi atualizada
        setTimeout(() => {
          const clienteElement = document.getElementById(
            getSectionDomId(clienteId, "contatos")
          );
          if (clienteElement) {
            clienteElement.scrollIntoView({
              behavior: "smooth",
              block: "center",
            });
          }
        }, 300);
      }

      // Limpar a referÃªncia
      clienteIdToExpandRef.current = null;
    }
  }, [clientes, getClienteId, getSectionDomId]);

  const toggleExpand = useCallback(
    (id: number | string, section: ExpandedSection = "contatos") => {
      const numericId = Number(id);
      setExpandedState((prev) => {
        const isSameRow = prev.id === numericId;
        const isSameSection = prev.section === section;

        if (isSameRow && isSameSection) {
          return { id: null, section: null };
        }

        return { id: numericId, section };
      });
    },
    []
  );

  // Efeito para carregar os contatos quando um cliente Ã© expandido
  useEffect(() => {
    const fetchContacts = async (clientId: number) => {
      if (!clientId || !clientes) {
        return;
      }

      // Verifica se o cliente já tem contatos carregados
      const clienteAtual = clientes.find((c) => getClienteId(c) === clientId);
      if (clienteAtual?.contatos?.length) {
        return;
      }

      try {
        const response = await clientesService.getContacts(clientId);

        // Vamos atualizar o estado diretamente em vez de fazer refetch
        if (response && response.contatos) {
          // Atualizar os clientes localmente em vez de fazer refetch completo
          const updatedClientes = clientes.map((c) => {
            if (getClienteId(c) === clientId) {
              return {
                ...c,
                contatos: response.contatos,
              };
            }
            return c;
          });

          // Usando a função updateData em vez de refetch
          if (updateData) {
            updateData(updatedClientes);
          }

          // Scrollar para o cliente expandido apÃ³s um pequeno delay
          // para garantir que os dados foram renderizados
          setTimeout(() => {
            const clienteElement = document.getElementById(
              getSectionDomId(clientId, "contatos")
            );
            if (clienteElement) {
              clienteElement.scrollIntoView({
                behavior: "smooth",
                block: "center",
              });
            }
          }, 300);
        }
      } catch (error) {
        console.error("Erro ao carregar contatos:", error);
        showError(
          "Erro ao carregar contatos",
          "Não foi possível carregar os contatos deste cliente."
        );
      }
    };

    if (expandedClienteId && expandedSection === "contatos") {
      fetchContacts(expandedClienteId);
    }
  }, [
    expandedClienteId,
    expandedSection,
    clientes,
    showError,
    getClienteId,
    updateData,
    getSectionDomId,
  ]);

  useEffect(() => {
    const fetchMaquinas = async (clientId: number) => {
      if (!clientId || !clientes) {
        return;
      }

      const clienteAtual = clientes.find((c) => getClienteId(c) === clientId);
      if (clienteAtual?.maquinas?.length) {
        return;
      }

      try {
        const response = await maquinasService.getByClienteId(clientId, 50);

        if (response && response.dados) {
          const maquinas: ClienteMaquina[] = response.dados.map((maquina) => ({
            id: maquina.id,
            id_maquina: maquina.id,
            numero_serie: maquina.numero_serie,
            descricao: maquina.descricao,
            modelo: maquina.modelo,
            data_1a_venda: maquina.data_1a_venda,
            nota_fiscal_venda: maquina.nota_fiscal_venda,
            data_final_garantia: maquina.data_final_garantia,
            situacao: maquina.situacao,
          }));

          const updatedClientes = clientes.map((c) => {
            if (getClienteId(c) === clientId) {
              return {
                ...c,
                maquinas,
                qtd_maquinas: response.total_registros ?? maquinas.length,
              };
            }
            return c;
          });

          if (updateData) {
            updateData(updatedClientes);
          }

          setTimeout(() => {
            const clienteElement = document.getElementById(
              getSectionDomId(clientId, "maquinas")
            );
            if (clienteElement) {
              clienteElement.scrollIntoView({
                behavior: "smooth",
                block: "center",
              });
            }
          }, 300);
        }
      } catch (error) {
        console.error("Erro ao carregar máquinas:", error);
        showError(
          "Erro ao carregar máquinas",
          "Não foi possível carregar as máquinas deste cliente."
        );
      }
    };

    if (expandedClienteId && expandedSection === "maquinas") {
      fetchMaquinas(expandedClienteId);
    }
  }, [
    expandedClienteId,
    expandedSection,
    clientes,
    showError,
    getClienteId,
    updateData,
    getSectionDomId,
  ]);

  const openLocationModal = useCallback(
    (cliente: Cliente) => {
      if (!canManageCadastros) {
        showError("Acesso negado", cadastroDeniedMessage);
        return;
      }

      setSelectedCliente(cliente);
      setShowLocationModal(true);
    },
    [canManageCadastros, showError, cadastroDeniedMessage]
  );

  const saveClienteLocation = useCallback(
    async (latitude: number, longitude: number) => {
      if (!selectedCliente) return;
      if (!canManageCadastros) {
        showError("Acesso negado", cadastroDeniedMessage);
        return;
      }
      try {
        const clientId = getClienteId(selectedCliente);

        await api.patch(`/clientes/geo?id=${clientId}`, {
          latitude: Number(latitude),
          longitude: Number(longitude),
        });

        setShowLocationModal(false);
        await refetch();
        showSuccess("Sucesso", "Localização atualizada com sucesso");
      } catch (error) {
        console.error("Error updating location:", error);
        showError(
          "Erro ao atualizar localização",
          error as Record<string, unknown>
        );
      }
    },
    [
      selectedCliente,
      refetch,
      showSuccess,
      showError,
      getClienteId,
      canManageCadastros,
      cadastroDeniedMessage,
    ]
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
              <div className="text-sm text-[var(--primary)] flex items-center gap-1.5">
                <a
                  href={`https://www.google.com/maps/place/${cliente.latitude},${cliente.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Ver no Google Maps"
                >
                  <MapPin
                    size={16}
                    className="text-[var(--primary)] hover:opacity-80"
                  />
                </a>
                <span>
                  {cliente.endereco}, {cliente.numero}
                  {cliente.complemento && ` - ${cliente.complemento}`}
                </span>
              </div>
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
        const isExpanded =
          expandedClienteId === clientId && expandedSection === "contatos";

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
                toggleExpand(clientId, "contatos");
              }
            }}
            type="button"
            disabled={!hasContatos}
            aria-expanded={isExpanded}
            aria-controls={getSectionDomId(clientId, "contatos")}
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
    {
      header: "Máquinas",
      accessor: "qtd_maquinas" as keyof Cliente,
      render: (cliente: Cliente) => {
        const maquinasCount =
          cliente.qtd_maquinas ?? cliente.maquinas?.length ?? 0;
        const hasMaquinas = maquinasCount > 0;
        const clientId = getClienteId(cliente);
        const isExpanded =
          expandedClienteId === clientId && expandedSection === "maquinas";

        return (
          <button
            className={`px-2.5 py-1.5 border rounded-lg text-xs font-medium flex items-center gap-2 transition-all ${
              hasMaquinas
                ? isExpanded
                  ? "bg-[var(--primary)]/10 border-[var(--primary)] text-[var(--primary)] shadow-sm"
                  : "bg-[var(--neutral-light-gray)] text-[var(--neutral-graphite)] border-gray-200 hover:bg-[var(--primary)]/5 hover:border-[var(--primary)]/30 cursor-pointer"
                : "bg-gray-50 text-gray-400 border-gray-100 cursor-not-allowed"
            }`}
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              if (hasMaquinas) {
                toggleExpand(clientId, "maquinas");
              }
            }}
            type="button"
            disabled={!hasMaquinas}
            aria-expanded={isExpanded}
            aria-controls={getSectionDomId(clientId, "maquinas")}
            title={hasMaquinas ? "Clique para ver as máquinas" : "Sem máquinas"}
          >
            <Settings
              size={16}
              className={
                hasMaquinas
                  ? isExpanded
                    ? "text-[var(--primary)]"
                    : "text-[var(--neutral-graphite)]"
                  : "text-gray-400"
              }
            />
            <span
              className={
                hasMaquinas
                  ? isExpanded
                    ? "text-[var(--primary)] font-semibold"
                    : "text-[var(--neutral-graphite)]"
                  : "text-gray-400"
              }
            >
              ({maquinasCount})
            </span>
            {hasMaquinas && (
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
    if (!canManageCadastros) {
      showError("Acesso negado", cadastroDeniedMessage);
      return;
    }

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

  // Função para mostrar o modal de confirmação de inativação
  const openInactivateModal = (id: number, name: string) => {
    if (!canManageCadastros) {
      showError("Acesso negado", cadastroDeniedMessage);
      return;
    }
    // Garantir que o ID seja um número válido
    if (!id || isNaN(Number(id))) {
      console.error("ID do contato inválido:", id);
      showError("Erro", "ID do contato inválido ou não encontrado.");
      return;
    }

    setSelectedContactId(Number(id));
    setSelectedContactName(name);
    setShowInactivateModal(true);
  };

  // Função para inativar contato
  const handleInativarContato = async () => {
    if (!canManageCadastros) {
      showError("Acesso negado", cadastroDeniedMessage);
      return;
    }

    if (!selectedContactId) {
      console.error("ID do contato não definido");
      showError("Erro", "ID do contato não definido ou inválido.");
      return;
    }

    try {
      setIsInactivating(true);

      // Garantir que o ID seja um número válido
      const contactId = Number(selectedContactId);
      if (isNaN(contactId)) {
        throw new Error("ID do contato inválido");
      }

      const resultado = await clientesService.deleteContact(contactId);
      console.log("Resposta da API de inativação:", resultado);

      showSuccess("Sucesso", "Contato excluí­do com sucesso.");

      // Atualizar os dados localmente em vez de fazer refetch completo
      if (expandedClienteId && clientes) {
        const updatedClientes = clientes.map((cliente) => {
          if (getClienteId(cliente) === expandedClienteId && cliente.contatos) {
            // Atualizar o status do contato inativado ou remover da lista
            return {
              ...cliente,
              contatos: cliente.contatos.filter(
                (contato) => (contato.id_contato || contato.id) !== contactId
              ),
            };
          }
          return cliente;
        });

        // Atualizar os dados sem fazer nova requisição
        updateData(updatedClientes);
      }

      // Fechar o modal
      setShowInactivateModal(false);
    } catch (error) {
      console.error("Erro ao excluir contato:", error);
      showError("Erro ao excluir", error as Record<string, unknown>);
    } finally {
      setIsInactivating(false);
    }
  };

  const renderActions = (cliente: Cliente) => {
    const clientId = getClienteId(cliente);

    return (
      <div className="flex gap-2">
        <LocationButton
          cliente={cliente}
          onDefineLocation={openLocationModal}
          enderecoEmpresa={getEnderecoEmpresa()}
          canDefine={canManageCadastros}
          disabledTooltip={cadastroDeniedMessage}
        />

        <EditButton
          id={clientId}
          editRoute="/admin/cadastro/clientes/editar"
          disabled={!canManageCadastros}
          disabledTooltip={cadastroDeniedMessage}
        />
        <DeleteButton
          id={clientId}
          onDelete={handleDelete}
          confirmText="Deseja realmente inativar este cliente?"
          confirmTitle="Inativação de Cliente"
          itemName={`${cliente.nome_fantasia || cliente.razao_social}`}
          disabled={!canManageCadastros}
          disabledTooltip={cadastroDeniedMessage}
        />
      </div>
    );
  };

  const handleFiltroChangeCustom = (campo: string, valor: string) => {
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

  const regiaoOptions = (() => {
    const uniqueOptions = new Map<string, string>();

    (regioes || []).forEach((regiao) => {
      const regiaoId = regiao.id ?? regiao.id_regiao;
      if (!regiaoId) {
        return;
      }

      const label =
        regiao.nome?.trim() ||
        regiao.nome_regiao?.trim() ||
        `Região ${regiaoId}`;

      if (!uniqueOptions.has(String(regiaoId))) {
        uniqueOptions.set(String(regiaoId), label);
      }
    });

    return [
      { value: "", label: "Todas" },
      ...Array.from(uniqueOptions.entries()).map(([value, label]) => ({
        value,
        label,
      })),
    ];
  })();

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
      id: "id_regiao",
      label: "Região",
      type: "select" as const,
      options: regiaoOptions,
    },
    {
      id: "incluir_inativos",
      label: "Exibir Inativos",
      type: "checkbox" as const,
      placeholder: "Exibir clientes inativos",
    },
  ];

  return (
    <>
      <header className="mb-5">
        <div className="p-5 rounded-xl shadow-sm border border-slate-200 bg-gradient-to-r from-[var(--neutral-white)] to-[var(--secondary-green)]/20 min-h-[88px]">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-[var(--neutral-graphite)] flex items-center">
              <span className="bg-[var(--primary)] h-6 w-1 rounded-full mr-3"></span>
              Lista de Clientes
              <span className="ml-2 bg-[var(--primary)]/10 text-[var(--primary)] text-sm px-3 py-0.5 rounded-full font-medium">
                {paginacao.totalRegistros}
              </span>
            </h2>

            <div className="flex items-center gap-3">
              {/* Botão de filtro */}
              <div className="relative">
                <button
                  onClick={handleToggleFilters}
                  className={`relative px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all duration-300 shadow-sm border cursor-pointer ${
                    localShowFilters
                      ? "bg-[var(--primary)] text-white border-[var(--primary)] shadow-lg shadow-[var(--primary)]/25"
                      : "bg-white hover:bg-gray-50 text-[var(--neutral-graphite)] border-gray-200 hover:border-gray-300 hover:shadow-md"
                  }`}
                >
                  <Filter size={18} />
                  <span className="font-medium">Filtros</span>
                  {Object.values(filtrosAplicados).some(
                    (v) => v && v !== ""
                  ) && (
                    <div className="absolute -top-1 -right-1 flex items-center justify-center">
                      <span className="w-5 h-5 bg-[#FDAD15] text-white text-xs font-bold rounded-full flex items-center justify-center shadow-lg">
                        {
                          Object.values(filtrosAplicados).filter(
                            (v) => v && v !== ""
                          ).length
                        }
                      </span>
                    </div>
                  )}
                </button>
              </div>

              {/* Botão Novo Contato */}
              {canManageCadastros ? (
                <Link
                  href="/admin/cadastro/clientes/contato/novo"
                  className="bg-[var(--secondary-yellow)] text-white px-5 py-2.5 rounded-xl flex items-center gap-2 transition-all duration-300 shadow-sm hover:shadow-lg border border-[var(--secondary-yellow)] hover:bg-[var(--secondary-yellow)]/90 hover:border-[var(--secondary-yellow)]/90"
                >
                  <Plus size={18} />
                  Novo Contato
                </Link>
              ) : (
                <span
                  className="px-5 py-2.5 rounded-xl flex items-center gap-2 transition-all duration-300 shadow-sm border bg-gray-200 text-gray-500 border-gray-300 cursor-not-allowed"
                  title={cadastroDeniedMessage}
                >
                  <Plus size={18} />
                  Novo Contato
                </span>
              )}

              {/* Botão Novo Cliente */}
              {canManageCadastros ? (
                <Link
                  href="/admin/cadastro/clientes/novo"
                  className="bg-[var(--primary)] text-white px-5 py-2.5 rounded-xl flex items-center gap-2 transition-all duration-300 shadow-sm hover:shadow-lg border border-[var(--primary)] hover:bg-[var(--primary)]/90 hover:border-[var(--primary)]/90"
                >
                  <Plus size={18} />
                  Novo Cliente
                </Link>
              ) : (
                <span
                  className="px-5 py-2.5 rounded-xl flex items-center gap-2 transition-all duration-300 shadow-sm border bg-gray-200 text-gray-500 border-gray-300 cursor-not-allowed"
                  title={cadastroDeniedMessage}
                >
                  <Plus size={18} />
                  Novo Cliente
                </span>
              )}
            </div>
          </div>
        </div>
      </header>

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
        renderExpandedRow={(cliente) => {
          const section = expandedSection ?? "contatos";
          const clienteId = getClienteId(cliente);
          const containerId = getSectionDomId(clienteId, section);
          const contatosCount =
            (cliente.contatos && cliente.contatos.length) ||
            cliente.qtd_contatos ||
            0;
          const maquinasCount =
            (cliente.maquinas && cliente.maquinas.length) ||
            cliente.qtd_maquinas ||
            0;

          if (section === "maquinas") {
            return (
              <div
                id={containerId}
                className="p-4 bg-gray-50 rounded-lg shadow-inner"
              >
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-sm font-bold text-gray-700">
                    Máquinas do Cliente
                  </h3>
                  <span className="text-xs text-gray-500">
                    {maquinasCount} máquina(s)
                  </span>
                </div>
                {!cliente.maquinas || cliente.maquinas.length === 0 ? (
                  <div className="text-center py-6 text-gray-500">
                    {maquinasCount > 0 ? (
                      <div className="flex flex-col items-center">
                        <svg
                          key="machines-spinner-icon"
                          className="animate-spin h-6 w-6 text-[var(--primary)] mb-2"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            key="machines-spinner-circle"
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            key="machines-spinner-path"
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        <p>Carregando máquinas...</p>
                      </div>
                    ) : (
                      <p>Este cliente não possui máquinas registradas.</p>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {cliente.maquinas.map((maquina) => (
                      <div
                        key={
                          maquina.id_maquina ||
                          maquina.id ||
                          maquina.numero_serie
                        }
                        className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-medium text-[var(--primary)] text-lg">
                              {maquina.numero_serie}
                            </div>
                            {maquina.modelo && (
                              <div className="text-xs text-gray-500 mt-0.5">
                                {maquina.modelo}
                              </div>
                            )}
                          </div>
                          {maquina.situacao && (
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                maquina.situacao?.toUpperCase() === "A"
                                  ? "bg-green-100 text-green-700"
                                  : "bg-red-100 text-red-600"
                              }`}
                            >
                              {getSituacaoLabel(maquina.situacao)}
                            </span>
                          )}
                        </div>
                        {maquina.descricao && (
                          <p className="text-sm text-gray-600 mt-2 line-clamp-3">
                            {maquina.descricao}
                          </p>
                        )}
                        <div className="mt-3 grid grid-cols-1 gap-2 text-xs text-gray-500">
                          {maquina.nota_fiscal_venda && (
                            <div className="flex justify-between gap-2">
                              <span className="font-medium text-gray-600">
                                Nota Fiscal:
                              </span>
                              <span>{maquina.nota_fiscal_venda}</span>
                            </div>
                          )}
                          {maquina.data_1a_venda && (
                            <div className="flex justify-between gap-2">
                              <span className="font-medium text-gray-600">
                                1a venda:
                              </span>
                              <span>{maquina.data_1a_venda}</span>
                            </div>
                          )}
                          {maquina.data_final_garantia && (
                            <div className="flex justify-between gap-2">
                              <span className="font-medium text-gray-600">
                                Garantia ate:
                              </span>
                              <span>{maquina.data_final_garantia}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          }

          return (
            <div
              id={containerId}
              className="p-4 bg-gray-50 rounded-lg shadow-inner"
            >
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-sm font-bold text-gray-700">
                  Contatos do Cliente
                </h3>
                <span className="text-xs text-gray-500">
                  {contatosCount} contato(s)
                </span>
              </div>
              {!cliente.contatos || cliente.contatos.length === 0 ? (
                <div className="text-center py-6 text-gray-500">
                  {contatosCount > 0 ? (
                    <div className="flex flex-col items-center">
                      <svg
                        key="spinner-icon"
                        className="animate-spin h-6 w-6 text-[var(--primary)] mb-2"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          key="spinner-circle"
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          key="spinner-path"
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
                      key={contato.id_contato || contato.id}
                      className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
                    >
                      <div className="flex justify-between">
                        <div className="font-medium text-[var(--primary)] text-lg">
                          {contato.nome || contato.nome_completo}
                          {contato.cargo && ` (${contato.cargo})`}
                        </div>
                        <div className="flex items-center gap-2">
                          {contato.situacao === "A" && canManageCadastros && (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  e.preventDefault();
                                  router.push(
                                    `/admin/cadastro/clientes/contato/editar/${
                                      contato.id_contato || contato.id
                                    }`
                                  );
                                }}
                                className="text-blue-500 hover:text-blue-700 p-1 rounded-full hover:bg-blue-50 transition-colors"
                                title="Editar contato"
                              >
                                <Pencil size={16} />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  e.preventDefault();
                                  openInactivateModal(
                                    Number(
                                      contato.id_contato || contato.id || 0
                                    ),
                                    contato.nome ||
                                      contato.nome_completo ||
                                      "este contato"
                                  );
                                }}
                                className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-50 transition-colors"
                                title="Excluir contato"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {contato.nome_completo &&
                        contato.nome_completo !== contato.nome && (
                          <div className="text-xs text-gray-500">
                            {contato.nome_completo}
                          </div>
                        )}

                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <div className="grid gap-2">
                          {contato.telefone && (
                            <div className="flex items-center gap-2 text-sm">
                              <div className="bg-gray-100 p-1.5 rounded-md">
                                <svg
                                  key="phone-icon"
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
                                  key="whatsapp-icon"
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
                                  key="email-icon"
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
                                key="notification-icon"
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
          );
        }}
      />
      {paginacao.totalRegistros > 0 && (
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
      )}

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
          clientName={
            selectedCliente.nome_fantasia || selectedCliente.razao_social
          }
          onLocationSelected={saveClienteLocation}
        />
      )}

      {/* Modal de confirmação de inativação de contato */}
      <ConfirmModal
        isOpen={showInactivateModal}
        onClose={() => setShowInactivateModal(false)}
        onConfirm={handleInativarContato}
        title="Exclusão do Contato"
        message="Tem certeza que deseja excluir este contato?"
        confirmLabel="Excluir Contato"
        isLoading={isInactivating}
        itemName={selectedContactName}
      />
    </>
  );
};

export default CadastroClientes;
