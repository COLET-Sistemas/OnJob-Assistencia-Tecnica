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
  Truck,
  Timer,
  History,
} from "lucide-react";
import { fatService, type FATDetalhada } from "@/api/services/fatService";
import { Loading } from "@/components/LoadingPersonalizado";

import StatusBadge from "@/components/tecnico/StatusBadge";

// Botão de ação para FAT, inspirado no QuickActions
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
        group relative flex flex-col items-center gap-2 p-4 
        rounded-xl border transition-all duration-200 ease-out
        min-w-[80px] bg-white hover:bg-gray-50
        ${color}
        hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 border-gray-200 hover:border-gray-300
      `}
      type="button"
    >
      <div className="flex items-center justify-center w-8 h-8">{icon}</div>
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

  // Ref para controlar se já está carregando
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

  // Função para buscar dados da FAT
  const fetchFAT = useCallback(
    async (force = false) => {
      if (!params?.id) {
        setError("ID da FAT não fornecido");
        setLoading(false);
        return;
      }

      if (isLoadingRef.current && !force) {
        console.log("Já está carregando, pulando chamada duplicada");
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
        console.log(`Carregando FAT ID: ${params.id}`);
        const response = await fatService.getById(Number(params.id), force);

        if (abortControllerRef.current?.signal.aborted) {
          console.log("Requisição cancelada");
          return;
        }

        if (!response) {
          setError("FAT não encontrada");
          return;
        }

        console.log("FAT carregada com sucesso:", response.id_fat);
        setFat(response);
      } catch (error: unknown) {
        if (abortControllerRef.current?.signal.aborted) {
          console.log("Requisição cancelada");
          return;
        }

        console.error("Erro ao carregar FAT:", error);

        let errorMessage = "Erro ao carregar detalhes da FAT";

        if (error && typeof error === "object") {
          if (
            "response" in error &&
            error.response &&
            typeof error.response === "object"
          ) {
            if (
              "data" in error.response &&
              error.response.data &&
              typeof error.response.data === "object"
            ) {
              if (
                "message" in error.response.data &&
                typeof error.response.data.message === "string"
              ) {
                errorMessage = error.response.data.message;
              }
            }
          } else if ("message" in error && typeof error.message === "string") {
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

  // Handlers para os botões de ação
  const handleIniciarAtendimento = useCallback(() => {
    console.log("Iniciar atendimento");
    // TODO: implementar ação
  }, []);

  const handlePausarAtendimento = useCallback(() => {
    console.log("Pausar atendimento");
    // TODO: implementar ação
  }, []);

  const handleRetomarAtendimento = useCallback(() => {
    console.log("Retomar atendimento");
    // TODO: implementar ação
  }, []);

  const handleInterromperAtendimento = useCallback(() => {
    console.log("Interromper atendimento");
    // TODO: implementar ação
  }, []);

  const handleCancelarAtendimento = useCallback(() => {
    console.log("Cancelar atendimento");
    // TODO: implementar ação
  }, []);

  const handleConcluirAtendimento = useCallback(() => {
    console.log("Concluir atendimento");
    // TODO: implementar ação
  }, []);

  if (loading) {
    return (
      <>
        <MobileHeader
          title="Detalhes da FAT"
          onMenuClick={() => router.back()}
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
          onMenuClick={() => router.back()}
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
    <main className="min-h-screen bg-slate-50">
      <MobileHeader
        title={fat.id_fat ? `FAT #${fat.id_fat}` : "Detalhes da FAT"}
        onMenuClick={() => router.back()}
      />

      {/* Header com informações principais */}
      <div className="bg-white border-b border-slate-100">
        {/* Problema descrição */}
        {fat.descricao_problema && (
          <div className="p-4">
            <p className="text-md text-slate-700 leading-relaxed bg-slate-100 p-3 rounded-lg">
              <span className="font-medium">
                {fat.motivo_atendimento.descricao}:
              </span>{" "}
              {fat.descricao_problema}
            </p>
            {/* Botões de ação abaixo da descrição */}
            <div className="flex gap-3 mt-4 overflow-x-auto pb-2 scrollbar-hide">
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
                label="Fotos"
                icon={<Camera className="w-5 h-5 text-purple-600" />}
                onClick={() => {}}
                color="hover:border-purple-300"
              />
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
        {/* Informações Gerais */}
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

        {/* Máquina */}
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

        {/* Peças Utilizadas */}
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
            icon={<Truck className="w-4 h-4" />}
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

        {/* Ocorrências/Histórico */}
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

      {/* Botões de ação no final da página */}
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
    </main>
  );
}
