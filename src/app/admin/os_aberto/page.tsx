"use client";
import React, { useState, useEffect } from "react";
import {
  Search,
  Calendar,
  User,
  MapPin,
  AlertCircle,
  Eye,
  Clock,
  Settings,
  Phone,
  Mail,
  ChevronDown,
  ChevronUp,
  Filter,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";
import { ordensServicoAPI } from "@/api/api";

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
  };
  cliente: {
    id: number;
    nome: string;
    cidade: string;
    uf: string;
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

const TelaOSAbertas: React.FC = () => {
  const [ordensServico, setOrdensServico] = useState<OrdemServico[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filtroGarantia, setFiltroGarantia] = useState<string>("todos");
  const [expandedCards, setExpandedCards] = useState<Set<number>>(new Set());

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const data = await ordensServicoAPI.getPendentes();
        if (Array.isArray(data)) {
          setOrdensServico(data);
        } else {
          console.warn("Resposta inesperada da API:", data);
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
  }, []);

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
    const [data, hora] = dataHora.split(" ");
    const [ano, mes, dia] = data.split("-");
    const dataFormatada = `${dia}/${mes}/${ano}`;
    const [h, m] = hora.split(":");
    const horaFormatada = `${h}:${m}`;
    return { data: dataFormatada, hora: horaFormatada };
  };

  const filteredOrdens = ordensServico.filter((os) => {
    const matchSearch =
      searchTerm === "" ||
      `OS-${os.id_os}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      os.cliente.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      os.contato.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      os.maquina.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
      os.maquina.numero_serie.toLowerCase().includes(searchTerm.toLowerCase());

    const matchGarantia =
      filtroGarantia === "todos" ||
      (filtroGarantia === "garantia" && os.em_garantia) ||
      (filtroGarantia === "fora_garantia" && !os.em_garantia);

    return matchSearch && matchGarantia;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
          <p className="text-gray-700 text-lg font-medium">
            Carregando ordens de serviço...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
        {/* Header with Filters - White background with green gradient on the right */}
        <div className="bg-gradient-to-r from-white via-white to-emerald-100 rounded-2xl shadow-sm border border-gray-100 mb-8 overflow-hidden">
          <div className="relative">
            {/* Colored border lines */}
            <div className="absolute inset-0 rounded-2xl pointer-events-none">
              <div
                className="absolute top-0 left-0 w-full h-0.5"
                style={{
                  background:
                    "linear-gradient(90deg, transparent 0%, rgba(246, 198, 71, 0.4) 50%, transparent 100%)",
                }}
              ></div>
              <div
                className="absolute bottom-0 right-0 w-full h-0.5"
                style={{
                  background:
                    "linear-gradient(270deg, transparent 0%, rgba(117, 250, 189, 0.4) 50%, transparent 100%)",
                }}
              ></div>
            </div>

            <div className="p-8">
              {/* Title Section */}
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">
                    Ordens de Serviço
                  </h1>
                </div>
                <div className="hidden md:flex items-center space-x-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-gray-900">
                      {filteredOrdens.length}
                    </div>
                    <div className="text-sm text-gray-500 font-medium">
                      OS Ativas
                    </div>
                  </div>
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center">
                    <Filter className="w-7 h-7 text-white" />
                  </div>
                </div>
              </div>

              {/* Filters Section */}
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Search */}
                <div className="lg:col-span-3">
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Buscar Ordem de Serviço
                  </label>
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      placeholder="Digite o número da OS, cliente, solicitante ou equipamento..."
                      className="w-full pl-12 pr-4 py-4 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all shadow-sm"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>

                {/* Warranty Filter */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Status da Garantia
                  </label>
                  <select
                    className="w-full px-4 py-4 bg-white border border-gray-200 rounded-xl text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all shadow-sm"
                    value={filtroGarantia}
                    onChange={(e) => setFiltroGarantia(e.target.value)}
                  >
                    <option value="todos">Todas as OS</option>
                    <option value="garantia">Em garantia</option>
                    <option value="fora_garantia">Fora da garantia</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* OS Cards */}
        <div className="space-y-4">
          {filteredOrdens.map((os) => {
            const dataHoraObj = formatarDataHora(os.abertura.data_abertura);
            const dataAbertura = dataHoraObj?.data || "";
            const horaAbertura = dataHoraObj?.hora || "";
            const isExpanded = expandedCards.has(os.id_os);

            return (
              <div
                key={os.id_os}
                className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 overflow-hidden"
              >
                {/* Compact Header - Always Visible */}
                <div className="p-6">
                  <div className="flex items-center justify-between">
                    {/* Left side - Main info */}
                    <div className="flex items-center space-x-8 flex-1">
                      {/* OS Number and Priority Info */}
                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-2xl font-bold text-gray-900">
                            OS-{os.id_os}
                          </h3>
                          <div className="flex gap-2">
                            <span
                              className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold ${
                                os.em_garantia
                                  ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                                  : "bg-amber-100 text-amber-700 border border-amber-200"
                              }`}
                            >
                              {os.em_garantia ? (
                                <CheckCircle className="w-3 h-3 mr-1.5" />
                              ) : (
                                <AlertTriangle className="w-3 h-3 mr-1.5" />
                              )}
                              {os.em_garantia
                                ? "Em Garantia"
                                : "Fora da Garantia"}
                            </span>
                            {!os.liberacao_financeira.liberada &&
                              !os.em_garantia && (
                                <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold bg-red-100 text-red-700 border border-red-200">
                                  <AlertCircle className="w-3 h-3 mr-1.5" />
                                  Aguard. Liberação
                                </span>
                              )}
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-4 h-4" />
                            <span className="font-medium">{dataAbertura}</span>
                            <span>às {horaAbertura}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-4 h-4" />
                            <span>
                              {getFormaAberturaTexto(
                                os.abertura.forma_abertura
                              )}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Client Info */}
                      <div className="hidden md:flex flex-col min-w-0">
                        <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                          Cliente
                        </div>
                        <div className="font-semibold text-gray-900 truncate">
                          {os.cliente.nome}
                        </div>
                        <div className="text-sm text-gray-600 flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5" />
                          {os.cliente.cidade}/{os.cliente.uf}
                        </div>
                      </div>

                      {/* Equipment Info */}
                      <div className="hidden lg:flex flex-col min-w-0">
                        <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                          Equipamento
                        </div>
                        <div className="font-semibold text-gray-900 truncate">
                          {os.maquina.descricao}
                        </div>
                        <div className="text-sm text-gray-600">
                          S/N: {os.maquina.numero_serie}
                        </div>
                      </div>

                      {/* Status and Technician */}
                      <div className="hidden xl:flex flex-col min-w-0">
                        <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                          Status / Técnico
                        </div>
                        <div className="font-semibold text-indigo-600 mb-1">
                          {os.situacao_os.descricao}
                        </div>
                        <div className="text-sm text-gray-600">
                          {os.tecnico.nome ? (
                            <span className="flex items-center gap-1.5">
                              <User className="w-3.5 h-3.5" />
                              {os.tecnico.nome}
                            </span>
                          ) : (
                            <span className="text-amber-600 font-medium">
                              Não definido
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right side - Actions */}
                    <div className="flex items-center space-x-3">
                      {/* View Details Button */}
                      <button className="inline-flex items-center px-5 py-2.5 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200 shadow-sm hover:shadow">
                        <Eye className="w-4 h-4 mr-2" />
                        Detalhes
                      </button>

                      {/* Expand Button */}
                      <button
                        onClick={() => toggleCardExpansion(os.id_os)}
                        className={`p-2.5 rounded-lg transition-all duration-200 ${
                          isExpanded
                            ? "text-indigo-600 bg-indigo-50 hover:bg-indigo-100"
                            : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                        }`}
                      >
                        {isExpanded ? (
                          <ChevronUp className="w-5 h-5" />
                        ) : (
                          <ChevronDown className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="border-t border-gray-100 bg-gray-50">
                    <div className="p-6">
                      {/* Problem Description */}
                      <div className="mb-6">
                        <h4 className="text-lg font-semibold text-gray-900 mb-3">
                          Descrição do Problema
                        </h4>
                        <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-r-lg">
                          <p className="text-gray-800 leading-relaxed">
                            {os.descricao_problema}
                          </p>
                        </div>
                      </div>

                      {/* Details Grid */}
                      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-6">
                        {/* Client and Contact */}
                        <div>
                          <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <User className="w-5 h-5 text-indigo-600" />
                            Cliente e Contato
                          </h4>
                          <div className="bg-white rounded-lg p-4 space-y-3 border border-gray-200">
                            <div>
                              <div className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-1">
                                Cliente
                              </div>
                              <div className="text-lg font-semibold text-gray-900">
                                {os.cliente.nome}
                              </div>
                            </div>

                            <div className="flex items-center gap-2 text-gray-600">
                              <MapPin className="w-4 h-4" />
                              <span className="font-medium">
                                {os.cliente.cidade}/{os.cliente.uf}
                              </span>
                            </div>

                            <div className="border-t border-gray-200 pt-3">
                              <div className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-2">
                                Contato
                              </div>
                              <div className="text-base font-semibold text-gray-900 mb-2">
                                {os.contato.nome}
                              </div>
                              <div className="space-y-1">
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                  <Phone className="w-4 h-4" />
                                  <span>{os.contato.telefone}</span>
                                  {os.contato.whatsapp && (
                                    <>
                                      <span className="text-gray-400">•</span>
                                      <span className="text-emerald-600 font-medium">
                                        WhatsApp
                                      </span>
                                    </>
                                  )}
                                </div>
                                {os.contato.email && (
                                  <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <Mail className="w-4 h-4" />
                                    <span>{os.contato.email}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Equipment and Technician */}
                        <div>
                          <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <Settings className="w-5 h-5 text-indigo-600" />
                            Equipamento e Técnico
                          </h4>
                          <div className="bg-white rounded-lg p-4 space-y-3 border border-gray-200">
                            <div>
                              <div className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-1">
                                Equipamento
                              </div>
                              <div className="text-lg font-semibold text-gray-900 mb-1">
                                {os.maquina.descricao}
                              </div>
                              {os.maquina.modelo && (
                                <div className="text-sm text-gray-600">
                                  Modelo:{" "}
                                  <span className="font-medium">
                                    {os.maquina.modelo}
                                  </span>
                                </div>
                              )}
                              <div className="text-sm text-gray-600">
                                Série:{" "}
                                <span className="font-mono font-medium">
                                  {os.maquina.numero_serie}
                                </span>
                              </div>
                            </div>

                            <div className="border-t border-gray-200 pt-3">
                              <div className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-1">
                                Técnico Responsável
                              </div>
                              {os.tecnico.nome ? (
                                <div className="text-base font-semibold text-indigo-600">
                                  {os.tecnico.nome}
                                </div>
                              ) : (
                                <div className="text-base font-semibold text-amber-600">
                                  Não definido
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Technician Observations */}
                      {os.tecnico.observacoes && (
                        <div className="mb-6">
                          <h4 className="text-lg font-semibold text-gray-900 mb-3">
                            Observações do Técnico
                          </h4>
                          <div className="bg-indigo-50 border-l-4 border-indigo-400 p-4 rounded-r-lg">
                            <p className="text-gray-700 leading-relaxed italic">
                              {os.tecnico.observacoes}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Footer Info */}
                      <div className="pt-4 border-t border-gray-200">
                        <div className="flex flex-wrap justify-between items-center text-sm text-gray-600">
                          <div className="space-y-1">
                            <div>
                              Aberta por:{" "}
                              <span className="font-medium text-gray-900">
                                {os.abertura.nome_usuario}
                              </span>
                              {" • "}
                              Via{" "}
                              {getFormaAberturaTexto(
                                os.abertura.forma_abertura
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-4 mt-2 sm:mt-0">
                            {os.situacao_os.motivo_pendencia && (
                              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-700">
                                {os.situacao_os.motivo_pendencia}
                              </span>
                            )}
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
          <div className="text-center py-16">
            <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
              <AlertCircle className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Nenhuma OS encontrada
            </h3>
            <p className="text-gray-600 max-w-md mx-auto leading-relaxed">
              Não há ordens de serviço pendentes no momento ou que correspondam
              aos filtros aplicados. Tente ajustar os critérios de busca.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TelaOSAbertas;
