"use client";
import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeft,
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
        className: "bg-gray-100 text-gray-700 border border-gray-200",
        icon: <Clock className="w-4 h-4 text-gray-500" />,
      },
      "2": {
        label: "A atender",
        className: "bg-blue-100 text-blue-700 border border-blue-200",
        icon: <Bell className="w-4 h-4 text-blue-600" />,
      },
      "3": {
        label: "Em deslocamento",
        className: "bg-purple-100 text-purple-700 border border-purple-200",
        icon: <Car className="w-4 h-4 text-purple-600" />,
      },
      "4": {
        label: "Em atendimento",
        className: "bg-orange-100 text-orange-700 border border-orange-200",
        icon: <Wrench className="w-4 h-4 text-orange-600" />,
      },
      "5": {
        label: "Atendimento interrompido",
        className: "bg-amber-100 text-amber-700 border border-amber-200",
        icon: <PauseCircle className="w-4 h-4 text-amber-600" />,
      },
      "6": {
        label: "Em Revisão",
        className: "bg-indigo-100 text-indigo-700 border border-indigo-200",
        icon: <FileSearch className="w-4 h-4 text-indigo-600" />,
      },
      "7": {
        label: "Concluída",
        className: "bg-green-100 text-green-700 border border-green-200",
        icon: <CheckCircle className="w-4 h-4 text-green-600" />,
      },
      "8": {
        label: "Cancelada",
        className: "bg-red-100 text-red-700 border border-red-200",
        icon: <XCircle className="w-4 h-4 text-red-600" />,
      },
      "9": {
        label: "Cancelada pelo Cliente",
        className: "bg-rose-100 text-rose-700 border border-rose-200",
        icon: <UserX className="w-4 h-4 text-rose-600" />,
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
    if (statusStr.includes("atendimento") && !statusStr.includes("interrompido"))
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
      className: "bg-gray-100 text-gray-700 border border-gray-200",
      icon: <AlertTriangle className="w-4 h-4 text-gray-500" />,
    };
  };

  const statusInfo = getStatusInfo();

  return (
    <div
      className={`inline-flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium ${statusInfo.className}`}
    >
      {statusInfo.icon}
      <span>{statusInfo.label}</span>
    </div>
  );
});
StatusBadge.displayName = "StatusBadge";

