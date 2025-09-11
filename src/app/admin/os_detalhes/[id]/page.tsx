"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import PageHeader from "@/components/admin/ui/PageHeader";
import { ordensServicoService } from "@/api/services/ordensServicoService";
import { formatarData } from "@/utils/formatters";
import { LoadingSpinner } from "@/components/LoadingPersonalizado";
import { OSDetalhadaV2 } from "@/api/services/ordensServicoService";
import { motion } from "framer-motion";
import ParecerTecnico from "@/components/admin/os/ParecerTecnico";
import "./animations.css";

// Reusable animated card component for consistency
interface AnimatedCardProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  delay?: number;
  className?: string;
}

const AnimatedCard = React.memo<AnimatedCardProps>(
  ({ title, icon, children, delay = 0, className = "" }) => {
    return (
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay }}
        className={`bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden card-transition ${className}`}
      >
        <div className="bg-gradient-to-r from-gray-50 to-white px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-black flex items-center gap-2">
            <motion.div
              whileHover={{ scale: 1.1 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
              className="text-[var(--primary)]"
            >
              {icon}
            </motion.div>
            {title}
          </h2>
        </div>
        <div className="p-6">{children}</div>
      </motion.div>
    );
  }
);

AnimatedCard.displayName = "AnimatedCard";

// API Error interface definition
interface ApiError {
  erro?: string;
  error?: string;
  message?: string;
}

// TechnicianTypeBadge component for better reuse and animations
interface TechnicianBadgeProps {
  type: string;
}

const TechnicianTypeBadge = React.memo<TechnicianBadgeProps>(({ type }) => {
  let icon: React.ReactNode;
  let label: string;
  let colorClasses: string;

  switch (type) {
    case "interno":
      icon = <UserCheck className="w-4 h-4" />;
      label = "Interno";
      colorClasses = "bg-blue-50 text-blue-700 border border-blue-200";
      break;
    case "terceiro":
      icon = <User className="w-4 h-4" />;
      label = "Terceiro";
      colorClasses = "bg-amber-50 text-amber-700 border border-amber-200";
      break;
    default:
      icon = <Info className="w-4 h-4" />;
      label = type || "Não definido";
      colorClasses = "bg-gray-50 text-gray-700 border border-gray-200";
  }

  return (
    <motion.span
      whileHover={{ scale: 1.05 }}
      transition={{ type: "spring", stiffness: 400, damping: 10 }}
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${colorClasses}`}
    >
      <span className="mr-1.5">{icon}</span>
      {label}
    </motion.span>
  );
});

TechnicianTypeBadge.displayName = "TechnicianTypeBadge";

// StatusBadge component for inline use
interface StatusBadgeProps {
  status: string;
  mapping: Record<
    string,
    {
      label: string;
      className: string;
      icon: React.ReactNode;
    }
  >;
}

const StatusBadge = React.memo<StatusBadgeProps>(({ status, mapping }) => {
  const statusInfo =
    status && mapping[status]
      ? mapping[status]
      : {
          label: "Desconhecido",
          className: "bg-gray-100 text-gray-700 border border-gray-200",
          icon: <span></span>,
        };

  return (
    <motion.span
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2 }}
      className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium ${statusInfo.className} hover:shadow-sm transition-all duration-200`}
    >
      <span className="mr-2">{statusInfo.icon}</span>
      {statusInfo.label}
    </motion.span>
  );
});

StatusBadge.displayName = "StatusBadge";

import {
  ArrowLeft,
  Info,
  User,
  Laptop,
  ClipboardList,
  Wrench,
  CheckCircle,
  XCircle,
  ReceiptText,
  Phone,
  Mail,
  Building,
  MapPin,
  Tag,
  FileText,
  UserCheck,
  Calendar,
  Clock,
} from "lucide-react";

