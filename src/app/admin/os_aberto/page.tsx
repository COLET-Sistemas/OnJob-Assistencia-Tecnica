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
import { useTitle } from "@/context/TitleContext";
import { feedback } from "@/utils/feedback";
import FilterPanel from "@/app/admin/os_aberto/components/FilterPanel";
import EmptyState from "@/app/admin/os_aberto/components/EmptyState";
import OSCard from "@/app/admin/os_aberto/components/OSCard";
import SkeletonCard from "@/app/admin/os_aberto/components/SkeletonCard";
import { OrdemServico } from "@/types/OrdemServico";

// Usando a interface OrdemServico do arquivo de tipos

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

  const { setTitle } = useTitle();

  // Define o título da página
  useEffect(() => {
    setTitle("Ordens de Serviço Abertas");
  }, [setTitle]);

  const [situacoes, setSituacoes] = useState({
    pendente: true,
    aAtender: true,
    emDeslocamento: true,
    emAtendimento: true,
    atendimentoInterrompido: true,
  });

  // Função para buscar os dados da API
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

        // Filtramos as ordens com base nas situações selecionadas
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

  // Carrega os dados na primeira renderização
  useEffect(() => {
    if (!didFetch.current) {
      fetchData();
      didFetch.current = true;
    }
  }, [fetchData]);

  // Quando as situações mudarem, filtramos as ordens novamente sem chamar a API
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

  // Função para alternar a expansão dos cards
  const toggleCardExpansion = useCallback((osId: number) => {
    setExpandedCards((prev) => {
      const newExpanded = new Set<number>();
      if (!prev.has(osId)) {
        newExpanded.add(osId);
      }
      return newExpanded;
    });
  }, []);

  // Função para formatar o texto de forma de abertura
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

  // Helper functions para ações de contato
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

  // Memoização para melhorar performance e evitar re-renderizações desnecessárias
  const filteredOrdens = useMemo(() => {
    return ordensServico.filter((os) => {
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
              />
            ))}
          </div>

          {/* Empty State - Componente separado */}
          {filteredOrdens.length === 0 && (
            <EmptyState resetFilters={resetFilters} />
          )}
        </div>
      </div>
    </div>
  );
};

export default TelaOSAbertas;
