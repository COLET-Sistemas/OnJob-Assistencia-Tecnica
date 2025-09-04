"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Search,
  Calendar,
  User,
  MapPin,
  AlertCircle,
  Settings,
  Phone,
  Mail,
  ChevronDown,
  ChevronUp,
  CircleCheck,
  CircleX,
  AlertTriangle,
  CheckCircle,
  Check,
  MessageCircle,
  ExternalLink,
} from "lucide-react";
import PageHeaderSimple from "@/components/admin/ui/PageHeaderSimple";
import { ordensServicoService } from "@/api/services/ordensServicoService";
import { useTitle } from "@/context/TitleContext";
import { Loading } from "@/components/LoadingPersonalizado";
import { formatarDataHora, isDataAgendadaPassada } from "@/utils/formatters";

interface OrdemServico {
  id_os: number;
  descricao_problema: string;
  em_garantia: boolean;
  abertura: {
    data_abertura: string;
    forma_abertura: string;
    origem_abertura: string;
    id_usuario: number;
    nome_usuario: string;
    id_motivo_atendimento?: number;
    motivo_atendimento?: string;
  };
  data_agendada?: string;
  cliente: {
    id: number;
    nome: string;
    endereco?: string;
    numero?: string;
    complemento?: string;
    bairro?: string;
    cidade: string;
    uf: string;
    cep?: string;
    latitude?: string;
    longitude?: string;
  };
  contato: {
    id: number;
    nome: string;
    telefone: string;
    whatsapp: string;
    email: string;
  };
  maquina: {
    id: number;
    numero_serie: string;
    descricao: string;
    modelo: string;
  };
  situacao_os: {
    codigo: number;
    descricao: string;
    id_motivo_pendencia: number;
    motivo_pendencia: string;
  };
  tecnico: {
    id: number;
    nome: string;
    tipo?: string; // Adicionando o campo tipo para o técnico
    observacoes: string;
  };
  liberacao_financeira: {
    liberada: boolean;
    id_usuario_liberacao: number;
    nome_usuario_liberacao: string;
  };
  revisao_os: {
    id_usuario: number;
    nome: string;
    data: string;
    observacoes: string;
  };
}

// Objeto que mapeia os nomes das situações para os códigos da API
const situacoesMap = {
  pendente: 1,
  aAtender: 2,
  emDeslocamento: 3,
  emAtendimento: 4,
  atendimentoInterrompido: 5,
};

