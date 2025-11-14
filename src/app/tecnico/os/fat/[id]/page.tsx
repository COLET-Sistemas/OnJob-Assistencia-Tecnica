"use client";
import React, {
  useEffect,
  useState,
  useCallback,
  useRef,
  useMemo,
} from "react";
import { useRouter, useParams } from "next/navigation";
import dynamic from "next/dynamic";
import MobileHeader from "@/components/tecnico/MobileHeader";
import {
  User,
  Settings,
  Calendar,
  AlertTriangle,
  FileSearch,
  MessageSquare,
  Package,
  Car,
  ChevronLeft,
  ChevronRight,
  FileText,
  Wrench,
  Camera,
  CheckSquare,
  Eye,
  Timer,
  History,
  ImageOff,
} from "lucide-react";
import { fatService, type FATDetalhada } from "@/api/services/fatService";
import { fatFotosService } from "@/api/services/fatFotosService";
import { Loading } from "@/components/LoadingPersonalizado";
import Toast from "@/components/tecnico/Toast";
import StatusBadge from "@/components/tecnico/StatusBadge";

// Lazy load components para melhor performance
const FloatingActionMenuFat = dynamic(
  () => import("@/components/tecnico/FloatingActionMenuFat"),
  {
    ssr: false,
    loading: () => null,
  }
);

type FATDeslocamento = NonNullable<FATDetalhada["deslocamentos"]>[number];
type FATPeca = NonNullable<FATDetalhada["pecas"]>[number];
type FATFoto = NonNullable<FATDetalhada["fotos"]>[number];

type SectionActionButtonProps = {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
};

function SectionActionButton({
  label,
  icon,
  onClick,
}: SectionActionButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-[#7B54BE] bg-white px-3 py-2 text-xs font-medium text-slate-600 transition-all duration-200 hover:border-slate-300 hover:bg-slate-50 active:scale-95 active:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-200 touch-manipulation"
    >
      <span className="flex items-center justify-center text-slate-500">
        {icon}
      </span>
      <span>{label}</span>
    </button>
  );
}

// Componente Section reutilizável com melhor performance para mobile
const Section = React.memo(
  ({
    title,
    icon,
    children,
    collapsible = false,
    defaultExpanded = true,
  }: {
    title: string;
    icon: React.ReactNode;
    children: React.ReactNode;
    collapsible?: boolean;
    defaultExpanded?: boolean;
  }) => {
    const [expanded, setExpanded] = useState(defaultExpanded);

    const handleToggle = useCallback(() => {
      if (collapsible) {
        setExpanded(!expanded);
      }
    }, [collapsible, expanded]);

    return (
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <div
          className={`flex items-center justify-between p-4 ${
            collapsible
              ? "cursor-pointer hover:bg-slate-50 active:bg-slate-100 touch-manipulation select-none"
              : ""
          } transition-all duration-200`}
          onClick={handleToggle}
          role={collapsible ? "button" : undefined}
          tabIndex={collapsible ? 0 : undefined}
          onKeyDown={
            collapsible
              ? (e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleToggle();
                  }
                }
              : undefined
          }
        >
          <div className="flex items-center gap-2">
            <div className="text-slate-600">{icon}</div>
            <h3 className="font-medium text-slate-900 text-sm">{title}</h3>
          </div>
          {collapsible && (
            <ChevronRight
              className={`w-4 h-4 text-slate-400 transition-transform duration-300 ease-out ${
                expanded ? "rotate-90" : ""
              }`}
            />
          )}
        </div>
        <div
          className={`overflow-hidden transition-all duration-300 ease-out ${
            !collapsible || expanded
              ? "max-h-[2000px] opacity-100"
              : "max-h-0 opacity-0"
          }`}
        >
          <div className="px-4 pb-4 space-y-3">{children}</div>
        </div>
      </div>
    );
  }
);

Section.displayName = "Section";

// Componente Field reutilizável com otimização
const Field = React.memo(
  ({
    label,
    value,
    icon,
  }: {
    label: string;
    value: string | React.ReactNode;
    icon?: React.ReactNode;
  }) => {
    if (!value || value === "Não informado" || value === "") return null;

    return (
      <div className="flex items-start gap-2 min-w-0">
        {icon && (
          <div className="text-slate-400 mt-0.5 flex-shrink-0">{icon}</div>
        )}
        <div className="min-w-0 flex-1">
          <p className="text-xs text-slate-500 mb-0.5 font-medium">{label}</p>
          <div className="text-sm text-slate-900 break-words leading-relaxed whitespace-pre-wrap">
            {value}
          </div>
        </div>
      </div>
    );
  },
  (prevProps, nextProps) => {
    // Comparação customizada para evitar re-renders desnecessários
    return (
      prevProps.label === nextProps.label &&
      prevProps.value === nextProps.value &&
      prevProps.icon === nextProps.icon
    );
  }
);

Field.displayName = "Field";

