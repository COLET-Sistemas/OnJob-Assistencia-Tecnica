"use client";

import React, { useState, useEffect } from "react";
import { ordensServicoAPI } from "@/api/api";
import OsCard from "@/components/admin/ui/OsCard";
import { Loading as LoadingSpinner } from "@/components/LoadingPersonalizado";
import { Expand, Funnel, RefreshCw } from "lucide-react";

interface OrdemServico {
  id_os: number;
  descricao_problema: string;
  em_garantia: boolean;
  abertura: {
    data_abertura: string;
    forma_abertura: string;
    origem_abertura: string;
    nome_usuario: string;
    motivo_atendimento: string;
  };
  data_agendada: string;
  data_fechamento: string;
  cliente: {
    nome: string;
    endereco: string;
    numero: string;
    complemento: string;
    bairro: string;
    cidade: string;
    uf: string;
    cep: string;
    latitude: string;
    longitude: string;
  };
  contato: {
    nome: string;
    telefone: string;
    whatsapp: string;
    email: string;
  };
  maquina: {
    numero_serie: string;
    descricao: string;
    modelo: string;
  };
  situacao_os: {
    codigo: number;
    descricao: string;
    motivo_pendencia: string;
  };
  tecnico: {
    nome: string;
    observacoes: string;
  };
  liberacao_financeira: {
    liberada: boolean;
    nome_usuario_liberacao: string;
  };
}

