"use client";
import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Wrench,
  AlertTriangle,
  CheckCircle,
  Clock,
  Settings,
  MapPin,
  CircleCheck,
  CircleX,
  Bell,
  Car,
  PauseCircle,
  FileSearch,
  XCircle,
  UserX,
} from "lucide-react";
import {
  ordensServicoService,
  type OSItem,
} from "@/api/services/ordensServicoService";
import { Loading } from "@/components/LoadingPersonalizado";

import MobileHeader from "@/components/tecnico/MobileHeader";

const StatusBadge = React.memo(({ status }: { status: string }) => {
  const statusMapping: Record<
    string,
    { label: string; className: string; icon: React.ReactNode }
  > = useMemo(
    () => ({
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
    }),
    []
  );

  // Assumindo que o status pode vir como ID ou descrição
  const getStatusInfo = () => {
    // Se for um ID numérico (string), use o mapeamento direto
    if (statusMapping[status]) {
      return statusMapping[status];
    }

    // Se for descrição, tente mapear baseado no texto
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

    // Status padrão se não encontrar correspondência
    return {
      label: status,
      className: "bg-gray-100 text-gray-700 border border-gray-200",
      icon: <AlertTriangle className="w-3.5 h-3.5 text-gray-500" />,
    };
  };

  const statusInfo = getStatusInfo();

  return (
    <div
      className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${statusInfo.className}`}
    >
      {statusInfo.icon}
      <span>{statusInfo.label}</span>
    </div>
  );
});
StatusBadge.displayName = "StatusBadge";

const OSCard = React.memo(({ os }: { os: OSItem }) => {
  const router = useRouter();
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

  // Definir cor da borda lateral baseada no status
  const getStatusBorderColor = (status: string) => {
    // Se for um ID numérico (string), use o mapeamento direto
    const statusMappingBorder: Record<string, string> = {
      "1": "border-l-gray-500",
      "2": "border-l-blue-500",
      "3": "border-l-purple-500",
      "4": "border-l-orange-500",
      "5": "border-l-amber-500",
      "6": "border-l-indigo-500",
      "7": "border-l-green-500",
      "8": "border-l-red-500",
      "9": "border-l-rose-500",
    };

    if (statusMappingBorder[status]) {
      return statusMappingBorder[status];
    }

    // Se for descrição, tente mapear baseado no texto
    const statusStr = status.toLowerCase();
    if (statusStr.includes("pendente")) return "border-l-gray-500";
    if (statusStr.includes("atender")) return "border-l-blue-500";
    if (statusStr.includes("deslocamento")) return "border-l-purple-500";
    if (
      statusStr.includes("atendimento") &&
      !statusStr.includes("interrompido")
    )
      return "border-l-orange-500";
    if (statusStr.includes("interrompido")) return "border-l-amber-500";
    if (statusStr.includes("revisão")) return "border-l-indigo-500";
    if (statusStr.includes("concluída") || statusStr.includes("finalizada"))
      return "border-l-green-500";
    if (statusStr.includes("cancelada") && statusStr.includes("cliente"))
      return "border-l-rose-500";
    if (statusStr.includes("cancelada")) return "border-l-red-500";

    return "border-l-gray-500";
  };

  return (
    <article
      onClick={() => router.push(`/tecnico/os/${os.id_os}`)}
      className={`bg-white rounded-lg cursor-pointer shadow-sm border-l-4 ${getStatusBorderColor(
        os.situacao_os?.descricao || ""
      )} border-r border-t border-b border-gray-200 p-4 mb-3 transition-all duration-200 hover:shadow-md`}
    >
      {/* Header com número da OS e status */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-gray-900 mb-1">
            OS #{os.id_os} - {os.cliente?.nome}
          </h3>
          <div className="flex items-center gap-1 text-xs text-gray-500 ">
            <MapPin className="w-3 h-3 text-gray-500" />
            <span>
              {os.cliente?.cidade}, {os.cliente?.uf}
            </span>
          </div>
        </div>
        <StatusBadge status={os.situacao_os?.descricao || ""} />
      </div>

      {/* Informações da máquina */}
      <div className="mb-3">
        <div className="flex items-center gap-1 text-sm text-gray-700">
          <Settings className="w-3 h-3 text-gray-500" />
          <span className="font-medium">{os.maquina?.modelo}</span>

          <div
            className="w-4 h-4 flex items-center justify-center"
            title={os.em_garantia ? "Em garantia" : "Fora da garantia"}
          >
            {os.em_garantia ? (
              <CircleCheck className="w-4 h-4 text-emerald-500" />
            ) : (
              <CircleX className="w-4 h-4 text-amber-500" />
            )}
          </div>
        </div>
      </div>

      {/* Footer com data e técnico */}
      <div className="flex flex-col gap-2 pt-2 border-t border-gray-100">
        <div className="flex items-center gap-2 text-xs text-gray-600">
          <Clock className="w-3 h-3 text-gray-500" />
          <span>Agendado: {formatDate(os.data_agendada)}</span>
        </div>
      </div>
    </article>
  );
});

OSCard.displayName = "OSCard";

export default function OSAbertoMobile() {
  const [osList, setOsList] = useState<OSItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Handlers para os botões do header
  const handleMenuClick = () => {
    console.log("Menu clicado");
  };

  const handleAddClick = () => {
    console.log("Adicionar clicado");
  };

  useEffect(() => {
    const fetchOS = async () => {
      setLoading(true);
      setError("");

      try {
        const response = await ordensServicoService.getPendentes();
        setOsList(response.dados);
      } catch {
        setError("Erro ao carregar ordens de serviço.");
      } finally {
        setLoading(false);
      }
    };

    fetchOS();
  }, []);

  if (loading) {
    return (
      <>
        <MobileHeader
          title="OSs a Atender"
          onMenuClick={handleMenuClick}
          onAddClick={handleAddClick}
        />
        <Loading
          fullScreen={true}
          preventScroll={false}
          text="Carregando suas ordens de serviço..."
          size="large"
        />
      </>
    );
  }

  if (error) {
    return (
      <>
        <MobileHeader
          title="OSs a Atender"
          onMenuClick={handleMenuClick}
          onAddClick={handleAddClick}
        />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md w-full text-center">
            <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-red-500" />
            <h2 className="text-lg font-semibold text-red-800 mb-2">Erro</h2>
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-red-600 text-white rounded-md font-medium hover:bg-red-700 transition"
            >
              Tentar novamente
            </button>
          </div>
        </div>
      </>
    );
  }

  if (osList.length === 0) {
    return (
      <>
        <MobileHeader
          title="OSs a Atender"
          onMenuClick={handleMenuClick}
          onAddClick={handleAddClick}
        />
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
          <div className="bg-white border border-gray-200 rounded-lg p-8 max-w-md w-full text-center shadow-sm">
            <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-500" />
            <h2 className="text-lg font-semibold text-gray-800 mb-2">
              Nenhuma OS atribuída
            </h2>
            <p className="text-gray-600">
              Você não possui ordens de serviço atribuídas no momento.
            </p>
          </div>
        </div>
      </>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <MobileHeader
        title="OSs a Atender"
        onMenuClick={handleMenuClick}
        onAddClick={handleAddClick}
      />

      <div className="p-4">
        {osList.map((os) => (
          <OSCard key={os.id_os} os={os} />
        ))}
      </div>
    </main>
  );
}
