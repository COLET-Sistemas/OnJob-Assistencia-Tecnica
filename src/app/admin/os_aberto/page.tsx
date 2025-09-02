"use client";
import React, { useState, useEffect, useCallback } from "react";
import {
  Search,
  Calendar,
  User,
  MapPin,
  AlertCircle,
  Clock,
  Settings,
  Phone,
  Mail,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  CheckCircle,
  Check,
} from "lucide-react";
import PageHeaderSimple from "@/components/admin/ui/PageHeaderSimple";
import { ordensServicoService } from "@/api/services/ordensServicoService";
import { useTitle } from "@/context/TitleContext";
import { Loading } from "@/components/LoadingPersonalizado";

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

  const { setTitle } = useTitle();

  useEffect(() => {
    setTitle("Ordens de Serviço Abertas");
  }, [setTitle]);

  // Estados para os checkboxes de situação
  const [situacoes, setSituacoes] = useState({
    pendente: true,
    aAtender: true,
    emDeslocamento: true,
    emAtendimento: true,
    atendimentoInterrompido: true,
  });

  // Função para obter as situações selecionadas como uma string para a API
  const getSituacoesSelecionadas = useCallback(() => {
    const codigos = Object.entries(situacoes)
      .filter(([, isSelected]) => isSelected)
      .map(([key]) => situacoesMap[key as keyof typeof situacoesMap]);

    return codigos.join(",");
  }, [situacoes]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Obtém as situações selecionadas para o filtro
        const situacoesSelecionadas = getSituacoesSelecionadas();

        // Faz a chamada à API com os parâmetros de situação
        const response = await ordensServicoService.getAll({
          resumido: "S",
          situacao: situacoesSelecionadas,
        });

        if (response && response.dados) {
          // Converter os dados da API para o formato OrdemServico
          // Esta é uma adaptação temporária até que os tipos sejam alinhados
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
    };

    fetchData();
  }, [situacoes, getSituacoesSelecionadas]); // Adiciona situacoes e função como dependências

  const toggleCardExpansion = (osId: number) => {
    const newExpanded = new Set(expandedCards);
    if (newExpanded.has(osId)) {
      newExpanded.delete(osId);
    } else {
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

  const formatarDataHora = (dataHora: string) => {
    if (!dataHora) return undefined;

    // Verifica se a data já está no formato dd/mm/yyyy
    if (dataHora.includes("/")) {
      const [data, hora] = dataHora.split(" ");
      // Não precisamos separar dia/mes/ano, já está formatado
      const [h, m] = hora ? hora.split(":") : ["", ""];
      const dataFormatada = data;
      const horaFormatada = h && m ? `${h}:${m}` : "";
      return { data: dataFormatada, hora: horaFormatada };
    } else {
      // Formato ISO yyyy-mm-dd
      const [data, hora] = dataHora.split(" ");
      const [ano, mes, dia] = data.split("-");
      const dataFormatada = `${dia}/${mes}/${ano}`;
      const [h, m] = hora ? hora.split(":") : ["", ""];
      const horaFormatada = h && m ? `${h}:${m}` : "";
      return { data: dataFormatada, hora: horaFormatada };
    }
  };

  const isDataAgendadaPassada = (dataAgendada: string) => {
    if (!dataAgendada) return false;

    let dataComparacao;
    if (dataAgendada.includes("/")) {
      // Formato dd/mm/yyyy
      const [data] = dataAgendada.split(" ");
      const [dia, mes, ano] = data.split("/");
      dataComparacao = new Date(
        parseInt(ano),
        parseInt(mes) - 1,
        parseInt(dia)
      );
    } else {
      // Formato ISO yyyy-mm-dd
      const [data] = dataAgendada.split(" ");
      dataComparacao = new Date(data);
    }

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    return dataComparacao < hoje;
  };

  const filteredOrdens = ordensServico.filter((os) => {
    const matchSearch =
      searchTerm === "" ||
      `OS-${os.id_os}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      os.cliente.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      os.contato.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      os.maquina.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
      os.maquina.numero_serie.toLowerCase().includes(searchTerm.toLowerCase());

    return matchSearch;
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
      {/* Cabeçalho usando o componente PageHeaderSimple */}
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

      {/* Filters Section - Sempre visível */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100  overflow-hidden">
        <div className="p-4">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Search - 35% da largura */}
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

            {/* Status Filter Checkboxes - 65% da largura */}
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
                      setSituacoes({
                        pendente: true,
                        aAtender: true,
                        emDeslocamento: true,
                        emAtendimento: true,
                        atendimentoInterrompido: true,
                      });
                    }}
                  >
                    <Check className="w-3.5 h-3.5" />
                    Selecionar todos
                  </button>
                )}
              </div>
              <div className="bg-gray-50 rounded-lg p-2.5 border border-gray-100">
                <div className="flex flex-wrap gap-1">
                  <label className="flex items-center space-x-2 cursor-pointer p-1.5 rounded hover:bg-gray-100 transition-colors">
                    <input
                      type="checkbox"
                      className="form-checkbox h-5 w-5 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                      checked={situacoes.pendente}
                      onChange={() =>
                        setSituacoes({
                          ...situacoes,
                          pendente: !situacoes.pendente,
                        })
                      }
                    />
                    <span className="text-gray-700 whitespace-nowrap">
                      Pendente
                    </span>
                  </label>

                  <label className="flex items-center space-x-2 cursor-pointer p-1.5 rounded hover:bg-gray-100 transition-colors">
                    <input
                      type="checkbox"
                      className="form-checkbox h-5 w-5 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                      checked={situacoes.aAtender}
                      onChange={() =>
                        setSituacoes({
                          ...situacoes,
                          aAtender: !situacoes.aAtender,
                        })
                      }
                    />
                    <span className="text-gray-700 whitespace-nowrap">
                      Por Atender
                    </span>
                  </label>

                  <label className="flex items-center space-x-2 cursor-pointer p-1.5 rounded hover:bg-gray-100 transition-colors">
                    <input
                      type="checkbox"
                      className="form-checkbox h-5 w-5 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                      checked={situacoes.emDeslocamento}
                      onChange={() =>
                        setSituacoes({
                          ...situacoes,
                          emDeslocamento: !situacoes.emDeslocamento,
                        })
                      }
                    />
                    <span className="text-gray-700 whitespace-nowrap">
                      Em Deslocamento
                    </span>
                  </label>

                  <label className="flex items-center space-x-2 cursor-pointer p-1.5 rounded hover:bg-gray-100 transition-colors">
                    <input
                      type="checkbox"
                      className="form-checkbox h-5 w-5 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                      checked={situacoes.emAtendimento}
                      onChange={() =>
                        setSituacoes({
                          ...situacoes,
                          emAtendimento: !situacoes.emAtendimento,
                        })
                      }
                    />
                    <span className="text-gray-700 whitespace-nowrap">
                      Em Atendimento
                    </span>
                  </label>

                  <label className="flex items-center space-x-2 cursor-pointer p-1.5 rounded hover:bg-gray-100 transition-colors">
                    <input
                      type="checkbox"
                      className="form-checkbox h-5 w-5 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                      checked={situacoes.atendimentoInterrompido}
                      onChange={() =>
                        setSituacoes({
                          ...situacoes,
                          atendimentoInterrompido:
                            !situacoes.atendimentoInterrompido,
                        })
                      }
                    />
                    <span className="text-gray-700 whitespace-nowrap">
                      Atend. Interrompido
                    </span>
                  </label>
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
          const dataHoraObj = formatarDataHora(os.abertura.data_abertura);
          const dataAbertura = dataHoraObj?.data || "";
          // Mesmo que não usemos horaAbertura diretamente, mantemos a variável para referência futura
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
                        os.em_garantia ? "bg-emerald-500" : "bg-amber-500"
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
                        <div className="font-semibold text-gray-900 truncate text-base mt-1">
                          {os.maquina.modelo || os.maquina.descricao}
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
                              <span className="font-medium truncate my-auto">
                                {os.tecnico.nome}
                              </span>
                            ) : (
                              <span className="text-red-600 font-medium my-auto">
                                Técnico indefinido
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 text-sm text-gray-600">
                            <Calendar className="w-3.5 h-3.5 flex-shrink-0 text-gray-500 my-auto" />
                            <span className="font-medium my-auto">
                              Abertura: {dataAbertura}
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
                            ? "bg-blue-100 text-blue-800 border border-blue-200"
                            : os.situacao_os.codigo === 2
                            ? "bg-amber-100 text-amber-800 border border-amber-200"
                            : os.situacao_os.codigo === 3
                            ? "bg-purple-100 text-purple-800 border border-purple-200"
                            : os.situacao_os.codigo === 4
                            ? "bg-red-100 text-red-800 border border-red-200"
                            : "bg-gray-100 text-gray-800 border border-gray-200"
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
                  <div className="p-6">
                    {/* Main Info Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                      {/* Problem Description - Now emphasized as most important */}
                      <div className="md:col-span-2">
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-full">
                          <div className="border-b border-gray-100 bg-gray-50 p-3 rounded-t-lg">
                            <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                              <AlertCircle className="w-4 h-4 text-indigo-600" />
                              Descrição do Problema
                            </h4>
                          </div>
                          <div className="p-4">
                            <p className="text-gray-800 leading-relaxed">
                              {os.descricao_problema ||
                                "Sem descrição fornecida"}
                            </p>
                          </div>

                          {/* Abertura Information */}
                          <div className="border-t border-gray-100 p-3 bg-gray-50 flex justify-between items-center text-sm rounded-b-lg">
                            <div className="flex items-center gap-1.5">
                              <Calendar className="w-4 h-4 text-gray-500 my-auto" />
                              <span className="my-auto">{dataAbertura}</span>
                            </div>
                            <div>
                              <span className="font-medium text-gray-700 my-auto">
                                {os.abertura.nome_usuario}
                              </span>
                              <span className="text-gray-500 mx-1.5">•</span>
                              <span className="text-gray-600 my-auto">
                                Via{" "}
                                {getFormaAberturaTexto(
                                  os.abertura.forma_abertura
                                )}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* OS Status Column */}
                      <div>
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-full">
                          <div className="border-b border-gray-100 bg-gray-50 p-3 rounded-t-lg">
                            <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                              <Clock className="w-4 h-4 text-indigo-600" />
                              Status do Atendimento
                            </h4>
                          </div>
                          <div className="p-4">
                            <div className="space-y-3">
                              <div>
                                <div className="text-sm text-gray-500 mb-1">
                                  Situação
                                </div>
                                <div className="flex items-center">
                                  <div
                                    className={`w-2 h-10 rounded-sm ${
                                      os.situacao_os.codigo === 1
                                        ? "bg-blue-500"
                                        : os.situacao_os.codigo === 2
                                        ? "bg-amber-500"
                                        : os.situacao_os.codigo === 3
                                        ? "bg-purple-500"
                                        : os.situacao_os.codigo === 4
                                        ? "bg-red-500"
                                        : "bg-gray-500"
                                    } mr-3`}
                                  ></div>
                                  <span className="font-semibold text-gray-900">
                                    {os.situacao_os.descricao}
                                  </span>
                                </div>
                              </div>

                              {os.situacao_os.motivo_pendencia && (
                                <div>
                                  <div className="text-sm text-gray-500 mb-1">
                                    Motivo
                                  </div>
                                  <div className="bg-orange-50 border border-orange-100 p-2 rounded-md text-orange-700 text-sm">
                                    {os.situacao_os.motivo_pendencia}
                                  </div>
                                </div>
                              )}

                              <div>
                                <div className="text-sm text-gray-500 mb-1">
                                  Garantia
                                </div>
                                <div
                                  className={`font-medium ${
                                    os.em_garantia
                                      ? "text-emerald-600"
                                      : "text-amber-600"
                                  }`}
                                >
                                  {os.em_garantia
                                    ? "Em Garantia"
                                    : "Fora da Garantia"}
                                </div>
                              </div>

                              {os.data_agendada && (
                                <div>
                                  <div className="text-sm text-gray-500 mb-1">
                                    Agendamento
                                  </div>
                                  <div
                                    className={`font-semibold ${
                                      isDataAgendadaPassada(os.data_agendada)
                                        ? "text-red-600"
                                        : "text-indigo-600"
                                    } flex items-center gap-1.5`}
                                  >
                                    <Calendar className="w-4 h-4" />
                                    <span>
                                      {formatarDataHora(os.data_agendada)?.data}
                                    </span>
                                  </div>
                                  {formatarDataHora(os.data_agendada)?.hora && (
                                    <div className="text-sm text-gray-700 mt-0.5">
                                      Horário:{" "}
                                      {formatarDataHora(os.data_agendada)?.hora}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Second Row Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Cliente e Contato Info */}
                      <div>
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-full">
                          <div className="border-b border-gray-100 bg-gray-50 p-3 rounded-t-lg">
                            <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                              <User className="w-4 h-4 text-indigo-600" />
                              Cliente e Contato
                            </h4>
                          </div>
                          <div className="p-4">
                            <div className="space-y-4">
                              {/* Cliente */}
                              <div>
                                <div className="text-sm font-medium text-gray-500 mb-2">
                                  Informações do Cliente
                                </div>
                                <div className="text-base font-semibold text-gray-900 mb-1">
                                  {os.cliente.nome}
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-600 mt-2">
                                  <div className="flex items-start gap-2">
                                    <MapPin className="w-4 h-4 mt-1 flex-shrink-0 text-gray-500" />
                                    <div>
                                      {os.cliente.endereco && (
                                        <div>
                                          {os.cliente.endereco},{" "}
                                          {os.cliente.numero}
                                        </div>
                                      )}
                                      {os.cliente.bairro && (
                                        <div>{os.cliente.bairro}</div>
                                      )}
                                      <div className="font-medium">
                                        {os.cliente.cidade}/{os.cliente.uf}
                                      </div>
                                      {os.cliente.cep && (
                                        <div>CEP: {os.cliente.cep}</div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* Contato */}
                              <div className="pt-3 border-t border-gray-100">
                                <div className="text-sm font-medium text-gray-500 mb-2">
                                  Informações de Contato
                                </div>
                                <div className="text-base font-semibold text-gray-900 mb-1">
                                  {os.contato.nome}
                                </div>

                                <div className="space-y-1.5 mt-2">
                                  <div className="flex items-center gap-2 text-sm">
                                    <Phone className="w-4 h-4 text-gray-500 my-auto" />
                                    <span className="my-auto">
                                      {os.contato.telefone}
                                    </span>
                                    {os.contato.whatsapp && (
                                      <span className="text-emerald-600 font-medium text-xs px-2 py-0.5 bg-emerald-50 rounded-full border border-emerald-100 my-auto">
                                        WhatsApp
                                      </span>
                                    )}
                                  </div>

                                  {os.contato.email && (
                                    <div className="flex items-center gap-2 text-sm">
                                      <Mail className="w-4 h-4 text-gray-500 my-auto" />
                                      <span className="my-auto">
                                        {os.contato.email}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Equipment and Technician */}
                      <div>
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-full">
                          <div className="border-b border-gray-100 bg-gray-50 p-3 rounded-t-lg">
                            <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                              <Settings className="w-4 h-4 text-indigo-600" />
                              Máquina e Técnico
                            </h4>
                          </div>
                          <div className="p-4">
                            <div className="space-y-4">
                              <div>
                                <div className="text-sm font-medium text-gray-500 mb-2">
                                  Detalhes do Equipamento
                                </div>
                                <div className="text-base font-semibold text-gray-900 mb-1">
                                  {os.maquina.descricao}
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-600 mt-2">
                                  <div>
                                    <span className="text-gray-500">
                                      Modelo:
                                    </span>{" "}
                                    <span className="font-medium">
                                      {os.maquina.modelo || "Não especificado"}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-gray-500">
                                      Número de Série:
                                    </span>{" "}
                                    <span className="font-mono font-medium">
                                      {os.maquina.numero_serie}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* Técnico */}
                              <div className="pt-3 border-t border-gray-100">
                                <div className="text-sm font-medium text-gray-500 mb-2">
                                  Técnico Responsável
                                </div>

                                {os.tecnico.nome ? (
                                  <div>
                                    <div className="text-base font-semibold text-indigo-600 mb-1">
                                      {os.tecnico.nome}
                                    </div>

                                    {os.tecnico.observacoes && (
                                      <div className="mt-2 bg-gray-50 border-l-4 border-indigo-300 p-3 rounded-r-md">
                                        <div className="text-xs font-medium text-gray-500 mb-1">
                                          Observações
                                        </div>
                                        <p className="text-sm text-gray-700">
                                          {os.tecnico.observacoes}
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-2 text-amber-600">
                                    <AlertTriangle className="w-4 h-4 my-auto" />
                                    <span className="font-medium my-auto">
                                      Técnico não designado
                                    </span>
                                  </div>
                                )}
                              </div>

                              {/* Liberação Financeira */}
                              <div className="pt-3 border-t border-gray-100">
                                <div className="text-sm font-medium text-gray-500 mb-2">
                                  Liberação Financeira
                                </div>

                                {os.liberacao_financeira.liberada ? (
                                  <div className="flex items-center gap-2 text-emerald-600">
                                    <CheckCircle className="w-4 h-4 my-auto" />
                                    <span className="font-medium my-auto">
                                      Liberado por{" "}
                                      {
                                        os.liberacao_financeira
                                          .nome_usuario_liberacao
                                      }
                                    </span>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-2 text-amber-600">
                                    <AlertTriangle className="w-4 h-4 my-auto" />
                                    <span className="font-medium my-auto">
                                      Aguardando liberação
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
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
                setSituacoes({
                  pendente: true,
                  aAtender: true,
                  emDeslocamento: true,
                  emAtendimento: true,
                  atendimentoInterrompido: true,
                });
                setSearchTerm("");
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
