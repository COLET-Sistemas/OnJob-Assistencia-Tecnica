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
import { feedback } from "@/utils/feedback";
import FilterPanel from "@/app/admin/os_aberto/components/FilterPanel";
import EmptyState from "@/app/admin/os_aberto/components/EmptyState";
import OSCard from "@/app/admin/os_aberto/components/OSCard";
import SkeletonCard from "@/app/admin/os_aberto/components/SkeletonCard";
import LiberacaoFinanceiraModal from "@/app/admin/os_aberto/components/LiberacaoFinanceiraModal";
import AlterarPendenciaModal from "@/app/admin/os_aberto/components/AlterarPendenciaModal";
import TecnicoModal from "@/app/admin/os_aberto/components/TecnicoModal";
import { OrdemServico } from "@/types/OrdemServico";

const CODIGO_SITUACAO = {
  PENDENTE: 1,
  A_ATENDER: 2,
  EM_DESLOCAMENTO: 3,
  EM_ATENDIMENTO: 4,
  ATENDIMENTO_INTERROMPIDO: 5,
};

const TelaOSAbertas: React.FC = () => {
  const [ordensServico, setOrdensServico] = useState<OrdemServico[]>([]);
  const [allOrdensServico, setAllOrdensServico] = useState<OrdemServico[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedCards, setExpandedCards] = useState<Set<number>>(new Set());
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

  const [modalTecnico, setModalTecnico] = useState({
    isOpen: false,
    osId: 0,
    idRegiao: 0,
    nomeRegiao: "",
    mode: "add" as "add" | "edit",
    currentTecnicoId: 0,
    currentTecnicoNome: "",
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

        if (didFetch.current) {
          feedback.toast("Lista de ordens de serviço atualizada", "success");
        }
      } else {
        console.warn("Resposta inesperada da API:", response);
        setAllOrdensServico([]);
        setOrdensServico([]);
        if (didFetch.current) {
          feedback.toast("Nenhuma ordem de serviço encontrada", "info");
        }
      }
    } catch (error) {
      console.error("Erro ao buscar ordens de serviço:", error);
      setAllOrdensServico([]);
      setOrdensServico([]);
      if (didFetch.current) {
        feedback.toast("Erro ao atualizar a lista", "error");
      }
    } finally {
      setLoading(false);
    }
  }, [situacoes]);

  const didFetch = useRef(false);

  useEffect(() => {
    if (!didFetch.current) {
      fetchData();
      didFetch.current = true;
    }
  }, [fetchData]);

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

        // Atualiza os dados após a liberação
        await fetchData();
        feedback.toast("OS liberada com sucesso", "success");
        handleCloseLiberacaoModal();
        return Promise.resolve();
      } catch (error) {
        console.error("Erro ao liberar OS:", error);
        feedback.toast("Erro ao liberar OS", "error");
        return Promise.reject(error);
      }
    },
    [fetchData, handleCloseLiberacaoModal]
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

        // Atualiza os dados após a alteração
        await fetchData();

        if (motivoId === null) {
          feedback.toast("Pendência removida com sucesso", "success");
        } else {
          feedback.toast("Pendência alterada com sucesso", "success");
        }

        handleClosePendenciaModal();
        return Promise.resolve();
      } catch (error) {
        console.error("Erro ao alterar pendência:", error);
        feedback.toast("Erro ao alterar pendência", "error");
        return Promise.reject(error);
      }
    },
    [fetchData, handleClosePendenciaModal]
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
      nomeRegiao?: string, // Adicionar este parâmetro
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

  const handleConfirmTecnico = useCallback(
    async (osId: number, tecnicoId: number, tecnicoNome: string) => {
      try {
        // Aqui você faria a chamada para a API para definir/alterar o técnico
        // await ordensServicoService.definirTecnico(osId, tecnicoId);
        console.log("Definir técnico:", { osId, tecnicoId, tecnicoNome });

        // Atualiza os dados após a alteração
        await fetchData();

        if (modalTecnico.mode === "add") {
          feedback.toast("Técnico adicionado com sucesso", "success");
        } else {
          feedback.toast("Técnico alterado com sucesso", "success");
        }

        handleCloseTecnicoModal();
        return Promise.resolve();
      } catch (error) {
        console.error("Erro ao definir técnico:", error);
        feedback.toast("Erro ao definir técnico", "error");
        return Promise.reject(error);
      }
    },
    [fetchData, handleCloseTecnicoModal, modalTecnico.mode]
  );

  const filteredOrdens = useMemo(() => {
    return ordensServico.filter((os) => {
      // Verifica se a busca é específica por ID (quando começa com #)
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

  // Renderiza o loading
  if (loading) {
    return (
      <div className="flex flex-col h-full max-h-full overflow-hidden">
        {/* Fixed Header */}
        <div className="flex-shrink-0">
          <PageHeaderSimple
            title="Ordens de Serviços em Aberto"
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

        {/* Skeleton cards para as ordens de serviço */}
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
          title="Ordens de Serviços em Aberto"
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
              <OSCard
                key={os.id_os}
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
              />
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
    </div>
  );
};

export default TelaOSAbertas;
