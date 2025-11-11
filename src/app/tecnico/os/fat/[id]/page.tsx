"use client";
import React, {
  useEffect,
  useState,
  useCallback,
  useRef,
  useMemo,
} from "react";
import { useRouter, useParams } from "next/navigation";
import MobileHeader from "@/components/tecnico/MobileHeader";
import FloatingActionMenuFat from "@/components/tecnico/FloatingActionMenuFat";
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

type FATDeslocamento = NonNullable<FATDetalhada["deslocamentos"]>[number];
type FATPeca = NonNullable<FATDetalhada["pecas"]>[number];
type FATFoto = NonNullable<FATDetalhada["fotos"]>[number];

// BotÃ£o de aÃ§Ã£o para FAT
// type ActionButtonFatProps = {
//   label: string;
//   icon: React.ReactNode;
//   onClick: () => void;
//   color: string;
// };
// function ActionButtonFat({
//   label,
//   icon,
//   onClick,
//   color,
// }: ActionButtonFatProps) {
//   return (
//     <button
//       onClick={onClick}
//       className={`
//         group relative flex flex-col items-center gap-1.5 p-2
//         rounded-xl border transition-all duration-200 ease-out
//         w-28 flex-shrink-0 bg-white hover:bg-gray-50
//         ${color}
//         hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 border-gray-200 hover:border-gray-300
//       `}
//       type="button"
//     >
//       <div className="flex items-center justify-center w-6 h-6">{icon}</div>
//       <span className="text-xs font-medium text-gray-700 text-center">
//         {label}
//       </span>
//     </button>
//   );
// }

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
      className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-[#7B54BE] bg-white px-3 py-2 text-xs font-medium text-slate-600 transition-colors hover:border-slate-300 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-200"
    >
      <span className="flex items-center justify-center text-slate-500">
        {icon}
      </span>
      <span>{label}</span>
    </button>
  );
}

