"use client";

import React, { useState, useEffect } from "react";
import { services } from "@/api";
const { ordensServicoService } = services;
import OsCard from "@/components/admin/ui/OsCard";
import { Loading as LoadingSpinner } from "@/components/LoadingPersonalizado";
import { Expand, RefreshCw } from "lucide-react";

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
    data_situacao?: string;
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
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fullscreen, setFullscreen] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState<number>(2); // minutos
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const fetchOrdens = async () => {
    try {
      setIsLoading(true);
      const response = await ordensServicoService.getDashboard();
      // Converte os dados para o tipo OrdemServico
      const ordensData = response.dados as unknown as OrdemServico[];
      setOrdens(ordensData);
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
      <header className="bg-white shadow-md px-4 md:px-6 py-3 sticky top-0 z-10">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <div className="bg-gradient-to-r from-[#5E35B1] to-[#3949AB] p-2 rounded-lg shadow-md mr-3">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-white"
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
            <h1 className="text-lg md:text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#3949AB] to-[#5E35B1]">
              Painel de Monitoramento
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center bg-[#75FABD]/20 rounded-full px-2 py-1 text-xs font-medium text-[#7C54BD] border border-[#75FABD]/30">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-3 w-3 md:h-3.5 md:w-3.5 mr-1 text-[#7C54BD]"
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
              className="border border-[#7C54BD]/30 rounded-lg px-2 py-1 text-xs bg-[#7C54BD]/5 text-[#7C54BD] shadow-sm hover:border-[#7C54BD] focus:ring-1 focus:ring-[#7C54BD] focus:border-[#7C54BD] focus:outline-none transition-all duration-200"
            >
              <option value={1}>1 min</option>
              <option value={2}>2 min</option>
              <option value={5}>5 min</option>
              <option value={10}>10 min</option>
            </select>

            <div className="flex items-center gap-1">
              <button
                onClick={fetchOrdens}
                className="bg-[#7C54BD] hover:bg-[#6B47A8] text-white px-2 py-1 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 flex items-center text-xs font-medium"
                aria-label="Atualizar"
                title="Atualizar"
              >
                <RefreshCw size={12} className="text-white md:mr-1" />
                <span className="hidden md:inline">Atualizar</span>
              </button>

              <button
                onClick={toggleFullscreen}
                className="bg-[#75FABD] hover:bg-[#4DE69E] transition-all duration-200 text-white p-1 rounded-lg shadow-sm hover:shadow-md"
                aria-label={
                  fullscreen ? "Sair da tela cheia" : "Modo tela cheia"
                }
                title={fullscreen ? "Sair da tela cheia" : "Modo tela cheia"}
              >
                <Expand size={12} className="text-white" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Conteúdo principal */}
      <main className="flex-1 p-4 md:p-5 overflow-y-auto">
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
            className="bg-white border-l-4 border-red-500 p-4 rounded-lg shadow-md mb-4 animate-fadeIn"
            role="alert"
          >
            <div className="flex flex-col md:flex-row md:items-center">
              <div className="bg-red-50 rounded-full w-10 h-10 flex items-center justify-center mb-3 md:mb-0 mx-auto md:mx-0">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-red-500"
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
                <p className="font-bold text-md text-red-700">
                  Erro ao carregar dados
                </p>
                <p className="text-sm mt-1 text-gray-700">{error}</p>
                <button
                  onClick={fetchOrdens}
                  className="mt-2 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 rounded-md font-medium flex items-center text-xs transition-all duration-200 mx-auto md:mx-0"
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
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                  Tentar novamente
                </button>
              </div>
            </div>
          </div>
        )}

        {!isLoading && !error && ordens.length === 0 && (
          <div className="bg-white shadow-md rounded-lg p-5 md:p-8 text-center border border-gray-100 animate-fadeIn">
            <div className="bg-[#7C54BD]/5 rounded-full w-14 h-14 md:w-16 md:h-16 flex items-center justify-center mx-auto mb-4 border border-[#7C54BD]/20">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-7 w-7 md:h-8 md:w-8 text-[#7C54BD]/60"
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
            <h3 className="text-md md:text-lg font-bold text-gray-800 mb-2">
              Não há ordens de serviço disponíveis
            </h3>
            <p className="text-xs md:text-sm text-gray-500 mb-4 max-w-md mx-auto">
              Não encontramos ordens de serviço para exibir. Tente atualizar a
              página.
            </p>
            <button
              onClick={fetchOrdens}
              className="px-3 py-1.5 bg-[#7C54BD] hover:bg-[#6B47A8] text-white rounded-md font-medium flex items-center text-xs transition-all duration-200 mx-auto"
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
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              Atualizar dados
            </button>
          </div>
        )}

        {/* Lista de ordens de serviço */}
        {!isLoading && !error && ordens.length > 0 && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 md:gap-4 pb-4">
              {ordens.map((os) => (
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
      <footer className="bg-white border-t px-3 py-1.5 text-center shadow-inner">
        <div className="flex items-center justify-center gap-1">
          <div className="text-[#7C54BD] text-xs font-medium mr-1">
            OnJob Assistência Técnica
          </div>
          <div className="text-[10px] text-gray-500">
            Painel • {new Date().getFullYear()}
          </div>
        </div>
      </footer>
    </div>
  );
}
