"use client";
import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  Settings,
  MapPin,
  CircleCheck,
  CircleX,
} from "lucide-react";
import {
  ordensServicoService,
  type OSItem,
} from "@/api/services/ordensServicoService";
import { Loading } from "@/components/LoadingPersonalizado";

import MobileHeader from "@/components/tecnico/MobileHeader";
import StatusBadge from "@/components/tecnico/StatusBadge";

// Reused StatusBadge component imported from components

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
