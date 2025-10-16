"use client";
import React, { useEffect, useState, useCallback, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import MobileHeader from "@/components/tecnico/MobileHeader";
import ActionButtonsFat from "@/components/tecnico/ActionButtonsFat";
import {
  User,
  Settings,
  Calendar,
  AlertTriangle,
  FileSearch,
  MessageSquare,
  Package,
  Car,
  ChevronRight,
  FileText,
  Wrench,
  Camera,
  CheckSquare,
  Eye,
  Timer,
  History,
} from "lucide-react";
import { fatService, type FATDetalhada } from "@/api/services/fatService";
import { Loading } from "@/components/LoadingPersonalizado";
import Toast from "@/components/tecnico/Toast";
import StatusBadge from "@/components/tecnico/StatusBadge";

// Botão de ação para FAT
type ActionButtonFatProps = {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  color: string;
};
function ActionButtonFat({
  label,
  icon,
  onClick,
  color,
}: ActionButtonFatProps) {
  return (
    <button
      onClick={onClick}
      className={`
        group relative flex flex-col items-center gap-1.5 p-2 
        rounded-xl border transition-all duration-200 ease-out
        w-28 flex-shrink-0 bg-white hover:bg-gray-50
        ${color}
        hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 border-gray-200 hover:border-gray-300
      `}
      type="button"
    >
      <div className="flex items-center justify-center w-6 h-6">{icon}</div>
      <span className="text-xs font-medium text-gray-700 text-center">
        {label}
      </span>
    </button>
  );
}

// Componente Section reutilizável
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

// Componente Field reutilizável
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
          <div className="text-sm text-slate-900 break-words leading-relaxed">
            {value}
          </div>
        </div>
      </div>
    );
  }
);