// Componente Section reutilizÃ¡vel
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
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm">
        <div
          className={`flex items-center justify-between p-4 ${
            collapsible ? "cursor-pointer hover:bg-slate-50" : ""
          } transition-colors duration-200`}
          onClick={handleToggle}
        >
          <div className="flex items-center gap-2">
            <div className="text-slate-600">{icon}</div>
            <h3 className="font-medium text-slate-900 text-sm">{title}</h3>
          </div>
          {collapsible && (
            <ChevronRight
              className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
                expanded ? "rotate-90" : ""
              }`}
            />
          )}
        </div>
        {(!collapsible || expanded) && (
          <div className="px-4 pb-4 space-y-3">{children}</div>
        )}
      </div>
    );
  }
);

Section.displayName = "Section";

// Componente Field reutilizÃ¡vel
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
    if (!value || value === "NÃ£o informado" || value === "") return null;

    return (
      <div className="flex items-start gap-2 min-w-0">
        {icon && (
          <div className="text-slate-400 mt-0.5 flex-shrink-0">{icon}</div>
        )}
        <div className="min-w-0 flex-1">
          <p className="text-xs text-slate-500 mb-0.5 font-medium">{label}</p>
          <div className="text-sm text-slate-900 break-words leading-relaxed">
            {value}
          </div>
        </div>
      </div>
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
                    <p className="text-xs text-slate-500 mb-1">
                      Observaï¿½ï¿½ï¿½ï¿½es:
                    </p>
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
  ({
    pecas,
    onNavigate,
  }: {
    pecas: FATPeca[];
    onNavigate: () => void;
  }) => {
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
                      Cï¿½ï¿½digo: {peca.codigo_peca}
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
            Nenhuma peï¿½ï¿½a cadastrada
          </p>
        )}
        <div className="mt-4">
          <SectionActionButton
            label="Ir para Peï¿½ï¿½as"
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
                    className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-md border border-slate-200 bg-slate-100 transition hover:border-[#7B54BE]/60 focus:outline-none focus:ring-2 focus:ring-[#7B54BE] focus:ring-offset-2"
                  >
                    {previewUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={previewUrl}
                        alt={foto.descricao || foto.nome_arquivo}
                        className="h-full w-full object-cover transition-transform duration-200 hover:scale-105"
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

  const situacoesComBotoes = ["3", "4", "5"];

  const deveMostrarBotoes = situacoesComBotoes.includes(
    String(fat?.situacao?.codigo)
  );
  // FunÃ§Ã£o auxiliar para mostrar toast com auto-hide
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
    () => handleNavigateToSection("deslocamento"),
    [handleNavigateToSection]
  );

  const goToAtendimento = useCallback(
    () => handleNavigateToSection("atendimento"),
    [handleNavigateToSection]
  );

  const goToPecas = useCallback(
    () => handleNavigateToSection("pecas"),
    [handleNavigateToSection]
  );

  const goToFotos = useCallback(
    () => handleNavigateToSection("fotos"),
    [handleNavigateToSection]
  );

  // FunÃ§Ã£o para extrair mensagem de erro da API
  const extractErrorMessage = useCallback((error: unknown): string => {
    let errorMessage = "Ocorreu um erro durante a operaÃ§Ã£o";

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

  // FunÃ§Ã£o para buscar dados da FAT
  const fetchFAT = useCallback(
    async (force = false) => {
      if (!params?.id) {
        setError("ID da FAT nÃ£o fornecido");
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
          setError("FAT nÃ£o encontrada");
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
      const responseMessage = "Atendimento concluÃ­do com sucesso!";
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
                className="flex-1 px-4 py-3 bg-slate-100 text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-200 transition-colors"
              >
                Voltar
              </button>
              <button
                onClick={() => fetchFAT(true)}
                className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700 transition-colors"
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
              FAT nÃ£o encontrada
            </h2>
            <button
              onClick={handleNavigateToOS}
              className="px-6 py-3 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              Voltar
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 pb-5">
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
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-[100]">
          <div className="bg-white p-4 rounded-xl shadow-lg">
            <Loading fullScreen={false} size="medium" text="Processando..." />
          </div>
        </div>
      )}

      <div className="bg-white border-b border-slate-100">
        {fat.descricao_problema && (
          <div className="p-4">
            <div className="text-md text-slate-700 leading-relaxed bg-slate-100 p-3 rounded-lg break-words whitespace-pre-wrap max-h-[200px] overflow-y-auto custom-scrollbar">
              <span className="font-medium">
                {fat.motivo_atendimento.descricao}:
              </span>{" "}
              {fat.descricao_problema}
            </div>
          </div>
        )}

        {/* Status e Data */}
        <div className="px-4 pb-4 flex items-center justify-between">
          <StatusBadge
            status={String(fat.situacao.codigo)}
            descricao={fat.situacao.descricao}
          />

          {fat.data_atendimento && (
            <div className="flex items-center gap-1 text-sm text-gray-600">
              <Calendar className="w-3 h-3" />
              <span>Atendimento:</span>
              {formatDate(fat.data_atendimento) || fat.data_atendimento}
            </div>
          )}
        </div>
      </div>

      {/* Content Sections */}
      <div className="px-4 pb-6 space-y-4 mt-4">
        <Section
          title="InformaÃ§Ãµes Gerais"
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
                : "NÃ£o informado"
            }
            icon={<User className="w-3 h-3" />}
          />
        </Section>

        {fat.maquina?.modelo && fat.maquina.modelo.trim() !== "" && (
          <Section title="MÃ¡quina" icon={<Settings className="w-4 h-4" />}>
            <Field
              label="Modelo"
              value={fat.maquina.modelo}
              icon={<Settings className="w-3 h-3" />}
            />
            <Field
              label="DescriÃ§Ã£o"
              value={fat.maquina.descricao}
              icon={<FileText className="w-3 h-3" />}
            />
            <Field
              label="NÃºmero de SÃ©rie"
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
                  label="SoluÃ§Ã£o Encontrada"
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
                  label="SugestÃµes"
                  value={fat.sugestoes}
                  icon={<MessageSquare className="w-3 h-3" />}
                />
              )}

              {fat.observacoes && (
                <Field
                  label="ObservaÃ§Ãµes"
                  value={fat.observacoes}
                  icon={<FileText className="w-3 h-3" />}
                />
              )}

              {fat.numero_ciclos != null && fat.numero_ciclos > 0 && (
                <Field
                  label="NÃºmero de Ciclos"
                  value={fat.numero_ciclos.toString()}
                  icon={<Timer className="w-3 h-3" />}
                />
              )}
            </>
          ) : (
            <p className="text-sm text-slate-500 italic">
              NÃ£o hÃ¡ informaÃ§Ãµes sobre o atendimento
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
            title={`OcorrÃªncias (${fat.ocorrencias.length})`}
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
          className="fixed inset-0 z-[1050] flex items-center justify-center bg-black/80 p-4"
          onClick={closePhotoViewer}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="relative w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="relative flex items-center justify-center bg-slate-950/95 px-10 py-10">
              {hasMultiplePhotos && (
                <button
                  type="button"
                  onClick={showPreviousPhoto}
                  className="absolute left-4 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 text-slate-800 shadow transition hover:bg-white"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
              )}

              {selectedPhotoPreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={selectedPhotoPreview}
                  alt={selectedPhoto.descricao || selectedPhoto.nome_arquivo}
                  className="max-h-[70vh] w-full max-w-[90%] rounded-xl object-contain shadow-xl"
                />
              ) : (
                <div className="flex flex-col items-center gap-3 text-slate-200">
                  <ImageOff className="h-8 w-8" />
                  <span className="text-xs uppercase tracking-wide">
                    VisualizaÃ§Ã£o indisponÃ­vel
                  </span>
                </div>
              )}

              {hasMultiplePhotos && (
                <button
                  type="button"
                  onClick={showNextPhoto}
                  className="absolute right-4 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 text-slate-800 shadow transition hover:bg-white"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              )}
            </div>

            <div className="border-t border-slate-100 bg-white px-6 py-4">
              <p className="text-sm font-medium text-slate-900">
                {selectedPhoto.descricao?.trim() || selectedPhoto.nome_arquivo}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                {formatPhotoDate(selectedPhoto.data_cadastro)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 shadow-lg z-50">
        <div className="px-3 py-2">
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            <ActionButtonFat
              label="Deslocamento"
              icon={<Car className="w-5 h-5 text-emerald-600" />}
              onClick={() => handleNavigateToSection("deslocamento")}
              color="hover:border-emerald-300"
            />
            <ActionButtonFat
              label="Atendimento"
              icon={<Wrench className="w-5 h-5 text-blue-600" />}
              onClick={() => handleNavigateToSection("atendimento")}
              color="hover:border-blue-300"
            />
            <ActionButtonFat
              label="PeÃ§as"
              icon={<Package className="w-5 h-5 text-green-600" />}
              onClick={() => handleNavigateToSection("pecas")}
              color="hover:border-green-300"
            />
            <ActionButtonFat
              label="Fotos"
              icon={<Camera className="w-5 h-5 text-purple-600" />}
              onClick={() => {
                if (params?.id) {
                  router.push(`/tecnico/os/fat/${params.id}/fotos`);
                }
              }}
              color="hover:border-purple-300"
            />
          </div>
        </div>
      </div> */}

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
  );
}





