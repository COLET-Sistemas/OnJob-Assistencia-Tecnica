"use client";
import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import PageHeaderSimple from "@/components/admin/ui/PageHeaderSimple";
import { ordensServicoService } from "@/api/services/ordensServicoService";
import { useToast } from "@/components/admin/ui/ToastContainer";
import FilterPanel from "@/app/admin/os_aberto/components/FilterPanel";
import EmptyState from "@/app/admin/os_aberto/components/EmptyState";
import OSCard from "@/app/admin/os_aberto/components/OSCard";
import SkeletonCard from "@/app/admin/os_aberto/components/SkeletonCard";
import LiberacaoFinanceiraModal from "@/app/admin/os_aberto/components/LiberacaoFinanceiraModal";
import AlterarPendenciaModal from "@/app/admin/os_aberto/components/AlterarPendenciaModal";
import TecnicoModal from "@/app/admin/os_aberto/components/TecnicoModal";
import CancelarOSModal from "@/app/admin/os_aberto/components/CancelarOSModal";
import HistoricoModal from "@/app/admin/os_aberto/components/HistoricoModal";
import { OrdemServico } from "@/types/OrdemServico";
import { useRouter, useSearchParams } from "next/navigation";
import { HistoricoTipo } from "@/api/services/historicoService";

const CODIGO_SITUACAO = {
  PENDENTE: 1,
  A_ATENDER: 2,
  EM_DESLOCAMENTO: 3,
  EM_ATENDIMENTO: 4,
  ATENDIMENTO_INTERROMPIDO: 5,
};

const EXPANDED_STORAGE_KEY = "osAbertoExpandedId";
const EXPANDED_RESTORE_FLAG_KEY = "osAbertoShouldRestoreExpanded";

const POSSIBLE_MAQUINA_ID_KEYS = [
  "id",
  "id_maquina",
  "idMaquina",
  "maquina_id",
  "id_maquina_cliente",
] as const;

const resolveMaquinaId = (
  maquinaData?: Partial<OrdemServico["maquina"]> | null
): number | null => {
  if (!maquinaData) return null;

  for (const key of POSSIBLE_MAQUINA_ID_KEYS) {
    const value = (maquinaData as Record<string, unknown>)[key];
    if (typeof value === "number" && value > 0) {
      return value;
    }
    if (typeof value === "string") {
      const parsed = Number(value);
      if (!Number.isNaN(parsed) && parsed > 0) {
        return parsed;
      }
    }
  }

  return null;
};

const buildMaquinaLabel = (
  maquinaData?: Partial<OrdemServico["maquina"]> | null
): string => {
  if (!maquinaData) return "Máquina";
  const descricao =
    maquinaData.descricao || (maquinaData as { modelo?: string }).modelo || "";
  const serialInfo = maquinaData.numero_serie
    ? ` • S/N ${maquinaData.numero_serie}`
    : "";

  if (descricao) {
    return `Máquina: ${descricao}${serialInfo}`;
  }

  if (serialInfo) {
    return `Máquina${serialInfo}`;
  }

  return "Máquina";
};