const TelaOSAbertas: React.FC = () => {
  const [ordensServico, setOrdensServico] = useState<OrdemServico[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedCards, setExpandedCards] = useState<Set<number>>(new Set());
  const [tecnicoTipo, setTecnicoTipo] = useState<string>("todos"); // Novo state para filtro de tipo de técnico

  const { setTitle } = useTitle();

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

  const fetchData = useCallback(
    async (situacoesParam = situacoes) => {
      try {
        setLoading(true);
        const getSituacoesSelecionadas = () => {
          const codigos = Object.entries(situacoesParam)
            .filter(([, isSelected]) => isSelected)
            .map(([key]) => situacoesMap[key as keyof typeof situacoesMap]);

          return codigos.join(",");
        };

        const situacoesSelecionadas = getSituacoesSelecionadas();

        const response = await ordensServicoService.getAll({
          resumido: "S",
          situacao: situacoesSelecionadas,
        });

        if (response && response.dados) {
          setOrdensServico(response.dados as unknown as OrdemServico[]);
        } else {
          console.warn("Resposta inesperada da API:", response);
          setOrdensServico([]);
        }
      } catch (error) {
        console.error("Erro ao buscar ordens de serviço:", error);
        setOrdensServico([]);
      } finally {
        setLoading(false);
      }
    },
    [situacoes]
  );

  const didFetch = useRef(false);

  useEffect(() => {
    if (!didFetch.current) {
      fetchData();
      didFetch.current = true;
    }
  }, [fetchData]);

  const handleSituacoesChange = (newSituacoes: typeof situacoes) => {
    setSituacoes(newSituacoes);
    fetchData(newSituacoes);
  };

  const toggleCardExpansion = (osId: number) => {
    const newExpanded = new Set<number>();

    if (!expandedCards.has(osId)) {
      newExpanded.add(osId);
    }
    setExpandedCards(newExpanded);
  };

  const getFormaAberturaTexto = (forma: string) => {
    const formas: Record<string, string> = {
      email: "E-mail",
      whatsapp: "WhatsApp",
      telefone: "Telefone",
      carta: "Presencial",
      sistema: "Sistema",
    };
    return formas[forma] || forma;
  };

  // Helper functions for contact actions
  const formatWhatsAppUrl = (telefone: string) => {
    const cleanPhone = telefone.replace(/\D/g, "");
    return `https://wa.me/55${cleanPhone}`;
  };

  const formatEmailUrl = (email: string) => {
    return `mailto:${email}`;
  };

  const formatGoogleMapsUrl = (cliente: OrdemServico["cliente"]) => {
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
  };

  const filteredOrdens = ordensServico.filter((os) => {
    const matchSearch =
      searchTerm === "" ||
      `OS-${os.id_os}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      os.cliente.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      os.contato.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      os.maquina.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
      os.maquina.numero_serie.toLowerCase().includes(searchTerm.toLowerCase());

    // Filtro por tipo de técnico
    const matchTecnicoTipo =
      tecnicoTipo === "todos" ||
      (tecnicoTipo === "indefinido" &&
        (!os.tecnico.tipo || !os.tecnico.nome)) ||
      os.tecnico.tipo === tecnicoTipo;

    return matchSearch && matchTecnicoTipo;
  });

  if (loading) {
    return (
      <Loading
        text="Buscando ordens de serviço pendentes..."
        fullScreen={true}
      />
    );
  }

  return (
    <>
      <PageHeaderSimple
        title="Ordens de Serviço Abertas"
        config={{
          type: "list",
          itemCount: filteredOrdens.length,
          newButton: {
            label: "Nova OS",
            link: "/admin/os_aberto/novo",
          },
        }}
      />

      <div className="bg-white rounded-xl shadow-sm border border-gray-100  overflow-hidden">
        <div className="p-4">
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="lg:w-[35%] order-2 lg:order-1">
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Buscar Ordem de Serviço
              </label>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Digite o número, cliente ou equipamento..."
                  className="w-full pl-12 pr-4 py-3.5 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all shadow-sm"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {/* Status Filter Buttons - 65% da largura */}
            <div className="lg:w-[65%] order-1 lg:order-2">
              <div className="flex justify-between items-center mb-3">
                <label className="block text-sm font-semibold text-gray-700">
                  Filtrar por Situação
                </label>
                {(!situacoes.pendente ||
                  !situacoes.aAtender ||
                  !situacoes.emDeslocamento ||
                  !situacoes.emAtendimento ||
                  !situacoes.atendimentoInterrompido) && (
                  <button
                    type="button"
                    className="px-2 py-1 text-xs bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-md font-medium transition-colors border border-indigo-200 flex items-center gap-1"
                    onClick={() => {
                      const newSituacoes = {
                        pendente: true,
                        aAtender: true,
                        emDeslocamento: true,
                        emAtendimento: true,
                        atendimentoInterrompido: true,
                      };
                      handleSituacoesChange(newSituacoes);
                    }}
                  >
                    <Check className="w-3.5 h-3.5" />
                    Selecionar todos
                  </button>
                )}
              </div>
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    className={`px-3 py-2 rounded-lg font-medium text-sm flex items-center gap-1.5 transition-all ${
                      situacoes.pendente
                        ? "bg-emerald-100 text-emerald-800 border border-emerald-200 shadow-sm"
                        : "bg-white text-gray-500 border border-gray-200 hover:bg-gray-50"
                    }`}
                    onClick={() =>
                      handleSituacoesChange({
                        ...situacoes,
                        pendente: !situacoes.pendente,
                      })
                    }
                  >
                    {situacoes.pendente && <Check className="w-4 h-4" />}
                    <span className="whitespace-nowrap">Pendente</span>
                  </button>

                  <button
                    type="button"
                    className={`px-3 py-2 rounded-lg font-medium text-sm flex items-center gap-1.5 transition-all ${
                      situacoes.aAtender
                        ? "bg-purple-100 text-purple-800 border border-purple-200 shadow-sm"
                        : "bg-white text-gray-500 border border-gray-200 hover:bg-gray-50"
                    }`}
                    onClick={() =>
                      handleSituacoesChange({
                        ...situacoes,
                        aAtender: !situacoes.aAtender,
                      })
                    }
                  >
                    {situacoes.aAtender && <Check className="w-4 h-4" />}
                    <span className="whitespace-nowrap">Por Atender</span>
                  </button>

                  <button
                    type="button"
                    className={`px-3 py-2 rounded-lg font-medium text-sm flex items-center gap-1.5 transition-all ${
                      situacoes.emDeslocamento
                        ? "bg-amber-100 text-amber-800 border border-amber-200 shadow-sm"
                        : "bg-white text-gray-500 border border-gray-200 hover:bg-gray-50"
                    }`}
                    onClick={() =>
                      handleSituacoesChange({
                        ...situacoes,
                        emDeslocamento: !situacoes.emDeslocamento,
                      })
                    }
                  >
                    {situacoes.emDeslocamento && <Check className="w-4 h-4" />}
                    <span className="whitespace-nowrap">Em Deslocamento</span>
                  </button>

                  <button
                    type="button"
                    className={`px-3 py-2 rounded-lg font-medium text-sm flex items-center gap-1.5 transition-all ${
                      situacoes.emAtendimento
                        ? "bg-blue-100 text-blue-800 border border-blue-200 shadow-sm"
                        : "bg-white text-gray-500 border border-gray-200 hover:bg-gray-50"
                    }`}
                    onClick={() =>
                      handleSituacoesChange({
                        ...situacoes,
                        emAtendimento: !situacoes.emAtendimento,
                      })
                    }
                  >
                    {situacoes.emAtendimento && <Check className="w-4 h-4" />}
                    <span className="whitespace-nowrap">Em Atendimento</span>
                  </button>

                  <button
                    type="button"
                    className={`px-3 py-2 rounded-lg font-medium text-sm flex items-center gap-1.5 transition-all ${
                      situacoes.atendimentoInterrompido
                        ? "bg-red-100 text-red-800 border border-red-200 shadow-sm"
                        : "bg-white text-gray-500 border border-gray-200 hover:bg-gray-50"
                    }`}
                    onClick={() =>
                      handleSituacoesChange({
                        ...situacoes,
                        atendimentoInterrompido:
                          !situacoes.atendimentoInterrompido,
                      })
                    }
                  >
                    {situacoes.atendimentoInterrompido && (
                      <Check className="w-4 h-4" />
                    )}
                    <span className="whitespace-nowrap">Interrompido</span>
                  </button>
                </div>
              </div>

              {/* Filtro de Tipo de Técnico */}
              <div className="mt-4">
                <div className="flex justify-between items-center mb-3">
                  <label className="block text-sm font-semibold text-gray-700">
                    Tipo de Técnico
                  </label>
                  {tecnicoTipo !== "todos" && (
                    <button
                      type="button"
                      className="px-2 py-1 text-xs bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-md font-medium transition-colors border border-indigo-200 flex items-center gap-1"
                      onClick={() => setTecnicoTipo("todos")}
                    >
                      <Check className="w-3.5 h-3.5" />
                      Mostrar todos
                    </button>
                  )}
                </div>
                <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      className={`px-3 py-2 rounded-lg font-medium text-sm flex items-center gap-1.5 transition-all ${
                        tecnicoTipo === "todos"
                          ? "bg-indigo-100 text-indigo-800 border border-indigo-200 shadow-sm"
                          : "bg-white text-gray-500 border border-gray-200 hover:bg-gray-50"
                      }`}
                      onClick={() => setTecnicoTipo("todos")}
                    >
                      {tecnicoTipo === "todos" && <Check className="w-4 h-4" />}
                      <span className="whitespace-nowrap">Todos</span>
                    </button>
                    <button
                      type="button"
                      className={`px-3 py-2 rounded-lg font-medium text-sm flex items-center gap-1.5 transition-all ${
                        tecnicoTipo === "interno"
                          ? "bg-blue-100 text-blue-800 border border-blue-200 shadow-sm"
                          : "bg-white text-gray-500 border border-gray-200 hover:bg-gray-50"
                      }`}
                      onClick={() => setTecnicoTipo("interno")}
                    >
                      {tecnicoTipo === "interno" && (
                        <Check className="w-4 h-4" />
                      )}
                      <span className="whitespace-nowrap">Internos</span>
                    </button>
                    <button
                      type="button"
                      className={`px-3 py-2 rounded-lg font-medium text-sm flex items-center gap-1.5 transition-all ${
                        tecnicoTipo === "terceiro"
                          ? "bg-amber-100 text-amber-800 border border-amber-200 shadow-sm"
                          : "bg-white text-gray-500 border border-gray-200 hover:bg-gray-50"
                      }`}
                      onClick={() => setTecnicoTipo("terceiro")}
                    >
                      {tecnicoTipo === "terceiro" && (
                        <Check className="w-4 h-4" />
                      )}
                      <span className="whitespace-nowrap">Terceirizados</span>
                    </button>
                    <button
                      type="button"
                      className={`px-3 py-2 rounded-lg font-medium text-sm flex items-center gap-1.5 transition-all ${
                        tecnicoTipo === "indefinido"
                          ? "bg-red-100 text-red-800 border border-red-200 shadow-sm"
                          : "bg-white text-gray-500 border border-gray-200 hover:bg-gray-50"
                      }`}
                      onClick={() => setTecnicoTipo("indefinido")}
                    >
                      {tecnicoTipo === "indefinido" && (
                        <Check className="w-4 h-4" />
                      )}
                      <span className="whitespace-nowrap">Indefinidos</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Espaço antes da lista */}
      <div className="mb-6"></div>

      {/* OS Cards */}
      <div className="space-y-4">
        {filteredOrdens.map((os) => {
          // Verificamos apenas se o card está expandido
          const isExpanded = expandedCards.has(os.id_os);

          // Não precisamos mais da variável dataAgendadaObj

          return (
            <div
              key={os.id_os}
              className={`bg-white rounded-xl shadow-sm border hover:shadow-md transition-all duration-300 overflow-hidden ${
                isExpanded ? "border-indigo-200" : "border-gray-100"
              }`}
            >
              {/* Compact Header - Always Visible */}
              <div className="p-5">
                <div className="flex items-center justify-between">
                  {/* Left side - Main info */}
                  <div className="flex items-center space-x-4 lg:space-x-6 flex-1">
                    {/* Status indicator */}
                    <div
                      className={`w-2 h-16 rounded-sm hidden sm:block ${
                        os.situacao_os.codigo === 1
                          ? "bg-emerald-500"
                          : os.situacao_os.codigo === 2
                          ? "bg-purple-500"
                          : os.situacao_os.codigo === 3
                          ? "bg-amber-500"
                          : os.situacao_os.codigo === 4
                          ? "bg-blue-500"
                          : "bg-red-500"
                      }`}
                    ></div>

                    {/* Primary Info Container */}
                    <div className="flex-grow grid grid-cols-1 md:grid-cols-12 gap-4 min-w-0">
                      {/* OS Number - Left aligned */}
                      <div className="md:col-span-1 flex items-center">
                        <div className="flex flex-col">
                          <div className="text-lg font-semibold text-gray-700">
                            #{os.id_os}
                          </div>
                        </div>
                      </div>

                      {/* Client Info - More prominent */}
                      <div className="md:col-span-4">
                        <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                          Cliente / Cidade
                        </div>
                        <div className="font-semibold text-gray-900 truncate text-base mt-1">
                          {os.cliente.nome}
                        </div>
                        <div className="text-sm text-gray-600 flex items-center gap-1.5 mt-0.5">
                          <MapPin className="w-3.5 h-3.5 flex-shrink-0 my-auto" />
                          <span className="my-auto">
                            {os.cliente.cidade}/{os.cliente.uf}
                          </span>
                        </div>
                      </div>

                      {/* Equipment Info - More prominent */}
                      <div className="md:col-span-4">
                        <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                          Máquina / Série
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="font-semibold text-gray-900 truncate text-base mt-1">
                            {os.maquina.modelo || os.maquina.descricao}
                          </div>
                          <div
                            className="w-4 h-4 flex items-center justify-center"
                            title={
                              os.em_garantia
                                ? "Em garantia"
                                : "Fora da garantia"
                            }
                          >
                            {os.em_garantia ? (
                              <CircleCheck className="w-4 h-4 text-emerald-500" />
                            ) : (
                              <CircleX className="w-4 h-4 text-amber-500" />
                            )}
                          </div>
                        </div>
                        <div className="text-sm text-gray-600 flex items-center gap-1.5 mt-0.5">
                          <Settings className="w-3.5 h-3.5 flex-shrink-0 my-auto" />
                          <span className="my-auto">
                            {os.maquina.numero_serie}
                          </span>
                        </div>
                      </div>

                      {/* Date and Tech Info - Combined */}
                      <div className="md:col-span-3">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-1.5 text-sm text-gray-600">
                            <User className="w-3.5 h-3.5 flex-shrink-0 text-gray-500 my-auto" />
                            {os.tecnico.nome ? (
                              <div className="flex items-center gap-1.5 truncate my-auto">
                                <span className="font-bold text-md truncate">
                                  {os.tecnico.nome}
                                </span>
                                {os.tecnico.tipo && (
                                  <span
                                    className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
                                      os.tecnico.tipo === "interno"
                                        ? "bg-blue-50 text-blue-600 border border-blue-100"
                                        : os.tecnico.tipo === "terceiro"
                                        ? "bg-amber-50 text-amber-600 border border-amber-100"
                                        : ""
                                    }`}
                                  >
                                    {os.tecnico.tipo === "interno"
                                      ? "Interno"
                                      : "Terceiro"}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-red-600 font-medium my-auto">
                                Técnico indefinido
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-1.5 text-sm text-gray-600">
                            <Calendar className="w-3.5 h-3.5 flex-shrink-0 text-gray-500 my-auto" />
                            <span className="font-medium my-auto">
                              Abertura:{" "}
                              {
                                formatarDataHora(os.abertura.data_abertura)
                                  ?.data
                              }
                            </span>
                          </div>

                          {os.data_agendada && (
                            <div
                              className={`flex items-center gap-1.5 text-sm ${
                                isDataAgendadaPassada(os.data_agendada)
                                  ? "text-red-600"
                                  : "text-indigo-600"
                              }`}
                            >
                              <Calendar className="w-3.5 h-3.5 flex-shrink-0 my-auto" />
                              <span className="font-medium my-auto">
                                Agendado:{" "}
                                {formatarDataHora(os.data_agendada)?.data}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right side - Status and Actions */}
                  <div className="flex flex-col items-end gap-2 ml-3">
                    <div className="flex flex-wrap gap-2 justify-end">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-md text-xs font-medium ${
                          os.situacao_os.codigo === 1
                            ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                            : os.situacao_os.codigo === 2
                            ? "bg-purple-100 text-purple-800 border border-purple-200"
                            : os.situacao_os.codigo === 3
                            ? "bg-amber-100 text-amber-800 border border-amber-200"
                            : os.situacao_os.codigo === 4
                            ? "bg-blue-100 text-blue-800 border border-blue-200"
                            : "bg-red-100 text-red-800 border border-red-200"
                        }`}
                      >
                        <span className="my-auto">
                          {os.situacao_os.descricao}
                        </span>
                      </span>
                    </div>

                    {/* Expand Button */}
                    <button
                      onClick={() => toggleCardExpansion(os.id_os)}
                      className={`p-2 rounded-lg transition-all duration-200 flex items-center justify-center ${
                        isExpanded
                          ? "text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200"
                          : "text-gray-400 hover:text-gray-600 hover:bg-gray-100 border border-transparent"
                      }`}
                      aria-label={
                        isExpanded ? "Esconder detalhes" : "Mostrar detalhes"
                      }
                    >
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5 my-auto" />
                      ) : (
                        <ChevronDown className="w-5 h-5 my-auto" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Expanded Details */}
              {isExpanded && (
                <div className="border-t border-gray-100 bg-gray-50">
                  <div className="p-4">
                    {/* Problema e informações adicionais - única seção */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Descrição do Problema e Abertura */}
                      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <AlertCircle className="w-4 h-4 text-indigo-500" />
                          <h4 className="font-medium text-gray-700">
                            Descrição do Problema
                          </h4>
                        </div>
                        <p className="text-gray-800 text-sm mb-3">
                          {os.descricao_problema || "Sem descrição fornecida"}
                        </p>

                        {/* Informações de Abertura */}
                        <div className="mt-3 pt-3 border-t border-gray-100">
                          <div className="flex justify-between text-xs text-gray-600">
                            <div className="flex items-center gap-1.5">
                              <User className="w-3 h-3 text-gray-500" />
                              <span>
                                Aberto por:{" "}
                                <span className="font-medium">
                                  {os.abertura.nome_usuario}
                                </span>
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Calendar className="w-3 h-3 text-gray-500" />
                              <span>
                                Via{" "}
                                {getFormaAberturaTexto(
                                  os.abertura.forma_abertura
                                )}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Informação de Liberação Financeira */}
                        <div className="mt-3 pt-3 border-t border-gray-100">
                          <div className="flex items-center gap-1.5">
                            {os.liberacao_financeira.liberada ? (
                              <span className="text-emerald-600 text-xs flex items-center gap-1">
                                <CheckCircle className="w-3 h-3" />
                                Liberação financeira:{" "}
                                <span className="font-medium">
                                  {
                                    os.liberacao_financeira
                                      .nome_usuario_liberacao
                                  }
                                </span>
                              </span>
                            ) : (
                              <span className="text-amber-600 text-xs flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3" />
                                Aguardando liberação financeira
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Motivo Pendência quando existir */}
                        {os.situacao_os.motivo_pendencia && (
                          <div className="mt-3 pt-3 border-t border-gray-100">
                            <div className="text-xs text-gray-700 mb-1 font-medium">
                              Motivo da Pendência:
                            </div>
                            <div className="px-3 py-1.5 bg-orange-50 border border-orange-100 rounded text-orange-700 text-xs">
                              {os.situacao_os.motivo_pendencia}
                            </div>
                          </div>
                        )}
                        {/* Observações do técnico quando existirem */}
                        {os.tecnico.observacoes && (
                          <div className="mt-4 pt-4 border-t border-gray-100">
                            <div className="flex items-center gap-2 mb-2">
                              <User className="w-4 h-4 text-indigo-500" />
                              <h4 className="font-medium text-gray-700 flex items-center gap-2">
                                Observações do Técnico
                                {os.tecnico.tipo && (
                                  <span
                                    className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
                                      os.tecnico.tipo === "interno"
                                        ? "bg-blue-50 text-blue-600 border border-blue-100"
                                        : os.tecnico.tipo === "terceiro"
                                        ? "bg-amber-50 text-amber-600 border border-amber-100"
                                        : ""
                                    }`}
                                  >
                                    {os.tecnico.tipo === "interno"
                                      ? "Interno"
                                      : "Terceiro"}
                                  </span>
                                )}
                              </h4>
                            </div>
                            <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded border border-gray-100">
                              {os.tecnico.observacoes}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Endereço e Contato - Informações Adicionais */}
                      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <MapPin className="w-4 h-4 text-indigo-500" />
                          <h4 className="font-medium text-gray-700">
                            Endereço Completo
                          </h4>
                        </div>

                        <div className="text-sm text-gray-600 mb-4">
                          {os.cliente.endereco ? (
                            <div className="space-y-1">
                              <div className="flex justify-between items-start">
                                <div className="space-y-1 flex-1">
                                  <p>
                                    {os.cliente.endereco}, {os.cliente.numero} -{" "}
                                    {os.cliente.bairro}, {os.cliente.cidade}/
                                    {os.cliente.uf}
                                  </p>
                                  {os.cliente.complemento && (
                                    <p>Complemento: {os.cliente.complemento}</p>
                                  )}
                                  {os.cliente.cep && (
                                    <p>CEP: {os.cliente.cep}</p>
                                  )}
                                </div>

                                {/* Google Maps Button */}
                                <div className="ml-2 flex-shrink-0">
                                  <a
                                    href={formatGoogleMapsUrl(os.cliente)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg text-xs font-medium transition-colors border border-blue-200"
                                  >
                                    <MapPin className="w-3.5 h-3.5" />
                                    Google Maps
                                    <ExternalLink className="w-3 h-3" />
                                  </a>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <p className="text-gray-500 italic">
                              Endereço não cadastrado
                            </p>
                          )}
                        </div>

                        <div className="mt-4 pt-4 border-t border-gray-100">
                          <div className="flex items-center gap-2 mb-2">
                            <Phone className="w-4 h-4 text-indigo-500" />
                            <h4 className="font-medium text-gray-700">
                              Contato
                            </h4>
                          </div>

                          <div className="text-sm space-y-2">
                            <div className="flex items-center justify-between">
                              {os.contato.telefone && (
                                <div className="flex items-center gap-1.5 text-gray-600">
                                  <Phone className="w-3 h-3 text-gray-600" />
                                  <span>{os.contato.telefone}</span>
                                  {os.contato.whatsapp && (
                                    <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                                  )}
                                </div>
                              )}
                              {/* WhatsApp Button */}
                              {os.contato.whatsapp && (
                                <a
                                  href={formatWhatsAppUrl(os.contato.telefone)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-md text-xs font-medium transition-colors border border-emerald-200"
                                >
                                  <MessageCircle className="w-3 h-3" />
                                  WhatsApp
                                  <ExternalLink className="w-2.5 h-2.5" />
                                </a>
                              )}
                            </div>

                            {os.contato.email && (
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5 text-gray-600">
                                  <Mail className="w-3 h-3 text-gray-600" />
                                  <span>{os.contato.email}</span>
                                </div>

                                {/* Email Button */}
                                <a
                                  href={formatEmailUrl(os.contato.email)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-md text-xs font-medium transition-colors border border-blue-200"
                                >
                                  <Mail className="w-3 h-3" />
                                  Enviar email
                                  <ExternalLink className="w-2.5 h-2.5" />
                                </a>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredOrdens.length === 0 && (
        <div className="text-center py-16 bg-white rounded-xl shadow-sm border border-gray-100 p-10">
          <div className="mx-auto w-24 h-24 bg-indigo-50 rounded-full flex items-center justify-center mb-6">
            <AlertCircle className="w-12 h-12 text-indigo-400" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-3">
            Nenhuma OS encontrada
          </h3>
          <p className="text-gray-600 max-w-md mx-auto leading-relaxed mb-8">
            Não há ordens de serviço pendentes no momento ou que correspondam
            aos filtros aplicados.
          </p>
          <div className="flex justify-center gap-4">
            <button
              type="button"
              onClick={() => {
                const newSituacoes = {
                  pendente: true,
                  aAtender: true,
                  emDeslocamento: true,
                  emAtendimento: true,
                  atendimentoInterrompido: true,
                };
                handleSituacoesChange(newSituacoes);
                setTecnicoTipo("todos");
              }}
              className="px-4 py-2 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              <Check className="w-4 h-4" />
              Ativar todos os filtros
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default TelaOSAbertas;
