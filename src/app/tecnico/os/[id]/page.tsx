"use client";
import React, {
  useEffect,
  useState,
  useCallback,
  useRef,
  useMemo,
} from "react";
import FloatingActionMenu from "@/components/tecnico/FloatingActionMenu";
import { useRouter, useParams } from "next/navigation";
import MobileHeader from "@/components/tecnico/MobileHeader";
import StatusBadge from "@/components/tecnico/StatusBadge";
import {
  MapPin,
  Building,
  User,
  Briefcase,
  Settings,
  Calendar,
  CircleX,
  MessageCircle,
  AlertTriangle,
  CircleCheck,
  FileSearch,
  Phone,
  Mail,
  MessageSquare,
  Package,
  ChevronRight,
  FileText,
} from "lucide-react";
import {
  ordensServicoService,
  type OSDetalhadaV2,
} from "@/api/services/ordensServicoService";
import FATCard from "@/components/tecnico/FATCard";
import { Loading } from "@/components/LoadingPersonalizado";
// import OSActionModal from "@/components/tecnico/OSActionModal";

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
      <div className="bg-white rounded-lg  shadow-sm">
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

export default function OSDetalheMobile() {
  const router = useRouter();
  const params = useParams();
  const [os, setOs] = useState<OSDetalhadaV2 | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshCount, setRefreshCount] = useState(0);
  const [currentLocation, setCurrentLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [isLocationLoading, setIsLocationLoading] = useState(false);

  // Ref para controlar se já está carregando e evitar chamadas duplas
  const isLoadingRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const formatDate = useCallback((dateStr: string | null) => {
    if (!dateStr?.trim()) return null;
    return dateStr;
  }, []);

  const getCurrentLocation = useCallback(() => {
    if (
      typeof navigator === "undefined" ||
      !navigator.geolocation ||
      isLocationLoading
    ) {
      return;
    }

    setIsLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCurrentLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setIsLocationLoading(false);
      },
      (error) => {
        console.error("Erro ao obter localização:", error);
        setIsLocationLoading(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 300000 }
    );
  }, [isLocationLoading]);

  useEffect(() => {
    getCurrentLocation();
  }, [getCurrentLocation]);

  const openNavigation = useCallback(
    (app: "google" | "waze") => {
      if (typeof window === "undefined" || !os?.cliente) {
        return;
      }

      let destinationUrl = "";
      let destinationCoords = "";

      if (os.cliente.latitude && os.cliente.longitude) {
        destinationCoords = `${os.cliente.latitude},${os.cliente.longitude}`;
        destinationUrl = destinationCoords;
      } else if (os.cliente.endereco) {
        const enderecoCompleto = `${os.cliente.endereco}${
          os.cliente.numero ? `, ${os.cliente.numero}` : ""
        } - ${os.cliente.bairro}, ${os.cliente.cidade}/${os.cliente.uf}`;
        destinationUrl = encodeURIComponent(enderecoCompleto);
      } else {
        window.alert("Endereço do cliente não disponível");
        return;
      }

      const userAgent =
        typeof navigator !== "undefined" ? navigator.userAgent : "";
      const isMobile =
        /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
          userAgent
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

          window.setTimeout(() => {
            if (Date.now() - startTime < 2000) {
              window.open(navigationUrl, "_blank");
            }
          }, 1500);
        } else {
          window.open(navigationUrl, "_blank");
        }
      } else {
        const wazeUrl = destinationCoords
          ? `https://waze.com/ul?ll=${destinationCoords}&navigate=yes`
          : `https://waze.com/ul?q=${destinationUrl}&navigate=yes`;

        if (isMobile) {
          const startTime = Date.now();
          window.location.href = wazeUrl;

          window.setTimeout(() => {
            if (Date.now() - startTime < 2000) {
              window.open(wazeUrl, "_blank");
            }
          }, 1500);
        } else {
          window.open(wazeUrl, "_blank");
        }
      }
    },
    [os, currentLocation]
  );

  const showNavigationModal = useCallback(() => {
    if (typeof window === "undefined") {
      return;
    }

    const userAgent =
      typeof navigator !== "undefined" ? navigator.userAgent : "";
    const isMobile =
      /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        userAgent
      );

    if (
      isMobile &&
      typeof document !== "undefined" &&
      typeof document.createElement === "function"
    ) {
      const modal = document.createElement("div");
      modal.className = `
        fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4
        animate-in fade-in duration-200
      `;

      const modalContent = document.createElement("div");
      modalContent.className = `
        bg-white rounded-2xl p-6 w-full max-w-sm 
        shadow-2xl animate-in slide-in-from-bottom-4 duration-300
      `;
      modalContent.innerHTML = `
        <div class="text-center mb-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-1">Escolher Navegação</h3>
        </div>
        <div class="space-y-3">
          <button id="google-maps-btn" class="w-full flex items-center gap-4 p-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors duration-200">
            <div class="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 48 48">
    <path fill="#48b564" d="M35.76,26.36h0.01c0,0-3.77,5.53-6.94,9.64c-2.74,3.55-3.54,6.59-3.77,8.06	C24.97,44.6,24.53,45,24,45s-0.97-0.4-1.06-0.94c-0.23-1.47-1.03-4.51-3.77-8.06c-0.42-0.55-0.85-1.12-1.28-1.7L28.24,22l8.33-9.88	C37.49,14.05,38,16.21,38,18.5C38,21.4,37.17,24.09,35.76,26.36z"></path>
    <path fill="#fcc60e" d="M28.24,22L17.89,34.3c-2.82-3.78-5.66-7.94-5.66-7.94h0.01c-0.3-0.48-0.57-0.97-0.8-1.48L19.76,15	c-0.79,0.95-1.26,2.17-1.26,3.5c0,3.04,2.46,5.5,5.5,5.5C25.71,24,27.24,23.22,28.24,22z"></path>
    <path fill="#2c85eb" d="M28.4,4.74l-8.57,10.18L13.27,9.2C15.83,6.02,19.69,4,24,4C25.54,4,27.02,4.26,28.4,4.74z"></path>
    <path fill="#ed5748" d="M19.83,14.92L19.76,15l-8.32,9.88C10.52,22.95,10,20.79,10,18.5c0-3.54,1.23-6.79,3.27-9.3	L19.83,14.92z"></path>
    <path fill="#5695f6" d="M28.24,22c0.79-0.95,1.26-2.17,1.26-3.5c0-3.04-2.46-5.5-5.5-5.5c-1.71,0-3.24,0.78-4.24,2L28.4,4.74	c3.59,1.22,6.53,3.91,8.17,7.38L28.24,22z"></path>
  </svg>
            </div>
            <div class="flex-1 text-left">
              <div class="font-medium text-gray-900">Google Maps</div>
             
            </div>
          </button>

          <button id="waze-btn" class="w-full flex items-center gap-4 p-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors duration-200">
            <div class="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
           <svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"
         width="100%" height="100%" viewBox="0 0 200 200" enable-background="new 0 0 200 200" xml:space="preserve">
      <g>
        <path fill="#303030" d="M99.513,76.832c0,4.719-3.825,8.545-8.544,8.545c-4.718,0-8.544-3.826-8.544-8.545
          c0-4.719,3.826-8.543,8.544-8.543C95.688,68.289,99.513,72.112,99.513,76.832"/>
        <path fill="#303030" d="M139.43,76.832c0,4.719-3.826,8.545-8.545,8.545c-4.718,0-8.544-3.826-8.544-8.545
          c0-4.719,3.826-8.543,8.544-8.543C135.604,68.289,139.43,72.112,139.43,76.832"/>
        <path fill="#303030" d="M110.621,122.646c-14.477,0-27.519-9.492-29.911-21.917c-0.464-2.412,1.116-4.745,3.528-5.209
          c2.413-0.465,4.745,1.116,5.209,3.528c1.406,7.304,10.152,14.996,21.81,14.691c12.144-0.318,20.165-7.58,21.813-14.588
          c0.563-2.391,2.961-3.872,5.35-3.312c2.393,0.563,3.875,2.958,3.312,5.349c-1.346,5.721-5.03,11.021-10.375,14.926
          c-5.567,4.07-12.438,6.324-19.866,6.52C111.201,122.643,110.91,122.646,110.621,122.646"/>
        <path fill="#303030" d="M183.97,81.47c-1.644-9.71-5.5-18.811-11.464-27.051c-6.736-9.307-15.951-17.078-26.648-22.472
          c-10.812-5.452-22.88-8.335-34.9-8.335c-3.391,0-6.809,0.23-10.16,0.682c-14.034,1.896-27.833,7.734-38.856,16.439
          c-12.42,9.808-20.435,22.418-23.177,36.469C37.948,81.379,37.6,86,37.263,90.468c-0.528,6.994-1.074,14.226-3.298,18.952
          c-1.52,3.23-3.788,5.381-9.919,5.381c-3.374,0-6.457,1.908-7.963,4.928c-1.505,3.02-1.173,6.631,0.857,9.324
          c9.237,12.254,21.291,19.676,33.982,24.148c-0.578,1.746-0.903,3.605-0.903,5.545c0,9.744,7.899,17.643,17.643,17.643
          c9.503,0,17.229-7.518,17.606-16.928c4.137,0.225,23.836,0.279,26.033,0.217c0.487,9.309,8.167,16.711,17.596,16.711
          c9.743,0,17.642-7.898,17.642-17.643c0-2.221-0.428-4.338-1.176-6.295c6.918-3.365,13.448-7.906,19.146-13.375
          c7.946-7.625,13.778-16.621,16.868-26.016C184.854,102.486,185.728,91.857,183.97,81.47 M67.662,164.568
          c-3.215,0-5.822-2.605-5.822-5.822c0-3.215,2.607-5.822,5.822-5.822c3.216,0,5.822,2.607,5.822,5.822
          C73.484,161.963,70.878,164.568,67.662,164.568 M128.897,164.568c-3.216,0-5.823-2.605-5.823-5.822
          c0-3.215,2.607-5.822,5.823-5.822s5.822,2.607,5.822,5.822C134.72,161.963,132.113,164.568,128.897,164.568 M172.925,110.281
          c-5.095,15.49-18.524,28.281-32.835,34.83c-3.047-2.504-6.943-4.006-11.192-4.006c-6.848,0-12.771,3.906-15.694,9.607
          c-2.976,0.123-25.135,0.047-29.984-0.285c-2.972-5.547-8.822-9.322-15.557-9.322c-4.48,0-8.559,1.682-11.669,4.434
          c-12.054-3.895-23.438-10.551-31.947-21.842c25.161,0,20.196-28.118,23.451-44.792c4.959-25.412,30.099-42.499,54.491-45.794
          c3-0.405,6-0.602,8.969-0.602C151.047,32.51,186.732,68.302,172.925,110.281"/>
      </g>
    </svg>
            </div>
            <div class="flex-1 text-left">
              <div class="font-medium text-gray-900">Waze</div>
             
            </div>
          </button>

          <button id="cancel-btn" class="w-full p-3 text-gray-600 hover:text-gray-800 transition-colors duration-200 font-medium">
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

      modal.addEventListener("click", (event) => {
        if (event.target === modal) {
          document.body.removeChild(modal);
        }
      });
    } else {
      openNavigation("google");
    }
  }, [openNavigation]);

  const enderecoFormatado = useMemo(() => {
    if (!os?.cliente?.endereco) {
      return "";
    }

    return `${os.cliente.endereco}${
      os.cliente.numero ? `, ${os.cliente.numero}` : ""
    } - ${os.cliente.bairro}, ${os.cliente.cidade}/${os.cliente.uf}${
      os.cliente?.cep ? `, ${os.cliente.cep}` : ""
    }`;
  }, [
    os?.cliente?.endereco,
    os?.cliente?.numero,
    os?.cliente?.bairro,
    os?.cliente?.cidade,
    os?.cliente?.uf,
    os?.cliente?.cep,
  ]);

  const fetchOS = useCallback(
    async (force = false) => {
      if (!params?.id) {
        setError("ID da OS não fornecido");
        setLoading(false);
        return;
      }

      if (isLoadingRef.current) {
        return;
      }

      // Cancelar requisição anterior se existir
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Criar novo AbortController
      abortControllerRef.current = new AbortController();

      isLoadingRef.current = true;

      // Sempre mostrar loading para feedback visual
      setLoading(true);
      setError("");

      try {
        // Se for force=true, invalidar cache antes da requisição
        if (force) {
          ordensServicoService.invalidateOSCache(Number(params.id));
        }

        const response = await ordensServicoService.getById(
          Number(params.id),
          force
        );

        // Verificar se a requisição foi cancelada
        if (abortControllerRef.current?.signal.aborted) {
          return;
        }

        const osData = Array.isArray(response) ? response[0] : response;

        if (!osData) {
          setError("OS não encontrada");
          return;
        }

        setOs({
          ...osData,
          _lastUpdated: Date.now(),
        } as OSDetalhadaV2);

        // Limpar erro se houver
        setError("");
      } catch (error) {
        console.error("Erro ao carregar dados da OS:", error);
        setError("Falha ao carregar dados da OS. Tente novamente.");
      } finally {
        isLoadingRef.current = false;
        setLoading(false);
      }
    },
    [params?.id]
  );

  const handleActionSuccess = useCallback(() => {
    setRefreshCount((prev) => {
      const newCount = prev + 1;
      return newCount;
    });

    // Chamar fetchOS com force=true - apenas uma vez
    fetchOS(true);
  }, [fetchOS]);

  // Effect otimizado com cleanup
  useEffect(() => {
    let mounted = true;

    const loadInitialOS = async () => {
      if (mounted && params?.id) {
        await fetchOS(false);
      }
    };

    loadInitialOS();

    // Cleanup function
    return () => {
      mounted = false;
      isLoadingRef.current = false;

      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    };
  }, [fetchOS, params?.id]);

  // Cleanup no unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  if (loading) {
    return (
      <>
        <MobileHeader
          title="Detalhes da OS"
          onAddClick={() => router.push("/tecnico/dashboard")}
          leftVariant="back"
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
          onAddClick={() => router.push("/tecnico/dashboard")}
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
                onClick={() => router.back()}
                className="flex-1 px-4 py-3 bg-slate-100 text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-200 transition-colors"
              >
                Voltar
              </button>
              <button
                onClick={() => fetchOS(true)}
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
          onAddClick={() => router.push("/tecnico/dashboard")}
          leftVariant="back"
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

  const telefoneContato =
    typeof os.contato?.telefone === "string" ? os.contato.telefone.trim() : "";
  const telefoneHref = telefoneContato
    ? telefoneContato.replace(/[^+\d]/g, "")
    : "";
  const whatsappContato =
    typeof os.contato?.whatsapp === "string" ? os.contato.whatsapp.trim() : "";
  const whatsappSanitized = whatsappContato
    ? whatsappContato.replace(/\D/g, "")
    : "";
  const emailContato =
    typeof os.contato?.email === "string" ? os.contato.email.trim() : "";

  return (
    <main
      className="min-h-screen bg-slate-50 flex flex-col relative pb-8"
      key={`os-${os.id_os}-${refreshCount}`}
    >
      <MobileHeader
        title={os.id_os ? `OS #${os.id_os}` : "Detalhes da OS"}
        onAddClick={() => router.push("/tecnico/dashboard")}
        leftVariant="back"
      />

      {/* Status Header */}
      <div className="bg-white">
        {os.descricao_problema && (
          <div className="text-md text-slate-700 leading-relaxed bg-slate-100 p-3 rounded-lg break-words whitespace-pre-wrap max-h-[200px] overflow-y-auto custom-scrollbar">
            {os.abertura.motivo_atendimento}: {os.descricao_problema}
          </div>
        )}
      </div>

      {/* Content Sections */}
      <div className="px-4 pb-2 space-y-4 mt-2">
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <StatusBadge status={os.situacao_os?.codigo?.toString()} />

            {os.data_agendada && (
              <div className="flex items-center gap-1 text-sm text-gray-600">
                <Calendar className="w-3 h-3" />
                <span>Agendada:</span>
                {formatDate(os.data_agendada)}
              </div>
            )}
          </div>

          {os.liberacao_financeira?.liberada === false && (
            <div className="w-full bg-red-600 text-white text-sm font-medium text-center py-1.5 rounded-md">
              Aguardando Liberação Financeira
            </div>
          )}
        </div>
        {/* Cliente */}
        <Section title="Cliente" icon={<Building className="w-4 h-4" />}>
          <Field
            label="Nome Empresa"
            value={os.cliente?.nome}
            icon={<Briefcase className="w-3 h-3" />}
          />
          {enderecoFormatado && (
            <Field
              label="Endereço"
              value={
                <button
                  type="button"
                  onClick={showNavigationModal}
                  disabled={isLocationLoading}
                  className="group flex w-full items-center gap-2 rounded-lg text-left text-black transition-colors duration-200 hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:text-slate-400"
                  aria-busy={isLocationLoading}
                  title="Abrir navegação"
                >
                  <span className="flex-1 text-sm font-semibold leading-snug text-current">
                    {enderecoFormatado}
                  </span>
                 
                </button>
              }
              icon={<MapPin className="w-3 h-3" />}
            />
          )}

          <Field
            label="Região"
            value={os.cliente?.nome_regiao}
            icon={<MapPin className="w-3 h-3" />}
          />
          <Field
            label="Contato"
            value={os.contato?.nome}
            icon={<User className="w-3 h-3" />}
          />
          {telefoneContato && telefoneHref && (
            <Field
              label="Telefone"
              value={
                <a
                  href={`tel:${telefoneHref}`}
                  className="inline-flex w-full items-center justify-between gap-2 rounded-lg  text-sm font-semibold text-black transition-colors duration-200 hover:bg-green-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500"
                >
                  <span className="truncate">{telefoneContato}</span>
              
                </a>
              }
              icon={<Phone className="w-3 h-3" />}
            />
          )}

          {whatsappContato && whatsappSanitized && (
            <Field
              label="WhatsApp"
              value={
                <a
                  href={`https://wa.me/${whatsappSanitized}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex w-full items-center justify-between gap-2 rounded-lg text-sm font-semibold text-black transition-colors duration-200 hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                >
                  <span className="truncate">{whatsappContato}</span>
                
                </a>
              }
              icon={<MessageCircle className="w-3 h-3" />}
            />
          )}

          {emailContato && (
            <Field
              label="E-mail"
              value={
                <a
                  href={`mailto:${emailContato}`}
                  className="inline-flex w-full items-center justify-between gap-2 rounded-lg  text-sm font-semibold text-black transition-colors duration-200 hover:bg-purple-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500"
                >
                  <span className="truncate">{emailContato}</span>
                 
                </a>
              }
              icon={<Mail className="w-3 h-3" />}
            />
          )}
        </Section>
        {/* Equipamento */}
        <Section title="Máquina" icon={<Settings className="w-4 h-4" />}>
          <div className="flex items-center gap-1">
            <Field label="Modelo" value={os.maquina?.modelo} />

            <div
              className="w-4 h-4 flex items-center justify-center"
              title={os.em_garantia ? "Em garantia" : "Fora da garantia"}
            >
              {os.em_garantia ? (
                <CircleCheck className="w-4 h-4 text-emerald-500 relative top-[8px]" />
              ) : (
                <CircleX className="w-4 h-4 text-amber-500 relative top-[8px]" />
              )}
            </div>
          </div>

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
              label="Data abertura"
              value={os.abertura.data_abertura}
              icon={<User className="w-3 h-3" />}
            />
            <Field
              label="Forma de abertura"
              value={os.abertura.forma_abertura}
              icon={<MessageSquare className="w-3 h-3" />}
            />
            <Field
              label="Origem"
              icon={<MessageSquare className="w-3 h-3" />}
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
              icon={<MessageSquare className="w-3 h-3" />}
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
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="w-5 h-5 text-slate-600" />
              <h3 className="font-semibold text-slate-900 text-base">
                Fichas de Atendimento ({os.fats.length})
              </h3>
            </div>
            {os.fats.map((fat, index) => (
              <FATCard key={fat.id_fat} fat={fat} index={index} />
            ))}
          </div>
        )}
      </div>

      <FloatingActionMenu
        id_os={os.id_os}
        onActionSuccess={handleActionSuccess}
      />
    </main>
  );
}