const TelaOSAbertas: React.FC = () => {
  const router = useRouter();
  const { showSuccess, showError, showInfo } = useToast();
  const [ordensServico, setOrdensServico] = useState<OrdemServico[]>([]);
  const [allOrdensServico, setAllOrdensServico] = useState<OrdemServico[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const searchParams = useSearchParams();
  const osParam = searchParams.get("os");
  const [expandedCards, setExpandedCards] = useState<Set<number>>(new Set());
  const cardRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const [tecnicoFiltros, setTecnicoFiltros] = useState({
    interno: true,
    terceiro: true,
    indefinido: true,
  });
  const [modalLiberacao, setModalLiberacao] = useState({
    isOpen: false,
    osId: 0,
  });

  const [modalPendencia, setModalPendencia] = useState({
    isOpen: false,
    osId: 0,
    currentMotivoId: 0,
    currentMotivoText: "",
  });

  const [modalCancelamento, setModalCancelamento] = useState({
    isOpen: false,
    osId: 0,
  });

  const [modalTecnico, setModalTecnico] = useState({
    isOpen: false,
    osId: 0,
    idRegiao: 0,
    nomeRegiao: "",
    mode: "add" as "add" | "edit",
    currentTecnicoId: 0,
    currentTecnicoNome: "",
  });

  const [historicoModal, setHistoricoModal] = useState<{
    isOpen: boolean;
    tipo: HistoricoTipo | null;
    targetId: number | null;
    targetLabel: string;
  }>({
    isOpen: false,
    tipo: null,
    targetId: null,
    targetLabel: "",
  });

  const [situacoes, setSituacoes] = useState({
    pendente: true,
    aAtender: true,
    emDeslocamento: true,
    emAtendimento: true,
    atendimentoInterrompido: true,
  });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const situacoesParam = "1,2,3,4,5";

      const response = await ordensServicoService.getAll({
        resumido: "S",
        situacao: situacoesParam,
      });

      if (response && response.dados) {
        const ordens = response.dados as unknown as OrdemServico[];
        setAllOrdensServico(ordens);

        const filteredOrdens = ordens.filter((os) => {
          const situacaoCodigo = os.situacao_os.codigo;
          return (
            (situacaoCodigo === CODIGO_SITUACAO.PENDENTE &&
              situacoes.pendente) ||
            (situacaoCodigo === CODIGO_SITUACAO.A_ATENDER &&
              situacoes.aAtender) ||
            (situacaoCodigo === CODIGO_SITUACAO.EM_DESLOCAMENTO &&
              situacoes.emDeslocamento) ||
            (situacaoCodigo === CODIGO_SITUACAO.EM_ATENDIMENTO &&
              situacoes.emAtendimento) ||
            (situacaoCodigo === CODIGO_SITUACAO.ATENDIMENTO_INTERROMPIDO &&
              situacoes.atendimentoInterrompido)
          );
        });

        setOrdensServico(filteredOrdens);
      } else {
        console.warn("Resposta inesperada da API:", response);
        setAllOrdensServico([]);
        setOrdensServico([]);
        if (didFetch.current) {
          showInfo("Nenhuma ordem de serviÃ§o encontrada");
        }
      }
    } catch (error) {
      console.error("Erro ao buscar ordens de serviÃ§o:", error);
      setAllOrdensServico([]);
      setOrdensServico([]);
      if (didFetch.current) {
        showError("Erro ao atualizar a lista");
      }
    } finally {
      setLoading(false);
    }
  }, [situacoes, showError, showInfo]);

  const didFetch = useRef(false);

  // Check for update or create message from OS screens
  useEffect(() => {
    // Check for update message from OS edit screen
    const updateMessage = localStorage.getItem("osUpdateMessage");
    if (updateMessage) {
      // Show the success message from the edit page
      showSuccess(updateMessage);
      // Remove the message from localStorage to prevent showing it again
      localStorage.removeItem("osUpdateMessage");
    }

    // Check for create message from OS creation screen
    const createMessage = localStorage.getItem("osCreateMessage");
    const createId = localStorage.getItem("osCreateId");
    if (createMessage) {
      // Show the success message with the OS ID if available
      const message = createId
        ? `${createMessage} ID: ${createId}`
        : createMessage;

      showSuccess(message);

      // Remove the messages from localStorage to prevent showing them again
      localStorage.removeItem("osCreateMessage");
      localStorage.removeItem("osCreateId");
    }
  }, [showSuccess]);

  useEffect(() => {
    if (!didFetch.current) {
      fetchData();
      didFetch.current = true;
    }
  }, [fetchData]);

  useEffect(() => {
    if (osParam) {
      const id = Number(osParam);
      if (!Number.isNaN(id)) {
        setExpandedCards(new Set([id]));
        window.sessionStorage.setItem(EXPANDED_STORAGE_KEY, id.toString());
      }
    }
  }, [osParam]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const shouldRestore = window.sessionStorage.getItem(
      EXPANDED_RESTORE_FLAG_KEY
    );
    const storedExpandedId =
      window.sessionStorage.getItem(EXPANDED_STORAGE_KEY);

    if (shouldRestore === "true" && storedExpandedId) {
      const parsedId = Number(storedExpandedId);
      if (!Number.isNaN(parsedId)) {
        setExpandedCards(new Set<number>([parsedId]));
      }
    } else if (storedExpandedId) {
      window.sessionStorage.removeItem(EXPANDED_STORAGE_KEY);
    }

    if (shouldRestore !== null) {
      window.sessionStorage.removeItem(EXPANDED_RESTORE_FLAG_KEY);
    }
  }, []);

  useEffect(() => {
    if (didFetch.current && allOrdensServico.length > 0) {
      const filteredOrdens = allOrdensServico.filter((os) => {
        const situacaoCodigo = os.situacao_os.codigo;
        return (
          (situacaoCodigo === CODIGO_SITUACAO.PENDENTE && situacoes.pendente) ||
          (situacaoCodigo === CODIGO_SITUACAO.A_ATENDER &&
            situacoes.aAtender) ||
          (situacaoCodigo === CODIGO_SITUACAO.EM_DESLOCAMENTO &&
            situacoes.emDeslocamento) ||
          (situacaoCodigo === CODIGO_SITUACAO.EM_ATENDIMENTO &&
            situacoes.emAtendimento) ||
          (situacaoCodigo === CODIGO_SITUACAO.ATENDIMENTO_INTERROMPIDO &&
            situacoes.atendimentoInterrompido)
        );
      });

      setOrdensServico(filteredOrdens);
    }
  }, [situacoes, allOrdensServico]);

  const toggleCardExpansion = useCallback((osId: number) => {
    setExpandedCards((prev) => {
      const newExpanded = new Set<number>();
      if (!prev.has(osId)) {
        newExpanded.add(osId);
        if (typeof window !== "undefined") {
          window.sessionStorage.setItem(EXPANDED_STORAGE_KEY, osId.toString());
        }
      } else if (typeof window !== "undefined") {
        window.sessionStorage.removeItem(EXPANDED_STORAGE_KEY);
      }
      return newExpanded;
    });
  }, []);

  const getFormaAberturaTexto = useCallback((forma: string) => {
    const formas: Record<string, string> = {
      email: "E-mail",
      whatsapp: "WhatsApp",
      telefone: "Telefone",
      carta: "Presencial",
      sistema: "Sistema",
    };
    return formas[forma] || forma;
  }, []);

  const formatWhatsAppUrl = useCallback((telefone: string) => {
    const cleanPhone = telefone.replace(/\D/g, "");
    return `https://wa.me/55${cleanPhone}`;
  }, []);

  const formatEmailUrl = useCallback((email: string) => {
    return `mailto:${email}`;
  }, []);

  const formatGoogleMapsUrl = useCallback(
    (cliente: OrdemServico["cliente"]) => {
      const endereco = [
        cliente.endereco,
        cliente.numero,
        cliente.bairro,
        cliente.cidade,
        cliente.uf,
        cliente.cep,
      ]
        .filter(Boolean)
        .join(", ");

      return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        endereco
      )}`;
    },
    []
  );

  // Reset dos filtros para o estado inicial
  const resetFilters = useCallback(() => {
    setSituacoes({
      pendente: true,
      aAtender: true,
      emDeslocamento: true,
      emAtendimento: true,
      atendimentoInterrompido: true,
    });
    setTecnicoFiltros({
      interno: true,
      terceiro: true,
      indefinido: true,
    });
    setSearchTerm("");
  }, []);

  // Funções para lidar com a liberação financeira
  const handleOpenLiberacaoModal = useCallback((osId: number) => {
    setModalLiberacao({
      isOpen: true,
      osId,
    });
  }, []);

  const handleCloseLiberacaoModal = useCallback(() => {
    setModalLiberacao({
      isOpen: false,
      osId: 0,
    });
  }, []);

  const handleConfirmLiberacaoFinanceira = useCallback(
    async (osId: number) => {
      try {
        await ordensServicoService.liberarFinanceiramente(osId);

        // Atualiza os dados apÃ³s a liberação
        await fetchData();
        showSuccess("OS liberada com sucesso");
        handleCloseLiberacaoModal();
        return Promise.resolve();
      } catch (error) {
        console.error("Erro ao liberar OS:", error);
        showError("Erro ao liberar OS");
        return Promise.reject(error);
      }
    },
    [fetchData, handleCloseLiberacaoModal, showError, showSuccess]
  );

  // Funções para lidar com a alteração de pendência
  const handleOpenPendenciaModal = useCallback(
    (osId: number, currentMotivoId?: number, currentMotivoText?: string) => {
      setModalPendencia({
        isOpen: true,
        osId,
        currentMotivoId: currentMotivoId || 0,
        currentMotivoText: currentMotivoText || "",
      });
    },
    []
  );

  const handleClosePendenciaModal = useCallback(() => {
    setModalPendencia({
      isOpen: false,
      osId: 0,
      currentMotivoId: 0,
      currentMotivoText: "",
    });
  }, []);

  const handleConfirmAlterarPendencia = useCallback(
    async (osId: number, motivoId: number | null) => {
      try {
        await ordensServicoService.alterarMotivoPendencia(osId, motivoId);

        // Atualiza os dados apÃ³s a alteração
        await fetchData();

        if (motivoId === null) {
          showSuccess("Pendência removida com sucesso");
        } else {
          showSuccess("Pendência alterada com sucesso");
        }

        handleClosePendenciaModal();
        return Promise.resolve();
      } catch (error) {
        console.error("Erro ao alterar pendência:", error);
        showError("Erro ao alterar pendência");
        return Promise.reject(error);
      }
    },
    [fetchData, handleClosePendenciaModal, showError, showSuccess]
  );

  // Funções para lidar com o gerenciamento de técnicos
  const handleOpenAdicionarTecnicoModal = useCallback(
    (osId: number, idRegiao: number, nomeRegiao?: string) => {
      setModalTecnico({
        isOpen: true,
        osId,
        idRegiao,
        nomeRegiao: nomeRegiao || "", // Adicionar esta linha
        mode: "add",
        currentTecnicoId: 0,
        currentTecnicoNome: "",
      });
    },
    []
  );

  const handleOpenAlterarTecnicoModal = useCallback(
    (
      osId: number,
      idRegiao: number,
      nomeRegiao?: string, // Adicionar este parÃ¢metro
      currentTecnicoId?: number,
      currentTecnicoNome?: string
    ) => {
      setModalTecnico({
        isOpen: true,
        osId,
        idRegiao,
        nomeRegiao: nomeRegiao || "", // Adicionar esta linha
        mode: "edit",
        currentTecnicoId: currentTecnicoId || 0,
        currentTecnicoNome: currentTecnicoNome || "",
      });
    },
    []
  );

  const handleCloseTecnicoModal = useCallback(() => {
    setModalTecnico({
      isOpen: false,
      osId: 0,
      idRegiao: 0,
      nomeRegiao: "", // Adicionar esta linha
      mode: "add",
      currentTecnicoId: 0,
      currentTecnicoNome: "",
    });
  }, []);

  const getNomeRegiao = useCallback((os: OrdemServico): string => {
    if ("nome_regiao" in os.cliente && os.cliente.nome_regiao) {
      return os.cliente.nome_regiao as string;
    }
    return os.cliente.cidade || "Região não informada";
  }, []);

  // Depois atualize as funções wrapper:
  const createAdicionarTecnicoHandler = useCallback(
    (os: OrdemServico) => {
      return () =>
        handleOpenAdicionarTecnicoModal(
          os.id_os,
          os.cliente.id_regiao || 0,
          getNomeRegiao(os)
        );
    },
    [handleOpenAdicionarTecnicoModal, getNomeRegiao]
  );

  const createAlterarTecnicoHandler = useCallback(
    (os: OrdemServico) => {
      return (osId: number, tecnicoId?: number, tecnicoNome?: string) =>
        handleOpenAlterarTecnicoModal(
          osId,
          os.cliente.id_regiao || 0,
          getNomeRegiao(os),
          tecnicoId,
          tecnicoNome
        );
    },
    [handleOpenAlterarTecnicoModal, getNomeRegiao]
  );

  // Função para navegar para a tela de edição da OS
  const handleEditarOS = useCallback(
    (osId: number) => {
      if (typeof window !== "undefined") {
        window.sessionStorage.setItem(EXPANDED_STORAGE_KEY, osId.toString());
        window.sessionStorage.setItem(EXPANDED_RESTORE_FLAG_KEY, "true");
      }
      router.push(`/admin/os_aberto/editar/${osId}`);
    },
    [router]
  );

  // Funções para lidar com o cancelamento de OS
  const handleOpenCancelamentoModal = useCallback((osId: number) => {
    setModalCancelamento({
      isOpen: true,
      osId,
    });
  }, []);

  const handleCloseCancelamentoModal = useCallback(() => {
    setModalCancelamento({
      isOpen: false,
      osId: 0,
    });
  }, []);

  const handleConfirmCancelamento = useCallback(
    async (
      osId: number,
      descricao: string,
      tipoCancelamento: "cliente" | "empresa"
    ) => {
      try {
        // Enviar dados de cancelamento através do serviÃ§o
        await ordensServicoService.cancel(osId, {
          tipo_cancelamento: tipoCancelamento,
          descricao: descricao,
        });

        // Atualiza os dados apÃ³s o cancelamento
        await fetchData();
        showSuccess("OS cancelada com sucesso");
        handleCloseCancelamentoModal();
        return Promise.resolve();
      } catch (error) {
        console.error("Erro ao cancelar OS:", error);
        showError("Erro ao cancelar OS");
        return Promise.reject(error);
      }
    },
    [fetchData, handleCloseCancelamentoModal, showError, showSuccess]
  );

  const handleOpenHistoricoCliente = useCallback(
    (cliente: OrdemServico["cliente"]) => {
      if (!cliente?.id) return;
      router.push(`/admin/clientes_detalhes/${cliente.id}?tab=historico`);
    },
    [router]
  );

  const handleOpenHistoricoMaquina = useCallback(
    async (maquina: OrdemServico["maquina"], osId: number) => {
      let maquinaId = resolveMaquinaId(maquina);
      let labelText = buildMaquinaLabel(maquina);

      if (!maquinaId) {
        try {
          const detalhes = await ordensServicoService.getById(osId);
          maquinaId = resolveMaquinaId(
            (detalhes?.maquina as OrdemServico["maquina"]) || null
          );
          labelText = buildMaquinaLabel(
            (detalhes?.maquina as OrdemServico["maquina"]) || maquina
          );
        } catch (error) {
          console.error("Erro ao buscar dados da máquina:", error);
          showError("Erro ao carregar dados da máquina.");
          return;
        }
      }

      if (!maquinaId) {
        showError("Não foi possível identificar a máquina desta OS.");
        return;
      }

      setHistoricoModal({
        isOpen: true,
        tipo: "maquina",
        targetId: maquinaId,
        targetLabel: labelText,
      });
    },
    [showError]
  );

  const handleCloseHistoricoModal = useCallback(() => {
    setHistoricoModal({
      isOpen: false,
      tipo: null,
      targetId: null,
      targetLabel: "",
    });
  }, []);

  const handleConfirmTecnico = useCallback(
    async (osId: number, tecnicoId: number, tecnicoNome: string) => {
      try {
        // Aqui você faria a chamada para a API para definir/alterar o técnico
        // await ordensServicoService.definirTecnico(osId, tecnicoId);
        console.log("Definir técnico:", { osId, tecnicoId, tecnicoNome });

        // Atualiza os dados apÃ³s a alteração
        await fetchData();

        if (modalTecnico.mode === "add") {
          showSuccess("Técnico adicionado com sucesso");
        } else {
          showSuccess("Técnico alterado com sucesso");
        }

        handleCloseTecnicoModal();
        return Promise.resolve();
      } catch (error) {
        console.error("Erro ao definir técnico:", error);
        showError("Erro ao definir técnico");
        return Promise.reject(error);
      }
    },
    [
      fetchData,
      handleCloseTecnicoModal,
      modalTecnico.mode,
      showError,
      showSuccess,
    ]
  );

  const filteredOrdens = useMemo(() => {
    return ordensServico.filter((os) => {
      // Verifica se a busca é especÃ­fica por ID (quando comeÃ§a com #)
      if (searchTerm.startsWith("#")) {
        const idSearch = searchTerm.substring(1);
        return os.id_os.toString() === idSearch;
      }

      const matchSearch =
        searchTerm === "" ||
        `OS-${os.id_os}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        os.cliente.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        os.contato.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        os.maquina.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
        os.maquina.numero_serie
          .toLowerCase()
          .includes(searchTerm.toLowerCase());

      // Filtro por tipo de técnico
      const matchTecnicoTipo =
        // Técnicos internos
        (os.tecnico.tipo === "interno" && tecnicoFiltros.interno) ||
        // Técnicos terceirizados
        (os.tecnico.tipo === "terceiro" && tecnicoFiltros.terceiro) ||
        // Técnicos indefinidos (sem tipo ou sem nome)
        ((!os.tecnico.tipo || !os.tecnico.nome) && tecnicoFiltros.indefinido);

      return matchSearch && matchTecnicoTipo;
    });
  }, [ordensServico, searchTerm, tecnicoFiltros]);

  useEffect(() => {
    if (typeof window === "undefined" || expandedCards.size === 0) {
      return;
    }

    const [expandedId] = Array.from(expandedCards);
    const cardElement = cardRefs.current.get(expandedId);

    if (cardElement) {
      window.requestAnimationFrame(() => {
        cardElement.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      });
    }
  }, [expandedCards, filteredOrdens]);

  // Renderiza o loading
  if (loading) {
    return (
      <div className="flex flex-col h-full max-h-full overflow-hidden">
        {/* Fixed Header */}
        <div className="flex-shrink-0">
          <PageHeaderSimple
            title="Gerenciamento de OSs"
            config={{
              type: "list",
              itemCount: 0,
              newButton: {
                label: "Nova OS",
                link: "/admin/os_aberto/novo",
              },
              refreshButton: {
                onClick: () => {},
              },
            }}
          />
        </div>

        {/* Skeleton para o painel de filtros */}
        <div className="flex-shrink-0 mb-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden p-4 animate-pulse">
            <div className="flex flex-wrap gap-4 items-center">
              <div className="w-full sm:w-64 h-10 bg-gray-200 rounded-lg"></div>
              <div className="flex items-center gap-2">
                <div className="w-20 h-5 bg-gray-200 rounded"></div>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div
                      key={i}
                      className="w-20 h-7 bg-gray-200 rounded-md"
                    ></div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Skeleton cards para as ordens de serviÃ§o */}
        <div className="flex-1 min-h-0 overflow-hidden">
          <div className="h-full overflow-y-auto custom-scrollbar scroll-smooth px-1 pr-2">
            <div className="space-y-4 pb-6">
              {Array.from({ length: 5 }).map((_, index) => (
                <SkeletonCard key={index} />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full max-h-full overflow-hidden">
      {/* Fixed Header */}
      <div className="flex-shrink-0">
        <PageHeaderSimple
          title="Gerenciamento de OSs"
          config={{
            type: "list",
            itemCount: filteredOrdens.length,
            refreshButton: {
              onClick: fetchData,
            },
            newButton: {
              label: "Nova OS",
              link: "/admin/os_aberto/novo",
            },
          }}
        />
      </div>

      {/* Fixed Filters Container - Componente separado */}
      <div className="flex-shrink-0">
        <FilterPanel
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          situacoes={situacoes}
          setSituacoes={setSituacoes}
          tecnicoFiltros={tecnicoFiltros}
          setTecnicoFiltros={setTecnicoFiltros}
        />
      </div>

      {/* Scrollable Content Area */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <div className="h-full overflow-y-auto custom-scrollbar scroll-smooth px-1 pr-2">
          <div className="space-y-4 pb-6">
            {filteredOrdens.map((os) => (
              <div
                key={os.id_os}
                ref={(element) => {
                  if (!element) {
                    cardRefs.current.delete(os.id_os);
                  } else {
                    cardRefs.current.set(os.id_os, element);
                  }
                }}
              >
                <OSCard
                  os={os}
                  isExpanded={expandedCards.has(os.id_os)}
                  toggleCardExpansion={toggleCardExpansion}
                  getFormaAberturaTexto={getFormaAberturaTexto}
                  formatWhatsAppUrl={formatWhatsAppUrl}
                  formatEmailUrl={formatEmailUrl}
                  formatGoogleMapsUrl={formatGoogleMapsUrl}
                  onLiberarFinanceiramente={handleOpenLiberacaoModal}
                  onAlterarPendencia={handleOpenPendenciaModal}
                  onAdicionarTecnico={createAdicionarTecnicoHandler(os)}
                  onAlterarTecnico={createAlterarTecnicoHandler(os)}
                  onEditarOS={handleEditarOS}
                  onCancelarOS={handleOpenCancelamentoModal}
                  onHistoricoCliente={handleOpenHistoricoCliente}
                  onHistoricoMaquina={handleOpenHistoricoMaquina}
                />
              </div>
            ))}
          </div>

          {filteredOrdens.length === 0 && (
            <EmptyState resetFilters={resetFilters} />
          )}
        </div>
      </div>

      {/* Modal de Liberação Financeira */}
      <LiberacaoFinanceiraModal
        isOpen={modalLiberacao.isOpen}
        osId={modalLiberacao.osId}
        onClose={handleCloseLiberacaoModal}
        onConfirm={handleConfirmLiberacaoFinanceira}
      />

      {/* Modal de Alteração de Pendência */}
      <AlterarPendenciaModal
        isOpen={modalPendencia.isOpen}
        osId={modalPendencia.osId}
        currentMotivoId={modalPendencia.currentMotivoId}
        currentMotivoText={modalPendencia.currentMotivoText}
        onClose={handleClosePendenciaModal}
        onConfirm={handleConfirmAlterarPendencia}
      />

      {/* Modal de Gerenciamento de Técnico */}
      <TecnicoModal
        isOpen={modalTecnico.isOpen}
        osId={modalTecnico.osId}
        idRegiao={modalTecnico.idRegiao}
        nomeRegiao={modalTecnico.nomeRegiao} // Adicionar esta linha
        mode={modalTecnico.mode}
        currentTecnicoId={modalTecnico.currentTecnicoId}
        currentTecnicoNome={modalTecnico.currentTecnicoNome}
        onClose={handleCloseTecnicoModal}
        onConfirm={handleConfirmTecnico}
      />

      {/* Modal de Histórico */}
      <HistoricoModal
        isOpen={historicoModal.isOpen}
        tipo={historicoModal.tipo}
        targetId={historicoModal.targetId}
        targetLabel={historicoModal.targetLabel || undefined}
        onClose={handleCloseHistoricoModal}
      />

      {/* Modal de Cancelamento de OS */}
      <CancelarOSModal
        isOpen={modalCancelamento.isOpen}
        osId={modalCancelamento.osId}
        onClose={handleCloseCancelamentoModal}
        onConfirm={handleConfirmCancelamento}
      />
    </div>
  );
};

export default TelaOSAbertas;