const InfoCard = React.memo(
  ({
    title,
    icon,
    children,
    className = "",
  }: {
    title: string;
    icon: React.ReactNode;
    children: React.ReactNode;
    className?: string;
  }) => {
    return (
      <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-4 ${className}`}>
        <div className="flex items-center gap-2 mb-3">
          {icon}
          <h3 className="font-semibold text-gray-900">{title}</h3>
        </div>
        {children}
      </div>
    );
  }
);
InfoCard.displayName = "InfoCard";

const InfoItem = React.memo(
  ({
    label,
    value,
    icon,
  }: {
    label: string;
    value: string | React.ReactNode;
    icon?: React.ReactNode;
  }) => {
    return (
      <div className="flex items-start gap-2 py-2 border-b border-gray-100 last:border-b-0">
        {icon && <div className="mt-0.5">{icon}</div>}
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-gray-600 mb-1">{label}</p>
          <div className="text-sm text-gray-900">{value}</div>
        </div>
      </div>
    );
  }
);
InfoItem.displayName = "InfoItem";

export default function OSDetalheMobile() {
  const router = useRouter();
  const params = useParams();
  const [os, setOs] = useState<OSDetalhadaV2 | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const formatDate = useCallback((dateStr: string | null) => {
    if (!dateStr || dateStr.trim() === "") return "Não definida";
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;
      const dia = String(date.getDate()).padStart(2, "0");
      const mes = String(date.getMonth() + 1).padStart(2, "0");
      const ano = date.getFullYear();
      const horas = String(date.getHours()).padStart(2, "0");
      const minutos = String(date.getMinutes()).padStart(2, "0");
      return `${dia}/${mes}/${ano} ${horas}:${minutos}`;
    } catch {
      return dateStr;
    }
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
        
        // A API pode retornar um array ou um objeto único
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
      <Loading
        fullScreen={true}
        preventScroll={false}
        text="Carregando detalhes da OS..."
        size="large"
      />
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md w-full text-center">
          <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-red-500" />
          <h2 className="text-lg font-semibold text-red-800 mb-2">Erro</h2>
          <p className="text-red-600 mb-4">{error}</p>
          <div className="flex gap-2">
            <button
              onClick={() => router.back()}
              className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-md font-medium hover:bg-gray-700 transition"
            >
              Voltar
            </button>
            <button
              onClick={() => window.location.reload()}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md font-medium hover:bg-red-700 transition"
            >
              Tentar novamente
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!os) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <h2 className="text-lg font-semibold text-gray-800 mb-2">
            OS não encontrada
          </h2>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 transition"
          >
            Voltar
          </button>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header fixo */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2 -ml-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-semibold text-gray-900 truncate">
              OS #{os.id_os}
            </h1>
          </div>
          <StatusBadge status={os.situacao_os?.descricao || ""} />
        </div>
      </div>

      {/* Conteúdo */}
      <div className="p-4 space-y-4">
        {/* Informações Básicas */}
        <InfoCard
          title="Informações da OS"
          icon={<FileSearch className="w-5 h-5 text-blue-600" />}
        >
          <InfoItem
            label="Descrição do Problema"
            value={os.descricao_problema || "Não informado"}
            icon={<MessageSquare className="w-4 h-4 text-gray-500" />}
          />
          <InfoItem
            label="Data de Abertura"
            value={formatDate(os.abertura?.data_abertura)}
            icon={<Calendar className="w-4 h-4 text-gray-500" />}
          />
          <InfoItem
            label="Data Agendada"
            value={formatDate(os.data_agendada)}
            icon={<Clock className="w-4 h-4 text-gray-500" />}
          />
          <InfoItem
            label="Motivo do Atendimento"
            value={os.abertura?.motivo_atendimento || "Não informado"}
          />
          <InfoItem
            label="Garantia"
            value={
              <div className="flex items-center gap-2">
                {os.em_garantia ? (
                  <>
                    <CircleCheck className="w-4 h-4 text-green-500" />
                    <span className="text-green-700 font-medium">Em garantia</span>
                  </>
                ) : (
                  <>
                    <CircleX className="w-4 h-4 text-red-500" />
                    <span className="text-red-700 font-medium">Fora da garantia</span>
                  </>
                )}
              </div>
            }
            icon={<Shield className="w-4 h-4 text-gray-500" />}
          />
        </InfoCard>

        {/* Informações do Cliente */}
        <InfoCard
          title="Cliente"
          icon={<User className="w-5 h-5 text-green-600" />}
        >
          <InfoItem
            label="Nome"
            value={os.cliente?.nome || "Não informado"}
            icon={<User className="w-4 h-4 text-gray-500" />}
          />
          <InfoItem
            label="Endereço"
            value={
              os.cliente?.endereco
                ? `${os.cliente.endereco}, ${os.cliente.numero || "S/N"} - ${
                    os.cliente.bairro
                  }, ${os.cliente.cidade}/${os.cliente.uf}`
                : "Não informado"
            }
            icon={<MapPin className="w-4 h-4 text-gray-500" />}
          />
          <InfoItem
            label="CEP"
            value={os.cliente?.cep || "Não informado"}
          />
        </InfoCard>

        {/* Informações de Contato */}
        <InfoCard
          title="Contato"
          icon={<Phone className="w-5 h-5 text-purple-600" />}
        >
          <InfoItem
            label="Nome do Contato"
            value={os.contato?.nome || "Não informado"}
            icon={<User className="w-4 h-4 text-gray-500" />}
          />
          <InfoItem
            label="Telefone"
            value={os.contato?.telefone || "Não informado"}
            icon={<Phone className="w-4 h-4 text-gray-500" />}
          />
          <InfoItem
            label="WhatsApp"
            value={os.contato?.whatsapp || "Não informado"}
            icon={<MessageSquare className="w-4 h-4 text-gray-500" />}
          />
          <InfoItem
            label="Email"
            value={os.contato?.email || "Não informado"}
            icon={<Mail className="w-4 h-4 text-gray-500" />}
          />
        </InfoCard>

        {/* Informações da Máquina */}
        <InfoCard
          title="Máquina"
          icon={<Settings className="w-5 h-5 text-orange-600" />}
        >
          <InfoItem
            label="Modelo"
            value={os.maquina?.modelo || "Não informado"}
            icon={<Settings className="w-4 h-4 text-gray-500" />}
          />
          <InfoItem
            label="Descrição"
            value={os.maquina?.descricao || "Não informado"}
          />
          <InfoItem
            label="Número de Série"
            value={os.maquina?.numero_serie || "Não informado"}
          />
        </InfoCard>

        {/* Técnico */}
        {os.tecnico?.nome && (
          <InfoCard
            title="Técnico"
            icon={<Wrench className="w-5 h-5 text-indigo-600" />}
          >
            <InfoItem
              label="Nome"
              value={os.tecnico.nome}
              icon={<User className="w-4 h-4 text-gray-500" />}
            />
            <InfoItem
              label="Tipo"
              value={
                os.tecnico.tipo === "interno" ? "Técnico Interno" : 
                os.tecnico.tipo === "terceiro" ? "Técnico Terceirizado" : 
                os.tecnico.tipo || "Não informado"
              }
            />
            {os.tecnico.observacoes && (
              <InfoItem
                label="Observações"
                value={os.tecnico.observacoes}
                icon={<MessageSquare className="w-4 h-4 text-gray-500" />}
              />
            )}
          </InfoCard>
        )}

        {/* Liberação Financeira */}
        {os.liberacao_financeira && (
          <InfoCard
            title="Liberação Financeira"
            icon={<DollarSign className="w-5 h-5 text-green-600" />}
          >
            <InfoItem
              label="Status"
              value={
                <div className="flex items-center gap-2">
                  {os.liberacao_financeira.liberada ? (
                    <>
                      <CircleCheck className="w-4 h-4 text-green-500" />
                      <span className="text-green-700 font-medium">Liberada</span>
                    </>
                  ) : (
                    <>
                      <CircleX className="w-4 h-4 text-red-500" />
                      <span className="text-red-700 font-medium">Não liberada</span>
                    </>
                  )}
                </div>
              }
            />
            {os.liberacao_financeira.liberada && (
              <>
                <InfoItem
                  label="Liberado por"
                  value={os.liberacao_financeira.nome_usuario_liberacao || "Não informado"}
                  icon={<User className="w-4 h-4 text-gray-500" />}
                />
                <InfoItem
                  label="Data da Liberação"
                  value={formatDate(os.liberacao_financeira.data_liberacao)}
                  icon={<Calendar className="w-4 h-4 text-gray-500" />}
                />
              </>
            )}
          </InfoCard>
        )}

        {/* Peças Utilizadas */}
        {os.pecas_corrigidas && os.pecas_corrigidas.length > 0 && (
          <InfoCard
            title="Peças Utilizadas"
            icon={<Package className="w-5 h-5 text-amber-600" />}
          >
            {os.pecas_corrigidas.map((peca, index) => (
              <InfoItem
                key={index}
                label={peca.nome}
                value={`Quantidade: ${peca.quantidade}`}
                icon={<Package className="w-4 h-4 text-gray-500" />}
              />
            ))}
          </InfoCard>
        )}

        {/* FATs */}
        {os.fats && os.fats.length > 0 && (
          <InfoCard
            title="Relatórios de Atendimento (FATs)"
            icon={<History className="w-5 h-5 text-cyan-600" />}
          >
            {os.fats.map((fat, index) => (
              <div key={index} className="border border-gray-100 rounded-lg p-3 mb-3 last:mb-0">
                <InfoItem
                  label="Data"
                  value={formatDate(fat.data)}
                  icon={<Calendar className="w-4 h-4 text-gray-500" />}
                />
                <InfoItem
                  label="Técnico"
                  value={fat.tecnico?.nome || "Não informado"}
                  icon={<User className="w-4 h-4 text-gray-500" />}
                />
                {fat.observacoes && (
                  <InfoItem
                    label="Observações"
                    value={fat.observacoes}
                    icon={<MessageSquare className="w-4 h-4 text-gray-500" />}
                  />
                )}
                {fat.pecas && fat.pecas.length > 0 && (
                  <div className="mt-2">
                    <p className="text-xs font-medium text-gray-600 mb-2">Peças utilizadas:</p>
                    {fat.pecas.map((peca, pecaIndex) => (
                      <div key={pecaIndex} className="text-sm text-gray-700 ml-4">
                        • {peca.nome} (Qty: {peca.quantidade})
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </InfoCard>
        )}

        {/* Revisão */}
        {os.revisao_os && (
          <InfoCard
            title="Revisão da OS"
            icon={<FileSearch className="w-5 h-5 text-indigo-600" />}
          >
            <InfoItem
              label="Revisado por"
              value={os.revisao_os.nome || "Não informado"}
              icon={<User className="w-4 h-4 text-gray-500" />}
            />
            <InfoItem
              label="Data da Revisão"
              value={formatDate(os.revisao_os.data)}
              icon={<Calendar className="w-4 h-4 text-gray-500" />}
            />
            {os.revisao_os.observacoes && (
              <InfoItem
                label="Observações"
                value={os.revisao_os.observacoes}
                icon={<MessageSquare className="w-4 h-4 text-gray-500" />}
              />
            )}
          </InfoCard>
        )}

        {/* Motivo de Pendência */}
        {os.situacao_os?.motivo_pendencia && (
          <InfoCard
            title="Motivo da Pendência"
            icon={<AlertTriangle className="w-5 h-5 text-yellow-600" />}
          >
            <InfoItem
              label="Motivo"
              value={os.situacao_os.motivo_pendencia}
              icon={<AlertTriangle className="w-4 h-4 text-gray-500" />}
            />
          </InfoCard>
        )}

        {/* Data de Fechamento */}
        {os.data_fechamento && (
          <InfoCard
            title="Finalização"
            icon={<CheckCircle className="w-5 h-5 text-green-600" />}
          >
            <InfoItem
              label="Data de Fechamento"
              value={formatDate(os.data_fechamento)}
              icon={<Calendar className="w-4 h-4 text-gray-500" />}
            />
          </InfoCard>
        )}
      </div>

      {/* Espaço extra no final para melhor navegação */}
      <div className="h-8"></div>
    </main>
  );
}