"use client";

import React, { useEffect, useState, useMemo, useRef } from "react";
import { useParams } from "next/navigation";
import { createPortal } from "react-dom";
import { fatService, FATDetalhada } from "@/api/services/fatService";
import { fatFotosService } from "@/api/services/fatFotosService";
import PageHeader from "@/components/admin/ui/PageHeader";
import { StatusBadge } from "@/components/admin/common";
import Image from "next/image";
import { LoadingSpinner } from "@/components/LoadingPersonalizado";
import {
  Clock,
  Bell,
  Car,
  Wrench,
  PauseCircle,
  FileSearch,
  CheckCircle,
  XCircle,
  UserX,
  User,
  Laptop,
  Phone,
  CalendarClock,
  FileText,
  AlertCircle,
  ArrowLeft,
  ArrowUp,
  Package,
  Image as ImageIcon,
  ImageOff,
  Truck,
  // ExternalLink,
} from "lucide-react";

const FATDetalhesPage: React.FC = () => {
  const params = useParams();
  const fatId = params.id as string;

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [fatData, setFatData] = useState<FATDetalhada | null>(null);
  const [showScrollToTop, setShowScrollToTop] = useState<boolean>(false);
  const [loadingFotos, setLoadingFotos] = useState<boolean>(false);
  const [fotosErro, setFotosErro] = useState<string | null>(null);
  const [fotoPreviews, setFotoPreviews] = useState<Record<number, string>>({});
  const fotoUrlsRef = useRef<Map<number, string>>(new Map());
  const [imagemAmpliada, setImagemAmpliada] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      fotoUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
      fotoUrlsRef.current.clear();
    };
  }, []);

  // Memoizado para evitar re-renderizações desnecessárias
  const memoizedFatId = useMemo(() => fatId, [fatId]);

  // Status mapping memoizado
  const statusMapping: Record<
    number,
    { label: string; className: string; icon: React.ReactNode }
  > = useMemo(
    () => ({
      1: {
        label: "Pendente",
        className: "bg-gray-100 text-gray-700 border border-gray-200",
        icon: (
          <span title="Pendente">
            <Clock className="w-3.5 h-3.5 text-gray-500" />
          </span>
        ),
      },
      2: {
        label: "A atender",
        className: "bg-blue-100 text-blue-700 border border-blue-200",
        icon: (
          <span title="A atender">
            <Bell className="w-3.5 h-3.5 text-blue-600" />
          </span>
        ),
      },
      3: {
        label: "Em deslocamento",
        className: "bg-purple-100 text-purple-700 border border-purple-200",
        icon: (
          <span title="Em deslocamento">
            <Car className="w-3.5 h-3.5 text-purple-600" />
          </span>
        ),
      },
      4: {
        label: "Em atendimento",
        className: "bg-orange-100 text-orange-700 border border-orange-200",
        icon: (
          <span title="Em atendimento">
            <Wrench className="w-3.5 h-3.5 text-orange-600" />
          </span>
        ),
      },
      5: {
        label: "Atendimento interrompido",
        className: "bg-amber-100 text-amber-700 border border-amber-200",
        icon: (
          <span title="Atendimento interrompido">
            <PauseCircle className="w-3.5 h-3.5 text-amber-600" />
          </span>
        ),
      },
      6: {
        label: "Em Revisão",
        className: "bg-indigo-100 text-indigo-700 border border-indigo-200",
        icon: (
          <span title="Em Revisão">
            <FileSearch className="w-3.5 h-3.5 text-indigo-600" />
          </span>
        ),
      },
      7: {
        label: "Concluída",
        className: "bg-green-100 text-green-700 border border-green-200",
        icon: (
          <span title="Concluída">
            <CheckCircle className="w-3.5 h-3.5 text-green-600" />
          </span>
        ),
      },
      8: {
        label: "Cancelada",
        className: "bg-red-100 text-red-700 border border-red-200",
        icon: (
          <span title="Cancelada">
            <XCircle className="w-3.5 h-3.5 text-red-600" />
          </span>
        ),
      },
      9: {
        label: "Cancelada pelo Cliente",
        className: "bg-rose-100 text-rose-700 border border-rose-200",
        icon: (
          <span title="Cancelada pelo Cliente">
            <UserX className="w-3.5 h-3.5 text-rose-600" />
          </span>
        ),
      },
    }),
    []
  );

  type FullscreenImageModalProps = {
  src: string;
  onClose: () => void;
  onPrev?: () => void;
  onNext?: () => void;
  descricao?: string;
  data?: string;
};

