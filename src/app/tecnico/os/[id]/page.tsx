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
  CircleCheck,
  CircleX,
  Wrench,
  Bell,
  Car,
  PauseCircle,
  FileSearch,
  XCircle,
  UserX,
  Shield,
  MessageSquare,
  DollarSign,
  History,
  Package,
  ChevronRight,
  ExternalLink,
} from "lucide-react";
import {
  ordensServicoService,
  type OSDetalhadaV2,
} from "@/api/services/ordensServicoService";
import { Loading } from "@/components/LoadingPersonalizado";

const StatusBadge = React.memo(({ status }: { status: string }) => {
  const statusMapping: Record<
    string,
    { label: string; className: string; icon: React.ReactNode }
  > = useMemo(
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

  const getStatusInfo = () => {
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
  };

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

    return (
      <div className="bg-white rounded-lg border border-slate-200">
        <div
          className={`flex items-center justify-between p-4 ${
            collapsible ? "cursor-pointer" : ""
          }`}
          onClick={() => collapsible && setExpanded(!expanded)}
        >
          <div className="flex items-center gap-2">
            <div className="text-slate-600">{icon}</div>
            <h3 className="font-medium text-slate-900 text-sm">{title}</h3>
          </div>
          {collapsible && (
            <ChevronRight
              className={`w-4 h-4 text-slate-400 transition-transform ${
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
    action,
  }: {
    label: string;
    value: string | React.ReactNode;
    icon?: React.ReactNode;
    action?: () => void;
  }) => {
    if (!value || value === "Não informado") return null;

    return (
      <div
        className={`flex items-start justify-between gap-3 ${
          action
            ? "cursor-pointer hover:bg-slate-50 -mx-2 px-2 py-1 rounded"
            : ""
        }`}
        onClick={action}
      >
        <div className="flex items-start gap-2 min-w-0 flex-1">
          {icon && (
            <div className="text-slate-400 mt-0.5 flex-shrink-0">{icon}</div>
          )}
          <div className="min-w-0">
            <p className="text-xs text-slate-500 mb-0.5">{label}</p>
            <div className="text-sm text-slate-900 break-words">{value}</div>
          </div>
        </div>
        {action && (
          <ExternalLink className="w-3 h-3 text-slate-400 flex-shrink-0 mt-1" />
        )}
      </div>
    );
  }
);
Field.displayName = "Field";

const QuickActions = React.memo(({ os }: { os: OSDetalhadaV2 }) => {
  const actions = [];

  if (os.cliente?.endereco) {
    const enderecoCompleto = `${os.cliente.endereco}${
      os.cliente.numero ? `, ${os.cliente.numero}` : ""
    } - ${os.cliente.bairro}, ${os.cliente.cidade}/${os.cliente.uf}`;
    actions.push({
      icon: <MapPin className="w-4 h-4" />,
      label: "Ver no mapa",
      action: () =>
        window.open(
          `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
            enderecoCompleto
          )}`,
          "_blank"
        ),
      color: "text-blue-600 bg-blue-50",
    });
  }

  if (os.contato?.telefone) {
    actions.push({
      icon: <Phone className="w-4 h-4" />,
      label: "Ligar",
      action: () => window.open(`tel:${os.contato.telefone}`),
      color: "text-emerald-600 bg-emerald-50",
    });
  }

  if (os.contato?.whatsapp && os.contato.whatsapp.trim() !== "") {
    actions.push({
      icon: <MessageSquare className="w-4 h-4" />,
      label: "WhatsApp",
      action: () =>
        window.open(
          `https://wa.me/${os.contato.whatsapp.replace(/\D/g, "")}`,
          "_blank"
        ),
      color: "text-green-600 bg-green-50",
    });
  }

  if (actions.length === 0) return null;

  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {actions.map((action, index) => (
        <button
          key={index}
          onClick={action.action}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap ${action.color} border border-current border-opacity-20`}
        >
          {action.icon}
          {action.label}
        </button>
      ))}
    </div>
  );
});
QuickActions.displayName = "QuickActions";

export default function OSDetalheMobile() {
  const router = useRouter();
  const params = useParams();
  const [os, setOs] = useState<OSDetalhadaV2 | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const formatDate = useCallback((dateStr: string | null) => {
    if (!dateStr || dateStr.trim() === "") return null;
    // API já retorna no formato DD/MM/YYYY HH:MM
    return dateStr;
  }, []);

  useEffect(() => {
    const fetchOS = async () => {
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
    };

    fetchOS();
  }, [params?.id]);

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
          text="Carregando..."
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
          <div className="bg-white rounded-lg p-6 max-w-sm w-full text-center shadow-sm border border-red-200">
            <AlertTriangle className="w-8 h-8 mx-auto mb-3 text-red-500" />
            <h2 className="font-medium text-slate-900 mb-2">Erro</h2>
            <p className="text-sm text-slate-600 mb-4">{error}</p>
            <div className="flex gap-2">
              <button
                onClick={() => router.back()}
                className="flex-1 px-3 py-2 bg-slate-100 text-slate-700 rounded text-sm font-medium"
              >
                Voltar
              </button>
              <button
                onClick={() => window.location.reload()}
                className="flex-1 px-3 py-2 bg-red-600 text-white rounded text-sm font-medium"
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
            <AlertTriangle className="w-8 h-8 mx-auto mb-3 text-slate-400" />
            <h2 className="font-medium text-slate-900 mb-3">
              OS não encontrada
            </h2>
            <button
              onClick={() => router.back()}
              className="px-4 py-2 bg-blue-600 text-white rounded text-sm font-medium"
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
      <div className="bg-white border-b border-slate-200 p-4">
        <div className="flex items-center justify-between mb-2">
          <StatusBadge status={os.situacao_os?.codigo?.toString() || "1"} />
          {os.em_garantia && (
            <div className="flex items-center gap-1 text-xs text-emerald-600">
              <Shield className="w-3 h-3" />
              <span>Garantia</span>
            </div>
          )}
        </div>
        {os.descricao_problema && (
          <p className="text-sm text-slate-700 mt-2">{os.descricao_problema}</p>
        )}
      </div>

      {/* Quick Actions */}
      <div className="p-4">
        <QuickActions os={os} />
      </div>

      {/* Content Sections */}
      <div className="px-4 pb-6 space-y-4">
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
            label="Região"
            value={os.cliente?.nome_regiao}
            icon={<MapPin className="w-3 h-3" />}
          />
          <Field
            label="Endereço"
            value={
              os.cliente?.endereco &&
              `${os.cliente.endereco}${
                os.cliente.numero ? `, ${os.cliente.numero}` : ""
              } - ${os.cliente.bairro}, ${os.cliente.cidade}/${os.cliente.uf}`
            }
            icon={<MapPin className="w-3 h-3" />}
            action={
              os.cliente?.endereco
                ? () =>
                    window.open(
                      `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                        `${os.cliente.endereco}${
                          os.cliente.numero ? `, ${os.cliente.numero}` : ""
                        } - ${os.cliente.bairro}, ${os.cliente.cidade}/${
                          os.cliente.uf
                        }`
                      )}`,
                      "_blank"
                    )
                : undefined
            }
          />
          <Field label="CEP" value={os.cliente?.cep} />
          <Field
            label="Contato"
            value={os.contato?.nome}
            icon={<User className="w-3 h-3" />}
          />
          <Field
            label="Telefone"
            value={os.contato?.telefone}
            icon={<Phone className="w-3 h-3" />}
            action={
              os.contato?.telefone
                ? () => window.open(`tel:${os.contato.telefone}`)
                : undefined
            }
          />
          {os.contato?.whatsapp && (
            <Field
              label="WhatsApp"
              value={os.contato.whatsapp}
              icon={<MessageSquare className="w-3 h-3" />}
              action={() =>
                window.open(
                  `https://wa.me/${os.contato.whatsapp.replace(/\D/g, "")}`,
                  "_blank"
                )
              }
            />
          )}
          <Field
            label="Email"
            value={os.contato?.email}
            icon={<Mail className="w-3 h-3" />}
            action={
              os.contato?.email
                ? () => window.open(`mailto:${os.contato.email}`)
                : undefined
            }
          />
        </Section>

        {/* Máquina */}
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

        {/* Técnico */}
        {os.tecnico?.nome && (
          <Section title="Técnico" icon={<Wrench className="w-4 h-4" />}>
            <Field
              label="Nome"
              value={os.tecnico.nome}
              icon={<User className="w-3 h-3" />}
            />
            <Field
              label="Tipo"
              value={
                os.tecnico.tipo === "interno"
                  ? "Interno"
                  : os.tecnico.tipo === "terceiro"
                  ? "Terceirizado"
                  : os.tecnico.tipo
              }
            />
            <Field label="Observações" value={os.tecnico.observacoes} />
          </Section>
        )}

        {/* Peças */}
        {os.pecas_corrigidas && os.pecas_corrigidas.length > 0 && (
          <Section
            title="Peças Utilizadas"
            icon={<Package className="w-4 h-4" />}
            collapsible={true}
            defaultExpanded={false}
          >
            {os.pecas_corrigidas.map((peca, index) => (
              <Field
                key={index}
                label={peca.nome}
                value={`Qty: ${peca.quantidade}`}
                icon={<Package className="w-3 h-3" />}
              />
            ))}
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
            {os.fats.map((fat, index) => (
              <div
                key={index}
                className="bg-slate-50 rounded-lg p-3 space-y-2 mb-3"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-slate-600">
                    FAT #{fat.id_fat}
                  </span>
                  {fat.data_atendimento && (
                    <span className="text-xs text-slate-500">
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
                  <div className="mt-3 pt-3 border-t border-slate-200">
                    <p className="text-xs font-medium text-slate-600 mb-2">
                      Deslocamentos:
                    </p>
                    {fat.deslocamentos.map((desl, deslIndex) => (
                      <div
                        key={deslIndex}
                        className="bg-white rounded p-2 mb-2 text-xs"
                      >
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <span className="text-slate-600">Ida:</span>{" "}
                            <span className="text-slate-500">
                              {desl.km_ida?.toFixed(1)}km ({desl.tempo_ida_min}
                              min)
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-600">Volta:</span>{" "}
                            <span className="text-slate-500">
                              {desl.km_volta?.toFixed(1)}km (
                              {desl.tempo_volta_min}min)
                            </span>
                          </div>
                        </div>
                        {desl.observacoes && (
                          <div className="mt-1 text-slate-600">
                            {desl.observacoes}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Peças utilizadas no FAT */}
                {fat.pecas_utilizadas && fat.pecas_utilizadas.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-200">
                    <p className="text-xs font-medium text-slate-600 mb-2">
                      Peças utilizadas neste atendimento:
                    </p>
                    {fat.pecas_utilizadas.map((peca, pecaIndex) => (
                      <div
                        key={pecaIndex}
                        className="text-sm text-slate-700 ml-2"
                      >
                        • {peca.nome} (Qty: {peca.quantidade})
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </Section>
        )}

        {/* Outros campos condicionais */}
        {os.liberacao_financeira && (
          <Section
            title="Financeiro"
            icon={<DollarSign className="w-4 h-4" />}
            collapsible={true}
            defaultExpanded={false}
          >
            <Field
              label="Status"
              value={
                <div className="flex items-center gap-1.5">
                  {os.liberacao_financeira.liberada ? (
                    <>
                      <CircleCheck className="w-3 h-3 text-emerald-500" />
                      <span className="text-emerald-600 text-xs">Liberada</span>
                    </>
                  ) : (
                    <>
                      <CircleX className="w-3 h-3 text-red-500" />
                      <span className="text-red-600 text-xs">Não liberada</span>
                    </>
                  )}
                </div>
              }
            />
            {os.liberacao_financeira.liberada && (
              <>
                <Field
                  label="Liberado por"
                  value={os.liberacao_financeira.nome_usuario_liberacao}
                />
                <Field
                  label="Data"
                  value={formatDate(os.liberacao_financeira.data_liberacao)}
                />
              </>
            )}
          </Section>
        )}

        {os.situacao_os?.motivo_pendencia && (
          <Section
            title="Pendência"
            icon={<AlertTriangle className="w-4 h-4" />}
          >
            <Field
              label="Motivo"
              value={os.situacao_os.motivo_pendencia}
              icon={<AlertTriangle className="w-3 h-3" />}
            />
          </Section>
        )}
      </div>

      <div className="h-6"></div>
    </main>
  );
}
