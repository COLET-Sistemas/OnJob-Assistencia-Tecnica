"use client";

import React, {
  useEffect,
  useState,
  useMemo,
  useCallback,
  useRef,
} from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ordensServicoService,
  OSDetalhadaV2,
} from "@/api/services/ordensServicoService";
import {
  ocorrenciasOSService,
  OcorrenciaOSDetalhe,
} from "@/api/services/ocorrenciaOSService";
import { getStoredRoles, USER_ROLES_UPDATED_EVENT } from "@/utils/userRoles";
import PageHeader from "@/components/admin/ui/PageHeader";
import { StatusBadge } from "@/components/admin/common";
import { LoadingSpinner } from "@/components/LoadingPersonalizado";
import { useToast } from "@/components/admin/ui/ToastContainer";
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
  Building,
  Phone,
  Mail,
  CalendarClock,
  MessageCircle,
  FileText,
  AlertCircle,
  MapPinned,
  ArrowLeft,
  ArrowUp,
  CalendarRange,
  Camera,
  ListChecks,
  CameraOff,
  Eye,
  X,
  ShieldCheck,
  ShieldX,
  CircleCheck,
  CircleX,
} from "lucide-react";

// Status mapping como constante fora do componente para máxima estabilidade
const STATUS_MAPPING: Record<
  string,
  { label: string; className: string; icon: React.ReactNode }
> = {
  "1": {
    label: "Pendente",
    className: "bg-gray-100 text-gray-700 border border-gray-200",
    icon: (
      <span title="Pendente">
        <Clock className="w-3.5 h-3.5 text-gray-500" />
      </span>
    ),
  },
  "2": {
    label: "A atender",
    className: "bg-blue-100 text-blue-700 border border-blue-200",
    icon: (
      <span title="A atender">
        <Bell className="w-3.5 h-3.5 text-blue-600" />
      </span>
    ),
  },
  "3": {
    label: "Em deslocamento",
    className: "bg-purple-100 text-purple-700 border border-purple-200",
    icon: (
      <span title="Em deslocamento">
        <Car className="w-3.5 h-3.5 text-purple-600" />
      </span>
    ),
  },
  "4": {
    label: "Em atendimento",
    className: "bg-orange-100 text-orange-700 border border-orange-200",
    icon: (
      <span title="Em atendimento">
        <Wrench className="w-3.5 h-3.5 text-orange-600" />
      </span>
    ),
  },
  "5": {
    label: "Atendimento interrompido",
    className: "bg-amber-100 text-amber-700 border border-amber-200",
    icon: (
      <span title="Atendimento interrompido">
        <PauseCircle className="w-3.5 h-3.5 text-amber-600" />
      </span>
    ),
  },
  "6": {
    label: "Em Revisão",
    className: "bg-indigo-100 text-indigo-700 border border-indigo-200",
    icon: (
      <span title="Em Revisão">
        <FileSearch className="w-3.5 h-3.5 text-indigo-600" />
      </span>
    ),
  },
  "7": {
    label: "Concluída",
    className: "bg-green-100 text-green-700 border border-green-200",
    icon: (
      <span title="Concluída">
        <CheckCircle className="w-3.5 h-3.5 text-green-600" />
      </span>
    ),
  },
  "8": {
    label: "Cancelada",
    className: "bg-red-100 text-red-700 border border-red-200",
    icon: (
      <span title="Cancelada">
        <XCircle className="w-3.5 h-3.5 text-red-600" />
      </span>
    ),
  },
  "9": {
    label: "Cancelada pelo Cliente",
    className: "bg-rose-100 text-rose-700 border border-rose-200",
    icon: (
      <span title="Cancelada pelo Cliente">
        <UserX className="w-3.5 h-3.5 text-rose-600" />
      </span>
    ),
  },
};

const OCORRENCIA_LABELS: Record<string, string> = {
  "concluir os": "Concluir OS",
  "cancelar os": "Cancelar OS",
  "cancelar os (cliente)": "Cancelar OS (cliente)",
  "reabrir os": "Reabrir OS",
};

const sanitizeApiMessage = (value?: string | null): string | undefined => {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return undefined;
  }

  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    const inner = trimmed.slice(1, -1).trim();
    return inner || undefined;
  }

  return trimmed;
};

const extractMessageFromValue = (
  value: unknown,
  visited = new WeakSet<object>()
): string | undefined => {
  if (typeof value === "string") {
    const sanitized = sanitizeApiMessage(value);
    if (sanitized) {
      return sanitized;
    }

    const trimmed = value.trim();
    return trimmed ? trimmed : undefined;
  }

  if (typeof value === "object" && value !== null) {
    const objectValue = value as object;
    if (visited.has(objectValue)) {
      return undefined;
    }
    visited.add(objectValue);

    if (Array.isArray(value)) {
      for (const item of value) {
        const result = extractMessageFromValue(item, visited);
        if (result) {
          return result;
        }
      }
      return undefined;
    }

    const recordValue = value as Record<string, unknown>;
    const candidates = [
      "erro",
      "mensagem",
      "message",
      "detail",
      "detalhe",
      "descricao",
      "descricao_ocorrencia",
      "data",
    ];

    for (const key of candidates) {
      if (Object.prototype.hasOwnProperty.call(recordValue, key)) {
        const result = extractMessageFromValue(recordValue[key], visited);
        if (result) {
          return result;
        }
      }
    }

    for (const nested of Object.values(recordValue)) {
      const result = extractMessageFromValue(nested, visited);
      if (result) {
        return result;
      }
    }
  }

  return undefined;
};

type ApiErrorWithData = Error & { data?: unknown };

