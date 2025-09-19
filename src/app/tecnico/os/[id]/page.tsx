"use client";
import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import MobileHeader from "@/components/tecnico/MobileHeader";
import {
  MapPin,
  User,
  Phone,
  Mail,
  Settings,
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle,
  Wrench,
  Bell,
  Car,
  PauseCircle,
  FileSearch,
  XCircle,
  UserX,
  Shield,
  MessageSquare,
  History,
  Package,
  ChevronRight,
  Navigation,
  X,
} from "lucide-react";
import {
  ordensServicoService,
  type OSDetalhadaV2,
} from "@/api/services/ordensServicoService";
import { Loading } from "@/components/LoadingPersonalizado";

interface StatusInfo {
  label: string;
  className: string;
  icon: React.ReactNode;
}

interface QuickAction {
  icon: React.ReactNode;
  label: string;
  action: () => void;
  color: string;
  disabled: boolean;
}

const StatusBadge = React.memo(({ status }: { status: string }) => {
  const statusMapping: Record<string, StatusInfo> = useMemo(
    () => ({
      "1": {
        label: "Pendente",
        className: "bg-slate-50 text-slate-600 border-slate-200",
        icon: <Clock className="w-3 h-3" />,
      },
      "2": {
        label: "A atender",
        className: "bg-blue-50 text-blue-600 border-blue-200",
        icon: <Bell className="w-3 h-3" />,
      },
      "3": {
        label: "Em deslocamento",
        className: "bg-purple-50 text-purple-600 border-purple-200",
        icon: <Car className="w-3 h-3" />,
      },
      "4": {
        label: "Em atendimento",
        className: "bg-orange-50 text-orange-600 border-orange-200",
        icon: <Wrench className="w-3 h-3" />,
      },
      "5": {
        label: "Interrompido",
        className: "bg-amber-50 text-amber-600 border-amber-200",
        icon: <PauseCircle className="w-3 h-3" />,
      },
      "6": {
        label: "Em Revisão",
        className: "bg-indigo-50 text-indigo-600 border-indigo-200",
        icon: <FileSearch className="w-3 h-3" />,
      },
      "7": {
        label: "Concluída",
        className: "bg-emerald-50 text-emerald-600 border-emerald-200",
        icon: <CheckCircle className="w-3 h-3" />,
      },
      "8": {
        label: "Cancelada",
        className: "bg-red-50 text-red-600 border-red-200",
        icon: <XCircle className="w-3 h-3" />,
      },
      "9": {
        label: "Cancelada pelo Cliente",
        className: "bg-rose-50 text-rose-600 border-rose-200",
        icon: <UserX className="w-3 h-3" />,
      },
    }),
    []
  );

  const getStatusInfo = useCallback((): StatusInfo => {
    if (statusMapping[status]) {
      return statusMapping[status];
    }

    const statusStr = status.toLowerCase();
    if (statusStr.includes("pendente")) return statusMapping["1"];
    if (statusStr.includes("atender")) return statusMapping["2"];
    if (statusStr.includes("deslocamento")) return statusMapping["3"];
    if (
      statusStr.includes("atendimento") &&
      !statusStr.includes("interrompido")
    )
      return statusMapping["4"];
    if (statusStr.includes("interrompido")) return statusMapping["5"];
    if (statusStr.includes("revisão")) return statusMapping["6"];
    if (statusStr.includes("concluída") || statusStr.includes("finalizada"))
      return statusMapping["7"];
    if (statusStr.includes("cancelada") && statusStr.includes("cliente"))
      return statusMapping["9"];
    if (statusStr.includes("cancelada")) return statusMapping["8"];

    return {
      label: status,
      className: "bg-slate-50 text-slate-600 border-slate-200",
      icon: <AlertTriangle className="w-3 h-3" />,
    };
  }, [status, statusMapping]);

  const statusInfo = getStatusInfo();

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border ${statusInfo.className}`}
    >
      {statusInfo.icon}
      <span>{statusInfo.label}</span>
    </div>
  );
});

StatusBadge.displayName = "StatusBadge";

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
    if (!value || value === "Não informado") return null;

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

const QuickActions = React.memo(({ os }: { os: OSDetalhadaV2 }) => {
  const [currentLocation, setCurrentLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

  const getCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCurrentLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      (error) => {
        console.error("Erro ao obter localização:", error);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 300000,
      }
    );
  }, []);

  useEffect(() => {
    getCurrentLocation();
  }, [getCurrentLocation]);

  const openNavigation = useCallback(
    (app: "google" | "waze") => {
      let destinationUrl = "";
      let destinationCoords = "";

      if (os.cliente?.latitude && os.cliente?.longitude) {
        destinationCoords = `${os.cliente.latitude},${os.cliente.longitude}`;
        destinationUrl = destinationCoords;
      } else if (os.cliente?.endereco) {
        const enderecoCompleto = `${os.cliente.endereco}${
          os.cliente.numero ? `, ${os.cliente.numero}` : ""
        } - ${os.cliente.bairro}, ${os.cliente.cidade}/${os.cliente.uf}`;
        destinationUrl = encodeURIComponent(enderecoCompleto);
      } else {
        alert("Endereço do cliente não disponível");
        return;
      }

      const isMobile =
        /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
          navigator.userAgent
        );

      if (app === "google") {
        const navigationUrl = currentLocation
          ? `https://www.google.com/maps/dir/${currentLocation.lat},${currentLocation.lng}/${destinationUrl}`
          : `https://www.google.com/maps/search/?api=1&query=${destinationUrl}`;

        if (isMobile) {
          const nativeUrl = currentLocation
            ? `comgooglemaps://?saddr=${currentLocation.lat},${currentLocation.lng}&daddr=${destinationUrl}&directionsmode=driving`
            : `comgooglemaps://?daddr=${destinationUrl}&directionsmode=driving`;

          const startTime = Date.now();
          window.location.href = nativeUrl;

          setTimeout(() => {
            if (Date.now() - startTime < 2000) {
              window.open(navigationUrl, "_blank");
            }
          }, 1500);
        } else {
          window.open(navigationUrl, "_blank");
        }
      } else if (app === "waze") {
        const wazeUrl = destinationCoords
          ? `https://waze.com/ul?ll=${destinationCoords}&navigate=yes`
          : `https://waze.com/ul?q=${destinationUrl}&navigate=yes`;

        if (isMobile) {
          const startTime = Date.now();
          window.location.href = wazeUrl;

          setTimeout(() => {
            if (Date.now() - startTime < 2000) {
              window.open(wazeUrl, "_blank");
            }
          }, 1500);
        } else {
          window.open(wazeUrl, "_blank");
        }
      }
    },
    [os.cliente, currentLocation]
  );

  const showNavigationModal = useCallback(() => {
    const isMobile =
      /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      );

    if (isMobile) {
      const modal = document.createElement("div");
      modal.className =
        "fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4";

      const modalContent = document.createElement("div");
      modalContent.className =
        "bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl";
      modalContent.innerHTML = `
        <h3 class="text-lg font-semibold text-gray-900 mb-4 text-center">
          Escolher app de navegação
        </h3>
        <div class="space-y-3">
          <button id="google-maps-btn" class="w-full flex items-center justify-center gap-3 p-4 border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all">
            <div class="w-8 h-8">
              <svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="32" height="32" viewBox="0 0 48 48">
                <path fill="#48b564" d="M35.76,26.36h0.01c0,0-3.77,5.53-6.94,9.64c-2.74,3.55-3.54,6.59-3.77,8.06C24.97,44.6,24.53,45,24,45s-0.97-0.4-1.06-0.94c-0.23-1.47-1.03-4.51-3.77-8.06c-0.42-0.55-0.85-1.12-1.28-1.7L28.24,22l8.33-9.88C37.49,14.05,38,16.21,38,18.5C38,21.4,37.17,24.09,35.76,26.36z"></path>
                <path fill="#fcc60e" d="M28.24,22L17.89,34.3c-2.82-3.78-5.66-7.94-5.66-7.94h0.01c-0.3-0.48-0.57-0.97-0.8-1.48L19.76,15c-0.79,0.95-1.26,2.17-1.26,3.5c0,3.04,2.46,5.5,5.5,5.5C25.71,24,27.24,23.22,28.24,22z"></path>
                <path fill="#2c85eb" d="M28.4,4.74l-8.57,10.18L13.27,9.2C15.83,6.02,19.69,4,24,4C25.54,4,27.02,4.26,28.4,4.74z"></path>
                <path fill="#ed5748" d="M19.83,14.92L19.76,15l-8.32,9.88C10.52,22.95,10,20.79,10,18.5c0-3.54,1.23-6.79,3.27-9.3L19.83,14.92z"></path>
                <path fill="#5695f6" d="M28.24,22c0.79-0.95,1.26-2.17,1.26-3.5c0-3.04-2.46-5.5-5.5-5.5c-1.71,0-3.24,0.78-4.24,2L28.4,4.74c3.59,1.22,6.53,3.91,8.17,7.38L28.24,22z"></path>
              </svg>
            </div>
            <span class="font-medium">Google Maps</span>
          </button>
          <button id="waze-btn" class="w-full flex items-center justify-center gap-3 p-4 border-2 border-gray-200 rounded-xl hover:border-green-500 hover:bg-green-50 transition-all">
            <div class="w-8 h-8">
              <svg width="32" height="32" viewBox="0 0 200 200">
                <path fill="#00d4aa" d="M99.513,76.832c0,4.719-3.825,8.545-8.544,8.545c-4.718,0-8.544-3.826-8.544-8.545c0-4.719,3.826-8.543,8.544-8.543C95.688,68.289,99.513,72.112,99.513,76.832"/>
                <path fill="#00d4aa" d="M139.43,76.832c0,4.719-3.826,8.545-8.545,8.545c-4.718,0-8.544-3.826-8.544-8.545c0-4.719,3.826-8.543,8.544-8.543C135.604,68.289,139.43,72.112,139.43,76.832"/>
              </svg>
            </div>
            <span class="font-medium">Waze</span>
          </button>
          <button id="cancel-btn" class="w-full p-3 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
            Cancelar
          </button>
        </div>
      `;

      modal.appendChild(modalContent);
      document.body.appendChild(modal);

      document
        .getElementById("google-maps-btn")
        ?.addEventListener("click", () => {
          document.body.removeChild(modal);
          openNavigation("google");
        });

      document.getElementById("waze-btn")?.addEventListener("click", () => {
        document.body.removeChild(modal);
        openNavigation("waze");
      });

      document.getElementById("cancel-btn")?.addEventListener("click", () => {
        document.body.removeChild(modal);
      });

      modal.addEventListener("click", (e) => {
        if (e.target === modal) {
          document.body.removeChild(modal);
        }
      });
    } else {
      openNavigation("google");
    }
  }, [openNavigation]);

  const actions: QuickAction[] = useMemo(() => {
    const actionList: QuickAction[] = [];

    if (
      os.cliente?.endereco ||
      (os.cliente?.latitude && os.cliente?.longitude)
    ) {
      actionList.push({
        icon: <Navigation className="w-4 h-4" />,
        label: "Traçar rota",
        action: showNavigationModal,
        color: "text-blue-600 bg-blue-50 border-blue-200",
        disabled: false,
      });
    }

    if (os.contato?.telefone) {
      actionList.push({
        icon: <Phone className="w-4 h-4" />,
        label: "Ligar",
        action: () => window.open(`tel:${os.contato.telefone}`),
        color: "text-emerald-600 bg-emerald-50 border-emerald-200",
        disabled: false,
      });
    }

    if (os.contato?.whatsapp?.trim()) {
      actionList.push({
        icon: <MessageSquare className="w-4 h-4" />,
        label: "WhatsApp",
        action: () =>
          window.open(
            `https://wa.me/${os.contato.whatsapp.replace(/\D/g, "")}`,
            "_blank"
          ),
        color: "text-green-600 bg-green-50 border-green-200",
        disabled: false,
      });
    }

    if (os.contato?.email) {
      actionList.push({
        icon: <Mail className="w-4 h-4" />,
        label: "E-mail",
        action: () => window.open(`mailto:${os.contato.email}`),
        color: "text-blue-600 bg-blue-50 border-blue-200",
        disabled: false,
      });
    }

    return actionList;
  }, [os.cliente, os.contato, showNavigationModal]);

  if (actions.length === 0) return null;

  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
      {actions.map((action, index) => (
        <button
          key={index}
          onClick={action.action}
          disabled={action.disabled}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-medium whitespace-nowrap border ${
            action.color
          } ${
            action.disabled
              ? "opacity-50 cursor-not-allowed"
              : "hover:scale-105 active:scale-95 transition-all duration-200 shadow-sm"
          }`}
        >
          {action.icon}
          {action.label}
        </button>
      ))}
    </div>
  );
});

QuickActions.displayName = "QuickActions";

const ActionModal = React.memo(
  ({
    isOpen,
    onClose,
    onAction,
  }: {
    isOpen: boolean;
    onClose: () => void;
    onAction: (action: string) => void;
  }) => {
    const actions = [
      {
        key: "iniciar_deslocamento",
        label: "Iniciar deslocamento",
        color: "blue",
      },
      {
        key: "iniciar_atendimento",
        label: "Iniciar Atendimento",
        color: "emerald",
      },
      {
        key: "pausar_atendimento",
        label: "Pausar Atendimento",
        color: "amber",
      },
      {
        key: "retomar_atendimento",
        label: "Retomar Atendimento",
        color: "purple",
      },
      { key: "interromper_atendimento", label: "Interromper", color: "rose" },
      {
        key: "concluir_atendimento",
        label: "Concluir Atendimento",
        color: "emerald",
      },
      { key: "concluir_os", label: "Concluir OS", color: "slate" },
      { key: "cancelar_atendimento", label: "Cancelar", color: "red" },
    ];

    if (!isOpen) return null;

    return (
      <div
        role="dialog"
        aria-modal="true"
        className="fixed inset-0 z-50 flex items-end md:items-center justify-center"
      >
        <div className="absolute inset-0 bg-black/50" onClick={onClose} />
        <div className="relative w-full max-w-lg bg-white rounded-t-2xl md:rounded-2xl p-6 shadow-2xl animate-in slide-in-from-bottom-4 md:slide-in-from-bottom-0">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-slate-900">Ações</h3>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5 text-slate-600" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {actions.map((action) => (
              <button
                key={action.key}
                onClick={() => onAction(action.key)}
                className={`flex items-center justify-center gap-2 p-4 rounded-xl bg-${action.color}-50 text-${action.color}-700 text-sm font-medium hover:bg-${action.color}-100 transition-all duration-200 active:scale-95`}
              >
                {action.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }
);

ActionModal.displayName = "ActionModal";

export default function OSDetalheMobile() {
  const router = useRouter();
  const params = useParams();
  const [os, setOs] = useState<OSDetalhadaV2 | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showActions, setShowActions] = useState(false);

  const formatDate = useCallback((dateStr: string | null) => {
    if (!dateStr?.trim()) return null;
    return dateStr;
  }, []);

  const handleAction = useCallback(
    async (action: string) => {
      setShowActions(false);
      console.log("Ação selecionada:", action, "OS:", os?.id_os);

      const actionMessages: Record<string, string> = {
        iniciar_deslocamento: "Deslocamento iniciado",
        iniciar_atendimento: "Atendimento iniciado",
        pausar_atendimento: "Atendimento pausado",
        retomar_atendimento: "Atendimento retomado",
        interromper_atendimento: "Atendimento interrompido",
        concluir_atendimento: "Atendimento concluído",
        concluir_os: "OS concluída",
        cancelar_atendimento: "Atendimento cancelado",
      };

      alert(actionMessages[action] || "Ação executada");
    },
    [os?.id_os]
  );

  const fetchOS = useCallback(async () => {
    if (!params?.id) {
      setError("ID da OS não fornecido");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await ordensServicoService.getById(Number(params.id));
      const osData = Array.isArray(response) ? response[0] : response;

      if (!osData) {
        setError("OS não encontrada");
        return;
      }

      setOs(osData);
    } catch {
      setError("Erro ao carregar detalhes da OS.");
    } finally {
      setLoading(false);
    }
  }, [params?.id]);

  useEffect(() => {
    fetchOS();
  }, [fetchOS]);

  if (loading) {
    return (
      <>
        <MobileHeader
          title="Detalhes da OS"
          onMenuClick={() => router.back()}
        />
        <Loading
          fullScreen={true}
          preventScroll={false}
          text="Carregando detalhes da OS..."
          size="large"
        />
      </>
    );
  }

  if (error) {
    return (
      <>
        <MobileHeader
          title="Detalhes da OS"
          onMenuClick={() => router.back()}
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
                onClick={() => router.back()}
                className="flex-1 px-4 py-3 bg-slate-100 text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-200 transition-colors"
              >
                Voltar
              </button>
              <button
                onClick={() => window.location.reload()}
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

  if (!os) {
    return (
      <>
        <MobileHeader
          title="Detalhes da OS"
          onMenuClick={() => router.back()}
        />
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
          <div className="text-center">
            <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-slate-400" />
            <h2 className="font-semibold text-slate-900 mb-4 text-lg">
              OS não encontrada
            </h2>
            <button
              onClick={() => router.back()}
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
    <main className="min-h-screen bg-slate-50">
      <MobileHeader
        title={os.id_os ? `OS #${os.id_os}` : "Detalhes da OS"}
        onMenuClick={() => router.back()}
      />

      {/* Status Header */}
      <div className="bg-white border-b border-slate-200 p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <StatusBadge status={os.situacao_os?.codigo?.toString() || "1"} />
          {os.em_garantia && (
            <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-xs font-medium">
              <Shield className="w-3 h-3" />
              <span>Garantia</span>
            </div>
          )}
        </div>
        {os.descricao_problema && (
          <p className="text-sm text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-lg">
            {os.descricao_problema}
          </p>
        )}
      </div>

      {/* Quick Actions */}
      <div className="p-4 bg-white border-b border-slate-100">
        <QuickActions os={os} />
      </div>

      {/* Content Sections */}
      <div className="px-4 pb-6 space-y-4 mt-4">
        {/* Datas */}
        <Section title="Datas" icon={<Calendar className="w-4 h-4" />}>
          <Field
            label="Abertura"
            value={formatDate(os.abertura?.data_abertura)}
            icon={<Clock className="w-3 h-3" />}
          />
          <Field
            label="Agendada"
            value={formatDate(os.data_agendada)}
            icon={<Calendar className="w-3 h-3" />}
          />
          {os.data_fechamento && (
            <Field
              label="Fechamento"
              value={formatDate(os.data_fechamento)}
              icon={<CheckCircle className="w-3 h-3" />}
            />
          )}
        </Section>

        {/* Cliente */}
        <Section title="Cliente" icon={<User className="w-4 h-4" />}>
          <Field
            label="Nome"
            value={os.cliente?.nome}
            icon={<User className="w-3 h-3" />}
          />
          <Field
            label="Endereço"
            value={
              os.cliente?.endereco &&
              `${os.cliente.endereco}${
                os.cliente.numero ? `, ${os.cliente.numero}` : ""
              } - ${os.cliente.bairro}, ${os.cliente.cidade}/${os.cliente.uf}${
                os.cliente?.cep ? `, ${os.cliente.cep}` : ""
              }`
            }
            icon={<MapPin className="w-3 h-3" />}
          />
          <Field
            label="Região"
            value={os.cliente?.nome_regiao}
            icon={<MapPin className="w-3 h-3" />}
          />
          {os.cliente?.latitude && os.cliente?.longitude && (
            <Field
              label="Coordenadas GPS"
              value={`${os.cliente.latitude}, ${os.cliente.longitude}`}
              icon={<Navigation className="w-3 h-3" />}
            />
          )}
          <Field
            label="Contato"
            value={os.contato?.nome}
            icon={<User className="w-3 h-3" />}
          />
          <Field
            label="Telefone"
            value={os.contato?.telefone}
            icon={<Phone className="w-3 h-3" />}
          />
          {os.contato?.whatsapp && (
            <Field
              label="WhatsApp"
              value={os.contato.whatsapp}
              icon={<MessageSquare className="w-3 h-3" />}
            />
          )}
          <Field
            label="Email"
            value={os.contato?.email}
            icon={<Mail className="w-3 h-3" />}
          />
        </Section>

        {/* Equipamento */}
        <Section title="Equipamento" icon={<Settings className="w-4 h-4" />}>
          <Field
            label="Modelo"
            value={os.maquina?.modelo}
            icon={<Settings className="w-3 h-3" />}
          />
          <Field label="Descrição" value={os.maquina?.descricao} />
          <Field label="Número de Série" value={os.maquina?.numero_serie} />
        </Section>

        {/* Abertura */}
        {os.abertura && (
          <Section
            title="Abertura"
            icon={<FileSearch className="w-4 h-4" />}
            collapsible={true}
            defaultExpanded={false}
          >
            <Field
              label="Aberto por"
              value={os.abertura.nome_usuario}
              icon={<User className="w-3 h-3" />}
            />
            <Field
              label="Forma"
              value={
                os.abertura.forma_abertura === "whats"
                  ? "WhatsApp"
                  : os.abertura.forma_abertura === "telefone"
                  ? "Telefone"
                  : os.abertura.forma_abertura === "email"
                  ? "Email"
                  : os.abertura.forma_abertura
              }
              icon={<MessageSquare className="w-3 h-3" />}
            />
            <Field
              label="Origem"
              value={
                os.abertura.origem_abertura === "I"
                  ? "Interno"
                  : os.abertura.origem_abertura === "T"
                  ? "Terceiro"
                  : os.abertura.origem_abertura === "C"
                  ? "Cliente"
                  : os.abertura.origem_abertura
              }
            />
            <Field
              label="Motivo do Atendimento"
              value={os.abertura.motivo_atendimento}
            />
          </Section>
        )}

        {/* Peças */}
        {os.pecas_corrigidas && os.pecas_corrigidas.length > 0 && (
          <Section
            title={`Peças Utilizadas (${os.pecas_corrigidas.length})`}
            icon={<Package className="w-4 h-4" />}
            collapsible={true}
            defaultExpanded={false}
          >
            <div className="space-y-2">
              {os.pecas_corrigidas.map((peca, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                >
                  <div className="flex items-center gap-2">
                    <Package className="w-3 h-3 text-slate-400" />
                    <span className="text-sm text-slate-900 font-medium">
                      {peca.nome}
                    </span>
                  </div>
                  <span className="text-xs text-slate-600 bg-white px-2 py-1 rounded">
                    Qty: {peca.quantidade}
                  </span>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* FATs */}
        {os.fats && os.fats.length > 0 && (
          <Section
            title={`Relatórios de Atendimento (${os.fats.length})`}
            icon={<History className="w-4 h-4" />}
            collapsible={true}
            defaultExpanded={false}
          >
            <div className="space-y-4">
              {os.fats.map((fat, index) => (
                <div
                  key={index}
                  className="bg-slate-50 rounded-xl p-4 space-y-3"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-xs font-bold text-blue-600">
                          {index + 1}
                        </span>
                      </div>
                      <span className="text-sm font-semibold text-slate-900">
                        FAT #{fat.id_fat}
                      </span>
                    </div>
                    {fat.data_atendimento && (
                      <span className="text-xs text-slate-500 bg-white px-2 py-1 rounded">
                        {fat.data_atendimento}
                      </span>
                    )}
                  </div>

                  <Field
                    label="Técnico"
                    value={fat.tecnico?.nome}
                    icon={<User className="w-3 h-3" />}
                  />
                  <Field label="Motivo" value={fat.motivo_atendimento} />
                  <Field
                    label="Atendente no Local"
                    value={fat.nome_atendente}
                    icon={<User className="w-3 h-3" />}
                  />
                  <Field
                    label="Contato do Atendente"
                    value={
                      fat.contato_atendente && fat.contato_atendente !== "-"
                        ? fat.contato_atendente
                        : null
                    }
                    icon={<Phone className="w-3 h-3" />}
                  />
                  <Field
                    label="Problema Descrito"
                    value={fat.descricao_problema}
                    icon={<AlertTriangle className="w-3 h-3" />}
                  />
                  <Field
                    label="Solução Aplicada"
                    value={fat.solucao_encontrada}
                    icon={<CheckCircle className="w-3 h-3" />}
                  />
                  <Field
                    label="Testes Realizados"
                    value={fat.testes_realizados}
                    icon={<FileSearch className="w-3 h-3" />}
                  />
                  <Field label="Sugestões" value={fat.sugestoes} />
                  <Field
                    label="Observações"
                    value={fat.observacoes}
                    icon={<MessageSquare className="w-3 h-3" />}
                  />

                  {fat.numero_ciclos > 0 && (
                    <Field
                      label="Número de Ciclos"
                      value={fat.numero_ciclos.toString()}
                      icon={<Settings className="w-3 h-3" />}
                    />
                  )}

                  {/* Deslocamentos */}
                  {fat.deslocamentos && fat.deslocamentos.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-slate-200">
                      <p className="text-xs font-semibold text-slate-600 mb-3 flex items-center gap-2">
                        <Car className="w-3 h-3" />
                        Deslocamentos
                      </p>
                      <div className="space-y-2">
                        {fat.deslocamentos.map((desl, deslIndex) => (
                          <div
                            key={deslIndex}
                            className="bg-white rounded-lg p-3"
                          >
                            <div className="grid grid-cols-2 gap-3 text-xs">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                                <span className="text-slate-600">Ida:</span>
                                <span className="font-medium text-slate-900">
                                  {desl.km_ida?.toFixed(1)}km (
                                  {desl.tempo_ida_min}min)
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                                <span className="text-slate-600">Volta:</span>
                                <span className="font-medium text-slate-900">
                                  {desl.km_volta?.toFixed(1)}km (
                                  {desl.tempo_volta_min}min)
                                </span>
                              </div>
                            </div>
                            {desl.observacoes && (
                              <div className="mt-2 text-xs text-slate-600 bg-slate-50 p-2 rounded">
                                {desl.observacoes}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Peças utilizadas no FAT */}
                  {fat.pecas_utilizadas && fat.pecas_utilizadas.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-slate-200">
                      <p className="text-xs font-semibold text-slate-600 mb-3 flex items-center gap-2">
                        <Package className="w-3 h-3" />
                        Peças utilizadas neste atendimento
                      </p>
                      <div className="space-y-2">
                        {fat.pecas_utilizadas.map((peca, pecaIndex) => (
                          <div
                            key={pecaIndex}
                            className="flex items-center justify-between bg-white p-2 rounded-lg"
                          >
                            <span className="text-sm text-slate-900">
                              {peca.nome}
                            </span>
                            <span className="text-xs text-slate-600 bg-slate-100 px-2 py-1 rounded">
                              Qty: {peca.quantidade}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Section>
        )}
      </div>

      {/* Action Button */}
      <div className="sticky bottom-0 p-4 bg-white border-t border-slate-200 shadow-lg">
        <button
          onClick={() => setShowActions(true)}
          className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-4 rounded-xl text-sm font-semibold shadow-lg hover:shadow-xl active:scale-98 transition-all duration-200"
        >
          Ações da OS
        </button>
      </div>

      {/* Action Modal */}
      <ActionModal
        isOpen={showActions}
        onClose={() => setShowActions(false)}
        onAction={handleAction}
      />
    </main>
  );
}
