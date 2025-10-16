"use client";

import React, {
  useEffect,
  useState,
  useMemo,
  useCallback,
  useRef,
} from "react";
import { useParams, useRouter } from "next/navigation";
import { LocationButtonIcon } from "@/components/admin/ui/LocationButton";
import {
  ordensServicoService,
  OSDetalhadaV2,
} from "@/api/services/ordensServicoService";
import PageHeader from "@/components/admin/ui/PageHeader";
import { StatusBadge } from "@/components/admin/common";
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

const OSDetalhesPage: React.FC = () => {
  const params = useParams();
  const router = useRouter();

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

  // Fetch data effect
  useEffect(() => {
    if (numericOsId === null) {
      setError("Identificador da Ordem de Servi��o inv��lido.");
      setLoading(false);
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
          throw new Error("Estrutura de dados da OS inv��lida.");
        }
      } catch (err) {
        if (!isActive) {
          return;
        }

        console.error("Erro ao carregar detalhes da OS:", err);
        setError(
          err instanceof Error && err.message
            ? err.message
            : "N��o foi poss��vel carregar os detalhes da Ordem de Servi��o."
        );
      } finally {
        if (isActive && shouldBlockScreen) {
          setLoading(false);
        }
      }
    };

    fetchOSData();

    return () => {
      isActive = false;
    };
  }, [numericOsId]);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollToTop(window.scrollY > 300);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Valores memoizados para otimização
  const clienteData = useMemo(() => osData?.cliente, [osData]);
  const contatoData = useMemo(() => osData?.contato, [osData]);
  const maquinaData = useMemo(() => osData?.maquina, [osData]);
  const fatsData = useMemo(() => osData?.fats || [], [osData]);

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
                  <div className="flex items-center gap-2">
                    {contatoData?.email && (
                      <a
                        href={`mailto:${contatoData.email}`}
                        data-tooltip="Enviar E-mail"
                        className="action-button tooltip text-blue-600 hover:bg-blue-50 bg-blue-50/30"
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
                        data-tooltip="Abrir WhatsApp"
                        className="action-button tooltip text-green-600 hover:bg-green-50 bg-green-50/30"
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
                        data-tooltip="Ver no Google Maps"
                        className="action-button tooltip text-orange-600 hover:bg-orange-50 bg-orange-50/30"
                      >
                        <MapPinned className="h-5 w-5" />
                      </a>
                    )}

                    {clienteData && (
                      <div className="tooltip" data-tooltip="Traçar Rota">
                        <LocationButtonIcon
                          cliente={{
                            id: clienteData.id,
                            nome_fantasia: clienteData.nome || "",
                            razao_social: clienteData.nome || "",
                            cnpj: clienteData.cnpj_cpf || "",
                            endereco: clienteData.endereco || "",
                            numero: clienteData.numero || "",
                            bairro: clienteData.bairro || "",
                            cidade: clienteData.cidade || "",
                            uf: clienteData.uf || "",
                            cep: clienteData.cep || "",
                            complemento: clienteData.complemento,
                            latitude: parseFloat(clienteData.latitude) || 0,
                            longitude: parseFloat(clienteData.longitude) || 0,
                            situacao: "A",
                          }}
                          enderecoEmpresa={`${clienteData.endereco || ""}${
                            clienteData.numero ? ", " + clienteData.numero : ""
                          }, ${clienteData.bairro || ""}, ${
                            clienteData.cidade || ""
                          }, ${clienteData.uf || ""}`}
                          className="action-button text-purple-600 hover:bg-purple-50 bg-purple-50/30"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {clienteData?.nome && (
                    <div>
                      <p className="text-sm font-medium text-gray-500">Nome</p>
                      <p className="text-gray-800">
                        <span className="font-bold">{clienteData.nome}</span> (
                        {clienteData.id})
                      </p>
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
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                            osData.em_garantia
                              ? "bg-green-100 text-green-700"
                              : "bg-orange-100 text-orange-700"
                          }`}
                        >
                          {osData.em_garantia ? (
                            <>
                              <CheckCircle className="h-3.5 w-3.5" />
                              Garantia
                            </>
                          ) : (
                            <>
                              <XCircle className="h-3.5 w-3.5" />
                              Sem Garantia
                            </>
                          )}
                        </span>
                      </div>
                    </div>
                  )}

                  {maquinaData?.descricao && (
                    <div>
                      <p className="text-sm font-medium text-gray-500">
                        Descrição
                      </p>
                      <p className="text-gray-800">{maquinaData.descricao}</p>
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
                          <p className="text-xs text-gray-600 mt-2 p-2 bg-gray-50 rounded-md">
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
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Técnico
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {fatsData.map((fat, index) => (
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
                              <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium transition-all duration-200 ${
                                  fat.aprovado
                                    ? "bg-green-100 text-green-800 hover:bg-green-200"
                                    : "bg-amber-100 text-amber-800 hover:bg-amber-200"
                                }`}
                              >
                                {fat.aprovado ? (
                                  <CheckCircle className="mr-1 h-3 w-3" />
                                ) : (
                                  <Clock className="mr-1 h-3 w-3" />
                                )}
                                {fat.aprovado ? "Aprovado" : "Pendente"}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
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

export default OSDetalhesPage;