const DeslocamentosSectionContent = React.memo(
  ({
    deslocamentos,
    formatTime,
    onNavigate,
  }: {
    deslocamentos: FATDeslocamento[];
    formatTime: (minutes: number | null | undefined) => string | null;
    onNavigate: () => void;
  }) => {
    const hasDeslocamentos = deslocamentos.length > 0;

    return (
      <>
        {hasDeslocamentos ? (
          <div className="space-y-2">
            {deslocamentos.map((desloc, index) => (
              <div
                key={desloc.id_deslocamento || index}
                className="p-3 bg-slate-50 rounded-lg"
              >
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-slate-500">KM Ida:</span>
                    <span className="ml-1 text-slate-900">
                      {desloc.km_ida || 0}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500">KM Volta:</span>
                    <span className="ml-1 text-slate-900">
                      {desloc.km_volta || 0}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500">Tempo Ida:</span>
                    <span className="ml-1 text-slate-900">
                      {formatTime(desloc.tempo_ida_min) || "N/A"}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500">Tempo Volta:</span>
                    <span className="ml-1 text-slate-900">
                      {formatTime(desloc.tempo_volta_min) || "N/A"}
                    </span>
                  </div>
                </div>
                {desloc.observacoes && (
                  <div className="mt-2">
                    <p className="text-xs text-slate-500 mb-1">Observações:</p>
                    <p className="text-xs text-slate-700">
                      {desloc.observacoes}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-500 italic">
            Nenhum deslocamento registrado
          </p>
        )}
        <div className="mt-4">
          <SectionActionButton
            label="Ir para Deslocamento"
            icon={<Car className="w-4 h-4" />}
            onClick={onNavigate}
          />
        </div>
      </>
    );
  }
);

DeslocamentosSectionContent.displayName = "DeslocamentosSectionContent";

const PecasSectionContent = React.memo(
  ({ pecas, onNavigate }: { pecas: FATPeca[]; onNavigate: () => void }) => {
    const hasPecas = pecas.length > 0;

    return (
      <>
        {hasPecas ? (
          <div className="space-y-2">
            {pecas.map((peca, index) => (
              <div
                key={peca.id_fat_peca || index}
                className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs text-slate-900 font-medium">
                      {peca.descricao_peca}
                    </span>
                  </div>
                  {peca.codigo_peca && (
                    <p className="text-xs text-slate-600">
                      Código: {peca.codigo_peca}
                    </p>
                  )}
                  {peca.observacoes && (
                    <p className="text-xs text-slate-500 mt-1">
                      Obs: {peca.observacoes}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-600 bg-white px-2 py-1 rounded">
                    Qtd: {peca.quantidade}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-500 italic">
            Nenhuma peça cadastrada
          </p>
        )}
        <div className="mt-4">
          <SectionActionButton
            label="Ir para Peças"
            icon={<Package className="w-4 h-4" />}
            onClick={onNavigate}
          />
        </div>
      </>
    );
  }
);

PecasSectionContent.displayName = "PecasSectionContent";

const FotosSectionContent = React.memo(
  ({
    fotos,
    photoPreviews,
    loadingPhotoPreviews,
    photoPreviewError,
    formatPhotoDate,
    onOpen,
    onNavigate,
  }: {
    fotos: FATFoto[];
    photoPreviews: Record<number, string>;
    loadingPhotoPreviews: boolean;
    photoPreviewError: string;
    formatPhotoDate: (value: string | Date | null | undefined) => string;
    onOpen: (index: number) => void;
    onNavigate: () => void;
  }) => {
    const hasPhotos = fotos.length > 0;

    return (
      <>
        {hasPhotos ? (
          <div className="space-y-3">
            {photoPreviewError && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700">
                {photoPreviewError}
              </div>
            )}
            {fotos.map((foto, index) => {
              const previewUrl = photoPreviews[foto.id_fat_foto];
              const isLoadingPreview = loadingPhotoPreviews && !previewUrl;

              return (
                <div
                  key={foto.id_fat_foto || index}
                  className="flex items-start gap-3 rounded-lg border border-slate-200 bg-white p-3 shadow-sm"
                >
                  <button
                    type="button"
                    onClick={() => onOpen(index)}
                    className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-md border border-slate-200 bg-slate-100 transition-all duration-200 hover:border-[#7B54BE]/60 active:scale-95 touch-manipulation focus:outline-none focus:ring-2 focus:ring-[#7B54BE] focus:ring-offset-2"
                  >
                    {previewUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={previewUrl}
                        alt={foto.descricao || foto.nome_arquivo}
                        className="h-full w-full object-cover transition-transform duration-200 hover:scale-105"
                        loading="lazy"
                        decoding="async"
                      />
                    ) : isLoadingPreview ? (
                      <div className="flex h-full w-full items-center justify-center">
                        <div className="h-6 w-6 rounded-full border-2 border-slate-200 border-t-[#7B54BE] animate-spin" />
                      </div>
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-slate-400">
                        <ImageOff className="h-6 w-6" />
                      </div>
                    )}
                  </button>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-800 line-clamp-2">
                      {foto.descricao?.trim() || foto.nome_arquivo}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      {formatPhotoDate(foto.data_cadastro)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-slate-500 italic">
            Nenhuma foto cadastrada
          </p>
        )}
        <div className="mt-4">
          <SectionActionButton
            label="Ir para Fotos"
            icon={<Camera className="w-4 h-4" />}
            onClick={onNavigate}
          />
        </div>
      </>
    );
  }
);

FotosSectionContent.displayName = "FotosSectionContent";

export default function FATDetalheMobile() {
  const router = useRouter();
  const params = useParams();
  const [fat, setFat] = useState<FATDetalhada | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [toast, setToast] = useState<{
    visible: boolean;
    message: string;
    type: "success" | "error";
  }>({
    visible: false,
    message: "",
    type: "success",
  });
  const [photoPreviews, setPhotoPreviews] = useState<Record<number, string>>(
    {}
  );
  const [loadingPhotoPreviews, setLoadingPhotoPreviews] = useState(false);
  const [photoPreviewError, setPhotoPreviewError] = useState("");
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(
    null
  );

  // Estados para controle de gestos touch
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const situacoesComBotoes = ["3", "4", "5"];

  const deveMostrarBotoes = situacoesComBotoes.includes(
    String(fat?.situacao?.codigo)
  );

  // Debounce para navegação para evitar múltiplos cliques
  const [navigationDebounce, setNavigationDebounce] = useState(false);

  const debouncedNavigate = useCallback(
    (navigateFunction: () => void) => {
      if (navigationDebounce) return;

      setNavigationDebounce(true);
      navigateFunction();

      setTimeout(() => {
        setNavigationDebounce(false);
      }, 300);
    },
    [navigationDebounce]
  );

  // Prevenção de scroll body quando modal está aberto
  useEffect(() => {
    if (isPhotoModalOpen) {
      document.body.style.overflow = "hidden";
      document.body.style.position = "fixed";
      document.body.style.width = "100%";
    } else {
      document.body.style.overflow = "";
      document.body.style.position = "";
      document.body.style.width = "";
    }

    return () => {
      document.body.style.overflow = "";
      document.body.style.position = "";
      document.body.style.width = "";
    };
  }, [isPhotoModalOpen]);
  // Função auxiliar para mostrar toast com auto-hide
  const showToast = useCallback(
    (message: string, type: "success" | "error" = "success") => {
      setToast({
        visible: true,
        message,
        type,
      });
    },
    []
  );

  const isLoadingRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const photoObjectUrlsRef = useRef<Map<number, string>>(new Map());

  const formatDate = useCallback((dateStr: string | null | undefined) => {
    if (!dateStr?.trim()) return null;
    return dateStr;
  }, []);

  const formatPhotoDate = useCallback(
    (dateStr: string | Date | null | undefined) => {
      if (!dateStr) return "Data n\u00e3o dispon\u00edvel";

      const raw =
        dateStr instanceof Date
          ? dateStr.toISOString()
          : typeof dateStr === "string"
          ? dateStr
          : String(dateStr);

      const value = raw.trim();
      if (!value) return "Data n\u00e3o dispon\u00edvel";

      try {
        const normalized = value.includes("T")
          ? value
          : value.replace(" ", "T");
        const parsed = new Date(normalized);
        if (!Number.isNaN(parsed.getTime())) {
          return parsed.toLocaleDateString("pt-BR");
        }
      } catch {
        // ignora queda de parse e tenta fallback textual
      }

      const [datePart] = value.split(" ");
      if (!datePart) return "Data n\u00e3o dispon\u00edvel";

      if (datePart.includes("-")) {
        const [year, month, day] = datePart.split("-");
        if (year && month && day) {
          return `${day.padStart(2, "0")}/${month.padStart(2, "0")}/${year}`;
        }
      }

      return datePart;
    },
    []
  );

  const formatTime = useCallback((minutes: number | null | undefined) => {
    if (!minutes) return null;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}min`;
  }, []);

  const handleNavigateToOS = useCallback(() => {
    const paramId = Array.isArray(params?.id) ? params?.id[0] : params?.id;
    const targetOsId = fat?.id_os ?? paramId;
    if (targetOsId) {
      router.push(`/tecnico/os/${targetOsId}`);
    } else {
      router.push("/tecnico/os");
    }
  }, [fat?.id_os, params?.id, router]);

  const handleNavigateToSection = useCallback(
    (section: "deslocamento" | "atendimento" | "pecas" | "fotos") => {
      const fatId = Array.isArray(params?.id) ? params?.id[0] : params?.id;
      if (!fatId) {
        return;
      }
      router.push(`/tecnico/os/fat/${fatId}/${section}`);
    },
    [params?.id, router]
  );

  const goToDeslocamento = useCallback(
    () => debouncedNavigate(() => handleNavigateToSection("deslocamento")),
    [handleNavigateToSection, debouncedNavigate]
  );

  const goToAtendimento = useCallback(
    () => debouncedNavigate(() => handleNavigateToSection("atendimento")),
    [handleNavigateToSection, debouncedNavigate]
  );

  const goToPecas = useCallback(
    () => debouncedNavigate(() => handleNavigateToSection("pecas")),
    [handleNavigateToSection, debouncedNavigate]
  );

  const goToFotos = useCallback(
    () => debouncedNavigate(() => handleNavigateToSection("fotos")),
    [handleNavigateToSection, debouncedNavigate]
  );

  // Função para extrair mensagem de erro da API
  const extractErrorMessage = useCallback((error: unknown): string => {
    let errorMessage = "Ocorreu um erro durante a operação";

    if (error && typeof error === "object") {
      if (
        "response" in error &&
        error.response &&
        typeof error.response === "object" &&
        "status" in error.response &&
        error.response.status === 409 &&
        "data" in error.response &&
        error.response.data &&
        typeof error.response.data === "object" &&
        "erro" in error.response.data
      ) {
        errorMessage = String(error.response.data.erro);
      } else if ("message" in error && typeof error.message === "string") {
        errorMessage = error.message;
      }
    }

    return errorMessage;
  }, []);

  // Função para buscar dados da FAT
  const fetchFAT = useCallback(
    async (force = false) => {
      if (!params?.id) {
        setError("ID da FAT não fornecido");
        setLoading(false);
        return;
      }

      if (isLoadingRef.current && !force) {
        return;
      }

      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      abortControllerRef.current = new AbortController();
      isLoadingRef.current = true;
      setLoading(true);
      setError("");

      try {
        const response = await fatService.getById(Number(params.id), force);

        if (abortControllerRef.current?.signal.aborted) {
          return;
        }

        if (!response) {
          setError("FAT não encontrada");
          return;
        }
        setFat(response);
      } catch (error: unknown) {
        if (abortControllerRef.current?.signal.aborted) {
          return;
        }

        console.error("Erro ao carregar FAT:", error);
        let errorMessage = "Erro ao carregar detalhes da FAT";

        if (error && typeof error === "object") {
          if ("message" in error && typeof error.message === "string") {
            errorMessage = error.message;
          }
        }

        setError(errorMessage);
      } finally {
        isLoadingRef.current = false;
        setLoading(false);
      }
    },
    [params?.id]
  );

  useEffect(() => {
    let mounted = true;

    const loadFAT = async () => {
      if (mounted) {
        await fetchFAT();
      }
    };

    loadFAT();

    return () => {
      mounted = false;
      isLoadingRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    };
  }, [fetchFAT]);

  useEffect(() => {
    // ðŸ‘‡ Capture a snapshot of the ref's current value
    const photoUrlsSnapshot = photoObjectUrlsRef.current;

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Use the snapshot instead of the ref directly
      photoUrlsSnapshot.forEach((url) => {
        URL.revokeObjectURL(url);
      });

      photoUrlsSnapshot.clear();
    };
  }, []);

  useEffect(() => {
    if (!fat?.fotos || fat.fotos.length === 0) {
      photoObjectUrlsRef.current.forEach((url) => {
        URL.revokeObjectURL(url);
      });
      photoObjectUrlsRef.current.clear();
      setPhotoPreviews({});
      setPhotoPreviewError("");
      setIsPhotoModalOpen(false);
      setSelectedPhotoIndex(null);
      setLoadingPhotoPreviews(false);
      return;
    }

    const fotosAtuais = fat.fotos;
    const activeIds = new Set(fotosAtuais.map((foto) => foto.id_fat_foto));

    photoObjectUrlsRef.current.forEach((url, id) => {
      if (!activeIds.has(id)) {
        URL.revokeObjectURL(url);
        photoObjectUrlsRef.current.delete(id);
      }
    });

    setPhotoPreviews((prev) => {
      const next: Record<number, string> = {};
      activeIds.forEach((id) => {
        const stored =
          photoObjectUrlsRef.current.get(id) ?? prev[id] ?? undefined;
        if (stored) {
          next[id] = stored;
          if (!photoObjectUrlsRef.current.has(id)) {
            photoObjectUrlsRef.current.set(id, stored);
          }
        }
      });
      return next;
    });

    const missingFotos = fotosAtuais.filter(
      (foto) => !photoObjectUrlsRef.current.has(foto.id_fat_foto)
    );

    if (missingFotos.length === 0) {
      return;
    }

    let cancelled = false;

    const loadPreviews = async () => {
      setLoadingPhotoPreviews(true);
      setPhotoPreviewError("");

      try {
        const results = await Promise.all(
          missingFotos.map(async (foto) => {
            try {
              const blob = await fatFotosService.visualizar(foto.id_fat_foto);
              const objectUrl = URL.createObjectURL(blob);
              return { id: foto.id_fat_foto, url: objectUrl };
            } catch {
              return { id: foto.id_fat_foto, url: "" };
            }
          })
        );

        if (cancelled) {
          results.forEach(({ url }) => {
            if (url) {
              URL.revokeObjectURL(url);
            }
          });
          return;
        }

        const newEntries: Record<number, string> = {};
        let hadError = false;

        results.forEach(({ id, url }) => {
          if (url) {
            const existing = photoObjectUrlsRef.current.get(id);
            if (existing) {
              URL.revokeObjectURL(existing);
            }
            photoObjectUrlsRef.current.set(id, url);
            newEntries[id] = url;
          } else {
            hadError = true;
          }
        });

        if (Object.keys(newEntries).length > 0) {
          setPhotoPreviews((prev) => ({ ...prev, ...newEntries }));
        }

        if (hadError) {
          setPhotoPreviewError(
            "Algumas fotos n\u00e3o puderam ser carregadas."
          );
        }
      } catch {
        if (!cancelled) {
          setPhotoPreviewError(
            "N\u00e3o foi poss\u00edvel carregar as fotos da FAT."
          );
        }
      } finally {
        if (!cancelled) {
          setLoadingPhotoPreviews(false);
        }
      }
    };

    loadPreviews();

    return () => {
      cancelled = true;
    };
  }, [fat?.fotos]);

  const handleIniciarAtendimento = useCallback(async () => {
    try {
      setLoading(true);
      // TODO: implementar API call para iniciar atendimento
      // Exemplo: const response = await fatService.iniciarAtendimento(fat?.id_fat);

      try {
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Simulando sucesso da API
        const responseMessage = "Atendimento iniciado com sucesso!";
        showToast(responseMessage, "success");

        await fetchFAT(true);
      } catch (error) {
        console.error("Erro ao iniciar atendimento:", error);

        const errorMessage = extractErrorMessage(error);

        showToast(errorMessage, "error");
      }
    } finally {
      setLoading(false);
    }
  }, [fetchFAT, extractErrorMessage, showToast]);

  const handlePausarAtendimento = useCallback(async () => {
    console.log("Pausar atendimento");
    try {
      setLoading(true);
      // TODO: implementar API call para pausar atendimento
      // Exemplo: const response = await fatService.pausarAtendimento(fat?.id_fat);

      try {
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Simulando sucesso da API
        const responseMessage = "Atendimento pausado com sucesso!";

        showToast(responseMessage, "success");

        await fetchFAT(true);
      } catch (error) {
        console.error("Erro ao pausar atendimento:", error);

        const errorMessage = extractErrorMessage(error);

        showToast(errorMessage, "error");
      }
    } finally {
      setLoading(false);
    }
  }, [fetchFAT, extractErrorMessage, showToast]);

  const handleRetomarAtendimento = useCallback(async () => {
    console.log("Retomar atendimento");
    try {
      setLoading(true);
      // TODO: implementar API call para retomar atendimento
      // Exemplo: const response = await fatService.retomarAtendimento(fat?.id_fat);

      try {
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Simulando sucesso da API
        const responseMessage = "Atendimento retomado com sucesso!";

        showToast(responseMessage, "success");

        await fetchFAT(true);
      } catch (error) {
        console.error("Erro ao retomar atendimento:", error);

        const errorMessage = extractErrorMessage(error);

        showToast(errorMessage, "error");
      }
    } finally {
      setLoading(false);
    }
  }, [fetchFAT, extractErrorMessage, showToast]);

  const handleInterromperAtendimento = useCallback(async () => {
    try {
      setLoading(true);
      // TODO: implementar API call para interromper atendimento
      // Exemplo: const response = await fatService.interromperAtendimento(fat?.id_fat);

      try {
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Simulando sucesso da API
        const responseMessage = "Atendimento interrompido com sucesso!";

        showToast(responseMessage, "success");

        await fetchFAT(true);
      } catch (error) {
        console.error("Erro ao interromper atendimento:", error);

        const errorMessage = extractErrorMessage(error);

        showToast(errorMessage, "error");
      }
    } finally {
      setLoading(false);
    }
  }, [fetchFAT, extractErrorMessage, showToast]);

  const handleCancelarAtendimento = useCallback(async () => {
    try {
      setLoading(true);
      await new Promise((resolve) => setTimeout(resolve, 1000));
      const responseMessage = "Atendimento cancelado com sucesso!";
      showToast(responseMessage, "success");

      setTimeout(() => {
        handleNavigateToOS();
      }, 1500);
    } catch (error) {
      console.error("Erro ao cancelar atendimento:", error);
      const errorMessage = extractErrorMessage(error);
      showToast(errorMessage, "error");
    } finally {
      setLoading(false);
    }
  }, [handleNavigateToOS, extractErrorMessage, showToast]);

  const handleConcluirAtendimento = useCallback(async () => {
    try {
      setLoading(true);
      await new Promise((resolve) => setTimeout(resolve, 1000));
      const responseMessage = "Atendimento concluí­do com sucesso!";
      showToast(responseMessage, "success");

      setTimeout(() => {
        handleNavigateToOS();
      }, 1500);
    } catch (error) {
      console.error("Erro ao concluir atendimento:", error);
      const errorMessage = extractErrorMessage(error);
      showToast(errorMessage, "error");
    } finally {
      setLoading(false);
    }
  }, [handleNavigateToOS, extractErrorMessage, showToast]);

  const fotos = useMemo(() => fat?.fotos ?? [], [fat?.fotos]);
  const hasPhotos = fotos.length > 0;
  const hasMultiplePhotos = fotos.length > 1;

  const pecas = useMemo(() => fat?.pecas ?? [], [fat?.pecas]);
  const deslocamentos = useMemo(
    () => fat?.deslocamentos ?? [],
    [fat?.deslocamentos]
  );

  const selectedPhoto =
    selectedPhotoIndex !== null && selectedPhotoIndex >= 0
      ? fotos[selectedPhotoIndex] ?? null
      : null;

  const selectedPhotoPreview = selectedPhoto
    ? photoPreviews[selectedPhoto.id_fat_foto] ?? ""
    : "";

  const openPhotoViewer = useCallback(
    (index: number) => {
      if (!hasPhotos) return;
      setSelectedPhotoIndex(index);
      setIsPhotoModalOpen(true);
    },
    [hasPhotos]
  );

  const closePhotoViewer = useCallback(() => {
    setIsPhotoModalOpen(false);
    setSelectedPhotoIndex(null);
  }, []);

  const showNextPhoto = useCallback(() => {
    if (!hasMultiplePhotos) return;
    setSelectedPhotoIndex((current) => {
      if (current === null || fotos.length === 0) return current;
      return (current + 1) % fotos.length;
    });
  }, [fotos.length, hasMultiplePhotos]);

  const showPreviousPhoto = useCallback(() => {
    if (!hasMultiplePhotos) return;
    setSelectedPhotoIndex((current) => {
      if (current === null || fotos.length === 0) return current;
      return (current - 1 + fotos.length) % fotos.length;
    });
  }, [fotos.length, hasMultiplePhotos]);

  // Distância mínima para swipe
  const minSwipeDistance = 50;

  // Handlers para gestos touch
  const onTouchStart = useCallback((e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  }, []);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  }, []);

  const onTouchEnd = useCallback(() => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe && hasMultiplePhotos) {
      showNextPhoto();
    }
    if (isRightSwipe && hasMultiplePhotos) {
      showPreviousPhoto();
    }
  }, [
    touchStart,
    touchEnd,
    hasMultiplePhotos,
    showNextPhoto,
    showPreviousPhoto,
    minSwipeDistance,
  ]);

  useEffect(() => {
    if (selectedPhotoIndex === null) return;

    if (fotos.length === 0) {
      setSelectedPhotoIndex(null);
      setIsPhotoModalOpen(false);
      return;
    }

    if (selectedPhotoIndex < 0 || selectedPhotoIndex >= fotos.length) {
      setSelectedPhotoIndex(Math.max(0, fotos.length - 1));
    }
  }, [fotos.length, selectedPhotoIndex]);

  const initialLoading = loading && !fat;

  if (initialLoading) {
    return (
      <>
        <MobileHeader
          title="Detalhes da FAT"
          onAddClick={handleNavigateToOS}
          leftVariant="back"
        />
        <Loading
          fullScreen={true}
          preventScroll={false}
          text="Carregando detalhes da FAT..."
          size="large"
        />
      </>
    );
  }

  if (error) {
    return (
      <>
        <MobileHeader
          title="Detalhes da FAT"
          onAddClick={handleNavigateToOS}
          leftVariant="back"
        />
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center shadow-lg border border-red-200">
            <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-red-500" />
            <h2 className="font-semibold text-slate-900 mb-3 text-lg">Erro</h2>
            <p className="text-sm text-slate-600 mb-6 leading-relaxed">
              {error}
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleNavigateToOS}
                className="flex-1 px-4 py-3 bg-slate-100 text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-200 active:scale-95 transition-all duration-200 touch-manipulation"
              >
                Voltar
              </button>
              <button
                onClick={() => fetchFAT(true)}
                className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700 active:scale-95 transition-all duration-200 touch-manipulation"
              >
                Tentar novamente
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (!fat) {
    return (
      <>
        <MobileHeader
          title="Detalhes da FAT"
          onAddClick={handleNavigateToOS}
          leftVariant="back"
        />
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
          <div className="text-center">
            <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-slate-400" />
            <h2 className="font-semibold text-slate-900 mb-4 text-lg">
              FAT não encontrada
            </h2>
            <button
              onClick={handleNavigateToOS}
              className="px-6 py-3 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 active:scale-95 transition-all duration-200 touch-manipulation"
            >
              Voltar
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <main className="min-h-screen bg-slate-50 pb-4 overflow-x-hidden">
        <MobileHeader
          title={fat.id_fat ? `FAT #${fat.id_fat}` : "Detalhes da FAT"}
          onAddClick={handleNavigateToOS}
          leftVariant="back"
        />

        {toast.visible && (
          <div className="fixed inset-x-0 bottom-20 z-[9999] flex items-center justify-center pointer-events-none">
            <Toast
              message={toast.message}
              type={toast.type}
              onClose={() => setToast((prev) => ({ ...prev, visible: false }))}
            />
          </div>
        )}

        {loading && fat && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-[100] backdrop-blur-sm">
            <div className="bg-white p-6 rounded-xl shadow-2xl max-w-xs w-full mx-4 animate-in fade-in zoom-in-95 duration-300">
              <Loading fullScreen={false} size="medium" text="Processando..." />
              <div className="mt-3 w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                <div className="bg-[#7B54BE] h-1.5 rounded-full animate-pulse"></div>
              </div>
            </div>
          </div>
        )}

        <div className="border-b border-slate-100 sticky top-[60px] z-10 backdrop-blur-sm bg-white/95">
          {fat.descricao_problema && (
            <div className="p-4">
              <div className="text-md text-slate-700 leading-relaxed bg-slate-100 p-3 rounded-lg break-words whitespace-pre-wrap max-h-[200px] overflow-y-auto custom-scrollbar overscroll-contain">
                <span className="font-medium">
                  {fat.motivo_atendimento.descricao}:
                </span>{" "}
                {fat.descricao_problema}
              </div>
            </div>
          )}

          {/* Status e Data */}
          <div className="px-4 pb-4 flex items-center justify-between flex-wrap gap-2">
            <StatusBadge
              status={String(fat.situacao.codigo)}
              descricao={fat.situacao.descricao}
            />

            {fat.data_atendimento && (
              <div className="flex items-center gap-1 text-sm text-gray-600 min-w-0">
                <Calendar className="w-3 h-3 flex-shrink-0" />
                <span className="whitespace-nowrap">Atendimento:</span>
                <span className="truncate">
                  {formatDate(fat.data_atendimento) || fat.data_atendimento}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Content Sections */}
        <div className="px-4 pb-20 space-y-4 mt-4 will-change-scroll overscroll-contain">
          <Section
            title="Informações Gerais"
            icon={<FileText className="w-4 h-4" />}
          >
            <Field
              label="OS Vinculada"
              value={`#${fat.id_os}`}
              icon={<FileSearch className="w-3 h-3" />}
            />
            <Field
              label="Nome do Atendente"
              value={
                fat.nome_atendente
                  ? `${fat.nome_atendente} ${
                      fat.contato_atendente ? `- ${fat.contato_atendente}` : ""
                    }`
                  : "Não informado"
              }
              icon={<User className="w-3 h-3" />}
            />
          </Section>

          {fat.maquina?.modelo && fat.maquina.modelo.trim() !== "" && (
            <Section title="Máquina" icon={<Settings className="w-4 h-4" />}>
              <Field
                label="Modelo"
                value={fat.maquina.modelo}
                icon={<Settings className="w-3 h-3" />}
              />
              <Field
                label="Descrição"
                value={fat.maquina.descricao}
                icon={<FileText className="w-3 h-3" />}
              />
              <Field
                label="Número de Série"
                value={fat.maquina.numero_serie}
                icon={<Settings className="w-3 h-3" />}
              />
            </Section>
          )}

          {/* Detalhes do Atendimento */}
          <Section
            title="Detalhes do Atendimento"
            icon={<Wrench className="w-4 h-4" />}
          >
            {(fat.solucao_encontrada && fat.solucao_encontrada !== "") ||
            (fat.testes_realizados && fat.testes_realizados !== "") ||
            (fat.sugestoes && fat.sugestoes !== "") ||
            (fat.observacoes && fat.observacoes !== "") ||
            (fat.numero_ciclos != null && fat.numero_ciclos > 0) ? (
              <>
                {fat.solucao_encontrada && (
                  <Field
                    label="Solução Encontrada"
                    value={fat.solucao_encontrada}
                    icon={<CheckSquare className="w-3 h-3" />}
                  />
                )}

                {fat.testes_realizados && (
                  <Field
                    label="Testes Realizados"
                    value={fat.testes_realizados}
                    icon={<Eye className="w-3 h-3" />}
                  />
                )}

                {fat.sugestoes && (
                  <Field
                    label="Sugestões"
                    value={fat.sugestoes}
                    icon={<MessageSquare className="w-3 h-3" />}
                  />
                )}

                {fat.observacoes && (
                  <Field
                    label="Observações"
                    value={fat.observacoes}
                    icon={<FileText className="w-3 h-3" />}
                  />
                )}

                {fat.numero_ciclos != null && fat.numero_ciclos > 0 && (
                  <Field
                    label="Número de Ciclos"
                    value={fat.numero_ciclos.toString()}
                    icon={<Timer className="w-3 h-3" />}
                  />
                )}
              </>
            ) : (
              <p className="text-sm text-slate-500 italic">
                Não há informações sobre o atendimento
              </p>
            )}
            <div className="mt-4">
              <SectionActionButton
                label="Ir para Atendimento"
                icon={<Wrench className="w-4 h-4" />}
                onClick={goToAtendimento}
              />
            </div>
          </Section>

          {/* Deslocamentos */}
          <Section
            title={`Deslocamentos (${deslocamentos.length})`}
            icon={<Car className="w-4 h-4" />}
            collapsible={true}
            defaultExpanded={false}
          >
            <DeslocamentosSectionContent
              deslocamentos={deslocamentos}
              formatTime={formatTime}
              onNavigate={goToDeslocamento}
            />
          </Section>

          <Section
            title={`Peças Utilizadas (${pecas.length})`}
            icon={<Package className="w-4 h-4" />}
            collapsible={true}
            defaultExpanded={false}
          >
            <PecasSectionContent pecas={pecas} onNavigate={goToPecas} />
          </Section>

          {/* Fotos */}
          <Section
            title={`Fotos (${fotos.length})`}
            icon={<Camera className="w-4 h-4" />}
            collapsible={true}
            defaultExpanded={false}
          >
            <FotosSectionContent
              fotos={fotos}
              photoPreviews={photoPreviews}
              loadingPhotoPreviews={loadingPhotoPreviews}
              photoPreviewError={photoPreviewError}
              formatPhotoDate={formatPhotoDate}
              onOpen={openPhotoViewer}
              onNavigate={goToFotos}
            />
          </Section>

          {fat.ocorrencias && fat.ocorrencias.length > 0 && (
            <Section
              title={`Ocorrências (${fat.ocorrencias.length})`}
              icon={<History className="w-4 h-4" />}
              collapsible={true}
              defaultExpanded={false}
            >
              <div className="space-y-3">
                {fat.ocorrencias.map((ocorrencia, index) => (
                  <div
                    key={ocorrencia.id_ocorrencia || index}
                    className="border-l-2 border-blue-200 pl-3"
                  >
                    <div className="flex justify-end">
                      <span className="text-xs text-slate-500">
                        {formatDate(ocorrencia.data_ocorrencia) ||
                          ocorrencia.data_ocorrencia}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-slate-900 leading-snug">
                      {ocorrencia.descricao_ocorrencia}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      Por: {ocorrencia.usuario.nome}
                    </p>
                    <div className="mt-2">
                      <StatusBadge
                        status={String(ocorrencia.nova_situacao.codigo)}
                        descricao={ocorrencia.nova_situacao?.descricao}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </Section>
          )}
        </div>

        {isPhotoModalOpen && selectedPhoto && (
          <div
            className="fixed inset-0 z-[1050] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
            onClick={closePhotoViewer}
            role="dialog"
            aria-modal="true"
            onTouchStart={(e) => e.stopPropagation()}
          >
            <div
              className="relative w-full max-w-3xl max-h-[90vh] overflow-hidden rounded-2xl bg-white shadow-2xl animate-in fade-in zoom-in-95 duration-300"
              onClick={(event) => event.stopPropagation()}
            >
              <div
                className="relative flex items-center justify-center bg-slate-950/95 px-4 py-6 sm:px-10 sm:py-10 min-h-[200px]"
                onTouchStart={onTouchStart}
                onTouchMove={onTouchMove}
                onTouchEnd={onTouchEnd}
              >
                {hasMultiplePhotos && (
                  <button
                    type="button"
                    onClick={showPreviousPhoto}
                    className="absolute left-2 sm:left-4 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 text-slate-800 shadow transition-all duration-200 hover:bg-white active:scale-95 touch-manipulation z-10"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                )}

                {selectedPhotoPreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={selectedPhotoPreview}
                    alt={selectedPhoto.descricao || selectedPhoto.nome_arquivo}
                    className="max-h-[60vh] sm:max-h-[70vh] w-full max-w-[85%] sm:max-w-[90%] rounded-xl object-contain shadow-xl"
                    loading="eager"
                    decoding="async"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-3 text-slate-200">
                    <ImageOff className="h-8 w-8" />
                    <span className="text-xs uppercase tracking-wide">
                      Visualização indisponível
                    </span>
                  </div>
                )}

                {hasMultiplePhotos && (
                  <button
                    type="button"
                    onClick={showNextPhoto}
                    className="absolute right-2 sm:right-4 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 text-slate-800 shadow transition-all duration-200 hover:bg-white active:scale-95 touch-manipulation z-10"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                )}

                {/* Botão de fechar no mobile */}
                <button
                  type="button"
                  onClick={closePhotoViewer}
                  className="absolute top-2 right-2 sm:top-4 sm:right-4 flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30 transition-all duration-200 active:scale-95 touch-manipulation z-10"
                >
                  <svg
                    className="h-4 w-4"
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
                </button>
              </div>

              <div className="border-t border-slate-100 bg-white px-4 py-3 sm:px-6 sm:py-4 max-h-[120px] overflow-y-auto">
                <p className="text-sm font-medium text-slate-900 line-clamp-2">
                  {selectedPhoto.descricao?.trim() ||
                    selectedPhoto.nome_arquivo}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  {formatPhotoDate(selectedPhoto.data_cadastro)}
                </p>
                {hasMultiplePhotos && (
                  <p className="text-xs text-slate-400 mt-1">
                    {(selectedPhotoIndex ?? 0) + 1} de {fotos.length}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {deveMostrarBotoes && (
          <FloatingActionMenuFat
            fat={fat}
            id_os={fat.id_os}
            onIniciarAtendimento={handleIniciarAtendimento}
            onPausarAtendimento={handlePausarAtendimento}
            onRetomarAtendimento={handleRetomarAtendimento}
            onInterromperAtendimento={handleInterromperAtendimento}
            onCancelarAtendimento={handleCancelarAtendimento}
            onConcluirAtendimento={handleConcluirAtendimento}
            onActionSuccess={() => fetchFAT(true)}
          />
        )}
      </main>
    </>
  );
}