Field.displayName = "Field";

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

  const formatDate = useCallback((dateStr: string | null | undefined) => {
    if (!dateStr?.trim()) return null;
    return dateStr;
  }, []);

  const formatTime = useCallback((minutes: number | null | undefined) => {
    if (!minutes) return null;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}min`;
  }, []);

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
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

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
      // TODO: implementar API call para cancelar atendimento
      // Exemplo: const response = await fatService.cancelarAtendimento(fat?.id_fat);

      try {
        await new Promise((resolve) => setTimeout(resolve, 1000));

        const responseMessage = "Atendimento cancelado com sucesso!";

        // Mostrar mensagem de sucesso
        showToast(responseMessage, "success");

        setTimeout(() => {
          router.push("/tecnico/os");
        }, 1500);
      } catch (error) {
        console.error("Erro ao cancelar atendimento:", error);

        // Capturar mensagem de erro da API
        const errorMessage = extractErrorMessage(error);

        showToast(errorMessage, "error");
      }
    } finally {
      setLoading(false);
    }
  }, [router, extractErrorMessage, showToast]);

  const handleConcluirAtendimento = useCallback(async () => {
    try {
      setLoading(true);
      // TODO: implementar API call para concluir atendimento
      // Exemplo: const response = await fatService.concluirAtendimento(fat?.id_fat);

      try {
        await new Promise((resolve) => setTimeout(resolve, 1000));

        const responseMessage = "Atendimento concluído com sucesso!";

        // Mostrar mensagem de sucesso
        showToast(responseMessage, "success");

        setTimeout(() => {
          router.push("/tecnico/os");
        }, 1500);
      } catch (error) {
        console.error("Erro ao concluir atendimento:", error);

        // Capturar mensagem de erro da API
        const errorMessage = extractErrorMessage(error);

        showToast(errorMessage, "error");
      }
    } finally {
      setLoading(false);
    }
  }, [router, extractErrorMessage, showToast]);

  const initialLoading = loading && !fat;

  if (initialLoading) {
    return (
      <>
        <MobileHeader
          title="Detalhes da FAT"
          onAddClick={() => router.back()}
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
          onAddClick={() => router.back()}
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
          onAddClick={() => router.back()}
          leftVariant="back"
        />
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
          <div className="text-center">
            <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-slate-400" />
            <h2 className="font-semibold text-slate-900 mb-4 text-lg">
              FAT não encontrada
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
    <main className="min-h-screen bg-slate-50 pb-25">
      <MobileHeader
        title={fat.id_fat ? `FAT #${fat.id_fat}` : "Detalhes da FAT"}
        onAddClick={() => router.back()}
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
          <StatusBadge status={String(fat.situacao.codigo)} />

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

        {fat.pecas && fat.pecas.length > 0 && (
          <Section
            title={`Peças Utilizadas (${fat.pecas.length})`}
            icon={<Package className="w-4 h-4" />}
            collapsible={true}
            defaultExpanded={false}
          >
            <div className="space-y-2">
              {fat.pecas.map((peca, index) => (
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
          </Section>
        )}

        {/* Deslocamentos */}
        {fat.deslocamentos && fat.deslocamentos.length > 0 && (
          <Section
            title={`Deslocamentos (${fat.deslocamentos.length})`}
            icon={<Car className="w-4 h-4" />}
            collapsible={true}
            defaultExpanded={false}
          >
            <div className="space-y-2">
              {fat.deslocamentos.map((desloc, index) => (
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
                        Observações:
                      </p>
                      <p className="text-xs text-slate-700">
                        {desloc.observacoes}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Fotos */}
        {fat.fotos && fat.fotos.length > 0 && (
          <Section
            title={`Fotos (${fat.fotos.length})`}
            icon={<Camera className="w-4 h-4" />}
            collapsible={true}
            defaultExpanded={false}
          >
            <div className="space-y-2">
              {fat.fotos.map((foto, index) => (
                <div
                  key={foto.id_fat_foto || index}
                  className="p-3 bg-slate-50 rounded-lg"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Camera className="w-4 h-4 text-slate-400" />
                    <span className="text-sm text-slate-900 font-medium">
                      {foto.nome_arquivo}
                    </span>
                  </div>

                  {foto.tipo && (
                    <p className="text-xs text-slate-600 mb-1">
                      Tipo: {foto.tipo}
                    </p>
                  )}

                  {foto.descricao && (
                    <p className="text-xs text-slate-600 mb-1">
                      {foto.descricao}
                    </p>
                  )}

                  <p className="text-xs text-slate-500">
                    Data: {formatDate(foto.data_cadastro) || foto.data_cadastro}
                  </p>
                </div>
              ))}
            </div>
          </Section>
        )}

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
                  <div className="flex items-center justify-between mb-1">
                    <StatusBadge
                      status={String(ocorrencia.nova_situacao.codigo)}
                    />
                    <span className="text-xs text-slate-500">
                      {formatDate(ocorrencia.data_ocorrencia) ||
                        ocorrencia.data_ocorrencia}
                    </span>
                  </div>
                  <p className="text-sm text-slate-700 mb-1">
                    {ocorrencia.descricao_ocorrencia}
                  </p>
                  <p className="text-xs text-slate-500">
                    Por: {ocorrencia.usuario.nome}
                  </p>
                </div>
              ))}
            </div>
          </Section>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 shadow-lg z-50">
        <div className="px-3 py-2">
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            <ActionButtonFat
              label="Deslocamento"
              icon={<Car className="w-5 h-5 text-emerald-600" />}
              onClick={() => {
                if (params?.id) {
                  router.push(`/tecnico/os/fat/${params.id}/deslocamento`);
                }
              }}
              color="hover:border-emerald-300"
            />
            <ActionButtonFat
              label="Atendimento"
              icon={<Wrench className="w-5 h-5 text-blue-600" />}
              onClick={() => {
                if (params?.id) {
                  router.push(`/tecnico/os/fat/${params.id}/atendimento`);
                }
              }}
              color="hover:border-blue-300"
            />
            <ActionButtonFat
              label="Peças"
              icon={<Package className="w-5 h-5 text-green-600" />}
              onClick={() => {
                if (params?.id) {
                  router.push(`/tecnico/os/fat/${params.id}/pecas`);
                }
              }}
              color="hover:border-green-300"
            />
            <ActionButtonFat
              label="Fotos"
              icon={<Camera className="w-5 h-5 text-purple-600" />}
              onClick={() => {}}
              color="hover:border-purple-300"
            />
          </div>
        </div>
      </div>

      <div className="px-2">
        <ActionButtonsFat
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
      </div>
    </main>
  );
}