const FullscreenImageModal: React.FC<FullscreenImageModalProps> = ({
  src,
  onClose,
  onPrev,
  onNext,
  descricao,
  data,
}) => {
  // Bloqueia scroll do body
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  // Teclas de atalho
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose?.();
      if (e.key === "ArrowLeft") onPrev?.();
      if (e.key === "ArrowRight") onNext?.();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, onPrev, onNext]);

  // Renderiza no body (fora do card)
  if (typeof document === "undefined") return null;
  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative max-w-[95vw] max-h-[90vh] flex items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Fechar */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white bg-black/50 hover:bg-black/70 rounded-full p-2 transition"
          aria-label="Fechar"
        >
          <XCircle className="w-8 h-8" />
        </button>

        {/* Navegação opcional */}
        {onPrev && (
          <button
            onClick={onPrev}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-white bg-black/50 hover:bg-black/70 rounded-full p-4 transition"
            aria-label="Anterior"
          >
            <ArrowLeft className="w-8 h-8" />
          </button>
        )}
        {onNext && (
          <button
            onClick={onNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-white bg-black/50 hover:bg-black/70 rounded-full p-4 transition"
            aria-label="Próxima"
          >
            <ArrowUp className="rotate-90 w-8 h-8" />
          </button>
        )}

        {/* Imagem */}
        <Image
          src={src}
          alt="Imagem ampliada"
          width={1600}
          height={1200}
          className="object-contain rounded-xl shadow-2xl border border-white max-w-[95vw] max-h-[85vh]"
          priority
        />

        {/* Descrição/Data */}
        {(descricao || data) && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-center text-white bg-black/40 px-4 py-2 rounded-lg max-w-[90vw]">
            {descricao && <p className="text-base font-medium">{descricao}</p>}
            {data && <p className="text-sm text-gray-300 mt-1">{data}</p>}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};

  // Carregar dados da FAT
  useEffect(() => {
    const fetchFATData = async () => {
      if (!memoizedFatId) return;

      try {
        setLoading(true);
        setError(null);
        const data = await fatService.getById(parseInt(memoizedFatId, 10));

        if (data) {
          setFatData(data);
        } else {
          setError("Nenhum dado encontrado para esta FAT");
        }
      } catch (err: Error | unknown) {
        console.error("Erro ao carregar detalhes da FAT:", err);
        const errorMessage =
          err instanceof Error ? err.message : "Erro desconhecido";
        setError(
          errorMessage ||
            "Não foi possível carregar os detalhes da FAT. Tente novamente mais tarde."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchFATData();
  }, [memoizedFatId]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setImagemAmpliada(null);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    const fotos = fatData?.fotos;
    let isCancelled = false;

    fotoUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    fotoUrlsRef.current.clear();
    fotoUrlsRef.current = new Map();

    if (!fotos || fotos.length === 0) {
      setFotoPreviews({});
      setFotosErro(null);
      setLoadingFotos(false);
      return;
    }

    const loadFotos = async () => {
      setLoadingFotos(true);
      setFotosErro(null);

      try {
        const results = await Promise.allSettled(
          fotos.map(async (foto) => {
            const blob = await fatFotosService.visualizar(foto.id_fat_foto);
            const url = URL.createObjectURL(blob);
            return [foto.id_fat_foto, url] as const;
          })
        );

        if (isCancelled) {
          results.forEach((result) => {
            if (result.status === "fulfilled") {
              URL.revokeObjectURL(result.value[1]);
            }
          });
          return;
        }

        const previews: Record<number, string> = {};
        const urlsMap = new Map<number, string>();
        let hadErrors = false;

        results.forEach((result) => {
          if (result.status === "fulfilled") {
            const [id, url] = result.value;
            previews[id] = url;
            urlsMap.set(id, url);
          } else {
            hadErrors = true;
          }
        });

        fotoUrlsRef.current = urlsMap;
        setFotoPreviews(previews);

        if (hadErrors) {
          setFotosErro("Algumas imagens não puderam ser carregadas.");
        }
      } catch (err) {
        if (!isCancelled) {
          console.error("Erro ao carregar imagens da FAT:", err);
          setFotoPreviews({});
          setFotosErro("Não foi possível carregar as imagens.");
        }
      } finally {
        if (!isCancelled) {
          setLoadingFotos(false);
        }
      }
    };

    loadFotos();

    return () => {
      isCancelled = true;
    };
  }, [fatData?.fotos]);

  const handleVoltar = () => {
    window.history.back();
  };

  const handleScrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Detectar rolagem para botão scroll to top
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollToTop(window.scrollY > 300);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Formatar números para exibição (evitando notação científica)
  const formatarNumero = (numero: number | string | null | undefined) => {
    if (numero === null || numero === undefined) return "N/A";

    // Converter para número se for string
    const num = typeof numero === "string" ? parseFloat(numero) : numero;

    // Verificar se é um número válido
    if (isNaN(num)) return "N/A";

    // Formatar número sem notação científica
    return num.toString().includes("E")
      ? parseFloat(num.toString()).toFixed(2)
      : num;
  };

  if (loading) {
    return (
      <LoadingSpinner
        text="Carregando detalhes da FAT..."
        fullScreen={true}
        preventScroll={false}
        size="large"
      />
    );
  }

  if (error) {
    return (
      <div className="text-center py-16 bg-white rounded-xl shadow-sm border border-gray-100 p-10 animate-fadeIn">
        <div className="w-20 h-20 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertCircle size={32} />
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-3">
          Erro ao carregar FAT
        </h3>
        <p className="text-gray-600 max-w-md mx-auto leading-relaxed mb-8">
          {error}
        </p>
        <button
          onClick={handleVoltar}
          className="px-5 py-2.5 border-2 border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--primary)] transition-all duration-200 shadow-sm hover:shadow flex items-center gap-2 mx-auto"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </button>
      </div>
    );
  }

  if (!fatData || !fatData.id_fat) {
    return (
      <div className="text-center py-16 bg-white rounded-xl shadow-sm border border-gray-100 p-10 animate-fadeIn">
        <div className="w-20 h-20 bg-yellow-100 text-yellow-500 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertCircle size={32} />
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-3">
          Dados da FAT incompletos
        </h3>
        <p className="text-gray-600 max-w-md mx-auto leading-relaxed mb-8">
          Os dados da FAT parecem estar incompletos ou em formato incorreto.
        </p>
        <button
          onClick={handleVoltar}
          className="px-5 py-2.5 border-2 border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--primary)] transition-all duration-200 shadow-sm hover:shadow flex items-center gap-2 mx-auto"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </button>
      </div>
    );
  }

  const fotosFAT = fatData.fotos ?? [];
  const possuiFotos = fotosFAT.length > 0;

  return (
    <>
      <div className="animate-fadeIn">
        <PageHeader
          title={`Ficha de Atendimento Técnico #${fatData.id_fat}`}
          config={{
            type: "form",
            backLink: `/admin/os_detalhes/${fatData.id_os}`,
            backLabel: "Voltar para OS",
          }}
        />

        {/* Grid Principal */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
          {/* Coluna Esquerda - Informações Técnicas */}
          <div className="lg:col-span-1">
            {/* Card Técnico */}
            <div
              className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6 hover:shadow-md transition-shadow duration-300 animate-fadeIn"
              style={{ animationDelay: "0.1s" }}
            >
              <div className="py-3 px-6 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <User className="text-[var(--primary)] h-4 w-4 animate-pulseScale" />
                    <h3 className="text-base font-semibold text-gray-800">
                      Técnico
                    </h3>
                  </div>
                </div>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {fatData.tecnico && (
                    <div>
                      <p className="text-sm font-medium text-gray-500">Nome</p>
                      <p className="text-gray-800 font-semibold">
                        {fatData.tecnico.nome}
                      </p>
                    </div>
                  )}

                  {fatData.motivo_atendimento && (
                    <div>
                      <p className="text-sm font-medium text-gray-500">
                        Motivo do Atendimento
                      </p>
                      <p className="text-gray-800 font-semibold bg-gray-50 p-2 rounded-md">
                        {fatData.motivo_atendimento.descricao}
                      </p>
                    </div>
                  )}

                  {fatData.data_atendimento && (
                    <div>
                      <p className="text-sm font-medium text-gray-500">
                        Data do Atendimento
                      </p>
                      <div className="flex items-center gap-2">
                        <CalendarClock className="h-4 w-4 text-blue-500" />
                        <p className="text-gray-800">
                          {fatData.data_atendimento}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Situação atual */}
                  {fatData.situacao && (
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-2">
                        Situação Atual
                      </p>
                      <div className="flex flex-col gap-1">
                        <StatusBadge
                          status={fatData.situacao.codigo.toString()}
                          mapping={statusMapping}
                        />
                        {fatData.situacao.data_situacao && (
                          <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
                            <CalendarClock className="h-3 w-3" />
                            <span>Desde: {fatData.situacao.data_situacao}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Card Máquina */}
            <div
              className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6 hover:shadow-md transition-shadow duration-300 animate-fadeIn"
              style={{ animationDelay: "0.2s" }}
            >
              <div className="py-3 px-6 border-b border-gray-100">
                <h3 className="text-base font-semibold text-gray-800 flex items-center gap-2">
                  <Laptop
                    className="text-[var(--primary)] h-4 w-4 animate-pulseScale"
                    style={{ animationDelay: "0.3s" }}
                  />
                  Máquina
                </h3>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {fatData.maquina?.numero_serie && (
                    <div>
                      <p className="text-sm font-medium text-gray-500">
                        Nº de Série
                      </p>
                      <p className="text-gray-800 font-semibold">
                        {fatData.maquina.numero_serie}
                      </p>
                    </div>
                  )}

                  {fatData.maquina?.descricao && (
                    <div>
                      <p className="text-sm font-medium text-gray-500">
                        Descrição
                      </p>
                      <p className="text-gray-800">
                        {fatData.maquina.descricao}
                      </p>
                    </div>
                  )}

                  {fatData.maquina?.modelo && (
                    <div>
                      <p className="text-sm font-medium text-gray-500">
                        Modelo
                      </p>
                      <p className="text-gray-800">{fatData.maquina.modelo}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Card Número de Ciclos */}
            {fatData.numero_ciclos && (
              <div
                className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6 hover:shadow-md transition-shadow duration-300 animate-fadeIn"
                style={{ animationDelay: "0.3s" }}
              >
                <div className="py-3 px-6 border-b border-gray-100">
                  <h3 className="text-base font-semibold text-gray-800 flex items-center gap-2">
                    <FileSearch className="text-[var(--primary)] h-4 w-4 animate-pulseScale" />
                    Ciclos da Máquina
                  </h3>
                </div>
                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-500">
                      Número de Ciclos
                    </p>
                    <span className="text-xl font-bold text-gray-800 bg-blue-50 px-4 py-2 rounded-lg">
                      {formatarNumero(fatData.numero_ciclos)}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Coluna Direita - Detalhes do Atendimento */}
          <div className="lg:col-span-2">
            {/* Card Detalhes do Atendimento */}
            <div
              className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6 hover:shadow-md transition-shadow duration-300 animate-fadeIn"
              style={{ animationDelay: "0.3s" }}
            >
              <div className="py-3 px-6 border-b border-gray-100">
                <h3 className="text-base font-semibold text-gray-800 flex items-center gap-2">
                  <FileText
                    className="text-[var(--primary)] h-4 w-4 animate-pulseScale"
                    style={{ animationDelay: "0.4s" }}
                  />
                  Detalhes do Atendimento
                </h3>
              </div>

              <div className="p-6">
                <div className="space-y-6">
                  {/* Informações sobre atendente */}
                  {(fatData.nome_atendente || fatData.contato_atendente) && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="text-sm font-semibold text-gray-700 mb-3">
                        Informações do Atendente
                      </h4>
                      <div className="space-y-2">
                        {fatData.nome_atendente && (
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-gray-400" />
                            <p className="text-gray-700">
                              {fatData.nome_atendente}
                            </p>
                          </div>
                        )}
                        {fatData.contato_atendente && (
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-gray-400" />
                            <p className="text-gray-700">
                              {fatData.contato_atendente}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Problema Relatado */}
                  {fatData.descricao_problema && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 mb-2">
                        Problema Relatado
                      </h4>
                      <div className="bg-red-50 p-4 rounded-lg">
                        <p className="text-gray-800 whitespace-pre-line">
                          {fatData.descricao_problema}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Solução Encontrada */}
                  {fatData.solucao_encontrada && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 mb-2">
                        Solução Encontrada
                      </h4>
                      <div className="bg-green-50 p-4 rounded-lg">
                        <p className="text-gray-800 whitespace-pre-line">
                          {fatData.solucao_encontrada}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Testes Realizados */}
                  {fatData.testes_realizados && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 mb-2">
                        Testes Realizados
                      </h4>
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <p className="text-gray-800 whitespace-pre-line">
                          {fatData.testes_realizados}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Sugestões */}
                  {fatData.sugestoes && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 mb-2">
                        Sugestões
                      </h4>
                      <div className="bg-amber-50 p-4 rounded-lg">
                        <p className="text-gray-800 whitespace-pre-line">
                          {fatData.sugestoes}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Observações */}
                  {fatData.observacoes && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 mb-2">
                        Observações
                      </h4>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-gray-800 whitespace-pre-line">
                          {fatData.observacoes}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Card Imagens */}
            <div
              className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6 hover:shadow-md transition-shadow duration-300 animate-fadeIn"
              style={{ animationDelay: "0.35s" }}
            >
              <div className="py-3 px-6 border-b border-gray-100 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <ImageIcon
                    className="text-[var(--primary)] h-4 w-4 animate-pulseScale"
                    style={{ animationDelay: "0.45s" }}
                  />
                  <h3 className="text-base font-semibold text-gray-800">
                    Imagens do Atendimento
                  </h3>
                </div>
                {possuiFotos && (
                  <span className="text-xs font-medium text-gray-500 bg-gray-50 px-2 py-1 rounded-full">
                    {fotosFAT.length} {fotosFAT.length === 1 ? "foto" : "fotos"}
                  </span>
                )}
              </div>

              <div className="p-6">
                {fotosErro && (
                  <div className="mb-4 text-sm text-amber-600 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                    {fotosErro}
                  </div>
                )}

                {loadingFotos ? (
                  <div className="flex items-center justify-center py-10">
                    <div className="w-8 h-8 border-2 border-gray-200 border-t-[var(--primary)] rounded-full animate-spin" />
                  </div>
                ) : possuiFotos ? (
                  <>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                      {fotosFAT.map((foto) => {
                        const previewUrl = fotoPreviews[foto.id_fat_foto];
                        return (
                          <div
                            key={foto.id_fat_foto}
                            className="group bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm hover:shadow transition-shadow duration-200 cursor-pointer"
                            onClick={() => setImagemAmpliada(previewUrl)}
                          >
                            <div className="relative w-full aspect-square bg-gray-50 overflow-hidden">
                              {previewUrl ? (
                                <Image
                                  src={previewUrl}
                                  alt={foto.descricao || foto.nome_arquivo}
                                  fill
                                  sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 200px"
                                  className="object-cover transition-transform duration-200 group-hover:scale-[1.03]"
                                />
                              ) : (
                                <div className="flex flex-col items-center justify-center h-full text-gray-400 text-xs text-center">
                                  <ImageOff className="w-6 h-6" />
                                  <span>Pré-visualização indisponível</span>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Modal de ampliação */}
                    {imagemAmpliada && (
                      <FullscreenImageModal
                        src={imagemAmpliada}
                        onClose={() => setImagemAmpliada(null)}
                        onPrev={() => {
                          const currentIndex = fotosFAT.findIndex(
                            (f) =>
                              fotoPreviews[f.id_fat_foto] === imagemAmpliada
                          );
                          const prevIndex =
                            (currentIndex - 1 + fotosFAT.length) %
                            fotosFAT.length;
                          setImagemAmpliada(
                            fotoPreviews[fotosFAT[prevIndex].id_fat_foto]
                          );
                        }}
                        onNext={() => {
                          const currentIndex = fotosFAT.findIndex(
                            (f) =>
                              fotoPreviews[f.id_fat_foto] === imagemAmpliada
                          );
                          const nextIndex =
                            (currentIndex + 1) % fotosFAT.length;
                          setImagemAmpliada(
                            fotoPreviews[fotosFAT[nextIndex].id_fat_foto]
                          );
                        }}
                        descricao={
                          fotosFAT.find(
                            (f) =>
                              fotoPreviews[f.id_fat_foto] === imagemAmpliada
                          )?.descricao || "Sem descrição"
                        }
                        data={
                          fotosFAT.find(
                            (f) =>
                              fotoPreviews[f.id_fat_foto] === imagemAmpliada
                          )?.data_cadastro || ""
                        }
                      />
                    )}
                  </>
                ) : (
                  <div className="border border-dashed border-gray-200 rounded-lg px-6 py-10 text-center bg-gray-50">
                    <div className="mx-auto mb-3 w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-sm">
                      <ImageIcon className="w-5 h-5 text-gray-400" />
                    </div>
                    <p className="text-sm font-medium text-gray-700">
                      Nenhuma imagem cadastrada para esta FAT.
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      As fotos enviadas pelo técnico ficam disponíveis aqui.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Card Deslocamentos */}
            {fatData.deslocamentos && fatData.deslocamentos.length > 0 && (
              <div
                className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6 hover:shadow-md transition-shadow duration-300 animate-fadeIn"
                style={{ animationDelay: "0.4s" }}
              >
                <div className="py-3 px-6 border-b border-gray-100">
                  <h3 className="text-base font-semibold text-gray-800 flex items-center gap-2">
                    <Truck
                      className="text-[var(--primary)] h-4 w-4 animate-pulseScale"
                      style={{ animationDelay: "0.5s" }}
                    />
                    Deslocamentos ({fatData.deslocamentos.length})
                  </h3>
                </div>
                <div className="p-6">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th
                            scope="col"
                            className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            KM Ida
                          </th>
                          <th
                            scope="col"
                            className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            KM Volta
                          </th>
                          <th
                            scope="col"
                            className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Tempo Ida
                          </th>
                          <th
                            scope="col"
                            className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Tempo Volta
                          </th>
                          <th
                            scope="col"
                            className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Observações
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {fatData.deslocamentos.map((deslocamento, index) => (
                          <tr
                            key={deslocamento.id_deslocamento}
                            className="hover:bg-gray-50 transition-colors"
                            style={{ animationDelay: `${0.05 * index}s` }}
                          >
                            <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                              {formatarNumero(deslocamento.km_ida)} km
                            </td>
                            <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                              {formatarNumero(deslocamento.km_volta)} km
                            </td>
                            <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                              {deslocamento.tempo_ida_min
                                ? `${formatarNumero(
                                    deslocamento.tempo_ida_min
                                  )} min`
                                : "N/A"}
                            </td>
                            <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                              {deslocamento.tempo_volta_min
                                ? `${formatarNumero(
                                    deslocamento.tempo_volta_min
                                  )} min`
                                : "N/A"}
                            </td>
                            <td className="px-3 py-2 text-sm text-gray-900">
                              {deslocamento.observacoes || "N/A"}
                            </td>
                          </tr>
                        ))}
                        {/* Totais */}
                        <tr className="bg-gray-50 font-medium">
                          <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                            Total:{" "}
                            {formatarNumero(
                              fatData.deslocamentos.reduce(
                                (acc, curr) =>
                                  acc + parseFloat(curr.km_ida.toString()),
                                0
                              )
                            )}{" "}
                            km
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                            Total:{" "}
                            {formatarNumero(
                              fatData.deslocamentos.reduce(
                                (acc, curr) =>
                                  acc + parseFloat(curr.km_volta.toString()),
                                0
                              )
                            )}{" "}
                            km
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                            Total:{" "}
                            {formatarNumero(
                              fatData.deslocamentos.reduce(
                                (acc, curr) =>
                                  acc +
                                  (curr.tempo_ida_min
                                    ? parseFloat(curr.tempo_ida_min.toString())
                                    : 0),
                                0
                              )
                            )}{" "}
                            min
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                            Total:{" "}
                            {formatarNumero(
                              fatData.deslocamentos.reduce(
                                (acc, curr) =>
                                  acc +
                                  (curr.tempo_volta_min
                                    ? parseFloat(
                                        curr.tempo_volta_min.toString()
                                      )
                                    : 0),
                                0
                              )
                            )}{" "}
                            min
                          </td>
                          <td className="px-3 py-2 text-sm text-gray-900"></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Card Peças Utilizadas */}
            {fatData.pecas && fatData.pecas.length > 0 && (
              <div
                className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6 hover:shadow-md transition-shadow duration-300 animate-fadeIn"
                style={{ animationDelay: "0.5s" }}
              >
                <div className="py-3 px-6 border-b border-gray-100">
                  <h3 className="text-base font-semibold text-gray-800 flex items-center gap-2">
                    <Package
                      className="text-[var(--primary)] h-4 w-4 animate-pulseScale"
                      style={{ animationDelay: "0.6s" }}
                    />
                    Peças Utilizadas ({fatData.pecas.length})
                  </h3>
                </div>
                <div className="p-6">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th
                            scope="col"
                            className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Código
                          </th>
                          <th
                            scope="col"
                            className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Descrição
                          </th>
                          <th
                            scope="col"
                            className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Quantidade
                          </th>
                          <th
                            scope="col"
                            className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Observações
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {fatData.pecas.map((peca, index) => (
                          <tr
                            key={peca.id_fat_peca}
                            className="hover:bg-gray-50 transition-colors"
                            style={{ animationDelay: `${0.05 * index}s` }}
                          >
                            <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900 font-medium">
                              {peca.codigo_peca}
                            </td>
                            <td className="px-3 py-2 text-sm text-gray-900">
                              {peca.descricao_peca}
                            </td>
                            <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                              {formatarNumero(peca.quantidade)}
                            </td>
                            <td className="px-3 py-2 text-sm text-gray-900">
                              {peca.observacoes || "N/A"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Card Fotos
            {fatData.fotos && fatData.fotos.length > 0 && (
              <div
                className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6 hover:shadow-md transition-shadow duration-300 animate-fadeIn"
                style={{ animationDelay: "0.6s" }}
              >
                <div className="py-3 px-6 border-b border-gray-100">
                  <h3 className="text-base font-semibold text-gray-800 flex items-center gap-2">
                    <ImageIcon
                      className="text-[var(--primary)] h-4 w-4 animate-pulseScale"
                      style={{ animationDelay: "0.7s" }}
                    />
                    Fotos ({fatData.fotos.length})
                  </h3>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {fatData.fotos.map((foto, index) => (
                      <div
                        key={foto.id_fat_foto}
                        className="bg-gray-50 rounded-lg p-2 hover:shadow-md transition-shadow duration-200 animate-fadeIn"
                        style={{ animationDelay: `${0.05 * index}s` }}
                      >
                        <div className="aspect-square bg-gray-100 rounded-md flex items-center justify-center mb-2 overflow-hidden">
                          <Image
                            src={`/api/fotos/${foto.nome_arquivo}`}
                            alt={foto.descricao || `Foto ${index + 1}`}
                            className="object-contain w-full h-full"
                            width={300}
                            height={300}
                            onError={(e) => {
                              // Using a type assertion for the error event
                              const imgElement =
                                e.currentTarget as HTMLImageElement;
                              imgElement.src =
                                "https://via.placeholder.com/300?text=Imagem+não+disponível";
                            }}
                          />
                        </div>
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-xs text-gray-500">
                              {foto.data_cadastro}
                            </p>
                            <p className="text-sm text-gray-800 truncate">
                              {foto.descricao || `Foto ${index + 1}`}
                            </p>
                          </div>
                          <a
                            href={`/api/fotos/${foto.nome_arquivo}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-blue-500 hover:text-blue-700 transition-colors p-1"
                            title="Abrir em nova janela"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )} */}

            {/* Card Ocorrências - Redesenhado como Timeline */}
            {fatData.ocorrencias && fatData.ocorrencias.length > 0 && (
              <div
                className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6 hover:shadow-md transition-shadow duration-300 animate-fadeIn"
                style={{ animationDelay: "0.7s" }}
              >
                <div className="py-3 px-6 border-b border-gray-100">
                  <h3 className="text-base font-semibold text-gray-800 flex items-center gap-2">
                    <Clock
                      className="text-[var(--primary)] h-4 w-4 animate-pulseScale"
                      style={{ animationDelay: "0.8s" }}
                    />
                    Histórico de Ocorrências ({fatData.ocorrencias.length})
                  </h3>
                </div>
                <div className="p-6">
                  {/* Timeline vertical */}
                  <div className="relative">
                    {/* Linha vertical da timeline */}
                    <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>

                    {/* Ordenar ocorrências por data (mais recente primeiro) */}
                    {fatData.ocorrencias.map((ocorrencia, index) => {
                      // Função para renderizar círculo de status na timeline
                      const renderTimelineCircle = () => {
                        const statusCode = ocorrencia.nova_situacao.codigo;
                        let bgColor = "bg-gray-100";
                        let borderColor = "border-gray-300";
                        let textColor = "text-gray-500";

                        switch (statusCode) {
                          case 1: // Pendente
                            bgColor = "bg-gray-100";
                            borderColor = "border-gray-300";
                            textColor = "text-gray-500";
                            break;
                          case 2: // A atender
                            bgColor = "bg-blue-100";
                            borderColor = "border-blue-300";
                            textColor = "text-blue-500";
                            break;
                          case 3: // Em deslocamento
                            bgColor = "bg-purple-100";
                            borderColor = "border-purple-300";
                            textColor = "text-purple-500";
                            break;
                          case 4: // Em atendimento
                            bgColor = "bg-orange-100";
                            borderColor = "border-orange-300";
                            textColor = "text-orange-500";
                            break;
                          case 5: // Atendimento interrompido
                            bgColor = "bg-amber-100";
                            borderColor = "border-amber-300";
                            textColor = "text-amber-500";
                            break;
                          case 6: // Em Revisão
                            bgColor = "bg-indigo-100";
                            borderColor = "border-indigo-300";
                            textColor = "text-indigo-500";
                            break;
                          case 7: // Concluída
                            bgColor = "bg-green-100";
                            borderColor = "border-green-300";
                            textColor = "text-green-500";
                            break;
                          case 8: // Cancelada
                            bgColor = "bg-red-100";
                            borderColor = "border-red-300";
                            textColor = "text-red-500";
                            break;
                          case 9: // Cancelada pelo Cliente
                            bgColor = "bg-rose-100";
                            borderColor = "border-rose-300";
                            textColor = "text-rose-500";
                            break;
                        }

                        return (
                          <div
                            className={`absolute -left-10 top-1.5 w-6 h-6 rounded-full flex items-center justify-center z-10 ${bgColor} border-2 ${borderColor}`}
                          >
                            {statusMapping[statusCode]?.icon || (
                              <Clock className={`w-3 h-3 ${textColor}`} />
                            )}
                          </div>
                        );
                      };

                      // Função para renderizar o card da ocorrência
                      const renderOcorrenciaCard = () => {
                        const statusCode = ocorrencia.nova_situacao.codigo;
                        let bgHeaderColor = "bg-gray-50";
                        let borderHeaderColor = "border-gray-100";
                        let borderCardColor = "border-gray-100";
                        let textStatusColor = "text-gray-700";

                        switch (statusCode) {
                          case 1: // Pendente
                            bgHeaderColor = "bg-gray-50";
                            borderHeaderColor = "border-gray-100";
                            borderCardColor = "border-gray-100";
                            textStatusColor = "text-gray-700";
                            break;
                          case 2: // A atender
                            bgHeaderColor = "bg-blue-50";
                            borderHeaderColor = "border-blue-100";
                            borderCardColor = "border-blue-100";
                            textStatusColor = "text-blue-700";
                            break;
                          case 3: // Em deslocamento
                            bgHeaderColor = "bg-purple-50";
                            borderHeaderColor = "border-purple-100";
                            borderCardColor = "border-purple-100";
                            textStatusColor = "text-purple-700";
                            break;
                          case 4: // Em atendimento
                            bgHeaderColor = "bg-orange-50";
                            borderHeaderColor = "border-orange-100";
                            borderCardColor = "border-orange-100";
                            textStatusColor = "text-orange-700";
                            break;
                          case 5: // Atendimento interrompido
                            bgHeaderColor = "bg-amber-50";
                            borderHeaderColor = "border-amber-100";
                            borderCardColor = "border-amber-100";
                            textStatusColor = "text-amber-700";
                            break;
                          case 6: // Em Revisão
                            bgHeaderColor = "bg-indigo-50";
                            borderHeaderColor = "border-indigo-100";
                            borderCardColor = "border-indigo-100";
                            textStatusColor = "text-indigo-700";
                            break;
                          case 7: // Concluída
                            bgHeaderColor = "bg-green-50";
                            borderHeaderColor = "border-green-100";
                            borderCardColor = "border-green-100";
                            textStatusColor = "text-green-700";
                            break;
                          case 8: // Cancelada
                            bgHeaderColor = "bg-red-50";
                            borderHeaderColor = "border-red-100";
                            borderCardColor = "border-red-100";
                            textStatusColor = "text-red-700";
                            break;
                          case 9: // Cancelada pelo Cliente
                            bgHeaderColor = "bg-rose-50";
                            borderHeaderColor = "border-rose-100";
                            borderCardColor = "border-rose-100";
                            textStatusColor = "text-rose-700";
                            break;
                        }

                        return (
                          <div
                            className={`bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden border ${borderCardColor}`}
                          >
                            {/* Cabeçalho do card */}
                            <div
                              className={`px-4 py-2 flex justify-between items-center ${bgHeaderColor} border-b ${borderHeaderColor}`}
                            >
                              <div className="flex items-center gap-3">
                                <div className="flex flex-col">
                                  <span
                                    className={`font-medium text-sm ${textStatusColor}`}
                                  >
                                    {ocorrencia.nova_situacao.descricao}
                                  </span>
                                  <span className="text-xs text-gray-500 flex items-center gap-1">
                                    <CalendarClock className="w-3 h-3" />
                                    {ocorrencia.data_ocorrencia}
                                  </span>
                                </div>
                              </div>
                              <div className="flex items-center gap-1">
                                <User className="w-3.5 h-3.5 text-gray-400" />
                                <span className="text-xs font-medium text-gray-600">
                                  {ocorrencia.usuario?.nome || "Sistema"}
                                </span>
                              </div>
                            </div>

                            {/* Corpo do card */}
                            {ocorrencia.descricao_ocorrencia ? (
                              <div className="px-4 py-3">
                                <p className="text-sm text-gray-700 whitespace-pre-line">
                                  {ocorrencia.descricao_ocorrencia}
                                </p>
                              </div>
                            ) : (
                              <div className="px-4 py-3">
                                <p className="text-xs text-gray-400 italic">
                                  Alteração de status sem comentários adicionais
                                </p>
                              </div>
                            )}
                          </div>
                        );
                      };

                      return (
                        <div
                          key={ocorrencia.id_ocorrencia}
                          className="ml-10 mb-6 relative animate-fadeIn last:mb-0"
                          style={{ animationDelay: `${0.05 * index}s` }}
                        >
                          {renderTimelineCircle()}
                          {renderOcorrenciaCard()}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Botão Voltar ao Topo */}
      {showScrollToTop && (
        <button
          onClick={handleScrollToTop}
          className="fixed bottom-6 right-6 bg-[var(--primary)] text-white p-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:bg-[var(--primary-dark)] animate-fadeIn z-50"
          aria-label="Voltar ao topo"
        >
          <ArrowUp className="h-5 w-5" />
        </button>
      )}
    </>
  );
};

export default FATDetalhesPage;