const OSDetalhesPage = () => {
  const router = useRouter();
  const params = useParams();
  const osId = params.id;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [osData, setOsData] = useState<OSDetalhadaV2 | null>(null);

  // Status mapping with improved icons - memoized to prevent recreation on each render
  const statusMapping = useMemo(
    () => ({
      "1": {
        label: "Pendente",
        className: "bg-gray-100 text-gray-700 border border-gray-200",
        icon: <Clock className="h-4 w-4" />,
      },
      "2": {
        label: "A atender",
        className: "bg-blue-100 text-blue-700 border border-blue-200",
        icon: <Calendar className="h-4 w-4" />,
      },
      "3": {
        label: "Em deslocamento",
        className: "bg-purple-100 text-purple-700 border border-purple-200",
        icon: <MapPin className="h-4 w-4" />,
      },
      "4": {
        label: "Em atendimento",
        className: "bg-orange-100 text-orange-700 border border-orange-200",
        icon: <Wrench className="h-4 w-4" />,
      },
      "5": {
        label: "Atendimento interrompido",
        className: "bg-amber-100 text-amber-700 border border-amber-200",
        icon: <XCircle className="h-4 w-4" />,
      },
      "6": {
        label: "Em Revisão",
        className: "bg-indigo-100 text-indigo-700 border border-indigo-200",
        icon: <ClipboardList className="h-4 w-4" />,
      },
      "7": {
        label: "Concluída",
        className: "bg-green-100 text-green-700 border border-green-200",
        icon: <CheckCircle className="h-4 w-4" />,
      },
      "8": {
        label: "Cancelada",
        className: "bg-red-100 text-red-700 border border-red-200",
        icon: <XCircle className="h-4 w-4" />,
      },
      "9": {
        label: "Cancelada pelo Cliente",
        className: "bg-rose-100 text-rose-700 border border-rose-200",
        icon: <XCircle className="h-4 w-4" />,
      },
    }),
    []
  );

  const apiCallMadeRef = React.useRef(false);

  useEffect(() => {
    async function fetchOSDetails() {
      if (!osId) return;

      if (apiCallMadeRef.current) return;
      apiCallMadeRef.current = true;

      try {
        setLoading(true);
        const response = await ordensServicoService.getById(Number(osId));

        if (!response || typeof response !== "object") {
          throw new Error("API returned an invalid response structure");
        }

        if ("erro" in response || "error" in response) {
          const apiErrorData = response as ApiError;
          const errorMessage =
            apiErrorData.erro ||
            apiErrorData.error ||
            apiErrorData.message ||
            "Unknown API error";
          throw new Error(errorMessage);
        }

        // Check if response is an array and extract the first item
        const data = Array.isArray(response) ? response[0] : response;

        if (!data) {
          throw new Error("Nenhum dado encontrado para esta ordem de serviço");
        }

        setOsData(data as OSDetalhadaV2);
      } catch (err) {
        if (err instanceof Error) {
          setError(`Erro: ${err.message}`);
        } else {
          setError(
            "Não foi possível carregar os detalhes da ordem de serviço."
          );
        }
        apiCallMadeRef.current = false;
      } finally {
        setLoading(false);
      }
    }

    fetchOSDetails();
  }, [osId]);

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.4, ease: "easeInOut" }}
        className="flex flex-col justify-center items-center h-[calc(100vh-5rem)] bg-gray-50/50 backdrop-blur-sm"
      >
        <motion.div
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="bg-white p-8 rounded-xl shadow-lg border border-gray-100"
        >
          <LoadingSpinner />
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="mt-4 text-black font-medium animate-pulse"
          >
            Carregando detalhes da ordem de serviço...
          </motion.p>
        </motion.div>
      </motion.div>
    );
  }

  if (error || !osData) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.4 }}
        className="flex justify-center items-center min-h-[60vh] p-4"
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-white rounded-xl shadow-md border border-gray-100 p-8 text-center max-w-lg w-full"
        >
          <motion.div
            initial={{ scale: 0.8, rotate: -5 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{
              delay: 0.1,
              type: "spring",
              stiffness: 150,
              damping: 15,
            }}
            className="w-20 h-20 mx-auto mb-6 bg-red-50 rounded-full flex items-center justify-center"
          >
            <Info className="h-10 w-10 text-red-500" />
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            className="text-2xl font-semibold text-gray-800 mb-3"
          >
            Erro ao carregar dados
          </motion.h2>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.4 }}
            className="text-gray-600 mb-8"
          >
            {error ||
              "Não foi possível encontrar a ordem de serviço solicitada."}
          </motion.p>

          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.3 }}
            whileHover={{ scale: 1.03, backgroundColor: "var(--primary-dark)" }}
            whileTap={{ scale: 0.98 }}
            onClick={() => router.back()}
            className="px-6 py-3 bg-[var(--primary)] text-white rounded-lg transition-all duration-300 inline-flex items-center gap-2 shadow-sm hover:shadow font-medium"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar para consulta
          </motion.button>
        </motion.div>
      </motion.div>
    );
  }

  // Os dados vêm diretamente da API através do osData

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <PageHeader
          title={`Ordem de Serviço #${osData?.id_os || osId}`}
          config={{
            type: "form",
            backLink: "/admin/os_consulta",
            backLabel: "Voltar para consulta",
          }}
        />
      </motion.div>

      {/* Status card - improved with subtle animations and better responsiveness */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6 hover:shadow-md transition-all duration-300 card-transition"
      >
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <motion.div
            className="flex flex-col"
            initial={{ opacity: 0, x: -5 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1, duration: 0.4 }}
          >
            <div className="text-sm font-medium text-gray-600">
              Status atual
            </div>
            <div className="flex items-center mt-2">
              <StatusBadge
                status={String(osData?.situacao_os?.codigo || "")}
                mapping={statusMapping}
              />
            </div>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.4 }}
          >
            <motion.div
              whileHover={{
                scale: 1.02,
                backgroundColor: "rgba(249, 250, 251, 0.8)",
              }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
              className="p-3 rounded-lg border border-gray-50"
            >
              <div className="text-xs font-medium text-gray-500">
                Data de Abertura
              </div>
              <div className="font-medium text-base mt-1 text-gray-800">
                {formatarData(osData?.abertura?.data_abertura) || "-"}
              </div>
            </motion.div>

            {osData.data_agendada && (
              <motion.div
                whileHover={{
                  scale: 1.02,
                  backgroundColor: "rgba(249, 250, 251, 0.8)",
                }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
                className="p-3 rounded-lg border border-gray-50"
              >
                <div className="text-xs font-medium text-gray-500">
                  Data Agendada
                </div>
                <div className="font-medium text-base mt-1 text-gray-800">
                  {formatarData(osData.data_agendada)}
                </div>
              </motion.div>
            )}

            {osData.data_fechamento && (
              <motion.div
                whileHover={{
                  scale: 1.02,
                  backgroundColor: "rgba(249, 250, 251, 0.8)",
                }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
                className="p-3 rounded-lg border border-gray-50"
              >
                <div className="text-xs font-medium text-gray-500">
                  Data de Fechamento
                </div>
                <div className="font-medium text-base mt-1 text-gray-800">
                  {formatarData(osData.data_fechamento)}
                </div>
              </motion.div>
            )}
          </motion.div>
        </div>
      </motion.div>

      {/* Main content grid - improved responsive grid with proper spacing */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-6">
        {/* Cliente info */}
        <AnimatedCard
          title="Dados do Cliente"
          icon={<Building className="h-5 w-5" />}
          delay={0.1}
        >
          <div className="stagger-children">
            <div className="space-y-4">
              <motion.div whileHover={{ x: 3 }} transition={{ duration: 0.2 }}>
                <div className="text-sm font-medium text-black">Nome</div>
                <div className="mt-1 font-medium">
                  {osData.cliente?.nome || "-"}
                </div>
              </motion.div>

              {(osData.cliente?.endereco || osData.cliente?.numero) && (
                <motion.div
                  whileHover={{ x: 3 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="text-sm font-medium text-black">Endereço</div>
                  <div className="mt-1">
                    {[
                      osData.cliente?.endereco,
                      osData.cliente?.numero && `Nº ${osData.cliente.numero}`,
                      osData.cliente?.complemento,
                    ]
                      .filter(Boolean)
                      .join(", ")}
                  </div>
                </motion.div>
              )}

              {osData.cliente?.bairro && (
                <motion.div
                  whileHover={{ x: 3 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="text-sm font-medium text-black">Bairro</div>
                  <div className="mt-1">{osData.cliente.bairro}</div>
                </motion.div>
              )}

              <motion.div whileHover={{ x: 3 }} transition={{ duration: 0.2 }}>
                <div className="text-sm font-medium text-black flex items-center">
                  <MapPin className="h-4 w-4 mr-1 text-black" />
                  Localização
                </div>
                <div className="mt-1">
                  {osData.cliente ? (
                    <>
                      {[osData.cliente?.cidade, osData.cliente?.uf]
                        .filter(Boolean)
                        .join("/")}
                      {osData.cliente?.cep && ` - CEP: ${osData.cliente.cep}`}
                    </>
                  ) : (
                    "-"
                  )}
                </div>
              </motion.div>

              {osData.contato && (
                <div className="border-t border-gray-100 pt-4 mt-6">
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                  >
                    <div className="text-sm font-medium text-black flex items-center">
                      <User className="h-4 w-4 mr-1 text-black" />
                      Contato
                    </div>
                    <div className="mt-1 font-medium">
                      {osData.contato.nome}
                    </div>

                    {osData.contato.telefone && (
                      <div className="mt-3">
                        <div className="text-sm font-medium text-black flex items-center">
                          <Phone className="h-4 w-4 mr-1 text-black" />
                          Telefone
                        </div>
                        <div className="mt-1">
                          <a
                            href={`tel:${osData.contato.telefone.replace(
                              /\D/g,
                              ""
                            )}`}
                            className="text-[var(--primary)] hover:text-[var(--primary-dark)] transition-colors"
                          >
                            {osData.contato.telefone}
                          </a>
                        </div>
                      </div>
                    )}

                    {osData.contato.whatsapp && (
                      <div className="mt-3">
                        <div className="text-sm font-medium text-black flex items-center">
                          <Phone className="h-4 w-4 mr-1 text-black" />
                          WhatsApp
                        </div>
                        <div className="mt-1">
                          <a
                            href={`https://wa.me/${osData.contato.whatsapp.replace(
                              /\D/g,
                              ""
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[var(--primary)] hover:text-[var(--primary-dark)] transition-colors"
                          >
                            {osData.contato.whatsapp}
                          </a>
                        </div>
                      </div>
                    )}

                    {osData.contato.email && (
                      <div className="mt-3">
                        <div className="text-sm font-medium text-black flex items-center">
                          <Mail className="h-4 w-4 mr-1 text-black" />
                          Email
                        </div>
                        <div className="mt-1">
                          <a
                            href={`mailto:${osData.contato.email}`}
                            className="text-[var(--primary)] hover:text-[var(--primary-dark)] transition-colors break-words"
                          >
                            {osData.contato.email}
                          </a>
                        </div>
                      </div>
                    )}
                  </motion.div>
                </div>
              )}
            </div>
          </div>
        </AnimatedCard>

        {/* Máquina info */}
        <AnimatedCard
          title="Dados da Máquina"
          icon={<Laptop className="h-5 w-5" />}
          delay={0.2}
        >
          <div className="space-y-4">
            <motion.div whileHover={{ x: 3 }} transition={{ duration: 0.2 }}>
              <div className="text-sm font-medium text-black">
                Número de Série
              </div>
              <div className="mt-1 font-medium  text-black">
                {osData.maquina?.numero_serie || "-"}
              </div>
            </motion.div>

            {osData.maquina?.modelo && (
              <motion.div whileHover={{ x: 3 }} transition={{ duration: 0.2 }}>
                <div className="text-sm font-medium text-black">Modelo</div>
                <div className="mt-1">{osData.maquina.modelo}</div>
              </motion.div>
            )}

            {osData.maquina?.descricao && (
              <motion.div whileHover={{ x: 3 }} transition={{ duration: 0.2 }}>
                <div className="text-sm font-medium text-black">Descrição</div>
                <div className="mt-1">{osData.maquina.descricao}</div>
              </motion.div>
            )}

            <motion.div whileHover={{ x: 2 }} transition={{ duration: 0.15 }}>
              <div className="text-sm font-medium text-black">Em Garantia</div>
              <div className="mt-1">
                {osData.em_garantia ? (
                  <motion.span
                    whileHover={{ scale: 1.05 }}
                    transition={{ type: "spring", stiffness: 400, damping: 8 }}
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200"
                  >
                    <CheckCircle className="w-3.5 h-3.5 mr-1" />
                    Sim
                  </motion.span>
                ) : (
                  <motion.span
                    whileHover={{ scale: 1.05 }}
                    transition={{ type: "spring", stiffness: 400, damping: 8 }}
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200"
                  >
                    <XCircle className="w-3.5 h-3.5 mr-1" />
                    Não
                  </motion.span>
                )}
              </div>
            </motion.div>
          </div>
        </AnimatedCard>

        {/* Técnico info */}
        <AnimatedCard
          title="Dados do Atendimento"
          icon={<Wrench className="h-5 w-5" />}
          delay={0.3}
        >
          <div className="space-y-4">
            {osData.tecnico && (
              <>
                <motion.div
                  whileHover={{ x: 3 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="text-sm font-medium text-black">
                    Técnico Responsável
                  </div>
                  <div className="mt-1 font-medium">{osData.tecnico.nome}</div>
                </motion.div>

                <motion.div
                  whileHover={{ x: 3 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="text-sm font-medium text-black">
                    Tipo de Técnico
                  </div>
                  <div className="mt-1">
                    <TechnicianTypeBadge type={osData.tecnico.tipo} />
                  </div>
                </motion.div>

                {osData.tecnico.observacoes && (
                  <motion.div
                    whileHover={{ x: 3 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="text-sm font-medium text-black">
                      Observações
                    </div>
                    <div className="mt-1 text-gray-600">
                      {osData.tecnico.observacoes}
                    </div>
                  </motion.div>
                )}
              </>
            )}

            <motion.div whileHover={{ x: 3 }} transition={{ duration: 0.2 }}>
              <div className="text-sm font-medium text-black flex items-center">
                <Tag className="h-4 w-4 mr-1 text-black" />
                Motivo do Atendimento
              </div>
              <div className="mt-1">
                <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded-md text-sm">
                  {osData.abertura?.motivo_atendimento || "-"}
                </span>
              </div>
            </motion.div>

            {osData.situacao_os?.motivo_pendencia && (
              <motion.div whileHover={{ x: 3 }} transition={{ duration: 0.2 }}>
                <div className="text-sm font-medium text-black">
                  Motivo da Pendência
                </div>
                <div className="mt-1">
                  <span className="px-2 py-1 bg-amber-50 text-amber-700 rounded-md text-sm">
                    {osData.situacao_os?.motivo_pendencia || "-"}
                  </span>
                </div>
              </motion.div>
            )}
          </div>
        </AnimatedCard>
      </div>

      {/* Dados da Abertura */}
      <motion.div
        initial={{ opacity: 0, x: -5 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3, delay: 0.25 }}
        className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-6 card-transition"
      >
        <div className="bg-gradient-to-r from-gray-50 to-white px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800 flex items-center gap-2">
            <FileText className="h-5 w-5 text-[var(--primary)]" />
            Dados da Abertura
          </h2>
        </div>

        <div className="p-6">
          <motion.div
            className="grid grid-cols-1 md:grid-cols-3 gap-6 stagger-children"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.05, staggerChildren: 0.05, duration: 0.2 }}
          >
            <motion.div
              className="p-3 rounded-lg hover:bg-gray-50 transition-colors duration-200"
              whileHover={{ scale: 1.02 }}
            >
              <div className="text-sm font-medium text-black">
                Forma de Abertura
              </div>
              <div className="mt-1 font-medium">
                {osData.abertura?.forma_abertura
                  ? osData.abertura.forma_abertura.charAt(0).toUpperCase() +
                    osData.abertura.forma_abertura.slice(1)
                  : "-"}
              </div>
            </motion.div>

            <motion.div
              className="p-3 rounded-lg hover:bg-gray-50 transition-colors duration-200"
              whileHover={{ scale: 1.02 }}
            >
              <div className="text-sm font-medium text-black">Origem</div>
              <div className="mt-1 font-medium">
                {osData.abertura?.origem_abertura === "I"
                  ? "Interna"
                  : osData.abertura?.origem_abertura === "E"
                  ? "Externa"
                  : osData.abertura?.origem_abertura || "-"}
              </div>
            </motion.div>

            <motion.div
              className="p-3 rounded-lg hover:bg-gray-50 transition-colors duration-200"
              whileHover={{ scale: 1.02 }}
            >
              <div className="text-sm font-medium text-black">
                Usuário de Abertura
              </div>
              <div className="mt-1 font-medium">
                {osData.abertura?.nome_usuario || "-"}
              </div>
            </motion.div>
          </motion.div>
        </div>
      </motion.div>

      {/* Descrição do problema */}
      {osData.descricao_problema && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-6 card-transition"
        >
          <div className="bg-gradient-to-r from-gray-50 to-white px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-black flex items-center gap-2">
              <FileText className="h-5 w-5 text-[var(--primary)]" />
              Descrição do Problema
            </h2>
          </div>

          <div className="p-6">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="prose max-w-none bg-gray-50 p-4 rounded-lg border border-gray-100"
            >
              {osData.descricao_problema}
            </motion.div>
          </div>
        </motion.div>
      )}

      {/* Liberação Financeira */}
      {osData.liberacao_financeira && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-6 card-transition"
        >
          <div className="bg-gradient-to-r from-gray-50 to-white px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-black flex items-center gap-2">
              <ReceiptText className="h-5 w-5 text-[var(--primary)]" />
              Liberação Financeira
            </h2>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 stagger-children">
              <motion.div
                className="p-3 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                whileHover={{ scale: 1.02 }}
              >
                <div className="text-sm font-medium text-black">Situação</div>
                <div className="mt-1">
                  {osData.liberacao_financeira.liberada ? (
                    <motion.span
                      whileHover={{ scale: 1.05 }}
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 shadow-sm"
                    >
                      <CheckCircle className="w-3.5 h-3.5 mr-1" />
                      Liberada
                    </motion.span>
                  ) : (
                    <motion.span
                      whileHover={{ scale: 1.05 }}
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 shadow-sm"
                    >
                      <XCircle className="w-3.5 h-3.5 mr-1" />
                      Não Liberada
                    </motion.span>
                  )}
                </div>
              </motion.div>

              {osData.liberacao_financeira.liberada && (
                <>
                  <motion.div
                    className="p-3 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                    whileHover={{ scale: 1.02 }}
                  >
                    <div className="text-sm font-medium text-black">
                      Liberado por
                    </div>
                    <div className="mt-1 font-medium">
                      {osData.liberacao_financeira.nome_usuario_liberacao ||
                        "-"}
                    </div>
                  </motion.div>

                  <motion.div
                    className="p-3 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                    whileHover={{ scale: 1.02 }}
                  >
                    <div className="text-sm font-medium text-black">
                      Data da Liberação
                    </div>
                    <div className="mt-1 font-medium">
                      {formatarData(
                        osData.liberacao_financeira.data_liberacao
                      ) || "-"}
                    </div>
                  </motion.div>
                </>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* FATs (Faturamento) */}
      {osData.fats && osData.fats.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.7 }}
          className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-6 card-transition"
        >
          <div className="bg-gradient-to-r from-gray-50 to-white px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-black flex items-center gap-2">
              <ReceiptText className="h-5 w-5 text-[var(--primary)]" />
              Faturamento
            </h2>
          </div>

          <div className="overflow-x-auto rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider"
                  >
                    Período
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider"
                  >
                    Técnico
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider"
                  >
                    Observações
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider"
                  >
                    Peças Utilizadas
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200 text-gray-700">
                {osData.fats.map((fat, index) => (
                  <motion.tr
                    key={fat.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.3,
                      delay: 0.1 + index * 0.05,
                    }}
                    whileHover={{
                      backgroundColor: "rgba(249, 250, 251, 0.9)",
                      transition: { duration: 0.1 },
                    }}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {formatarData(fat.data)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {fat.tecnico?.nome || "Técnico não identificado"}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {fat.observacoes || "-"}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {fat.pecas && fat.pecas.length > 0 ? (
                        <ul className="list-disc list-inside space-y-1">
                          {fat.pecas.map((peca) => (
                            <motion.li
                              key={peca.id}
                              whileHover={{ x: 2 }}
                              transition={{ duration: 0.2 }}
                            >
                              <span className="font-medium">
                                {peca.nome || "Peça não identificada"}
                              </span>{" "}
                              -{" "}
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                                {peca.quantidade} unid.
                              </span>
                            </motion.li>
                          ))}
                        </ul>
                      ) : (
                        <span className="text-gray-400 italic">
                          Nenhuma peça utilizada
                        </span>
                      )}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* Peças Corrigidas */}
      {osData.pecas_corrigidas && osData.pecas_corrigidas.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.75 }}
          className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-6 card-transition"
        >
          <div className="bg-gradient-to-r from-gray-50 to-white px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-black flex items-center gap-2">
              <motion.div
                whileHover={{ rotate: 15 }}
                transition={{ duration: 0.2 }}
              >
                <Wrench className="h-5 w-5 text-[var(--primary)]" />
              </motion.div>
              Peças Corrigidas
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    ID
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Nome
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Quantidade
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {osData.pecas_corrigidas.map((peca, index) => (
                  <motion.tr
                    key={peca.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.3,
                      delay: 0.1 + index * 0.05,
                    }}
                    whileHover={{
                      backgroundColor: "rgba(249, 250, 251, 0.9)",
                      transition: { duration: 0.1 },
                    }}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {peca.id}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <motion.span
                        whileHover={{ x: 2 }}
                        transition={{ duration: 0.2 }}
                      >
                        {peca.nome || "Peça não identificada"}
                      </motion.span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <motion.span
                        whileHover={{ scale: 1.05 }}
                        className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100"
                      >
                        {peca.quantidade} unid.
                      </motion.span>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* Deslocamentos Corrigidos */}
      {osData.deslocamentos_corrigidos &&
        osData.deslocamentos_corrigidos.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.8 }}
            className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-6 card-transition"
          >
            <div className="bg-gradient-to-r from-gray-50 to-white px-6 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-800 flex items-center gap-2">
                <motion.div
                  whileHover={{ scale: 1.15 }}
                  transition={{ duration: 0.2 }}
                >
                  <MapPin className="h-5 w-5 text-[var(--primary)]" />
                </motion.div>
                Deslocamentos Corrigidos
              </h2>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      ID
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Data
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Valor
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Observações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {osData.deslocamentos_corrigidos.map(
                    (deslocamento, index) => (
                      <motion.tr
                        key={deslocamento.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                          duration: 0.3,
                          delay: 0.1 + index * 0.05,
                        }}
                        whileHover={{
                          backgroundColor: "rgba(249, 250, 251, 0.9)",
                          transition: { duration: 0.1 },
                        }}
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {deslocamento.id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <motion.span
                            whileHover={{ fontWeight: 500 }}
                            transition={{ duration: 0.2 }}
                          >
                            {formatarData(deslocamento.data)}
                          </motion.span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <motion.span
                            whileHover={{ scale: 1.05 }}
                            className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-100"
                          >
                            R$ {deslocamento.valor.toFixed(2).replace(".", ",")}
                          </motion.span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          <motion.span
                            whileHover={{ x: 2 }}
                            transition={{ duration: 0.2 }}
                          >
                            {deslocamento.observacoes || "-"}
                          </motion.span>
                        </td>
                      </motion.tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

      {/* Revisão */}
      {osData.revisao_os && osData.revisao_os.id_usuario > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.85 }}
          className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-6 card-transition"
        >
          <div className="bg-gradient-to-r from-gray-50 to-white px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-black flex items-center gap-2">
              <motion.div
                whileHover={{ rotate: 10 }}
                transition={{ duration: 0.2 }}
              >
                <ClipboardList className="h-5 w-5 text-[var(--primary)]" />
              </motion.div>
              Informações de Revisão
            </h2>
          </div>

          <motion.div
            className="p-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.9 }}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <motion.div
                className="p-3 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                whileHover={{
                  scale: 1.02,
                  backgroundColor: "rgba(249, 250, 251, 0.9)",
                }}
              >
                <div className="text-sm font-medium text-black">
                  Data da Revisão
                </div>
                <div className="mt-1 font-medium">
                  {formatarData(osData.revisao_os.data) || "-"}
                </div>
              </motion.div>

              <motion.div
                className="p-3 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                whileHover={{
                  scale: 1.02,
                  backgroundColor: "rgba(249, 250, 251, 0.9)",
                }}
              >
                <div className="text-sm font-medium text-black">Revisor</div>
                <div className="mt-1 font-medium">
                  {osData.revisao_os.nome || "Usuário não identificado"}
                </div>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Parecer Técnico */}
      {osData.revisao_os?.observacoes && (
        <ParecerTecnico parecer={osData.revisao_os.observacoes} delay={0.9} />
      )}
    </>
  );
};

export default OSDetalhesPage;
