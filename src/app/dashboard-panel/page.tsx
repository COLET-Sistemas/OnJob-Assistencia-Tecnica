"use client";

import React, { useState, useEffect, useRef } from "react";
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

  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) {
      return;
    }

    let frameId: number | null = null;
    let direction: 1 | -1 = 1;
    let lastTimestamp: number | null = null;
    type ScrollPhase = "waiting" | "scrolling";
    let scrollPhase: ScrollPhase = "waiting";
    let holdUntil: number | null = null;
    const scrollDuration = 15000; // ms to scroll from top to bottom
    const holdDuration = 20000; // ms to wait at each end

    const startHold = (timestamp: number) => {
      scrollPhase = "waiting";
      holdUntil = timestamp + holdDuration;
      lastTimestamp = timestamp;
    };

    const animateScroll = (timestamp: number) => {
      if (!container) {
        return;
      }

      const maxScroll = container.scrollHeight - container.clientHeight;
      if (maxScroll <= 0) {
        container.scrollTop = 0;
        frameId = requestAnimationFrame(animateScroll);
        return;
      }

      if (scrollPhase === "waiting") {
        if (holdUntil === null) {
          startHold(timestamp);
        }
        if (holdUntil !== null && timestamp < holdUntil) {
          frameId = requestAnimationFrame(animateScroll);
          return;
        }
        scrollPhase = "scrolling";
        lastTimestamp = timestamp;
      }

      if (lastTimestamp === null) {
        lastTimestamp = timestamp;
      }

      const delta = timestamp - lastTimestamp;
      lastTimestamp = timestamp;
      const pxPerMs = maxScroll / scrollDuration;
      const next = container.scrollTop + direction * pxPerMs * delta;

      if (direction === 1 && next >= maxScroll) {
        container.scrollTop = maxScroll;
        direction = -1;
        startHold(timestamp);
        frameId = requestAnimationFrame(animateScroll);
        return;
      }

      if (direction === -1 && next <= 0) {
        container.scrollTop = 0;
        direction = 1;
        startHold(timestamp);
        frameId = requestAnimationFrame(animateScroll);
        return;
      }

      container.scrollTop = next;
      frameId = requestAnimationFrame(animateScroll);
    };

    frameId = requestAnimationFrame(animateScroll);

    return () => {
      if (frameId) {
        cancelAnimationFrame(frameId);
      }
    };
  }, [ordens.length]);

  const lastUpdatedFormatted = lastUpdated.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });

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
        .scrollbar-hidden::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hidden {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
      <header className="bg-white/75 backdrop-blur-lg border-b border-white/40 shadow-sm px-4 md:px-6 py-3">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl md:text-3xl font-semibold text-slate-900">
                Painel de Monitoramento
              </h1>
              <span className="text-xs font-semibold uppercase px-3 py-1 rounded-full border border-[#7C54BD]/60 bg-white/70 text-[#7C54BD]">
                {ordens.length} cards
              </span>
            </div>
            <p className="text-sm text-gray-500">
              Atualizado às {lastUpdatedFormatted} • Atualiza a cada{" "}
              {refreshInterval} min
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 justify-end">
            <label className="flex flex-col text-[9px] uppercase tracking-[0.4em] text-[#7C54BD]/70">
              Intervalo (min)
              <select
                value={refreshInterval}
                onChange={(event) =>
                  setRefreshInterval(Number(event.target.value))
                }
                className="mt-1 w-24 rounded-full border border-[#7C54BD]/40 bg-white/80 px-3 py-1 text-xs font-semibold text-[#4d1e9b] focus:border-[#7C54BD] focus:outline-none focus:ring-1 focus:ring-[#7C54BD]/50"
              >
                {[1, 2, 5, 10, 15, 30].map((interval) => (
                  <option key={interval} value={interval}>
                    {interval} min
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              onClick={fetchOrdens}
              className="flex items-center gap-1 cursor-pointer rounded-full bg-gradient-to-r from-[#7C54BD] to-[#5C3DB1] px-4 py-2 text-xs font-semibold text-white shadow-lg transition hover:opacity-95 focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-[#7C54BD]"
            >
              <RefreshCw size={16} />
              Atualizar
            </button>
            <button
              type="button"
              onClick={toggleFullscreen}
              aria-label={
                fullscreen ? "Sair da tela cheia" : "Entrar em tela cheia"
              }
              className="flex items-center gap-1 cursor-pointer rounded-full border border-[#7C54BD]/40 bg-white px-3 py-2 text-xs font-semibold text-[#4a2fa7] shadow-sm transition hover:border-[#7C54BD] focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-[#7C54BD]"
            >
              <Expand size={16} />
              {fullscreen ? "Sair da tela cheia" : "Tela cheia"}
            </button>
          </div>
        </div>
      </header>

      {/* Conteúdo principal */}
      <main className="flex-1 relative overflow-hidden px-3 pb-3 pt-3">
        <div
          ref={scrollContainerRef}
          className="h-full overflow-y-auto scrollbar-hidden rounded-[20px] border border-white/60 bg-white/80 px-4 py-6 backdrop-blur-xl shadow-[0_25px_80px_rgba(15,23,42,0.15)]"
        >
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-gray-500">
              <LoadingSpinner
                fullScreen={false}
                preventScroll={false}
                size="large"
                showText={false}
                className="text-center"
              />
              <p className="text-sm font-medium text-gray-600">
                Carregando painel de monitoramento...
              </p>
            </div>
          ) : error ? (
            <div className="max-w-2xl mx-auto rounded-2xl border border-red-100 bg-red-50/70 p-6 text-center shadow-lg animate-fadeIn">
              <div className="flex flex-col items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6"
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
                <p className="text-lg font-semibold text-red-700">
                  Erro ao carregar os dados
                </p>
                <p className="text-sm text-red-600">{error}</p>
                <button
                  onClick={fetchOrdens}
                  className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-white px-4 py-2 text-xs font-semibold text-red-600 transition hover:border-red-300 hover:bg-red-50"
                >
                  <RefreshCw size={14} />
                  Tentar novamente
                </button>
              </div>
            </div>
          ) : ordens.length === 0 ? (
            <div className="max-w-2xl mx-auto rounded-2xl border border-[#7C54BD]/30 bg-white p-6 text-center shadow-lg animate-fadeIn">
              <div className="flex flex-col items-center gap-3">
                <div className="rounded-full border border-[#7C54BD]/20 bg-[#7C54BD]/10 p-3">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-7 w-7 text-[#7C54BD]/60"
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
                <p className="text-lg font-semibold text-gray-800">
                  Sem ordens para exibir
                </p>
                <p className="text-sm text-gray-500">
                  Atualize para buscar as últimas ordens de serviço.
                </p>
                <button
                  onClick={fetchOrdens}
                  className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-[#7C54BD] to-[#5C3DB1] px-4 py-2 text-xs font-semibold text-white shadow-lg transition hover:opacity-95"
                >
                  <RefreshCw size={14} />
                  Atualizar painel
                </button>
              </div>
            </div>
          ) : (
            <div className="grid gap-4 grid-cols-[repeat(auto-fit,minmax(340px,1fr))]">
              {ordens.map((os) => (
                <div
                  key={os.id_os}
                  className="transform hover:-translate-y-1 transition-all duration-200 h-full"
                >
                  <OsCard os={os} />
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