export default function DashboardPainel() {
  const [ordens, setOrdens] = useState<OrdemServico[]>([]);
  const [filteredOrdens, setFilteredOrdens] = useState<OrdemServico[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fullscreen, setFullscreen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState<number>(2); // minutos
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [filter, setFilter] = useState({
    situacao: [] as number[],
    tecnico: "",
    cliente: "",
    dataInicial: "",
    dataFinal: "",
  });

  const situacoesOS = [
    { codigo: 1, descricao: "Pendente" },
    { codigo: 2, descricao: "Em Andamento" },
    { codigo: 3, descricao: "Concluída" },
    { codigo: 4, descricao: "Cancelada" },
    { codigo: 5, descricao: "Em Espera" },
  ];

  // Função para retornar a cor baseada no status
  const getStatusColor = (codigo: number): string => {
    switch (codigo) {
      case 1: // Pendente
        return "#F6C647";
      case 2: // Em Andamento
        return "#75FABD";
      case 3: // Concluída
        return "#4ADE80";
      case 4: // Cancelada
        return "#FF5757";
      case 5: // Em Espera
        return "#7C54BD";
      default:
        return "#6B7280";
    }
  };

  const fetchOrdens = async () => {
    try {
      setIsLoading(true);
      const response = await ordensServicoAPI.getDashboard();
      // Converte os dados para o tipo OrdemServico
      const ordensData = response.dados as unknown as OrdemServico[];
      setOrdens(ordensData);
      setFilteredOrdens(ordensData);
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      setError("Erro ao carregar as ordens de serviço.");
      console.error("Erro ao buscar ordens de serviço:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrdens();

    // Configura o intervalo de atualização
    const interval = setInterval(fetchOrdens, refreshInterval * 60 * 1000);

    return () => clearInterval(interval);
  }, [refreshInterval]);

  useEffect(() => {
    // Aplicar filtros
    let filtered = [...ordens];

    if (filter.situacao.length > 0) {
      filtered = filtered.filter((os) =>
        filter.situacao.includes(os.situacao_os.codigo)
      );
    }

    if (filter.tecnico) {
      filtered = filtered.filter(
        (os) =>
          os.tecnico.nome &&
          os.tecnico.nome.toLowerCase().includes(filter.tecnico.toLowerCase())
      );
    }

    if (filter.cliente) {
      filtered = filtered.filter((os) =>
        os.cliente.nome.toLowerCase().includes(filter.cliente.toLowerCase())
      );
    }

    if (filter.dataInicial) {
      const dataInicial = new Date(filter.dataInicial);
      filtered = filtered.filter((os) => {
        const dataAbertura = new Date(os.abertura.data_abertura);
        return dataAbertura >= dataInicial;
      });
    }

    if (filter.dataFinal) {
      const dataFinal = new Date(filter.dataFinal);
      dataFinal.setHours(23, 59, 59, 999); // Final do dia
      filtered = filtered.filter((os) => {
        const dataAbertura = new Date(os.abertura.data_abertura);
        return dataAbertura <= dataFinal;
      });
    }

    setFilteredOrdens(filtered);
  }, [filter, ordens]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((e) => {
        console.error(`Erro ao entrar em tela cheia: ${e.message}`);
      });
      setFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setFullscreen(false);
      }
    }
  };

  const handleSituacaoChange = (codigo: number) => {
    setFilter((prev) => {
      if (prev.situacao.includes(codigo)) {
        return { ...prev, situacao: prev.situacao.filter((s) => s !== codigo) };
      } else {
        return { ...prev, situacao: [...prev.situacao, codigo] };
      }
    });
  };

  const resetFilters = () => {
    setFilter({
      situacao: [],
      tecnico: "",
      cliente: "",
      dataInicial: "",
      dataFinal: "",
    });
  };

  return (
    <div className="h-screen bg-gradient-to-br from-[#f7f8fc] to-[#eef1f8] flex flex-col overflow-hidden">
      <style jsx global>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.4s ease-out forwards;
        }
      `}</style>
      {/* Cabeçalho */}
      <header className="bg-white shadow-lg px-4 md:px-6 py-3 md:py-4 sticky top-0 z-10">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center">
          <div className="flex items-center mb-3 md:mb-0">
            <div className="bg-gradient-to-r from-[#5E35B1] to-[#3949AB] p-2 rounded-lg shadow-lg mr-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h1 className="text-xl md:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#3949AB] to-[#5E35B1]">
              Painel de Monitoramento
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-2 md:gap-3">
            <div className="flex items-center bg-[#75FABD]/20 rounded-full px-3 py-1.5 text-xs md:text-sm font-medium text-[#7C54BD] border border-[#75FABD]/30">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-3.5 w-3.5 md:h-4 md:w-4 mr-1.5 text-[#7C54BD]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span className="whitespace-nowrap">
                Atualizado: {lastUpdated.toLocaleTimeString()}
              </span>
            </div>

            <select
              value={refreshInterval}
              onChange={(e) => setRefreshInterval(Number(e.target.value))}
              className="border border-[#7C54BD]/30 rounded-lg px-2 py-1.5 text-xs md:text-sm bg-[#7C54BD]/5 text-[#7C54BD] shadow-sm hover:border-[#7C54BD] focus:ring-2 focus:ring-[#7C54BD] focus:border-[#7C54BD] focus:outline-none transition-all duration-200"
            >
              <option value={1}>1 min</option>
              <option value={2}>2 min</option>
              <option value={5}>5 min</option>
              <option value={10}>10 min</option>
            </select>

            <div className="flex items-center gap-1.5">
              <button
                onClick={fetchOrdens}
                className="bg-[#7C54BD] hover:bg-[#6B47A8] text-white px-3 md:px-4 py-1.5 md:py-2 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 flex items-center text-xs md:text-sm font-medium"
                aria-label="Atualizar"
                title="Atualizar"
              >
                <RefreshCw size={14} className="text-white md:mr-1.5" />
                <span className="hidden md:inline">Atualizar</span>
              </button>

              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`${
                  showFilters ? "bg-[#F5AB1D]" : "bg-[#F6C647]"
                } hover:bg-[#F5AB1D] transition-all duration-200 text-white p-1.5 md:p-2.5 rounded-lg shadow-md hover:shadow-lg`}
                aria-label={showFilters ? "Ocultar filtros" : "Mostrar filtros"}
                title={showFilters ? "Ocultar filtros" : "Mostrar filtros"}
              >
                <Funnel size={14} className="text-white" />
              </button>

              <button
                onClick={toggleFullscreen}
                className="bg-[#75FABD] hover:bg-[#4DE69E] transition-all duration-200 text-white p-1.5 md:p-2.5 rounded-lg shadow-md hover:shadow-lg"
                aria-label={
                  fullscreen ? "Sair da tela cheia" : "Modo tela cheia"
                }
                title={fullscreen ? "Sair da tela cheia" : "Modo tela cheia"}
              >
                <Expand size={14} className="text-white" />
              </button>
            </div>
          </div>
        </div>

        {/* Filtros que só aparecem quando showFilters é true */}
        {showFilters && (
          <div className="mt-5 bg-white p-4 rounded-xl shadow-sm border border-gray-100 animate-fadeIn">
            <div className="mb-3 flex justify-between items-center">
              <span className="text-sm font-bold text-[#7C54BD]">
                Filtros de Pesquisa
              </span>

              {(filter.situacao.length > 0 ||
                filter.tecnico ||
                filter.cliente ||
                filter.dataInicial ||
                filter.dataFinal) && (
                <button
                  onClick={resetFilters}
                  className="px-3 py-1.5 bg-[#F6C647]/10 hover:bg-[#F6C647]/20 text-[#7C54BD] rounded-md text-xs font-medium flex items-center transition-all duration-200 border border-[#F6C647]/30"
                  title="Limpar filtros"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-3.5 w-3.5 mr-1.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                  Limpar filtros
                </button>
              )}
            </div>

            <div className="mb-3">
              <div className="text-xs font-medium text-gray-600 mb-2">
                Status da OS:
              </div>
              <div className="flex flex-wrap gap-2">
                {situacoesOS.map((situacao) => (
                  <button
                    key={situacao.codigo}
                    onClick={() => handleSituacaoChange(situacao.codigo)}
                    className="px-3 py-1.5 text-xs rounded-md transition-all duration-200 flex items-center"
                    style={{
                      backgroundColor: filter.situacao.includes(situacao.codigo)
                        ? `${getStatusColor(situacao.codigo)}20`
                        : "transparent",
                      color: filter.situacao.includes(situacao.codigo)
                        ? getStatusColor(situacao.codigo)
                        : "#6B7280",
                      border: `1px solid ${
                        filter.situacao.includes(situacao.codigo)
                          ? getStatusColor(situacao.codigo)
                          : "#E5E7EB"
                      }`,
                      boxShadow: filter.situacao.includes(situacao.codigo)
                        ? `0 1px 2px ${getStatusColor(situacao.codigo)}20`
                        : "none",
                    }}
                  >
                    {situacao.descricao}
                    {filter.situacao.includes(situacao.codigo) && (
                      <span className="ml-1.5 text-xs bg-white bg-opacity-50 rounded-full w-4 h-4 flex items-center justify-center">
                        ✓
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <div className="text-xs font-medium text-gray-600 mb-1">
                  Técnico:
                </div>
                <input
                  type="text"
                  value={filter.tecnico}
                  onChange={(e) =>
                    setFilter((prev) => ({ ...prev, tecnico: e.target.value }))
                  }
                  placeholder="Nome do técnico"
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-[#7C54BD] focus:border-[#7C54BD] focus:outline-none"
                />
              </div>

              <div>
                <div className="text-xs font-medium text-gray-600 mb-1">
                  Cliente:
                </div>
                <input
                  type="text"
                  value={filter.cliente}
                  onChange={(e) =>
                    setFilter((prev) => ({ ...prev, cliente: e.target.value }))
                  }
                  placeholder="Nome do cliente"
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-[#7C54BD] focus:border-[#7C54BD] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <div className="text-xs font-medium text-gray-600 mb-1">
                    Data inicial:
                  </div>
                  <input
                    type="date"
                    value={filter.dataInicial}
                    onChange={(e) =>
                      setFilter((prev) => ({
                        ...prev,
                        dataInicial: e.target.value,
                      }))
                    }
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-[#7C54BD] focus:border-[#7C54BD] focus:outline-none"
                  />
                </div>
                <div>
                  <div className="text-xs font-medium text-gray-600 mb-1">
                    Data final:
                  </div>
                  <input
                    type="date"
                    value={filter.dataFinal}
                    onChange={(e) =>
                      setFilter((prev) => ({
                        ...prev,
                        dataFinal: e.target.value,
                      }))
                    }
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-[#7C54BD] focus:border-[#7C54BD] focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Conteúdo principal */}
      <main className="flex-1 p-6 overflow-y-auto">
        {!isLoading && !error && <div className="mb-6"></div>}

        {isLoading && (
          <div className="flex justify-center items-center h-64">
            <div className="flex flex-col items-center">
              <LoadingSpinner
                fullScreen={true}
                preventScroll={false}
                size="large"
                text="Carregando painel de monitoramento..."
              />
            </div>
          </div>
        )}

        {error && (
          <div
            className="bg-white border-l-4 border-red-500 p-6 rounded-lg shadow-lg mb-6 animate-fadeIn"
            role="alert"
          >
            <div className="flex flex-col md:flex-row md:items-center">
              <div className="bg-red-50 rounded-full w-12 h-12 flex items-center justify-center mb-4 md:mb-0 mx-auto md:mx-0">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 text-red-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div className="md:ml-4 text-center md:text-left">
                <p className="font-bold text-lg text-red-700">
                  Erro ao carregar dados
                </p>
                <p className="text-md mt-1 text-gray-700">{error}</p>
                <button
                  onClick={fetchOrdens}
                  className="mt-3 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 rounded-md font-medium flex items-center text-sm transition-all duration-200 mx-auto md:mx-0"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 mr-2"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                  Tentar novamente
                </button>
              </div>
            </div>
          </div>
        )}

        {!isLoading && !error && filteredOrdens.length === 0 && (
          <div className="bg-white shadow-lg rounded-xl p-6 md:p-10 text-center border border-gray-100 animate-fadeIn">
            <div className="bg-[#7C54BD]/5 rounded-full w-16 h-16 md:w-20 md:h-20 flex items-center justify-center mx-auto mb-6 border border-[#7C54BD]/20">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-8 w-8 md:h-10 md:w-10 text-[#7C54BD]/60"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <h3 className="text-lg md:text-xl font-bold text-gray-800 mb-2">
              Não há ordens de serviço disponíveis
            </h3>
            <p className="text-sm md:text-base text-gray-500 mb-6 max-w-md mx-auto">
              Não encontramos ordens que correspondam aos filtros atuais. Tente
              modificar os critérios ou atualizar a página.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <button
                onClick={resetFilters}
                className="px-4 py-2 bg-[#7C54BD]/10 hover:bg-[#7C54BD]/20 text-[#7C54BD] rounded-md font-medium flex items-center text-sm transition-all duration-200"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 mr-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
                Limpar filtros
              </button>
              <button
                onClick={fetchOrdens}
                className="px-4 py-2 bg-[#7C54BD] hover:bg-[#6B47A8] text-white rounded-md font-medium flex items-center text-sm transition-all duration-200"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 mr-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                Atualizar dados
              </button>
            </div>
          </div>
        )}

        {/* Lista de ordens de serviço */}
        {!isLoading && !error && filteredOrdens.length > 0 && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 pb-6 mt-4">
              {filteredOrdens.map((os) => (
                <div
                  key={os.id_os}
                  className="transform hover:-translate-y-1 transition-all duration-200 h-full"
                >
                  <OsCard os={os} />
                </div>
              ))}
            </div>
          </>
        )}
      </main>

      {/* Rodapé com altura reduzida */}
      <footer className="bg-white border-t px-4 md:px-6 py-2 text-center shadow-inner">
        <div className="flex flex-col md:flex-row items-center justify-center gap-1 md:gap-0">
          <div className="text-[#7C54BD] font-medium md:mr-2">
            OnJob Assistência Técnica
          </div>
          <div className="text-xs text-gray-500">
            Painel de Monitoramento • {new Date().getFullYear()}
          </div>
        </div>
      </footer>
    </div>
  );
}
