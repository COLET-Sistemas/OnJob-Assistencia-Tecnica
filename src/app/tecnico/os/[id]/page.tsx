"use client";
import React, { useEffect, useState, useCallback, useRef } from "react";
import ActionButtons from "@/components/tecnico/ActionButtons";
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
  AlertTriangle,
  CircleCheck,
  FileSearch,
  MessageSquare,
  Package,
  ChevronRight,
  Navigation,
  FileText,
} from "lucide-react";
import {
  ordensServicoService,
  type OSDetalhadaV2,
} from "@/api/services/ordensServicoService";
import FATCard from "@/components/tecnico/FATCard";
import { Loading } from "@/components/LoadingPersonalizado";
// import OSActionModal from "@/components/tecnico/OSActionModal";
import QuickActions from "@/components/tecnico/QuickActions";

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

export default function OSDetalheMobile() {
  const router = useRouter();
  const params = useParams();
  const [os, setOs] = useState<OSDetalhadaV2 | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshCount, setRefreshCount] = useState(0); // Para forçar re-renders
  // const [showActions, setShowActions] = useState(false);

  // Ref para controlar se já está carregando e evitar chamadas duplas
  const isLoadingRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const formatDate = useCallback((dateStr: string | null) => {
    if (!dateStr?.trim()) return null;
    return dateStr;
  }, []);

  const fetchOS = useCallback(
    async (force = false) => {
      if (!params?.id) {
        setError("ID da OS não fornecido");
        setLoading(false);
        return;
      }

      // Evitar múltiplas chamadas simultâneas
      if (isLoadingRef.current) {
        console.log(
          `⏸️ Já está carregando OS ${params.id}, pulando chamada duplicada (force: ${force})`
        );
        return;
      }

      // Cancelar requisição anterior se existir
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Criar novo AbortController
      abortControllerRef.current = new AbortController();

      isLoadingRef.current = true;
      console.log(`📞 Iniciando fetchOS - Force: ${force} - ID: ${params.id}`);

      // Sempre mostrar loading para feedback visual
      setLoading(true);
      setError("");

      try {
        console.log(
          `🔄 Chamando ordensServicoService.getById(${params.id}, forceRefresh: ${force})`
        );

        // Se for force=true, invalidar cache antes da requisição
        if (force) {
          console.log("🧹 Invalidando cache da OS antes da requisição");
          ordensServicoService.invalidateOSCache(Number(params.id));
        }

        const response = await ordensServicoService.getById(
          Number(params.id),
          force
        );

        // Verificar se a requisição foi cancelada
        if (abortControllerRef.current?.signal.aborted) {
          console.log("Requisição cancelada");
          return;
        }

        const osData = Array.isArray(response) ? response[0] : response;

        if (!osData) {
          setError("OS não encontrada");
          console.log("❌ OS não encontrada na resposta");
          return;
        }

        console.log("✅ OS carregada com sucesso:", {
          id: osData.id_os,
          status: osData.situacao_os?.codigo,
          statusDescricao: osData.situacao_os?.descricao,
          timestamp: new Date().toLocaleTimeString(),
          force: force,
        });

        // Força a re-renderização criando um novo objeto com timestamp único
        setOs({
          ...osData,
          _lastUpdated: Date.now(), // Campo interno para forçar re-render
        } as OSDetalhadaV2);

        // Limpar erro se houver
        setError("");
      } catch (error) {
        console.error("❌ Erro ao carregar dados da OS:", error);
        setError("Falha ao carregar dados da OS. Tente novamente.");
      } finally {
        isLoadingRef.current = false;
        setLoading(false);
        console.log(`✅ fetchOS finalizado - Force: ${force}`);
      }
    },
    [params?.id]
  );

  // Callback otimizado para quando uma ação for executada com sucesso
  const handleActionSuccess = useCallback(() => {
    console.log("🚀 Action success! Reloading OS data...");
    console.log("📍 Current OS ID:", params?.id);
    console.log("🔄 Forçando reload dos dados da OS...");

    // Incrementar contador para forçar re-render
    setRefreshCount((prev) => {
      const newCount = prev + 1;
      console.log(`📊 Refresh count atualizado para: ${newCount}`);
      return newCount;
    });

    // Chamar fetchOS com force=true - apenas uma vez
    fetchOS(true);
  }, [fetchOS, params?.id]);

  // Effect otimizado com cleanup
  useEffect(() => {
    let mounted = true;

    const loadInitialOS = async () => {
      if (mounted && params?.id) {
        console.log("🎬 Carregamento inicial da OS");
        await fetchOS(false); // Carregamento inicial não forçado
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

  return (
    <main
      className="min-h-screen bg-slate-50 pb-20"
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

        {/* Cliente */}
        <Section title="Cliente" icon={<Building className="w-4 h-4" />}>
          <Field
            label="Nome Empresa"
            value={os.cliente?.nome}
            icon={<Briefcase className="w-3 h-3" />}
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

      {/* ActionButtons (Deslocamento e Novo Atendimento) - Não fixos */}
      <div className="p-4">
        <ActionButtons id_os={os.id_os} onActionSuccess={handleActionSuccess} />
      </div>

      {/* Quick Actions - Fixo na parte inferior */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 shadow-lg z-50 p-4 safe-area-bottom">
        <QuickActions os={os} />
      </div>
    </main>
  );
}