const getApiErrorMessage = (error: unknown): string | undefined => {
  if (!error) {
    return undefined;
  }

  if (error instanceof Error) {
    const errorWithData = error as ApiErrorWithData;
    const rawData = errorWithData.data;

    if (
      rawData &&
      typeof rawData === "object" &&
      Object.prototype.hasOwnProperty.call(rawData, "erro") &&
      typeof (rawData as Record<string, unknown>).erro === "string"
    ) {
      const erroValue = sanitizeApiMessage(
        (rawData as Record<string, unknown>).erro as string
      );
      if (erroValue) {
        return erroValue;
      }
      const trimmedErro = (
        (rawData as Record<string, unknown>).erro as string
      ).trim();
      if (trimmedErro) {
        return trimmedErro;
      }
    }

    const dataMessage = extractMessageFromValue(rawData);
    if (dataMessage) {
      return dataMessage;
    }

    const sanitizedMessage = sanitizeApiMessage(error.message);
    if (sanitizedMessage) {
      return sanitizedMessage;
    }

    const trimmedMessage = error.message.trim();
    if (trimmedMessage) {
      return trimmedMessage;
    }

    return extractMessageFromValue(error);
  }

  return extractMessageFromValue(error);
};

const OSDetalhesPage: React.FC = () => {
  const params = useParams();
  const router = useRouter();
  const { showSuccess, showError } = useToast();

  const rawOsId = params?.id;
  const osId = useMemo(() => {
    if (!rawOsId) return null;
    return Array.isArray(rawOsId) ? rawOsId[0] : rawOsId;
  }, [rawOsId]);

  const numericOsId = useMemo(() => {
    if (!osId) return null;
    const parsedId = Number(osId);
    return Number.isFinite(parsedId) ? parsedId : null;
  }, [osId]);

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [osData, setOsData] = useState<OSDetalhadaV2 | null>(null);
  const [showScrollToTop, setShowScrollToTop] = useState<boolean>(false);
  const [situacaoModalOpen, setSituacaoModalOpen] = useState(false);
  const [selectedOcorrencia, setSelectedOcorrencia] = useState<string>("");
  const [motivoAlteracao, setMotivoAlteracao] = useState("");
  const [situacaoModalError, setSituacaoModalError] = useState<string | null>(
    null
  );
  const [situacaoModalLoading, setSituacaoModalLoading] = useState(false);
  const [historicoOcorrenciasLoading, setHistoricoOcorrenciasLoading] =
    useState(true);

  const [historicoRefreshToken, setHistoricoRefreshToken] = useState(0);
  const [isGestor, setIsGestor] = useState(false);
  const hasLoadedOnceRef = useRef(false);
  const lastLoadedOsIdRef = useRef<number | null>(null);

  // Callbacks memoizados
  const handleVoltar = useCallback(() => {
    window.history.back();
  }, []);

  const handleScrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const handleFatClick = useCallback(
    (fatId: number) => {
      router.push(`/admin/fat_detalhes/${fatId}`);
    },
    [router]
  );
  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const updateGestorState = () => {
      try {
        const roles = getStoredRoles();
        setIsGestor(Boolean(roles.gestor));
      } catch (err) {
        console.error("Falha ao ler perfis do usuário:", err);
        setIsGestor(false);
      }
    };

    updateGestorState();

    const handleStorage = () => {
      updateGestorState();
    };

    window.addEventListener("storage", handleStorage);
    window.addEventListener(USER_ROLES_UPDATED_EVENT, updateGestorState);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener(USER_ROLES_UPDATED_EVENT, updateGestorState);
    };
  }, []);
  const situacaoOptions = useMemo(() => {
    const codigo = osData?.situacao_os.codigo;

    if (!codigo) {
      return [];
    }

    if ([1, 2, 3, 4, 5].includes(codigo)) {
      return ["concluir os", "cancelar os", "cancelar os (cliente)"];
    }

    if (codigo === 6) {
      return [
        "reabrir os",
        "concluir os",
        "cancelar os",
        "cancelar os (cliente)",
      ];
    }

    if ([7, 8, 9].includes(codigo)) {
      return ["reabrir os"];
    }

    return [];
  }, [osData?.situacao_os.codigo]);
  const shouldShowSituacaoButton = situacaoOptions.length > 0;
  const canShowSituacaoButton = shouldShowSituacaoButton && isGestor;
  const handleOpenSituacaoModal = useCallback(() => {
    if (situacaoOptions.length === 0 || !isGestor) {
      return;
    }

    setSelectedOcorrencia(situacaoOptions[0]);
    setMotivoAlteracao("");
    setSituacaoModalError(null);
    setSituacaoModalOpen(true);
  }, [isGestor, situacaoOptions]);
  const handleCloseSituacaoModal = useCallback(() => {
    setSituacaoModalOpen(false);
    setSituacaoModalError(null);
    setMotivoAlteracao("");
    setSelectedOcorrencia("");
  }, []);
  const handleSituacaoSubmit = useCallback(async () => {
    if (!isGestor) {
      setSituacaoModalError(
        "Você não possui permissão para alterar a situação."
      );
      return;
    }

    if (!osData || osData.id_os === undefined) {
      setSituacaoModalError("Não foi possível identificar a OS.");
      return;
    }

    if (!selectedOcorrencia) {
      setSituacaoModalError("Selecione uma opção para a situação.");
      return;
    }

    if (!motivoAlteracao.trim()) {
      setSituacaoModalError("Informe o motivo da alteração.");
      return;
    }

    try {
      setSituacaoModalLoading(true);
      setSituacaoModalError(null);

      const response = await ocorrenciasOSService.registrarOcorrencia({
        id_os: osData.id_os,
        ocorrencia: selectedOcorrencia,
        descricao_ocorrencia: motivoAlteracao.trim(),
      });

      ordensServicoService.invalidateOSCache(osData.id_os);

      const updatedData = await ordensServicoService.getById(osData.id_os);
      const normalizedData =
        Array.isArray(updatedData) && updatedData.length > 0
          ? updatedData[0]
          : updatedData;

      if (
        normalizedData &&
        typeof normalizedData === "object" &&
        "id_os" in normalizedData
      ) {
        setOsData(normalizedData as OSDetalhadaV2);
      }

      const successMessage =
        sanitizeApiMessage(response?.mensagem) ||
        "Situação da OS atualizada com sucesso!";
      showSuccess("Situação da OS", successMessage);
      setHistoricoRefreshToken((token) => token + 1);
      handleCloseSituacaoModal();
    } catch (submitError) {
      console.error("Erro ao alterar situação da OS:", submitError);
      const errorMessage =
        getApiErrorMessage(submitError) ||
        "Não foi possível alterar a situação. Tente novamente.";
      setSituacaoModalError(errorMessage);
      showError("Erro ao alterar situação da OS", errorMessage);
    } finally {
      setSituacaoModalLoading(false);
    }
  }, [
    handleCloseSituacaoModal,
    isGestor,
    motivoAlteracao,
    osData,
    selectedOcorrencia,
    showError,
    showSuccess,
  ]);
  useEffect(() => {
    if (!isGestor && situacaoModalOpen) {
      handleCloseSituacaoModal();
    }
  }, [handleCloseSituacaoModal, isGestor, situacaoModalOpen]);

  // Fetch data effect
  useEffect(() => {
    if (numericOsId === null) {
      setError("Identificador da Ordem de Serviço inválido.");
      setLoading(false);
      setHistoricoOcorrenciasLoading(false);
      return;
    }

    if (lastLoadedOsIdRef.current !== numericOsId) {
      hasLoadedOnceRef.current = false;
      lastLoadedOsIdRef.current = numericOsId;
    }

    let isActive = true;
    const shouldBlockScreen = !hasLoadedOnceRef.current;

    if (shouldBlockScreen) {
      setLoading(true);
    }

    setError(null);
    setHistoricoOcorrenciasLoading(true);

    const fetchOSData = async () => {
      try {
        const data = await ordensServicoService.getById(numericOsId);

        if (!isActive) {
          return;
        }

        const osItem = Array.isArray(data) && data.length > 0 ? data[0] : data;

        if (osItem && typeof osItem === "object" && "id_os" in osItem) {
          setOsData(osItem as OSDetalhadaV2);
          hasLoadedOnceRef.current = true;
        } else {
          throw new Error("Estrutura de dados da OS inválida.");
        }
      } catch (err) {
        if (!isActive) {
          return;
        }

        console.error("Erro ao carregar detalhes da OS:", err);
        setError(
          err instanceof Error && err.message
            ? err.message
            : "Não foi possível carregar os detalhes da Ordem de Serviço."
        );
      } finally {
        if (!isActive) {
          return;
        }

        if (shouldBlockScreen) {
          setLoading(false);
        }
        setHistoricoOcorrenciasLoading(false);
      }
    };

    fetchOSData();

    return () => {
      isActive = false;
    };
  }, [historicoRefreshToken, numericOsId]);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollToTop(window.scrollY > 300);
    };

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Valores memoizados para otimização
  const historicoOcorrencias = useMemo<OcorrenciaOSDetalhe[]>(
    () => osData?.ocorrencias ?? [],
    [osData]
  );
  const clienteData = useMemo(() => osData?.cliente, [osData]);
  const contatoData = useMemo(() => osData?.contato, [osData]);
  const maquinaData = useMemo(() => osData?.maquina, [osData]);
  const clienteDetalhesHref = clienteData?.id
    ? `/admin/clientes_detalhes/${clienteData.id}`
    : undefined;
  const maquinaDetalhesHref = maquinaData?.id
    ? `/admin/maquinas_detalhes/${maquinaData.id}`
    : undefined;
  type FatType = {
    id_fat: number;
    situacao?: string | number;
    descricao_situacao?: string;
    data_atendimento?: string;
    fotos?: unknown[];
    tecnico: {
      nome: string;
      tipo?: string;
    };
    // ...other FAT properties as needed
  };
  const fatsData: FatType[] = useMemo(() => osData?.fats || [], [osData]);

  const parseCodigo = (value: unknown): number | null => {
    if (typeof value === "number") {
      return Number.isFinite(value) ? value : null;
    }

    if (typeof value === "string") {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : null;
    }

    if (value && typeof value === "object") {
      const possibleCodigo = (value as { codigo?: number | string }).codigo;
      if (possibleCodigo !== undefined && possibleCodigo !== null) {
        const parsed = Number(possibleCodigo);
        return Number.isFinite(parsed) ? parsed : null;
      }
    }

    return null;
  };

  const parseDescricao = (value: unknown): string | null => {
    if (typeof value === "string" && value.trim()) {
      return value;
    }

    if (value && typeof value === "object") {
      const descricaoValue = (value as { descricao?: unknown }).descricao;
      if (typeof descricaoValue === "string" && descricaoValue.trim()) {
        return descricaoValue;
      }
    }

    return null;
  };

  const extractStatusCode = (
    ocorrencia: OcorrenciaOSDetalhe
  ): number | null => {
    const candidates: unknown[] = [
      ocorrencia.nova_situacao,
      ocorrencia.situacao,
      ocorrencia.situacao_atual,
    ];

    for (const candidate of candidates) {
      const code = parseCodigo(candidate);
      if (code !== null) {
        return code;
      }
    }

    return null;
  };

  const extractStatusDescricao = (
    ocorrencia: OcorrenciaOSDetalhe,
    statusCode: number | null
  ): string => {
    const candidates: unknown[] = [
      ocorrencia.nova_situacao,
      ocorrencia.descricao_situacao,
      ocorrencia.situacao,
      ocorrencia.situacao_atual,
    ];

    for (const candidate of candidates) {
      const descricao = parseDescricao(candidate);
      if (descricao) {
        return descricao;
      }
    }

    if (statusCode !== null) {
      const mapping = STATUS_MAPPING[String(statusCode)];
      if (mapping?.label) {
        return mapping.label;
      }
    }

    return "Situação não informada";
  };

  const extractDataOcorrencia = (ocorrencia: OcorrenciaOSDetalhe): string => {
    return (
      ocorrencia.data_ocorrencia || ocorrencia.data || "" // fallback para string vazia
    );
  };

  const extractUsuarioNome = (ocorrencia: OcorrenciaOSDetalhe): string => {
    if (ocorrencia.usuario?.nome) {
      return ocorrencia.usuario.nome;
    }

    if (ocorrencia.usuario_nome) {
      return ocorrencia.usuario_nome;
    }

    if (
      typeof ocorrencia.id_usuario === "number" &&
      Number.isFinite(ocorrencia.id_usuario)
    ) {
      return `Usuario #${ocorrencia.id_usuario}`;
    }

    return "Sistema";
  };

  const getTimelineTheme = (statusCode: number | null) => {
    switch (statusCode) {
      case 2:
        return {
          circleBg: "bg-blue-100",
          circleBorder: "border-blue-300",
          circleText: "text-blue-500",
          headerBg: "bg-blue-50",
          headerBorder: "border-blue-100",
          cardBorder: "border-blue-100",
          statusText: "text-blue-700",
        };
      case 3:
        return {
          circleBg: "bg-purple-100",
          circleBorder: "border-purple-300",
          circleText: "text-purple-500",
          headerBg: "bg-purple-50",
          headerBorder: "border-purple-100",
          cardBorder: "border-purple-100",
          statusText: "text-purple-700",
        };
      case 4:
        return {
          circleBg: "bg-orange-100",
          circleBorder: "border-orange-300",
          circleText: "text-orange-500",
          headerBg: "bg-orange-50",
          headerBorder: "border-orange-100",
          cardBorder: "border-orange-100",
          statusText: "text-orange-700",
        };
      case 5:
        return {
          circleBg: "bg-amber-100",
          circleBorder: "border-amber-300",
          circleText: "text-amber-500",
          headerBg: "bg-amber-50",
          headerBorder: "border-amber-100",
          cardBorder: "border-amber-100",
          statusText: "text-amber-700",
        };
      case 6:
        return {
          circleBg: "bg-indigo-100",
          circleBorder: "border-indigo-300",
          circleText: "text-indigo-500",
          headerBg: "bg-indigo-50",
          headerBorder: "border-indigo-100",
          cardBorder: "border-indigo-100",
          statusText: "text-indigo-700",
        };
      case 7:
        return {
          circleBg: "bg-green-100",
          circleBorder: "border-green-300",
          circleText: "text-green-500",
          headerBg: "bg-green-50",
          headerBorder: "border-green-100",
          cardBorder: "border-green-100",
          statusText: "text-green-700",
        };
      case 8:
        return {
          circleBg: "bg-red-100",
          circleBorder: "border-red-300",
          circleText: "text-red-500",
          headerBg: "bg-red-50",
          headerBorder: "border-red-100",
          cardBorder: "border-red-100",
          statusText: "text-red-700",
        };
      case 9:
        return {
          circleBg: "bg-rose-100",
          circleBorder: "border-rose-300",
          circleText: "text-rose-500",
          headerBg: "bg-rose-50",
          headerBorder: "border-rose-100",
          cardBorder: "border-rose-100",
          statusText: "text-rose-700",
        };
      default:
        return {
          circleBg: "bg-gray-100",
          circleBorder: "border-gray-300",
          circleText: "text-gray-500",
          headerBg: "bg-gray-50",
          headerBorder: "border-gray-100",
          cardBorder: "border-gray-100",
          statusText: "text-gray-700",
        };
    }
  };

  if (loading) {
    return (
      <LoadingSpinner
        text="Carregando detalhes da OS..."
        fullScreen={true}
        preventScroll={false}
        size="large"
      />
    );
  }

  if (error && !osData) {
    return (
      <div className="text-center py-16 bg-white rounded-xl shadow-sm border border-gray-100 p-10 animate-fadeIn">
        <div className="w-20 h-20 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertCircle size={32} />
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-3">
          Erro ao carregar OS
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

  if (!osData || !osData.id_os) {
    return (
      <div className="text-center py-16 bg-white rounded-xl shadow-sm border border-gray-100 p-10 animate-fadeIn">
        <div className="w-20 h-20 bg-yellow-100 text-yellow-500 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertCircle size={32} />
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-3">
          Dados da OS incompletos
        </h3>
        <p className="text-gray-600 max-w-md mx-auto leading-relaxed mb-8">
          Os dados da OS parecem estar incompletos ou em formato incorreto.
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

  return (
    <>
      {error && osData && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 animate-fadeIn">
          {error}
        </div>
      )}
      <div className="animate-fadeIn">
        <PageHeader
          title={`Ordem de Serviço #${osData.id_os}`}
          config={{
            type: "form",
            backLink: "/admin/os_consulta",
            backLabel: "Voltar para consulta de OS",
            actions: canShowSituacaoButton ? (
              <button
                type="button"
                onClick={handleOpenSituacaoModal}
                className="inline-flex items-center cursor-pointer gap-2 px-4 py-2.5 rounded-xl bg-[var(--primary)] text-white shadow-sm hover:bg-[var(--primary)]/90 hover:shadow-md transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
                disabled={situacaoModalLoading || !isGestor}
              >
                <ListChecks className="h-4 w-4" />
                Situação da OS
              </button>
            ) : undefined,
          }}
        />

        {/* Card de descrição */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6 py-4 px-6 hover:shadow-md transition-shadow duration-300 animate-fadeIn">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div className="flex flex-col w-full lg:w-auto">
              <h2 className="text-lg md:text-xl text-gray-800">
                <span className="font-semibold">
                  {osData.abertura.motivo_atendimento}
                </span>
                : {osData.descricao_problema}
              </h2>
            </div>
          </div>
        </div>

        {/* Grid Principal */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
          {/* Coluna Esquerda - Cliente e Máquina */}
          <div className="lg:col-span-1">
            {/* Card Cliente */}
            <div
              className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6 hover:shadow-md transition-shadow duration-300 animate-fadeIn"
              style={{ animationDelay: "0.1s" }}
            >
              <div className="py-3 px-6 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Building className="text-[var(--primary)] h-4 w-4 animate-pulseScale" />
                    <h3 className="text-base font-semibold text-gray-800">
                      Cliente
                    </h3>
                  </div>

                  {/* Botões de Ação */}
                  <div className="flex items-center gap-2 ">
                    {contatoData?.email && (
                      <a
                        href={`mailto:${contatoData.email}`}
                        title="Enviar E-mail"
                        data-tooltip="Enviar E-mail"
                        className="flex items-center justify-center h-9 w-9 rounded-lg border border-gray-200 text-blue-600 bg-white hover:bg-blue-50 hover:border-blue-200 transition-colors duration-200 shadow-sm"
                      >
                        <Mail className="h-5 w-5" />
                      </a>
                    )}

                    {contatoData?.telefone && contatoData?.whatsapp && (
                      <a
                        href={`https://wa.me/${contatoData.telefone.replace(
                          /\D/g,
                          ""
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Abrir WhatsApp"
                        data-tooltip="Abrir WhatsApp"
                        className="flex items-center justify-center h-9 w-9 rounded-lg border border-gray-200 text-green-600 bg-white hover:bg-green-50 hover:border-green-200 transition-colors duration-200 shadow-sm"
                      >
                        <MessageCircle className="h-5 w-5" />
                      </a>
                    )}

                    {clienteData?.endereco && (
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                          `${clienteData.endereco}${
                            clienteData.numero ? ", " + clienteData.numero : ""
                          }, ${clienteData.bairro || ""}, ${
                            clienteData.cidade || ""
                          }, ${clienteData.uf || ""}`
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Ver no Google Maps"
                        data-tooltip="Ver no Google Maps"
                        className="flex items-center justify-center h-9 w-9 rounded-lg border border-gray-200 text-orange-600 bg-white hover:bg-orange-50 hover:border-orange-200 transition-colors duration-200 shadow-sm"
                      >
                        <MapPinned className="h-5 w-5" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {clienteData?.nome && (
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-gray-500">Nome</p>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-gray-800 flex items-center gap-1.5">
                          <span className="font-bold">{clienteData.nome}</span>
                          <span className="text-sm text-gray-600">
                            ({clienteData.codigo_erp})
                          </span>
                        </p>
                        {clienteDetalhesHref && (
                          <Link
                            href={clienteDetalhesHref}
                            className="flex items-center text-[var(--primary)] hover:text-[var(--primary)]/80 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:rounded"
                            title="Ver detalhes do cliente"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                        )}
                      </div>
                      {clienteData && "razao_social" in clienteData && (
                        <p className="text-gray-800">
                          {String(
                            (clienteData as { razao_social: string })
                              .razao_social
                          )}
                        </p>
                      )}
                    </div>
                  )}

                  {(clienteData?.endereco ||
                    clienteData?.numero ||
                    clienteData?.bairro ||
                    clienteData?.cidade ||
                    clienteData?.uf ||
                    clienteData?.cep) && (
                    <div>
                      <p className="text-sm font-medium text-gray-500">
                        Endereço
                      </p>
                      <p className="text-gray-800">
                        {clienteData.endereco}
                        {clienteData.numero ? `, ${clienteData.numero}` : ""}
                        {clienteData.complemento
                          ? `, ${clienteData.complemento}`
                          : ""}
                      </p>
                      <p className="text-gray-800">
                        {clienteData.bairro && `${clienteData.bairro}, `}
                        {clienteData.cidade}/{clienteData.uf} -{" "}
                        {clienteData.cep}
                      </p>
                    </div>
                  )}

                  {clienteData?.nome_regiao && (
                    <div>
                      <p className="text-sm font-medium text-gray-500">
                        Região
                      </p>
                      <p className="text-gray-800">{clienteData.nome_regiao}</p>
                    </div>
                  )}

                  {(contatoData?.nome ||
                    contatoData?.telefone ||
                    contatoData?.email) && (
                    <div className="flex flex-col gap-2">
                      <p className="text-sm font-medium text-gray-500">
                        Contato
                      </p>
                      {contatoData.nome && (
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-800">
                            {contatoData.nome}
                            {contatoData.cargo && ` (${contatoData.cargo})`}
                          </span>
                        </div>
                      )}
                      {contatoData.telefone && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-800">
                            {contatoData.telefone}
                            {contatoData.whatsapp && (
                              <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                                WhatsApp
                              </span>
                            )}
                          </span>
                        </div>
                      )}
                      {contatoData.email && (
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-800">
                            {contatoData.email}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Card Máquina */}
            <div
              className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-300 animate-fadeIn"
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
                  {maquinaData?.numero_serie && (
                    <div>
                      <p className="text-sm font-medium text-gray-500">
                        Nº de Série
                      </p>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-gray-800">
                          {maquinaData.numero_serie}
                        </p>
                        <div
                          className="w-4 h-4 flex items-center justify-center shrink-0 transform"
                          title={
                            maquinaData.em_garantia
                              ? "Em garantia"
                              : "Fora da garantia"
                          }
                        >
                          {maquinaData.em_garantia ? (
                            <CircleCheck className="w-4 h-4 text-emerald-500" />
                          ) : (
                            <CircleX className="w-4 h-4 text-amber-500" />
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {maquinaData?.descricao && (
                    <div>
                      <p className="text-sm font-medium text-gray-500">
                        Descrição
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-gray-800 font-semibold">
                          {maquinaData.descricao}
                        </p>
                        {maquinaDetalhesHref && (
                          <Link
                            href={maquinaDetalhesHref}
                            className="flex items-center text-[var(--primary)] hover:text-[var(--primary)]/80 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:rounded"
                            title="Ver detalhes da máquina"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                        )}
                      </div>
                    </div>
                  )}

                  {maquinaData?.modelo && (
                    <div>
                      <p className="text-sm font-medium text-gray-500">
                        Modelo
                      </p>
                      <p className="text-gray-800">{maquinaData.modelo}</p>
                    </div>
                  )}

                  {(maquinaData?.data_1a_venda ||
                    maquinaData?.data_final_garantia) && (
                    <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:gap-26">
                      {maquinaData?.data_1a_venda && (
                        <div>
                          <p className="text-sm font-medium text-gray-500">
                            Data 1° Venda
                          </p>
                          <p className="text-gray-800">
                            {maquinaData.data_1a_venda}
                          </p>
                        </div>
                      )}

                      {maquinaData?.data_final_garantia && (
                        <div>
                          <p className="text-sm font-medium text-gray-500">
                            Data Final Garantia
                          </p>
                          <p className="text-gray-800">
                            {maquinaData.data_final_garantia}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {!!maquinaData?.observacoes?.trim() && (
                    <div>
                      <p className="text-sm font-medium text-gray-500">
                        Observações
                      </p>
                      <p className="text-gray-800 whitespace-pre-line">
                        {maquinaData.observacoes}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Coluna Direita - Detalhes da OS */}
          <div className="lg:col-span-2">
            {/* Card Detalhes da OS */}
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
                  Detalhes da Ordem de Serviço
                </h3>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Coluna Esquerda */}
                  <div className="space-y-6">
                    {/* Situação da OS */}
                    {osData.situacao_os && osData.situacao_os.codigo && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <StatusBadge
                            status={String(osData.situacao_os.codigo)}
                            mapping={STATUS_MAPPING}
                          />
                          <span className="text-sm text-gray-500">
                            desde{" "}
                            {String(
                              (osData.situacao_os as Record<string, unknown>)
                                .data_situacao
                            )}
                          </span>
                        </div>
                        {/* Mostrar motivo de cancelamento se existir */}
                        {osData.situacao_os.motivo_cancelamento && (
                          <div className="mt-2 text-sm">
                            <span className="font-medium text-red-600">
                              Motivo do cancelamento:{" "}
                            </span>
                            <span className="text-gray-700">
                              {osData.situacao_os.motivo_cancelamento}
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Status de Garantia da OS */}
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-gray-500">
                        Status da Garantia
                      </p>
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${
                          osData.em_garantia
                            ? "border-emerald-100 bg-emerald-50 text-emerald-700"
                            : "border-amber-100 bg-amber-50 text-amber-700"
                        }`}
                        title={
                          osData.em_garantia
                            ? "OS em garantia"
                            : "OS fora da garantia"
                        }
                      >
                        {osData.em_garantia ? (
                          <ShieldCheck className="h-4 w-4" />
                        ) : (
                          <ShieldX className="h-4 w-4" />
                        )}
                        {osData.em_garantia
                          ? "OS Em garantia"
                          : "OS Fora da garantia"}
                      </span>
                    </div>

                    {/* Datas importantes */}
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-gray-500">Datas</p>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <CalendarClock className="h-4 w-4 text-blue-500 flex-shrink-0" />
                          <div className="flex flex-col">
                            <span className="text-xs text-gray-500">
                              Abertura
                            </span>
                            <span className="text-sm text-gray-800">
                              {osData.abertura.data_abertura}
                            </span>
                          </div>
                        </div>

                        {osData.data_agendada && (
                          <div className="flex items-center gap-2">
                            <CalendarRange className="h-4 w-4 text-purple-500 flex-shrink-0" />
                            <div className="flex flex-col">
                              <span className="text-xs text-gray-500">
                                Agendamento
                              </span>
                              <span className="text-sm text-gray-800">
                                {osData.data_agendada}
                              </span>
                            </div>
                          </div>
                        )}

                        {osData.data_fechamento && (
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                            <div className="flex flex-col">
                              <span className="text-xs text-gray-500">
                                Fechamento
                              </span>
                              <span className="text-sm text-gray-800">
                                {osData.data_fechamento}
                              </span>
                            </div>
                          </div>
                        )}

                        {osData.numero_interno?.trim() && (
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-gray-500 flex-shrink-0" />
                            <div className="flex flex-col">
                              <span className="text-xs text-gray-500">
                                Número interno
                              </span>
                              <span className="text-sm text-gray-800">
                                {osData.numero_interno}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Coluna Direita */}
                  <div className="space-y-6">
                    {/* Aberto por */}
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-gray-500">
                        Aberto por
                      </p>
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-gray-400 flex-shrink-0" />
                          <span className="text-sm text-gray-800">
                            {osData.abertura.nome_usuario} - (
                            {osData.abertura.forma_abertura})
                          </span>
                        </div>
                        {osData.abertura.origem_abertura === "T" && (
                          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                            Técnico
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Técnico Responsável */}
                    {osData.tecnico && osData.tecnico.id > 0 && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-gray-500">
                          Técnico Responsável
                        </p>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-gray-400 flex-shrink-0" />
                          <span className="text-sm text-gray-800">
                            {osData.tecnico.nome}
                          </span>
                          {osData.tecnico.tipo && (
                            <span
                              className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                osData.tecnico.tipo === "interno"
                                  ? "bg-blue-50 text-blue-600"
                                  : "bg-amber-50 text-amber-600"
                              }`}
                            >
                              {osData.tecnico.tipo === "interno"
                                ? "Interno"
                                : "Terceiro"}
                            </span>
                          )}
                        </div>
                        {osData.tecnico.observacoes && (
                          <p className="text-xs text-gray-600 mt-2 p-2 bg-gray-50 rounded-md whitespace-pre-line">
                            {osData.tecnico.observacoes}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Liberação Financeira */}
                    {osData.liberacao_financeira && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-gray-500">
                          Liberação Financeira
                        </p>
                        <div className="flex items-center gap-2">
                          {osData.liberacao_financeira.liberada ? (
                            <>
                              <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                              <span className="text-sm text-green-600 font-medium">
                                Liberada
                              </span>
                            </>
                          ) : (
                            <>
                              <XCircle className="h-4 w-4 text-gray-400 flex-shrink-0" />
                              <span className="text-sm text-gray-500">
                                Não liberada
                              </span>
                            </>
                          )}
                        </div>
                        {osData.liberacao_financeira.liberada && (
                          <div className="text-xs text-gray-600 space-y-1 pl-6">
                            {osData.liberacao_financeira
                              .nome_usuario_liberacao && (
                              <p>
                                Por:{" "}
                                {
                                  osData.liberacao_financeira
                                    .nome_usuario_liberacao
                                }
                              </p>
                            )}
                            {osData.liberacao_financeira.data_liberacao && (
                              <p>
                                Em: {osData.liberacao_financeira.data_liberacao}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Tabela de FATs - se tiver FATs */}
            {fatsData.length > 0 && (
              <div
                className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-300 animate-fadeIn"
                style={{ animationDelay: "0.4s" }}
              >
                <div className="py-3 px-6 border-b border-gray-100">
                  <h3 className="text-base font-semibold text-gray-800 flex items-center gap-2">
                    <Wrench
                      className="text-[var(--primary)] h-4 w-4 animate-pulseScale"
                      style={{ animationDelay: "0.5s" }}
                    />
                    Fichas de Atendimento Técnico ({fatsData.length})
                  </h3>
                </div>
                <div className="p-6">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 rounded-lg overflow-hidden">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            FAT #
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Data
                          </th>
                          <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                            FOTO
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Técnico
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {fatsData.map((fat, index) => {
                          const rawStatusKey =
                            fat?.situacao !== undefined &&
                            fat?.situacao !== null
                              ? String(fat.situacao)
                              : undefined;
                          const baseStatusConfig = rawStatusKey
                            ? STATUS_MAPPING[rawStatusKey]
                            : undefined;
                          const resolvedStatusKey =
                            baseStatusConfig && rawStatusKey
                              ? rawStatusKey
                              : "desconhecido";
                          const statusMapping =
                            baseStatusConfig && rawStatusKey
                              ? {
                                  [rawStatusKey]: {
                                    ...baseStatusConfig,
                                    label:
                                      fat?.descricao_situacao ||
                                      baseStatusConfig.label,
                                  },
                                }
                              : {
                                  desconhecido: {
                                    label:
                                      fat?.descricao_situacao ||
                                      "Status não informado",
                                    className:
                                      "bg-gray-100 text-gray-700 border border-gray-200",
                                  },
                                };

                          const temFotos =
                            Array.isArray(fat.fotos) && fat.fotos.length > 0;

                          return (
                            <tr
                              key={fat.id_fat}
                              className="hover:bg-gray-50 cursor-pointer transition-colors duration-150 animate-fadeIn"
                              style={{ animationDelay: `${0.05 * index}s` }}
                              onClick={() => handleFatClick(fat.id_fat)}
                              onMouseEnter={(e) => {
                                e.currentTarget.classList.add("shadow-sm");
                                e.currentTarget.style.transform =
                                  "translateY(-1px)";
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.classList.remove("shadow-sm");
                                e.currentTarget.style.transform =
                                  "translateY(0px)";
                              }}
                            >
                              <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                                <div className="flex items-center">
                                  #{fat.id_fat}
                                </div>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                <div className="flex items-center">
                                  <CalendarClock className="h-4 w-4 text-gray-400 mr-1" />
                                  {fat.data_atendimento}
                                </div>
                              </td>
                              <td className="px-4 py-3 text-center align-middle">
                                {temFotos ? (
                                  <span
                                    title={`Há ${fat.fotos?.length ?? 0} foto${
                                      (fat.fotos?.length ?? 0) > 1 ? "s" : ""
                                    }.`}
                                    className="flex items-center justify-center text-purple-600"
                                  >
                                    <Camera className="h-5 w-5" />
                                  </span>
                                ) : (
                                  <span
                                    title="Não há fotos."
                                    className="flex items-center justify-center"
                                  >
                                    <CameraOff className="h-5 w-5 text-gray-300" />
                                  </span>
                                )}
                              </td>

                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                <div className="flex items-center">
                                  <User className="h-4 w-4 text-gray-400 mr-1" />
                                  {fat.tecnico.nome}
                                  {fat.tecnico.tipo && (
                                    <span
                                      className={`ml-2 text-xs px-2 py-0.5 rounded-full ${
                                        fat.tecnico.tipo === "interno"
                                          ? "bg-blue-50 text-blue-600"
                                          : "bg-amber-50 text-amber-600"
                                      }`}
                                    >
                                      {fat.tecnico.tipo === "interno"
                                        ? "Interno"
                                        : "Terceiro"}
                                    </span>
                                  )}
                                </div>
                              </td>

                              <td className="px-4 py-3 whitespace-nowrap">
                                <StatusBadge
                                  status={resolvedStatusKey}
                                  mapping={statusMapping}
                                />
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {historicoOcorrencias.length > 0 && (
              <div
                className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6 mt-8 hover:shadow-md transition-shadow duration-300 animate-fadeIn"
                style={{ animationDelay: "0.7s" }}
              >
                <div className="py-3 px-6 border-b border-gray-100 flex items-center justify-between gap-3">
                  <h3 className="text-base font-semibold text-gray-800 flex items-center gap-2">
                    <Clock
                      className="text-[var(--primary)] h-4 w-4 animate-pulseScale"
                      style={{ animationDelay: "0.8s" }}
                    />
                    Histórico de Ocorrências da OS (
                    {historicoOcorrencias.length})
                  </h3>
                  {historicoOcorrenciasLoading && (
                    <span className="text-xs text-gray-400">
                      Atualizando...
                    </span>
                  )}
                </div>
                <div className="p-6">
                  <div className="relative">
                    <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>

                    {historicoOcorrencias.map((ocorrencia, index) => {
                      const statusCode = extractStatusCode(ocorrencia);
                      const theme = getTimelineTheme(statusCode);
                      const statusLabel = extractStatusDescricao(
                        ocorrencia,
                        statusCode
                      );
                      const dataOcorrencia = extractDataOcorrencia(ocorrencia);
                      const usuarioNome = extractUsuarioNome(ocorrencia);
                      const descricao =
                        ocorrencia.descricao_ocorrencia?.trim() ?? "";
                      const statusIcon =
                        statusCode !== null
                          ? STATUS_MAPPING[String(statusCode)]?.icon
                          : undefined;

                      return (
                        <div
                          key={
                            ocorrencia.id_ocorrencia ??
                            `ocorrencia-${index.toString()}`
                          }
                          className="ml-10 mb-6 relative animate-fadeIn last:mb-0"
                          style={{ animationDelay: `${0.05 * index}s` }}
                        >
                          <div
                            className={`absolute -left-10 top-1.5 w-6 h-6 rounded-full flex items-center justify-center z-10 ${theme.circleBg} border-2 ${theme.circleBorder}`}
                          >
                            {statusIcon || (
                              <Clock
                                className={`w-3 h-3 ${theme.circleText}`}
                              />
                            )}
                          </div>
                          <div
                            className={`bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden border ${theme.cardBorder}`}
                          >
                            <div
                              className={`px-4 py-2 flex justify-between items-center ${theme.headerBg} border-b ${theme.headerBorder}`}
                            >
                              <div className="flex flex-col gap-1">
                                {descricao ? (
                                  <span className="font-medium text-sm text-gray-700 whitespace-pre-line">
                                    {descricao}
                                  </span>
                                ) : (
                                  <span className="text-xs text-gray-400 italic">
                                    Alteração de status sem comentários
                                    adicionais.
                                  </span>
                                )}
                                <span className="text-xs text-gray-500 flex items-center gap-1">
                                  <CalendarClock className="w-3 h-3" />
                                  {dataOcorrencia || "Data não informada"}
                                </span>
                              </div>
                              <div className="flex items-center gap-1">
                                <User className="w-3.5 h-3.5 text-gray-400" />
                                <span className="text-xs font-medium text-gray-600">
                                  {usuarioNome}
                                </span>
                              </div>
                            </div>
                            <div className="px-4 py-3">
                              {statusLabel ? (
                                <p
                                  className={`text-sm font-medium ${theme.statusText}`}
                                >
                                  {statusLabel}
                                </p>
                              ) : (
                                <p className="text-xs text-gray-400 italic">
                                  Status da nova situação não informado.
                                </p>
                              )}
                            </div>
                          </div>
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

      {situacaoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => {
              if (!situacaoModalLoading) {
                handleCloseSituacaoModal();
              }
            }}
          />

          <div className="relative bg-white rounded-xl shadow-xl max-w-lg w-full mx-4 animate-in fade-in-0 zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <ListChecks className="h-5 w-5 text-[var(--primary)]" />
                <h3 className="text-lg font-semibold text-gray-900">
                  Informe a nova situação para a OS {osData?.id_os}
                </h3>
              </div>
              <button
                type="button"
                onClick={handleCloseSituacaoModal}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-lg"
                disabled={situacaoModalLoading}
                aria-label="Fechar modal"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div className="space-y-3">
                <p className="text-sm text-gray-600">
                  Selecione a nova situação da OS:
                </p>
                <div className="space-y-2">
                  {situacaoOptions.map((option) => (
                    <label
                      key={option}
                      className={`flex items-center gap-3 rounded-lg border px-3 py-2 cursor-pointer transition-colors ${
                        selectedOcorrencia === option
                          ? "border-[var(--primary)] bg-[var(--primary)]/5"
                          : "border-gray-200 hover:border-[var(--primary)]/60"
                      }`}
                    >
                      <input
                        type="radio"
                        name="situacaoOs"
                        value={option}
                        checked={selectedOcorrencia === option}
                        onChange={() => {
                          setSelectedOcorrencia(option);
                          setSituacaoModalError(null);
                        }}
                        className="h-4 w-4 text-[var(--primary)] focus:ring-[var(--primary)]"
                        disabled={situacaoModalLoading}
                      />
                      <span className="text-sm font-medium text-gray-700">
                        {OCORRENCIA_LABELS[option] ?? option}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label
                  htmlFor="motivoSituacao"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Motivo <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="motivoSituacao"
                  value={motivoAlteracao}
                  onChange={(event) => {
                    setMotivoAlteracao(event.target.value);
                    if (situacaoModalError) {
                      setSituacaoModalError(null);
                    }
                  }}
                  className={`w-full rounded-lg border px-3 py-2 text-sm text-gray-800 min-h-[120px] shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] ${
                    situacaoModalError?.toLowerCase().includes("motivo")
                      ? "border-red-300"
                      : "border-gray-300"
                  }`}
                  placeholder="Descreva o motivo da alteração..."
                  disabled={situacaoModalLoading}
                />
                {situacaoModalError && (
                  <div className="mt-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
                    {situacaoModalError}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50 rounded-b-xl">
              <button
                type="button"
                onClick={handleCloseSituacaoModal}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                disabled={situacaoModalLoading}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSituacaoSubmit}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white rounded-lg bg-[var(--primary)] hover:bg-[var(--primary)]/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                disabled={
                  situacaoModalLoading ||
                  !selectedOcorrencia ||
                  !motivoAlteracao.trim()
                }
              >
                {situacaoModalLoading && (
                  <span className="inline-flex h-4 w-4 items-center justify-center">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  </span>
                )}
                {situacaoModalLoading ? "Alterando..." : "Alterar situação"}
              </button>
            </div>
          </div>
        </div>
      )}

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

export default OSDetalhesPage;
