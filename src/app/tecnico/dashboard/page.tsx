"use client";
import React, { useEffect, useState, useCallback, useMemo, memo } from "react";
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
import { motion, AnimatePresence } from "framer-motion";

const OSCard = memo(({ os }: { os: OSItem }) => {
  const router = useRouter();

  const formatDate = useCallback((dateStr: string | null) => {
    if (!dateStr || dateStr.trim() === "") return "Não definida";
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;
      return date.toLocaleString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateStr;
    }
  }, []);

  const borderColor = useMemo(() => {
    const map: Record<string, string> = {
      pendente: "border-l-gray-400",
      atender: "border-l-blue-500",
      deslocamento: "border-l-purple-500",
      atendimento: "border-l-orange-400",
      interrompido: "border-l-amber-400",
      revisão: "border-l-indigo-500",
      concluída: "border-l-green-500",
      cancelada: "border-l-red-500",
    };
    const status = os.situacao_os?.descricao?.toLowerCase() || "";
    return (
      Object.entries(map).find(([key]) => status.includes(key))?.[1] ||
      "border-l-gray-300"
    );
  }, [os.situacao_os?.descricao]);

  return (
    <motion.article
      layout
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => router.push(`/tecnico/os/${os.id_os}`)}
      className={`bg-white rounded-xl cursor-pointer shadow-sm border ${borderColor} border-l-4 p-4 mb-3 transition-all duration-200 hover:shadow-md active:shadow-lg`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-gray-900 leading-tight">
            OS #{os.id_os} - {os.cliente?.nome}
          </h3>
          <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
            <MapPin className="w-3 h-3 text-gray-500" />
            <span className="truncate">
              {os.cliente?.cidade}, {os.cliente?.uf}
            </span>
          </div>
        </div>
        <StatusBadge status={os.situacao_os?.descricao || ""} />
      </div>

      {/* Máquina + Garantia */}
      <div className="flex items-center gap-2 text-sm text-gray-700 mb-3">
        <Settings className="w-3 h-3 text-gray-500 flex-shrink-0" />
        <span className="font-medium truncate">{os.maquina?.modelo}</span>

        {/* Ícone de garantia logo ao lado */}
        {os.em_garantia ? (
          <CircleCheck className="w-4 h-4 text-emerald-500 flex-shrink-0" />
        ) : (
          <CircleX className="w-4 h-4 text-amber-500 flex-shrink-0" />
        )}
      </div>

      {/* Data */}
      <div className="pt-2 border-t border-gray-100 flex items-center gap-2 text-xs text-gray-600">
        <Clock className="w-3 h-3 text-gray-500" />
        <span>Agendado: {formatDate(os.data_agendada)}</span>
      </div>
    </motion.article>
  );
});
OSCard.displayName = "OSCard";

export default function OSAbertoMobile() {
  const [osList, setOsList] = useState<OSItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchOS = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await ordensServicoService.getPendentes();
      setOsList(response.dados || []);
    } catch {
      setError("Erro ao carregar ordens de serviço.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOS();
  }, [fetchOS]);

  const handleAddClick = useCallback(() => {
    console.log("Adicionar clicado");
  }, []);

  // Estados de carregamento, erro e vazio
  if (loading)
    return (
      <>
        <MobileHeader
          title="OSs a Atender"
          onAddClick={handleAddClick}
          leftVariant="plus"
        />
        <Loading
          fullScreen
          preventScroll={false}
          text="Carregando ordens de serviço..."
          size="large"
        />
      </>
    );

  if (error)
    return (
      <>
        <MobileHeader
          title="OSs a Atender"
          onAddClick={handleAddClick}
          leftVariant="plus"
        />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white border border-red-200 rounded-xl p-6 max-w-md w-full text-center shadow-md">
            <AlertTriangle className="w-12 h-12 mx-auto mb-3 text-red-500" />
            <h2 className="text-lg font-semibold text-red-700 mb-1">Erro</h2>
            <p className="text-red-600 mb-4 text-sm">{error}</p>
            <button
              onClick={fetchOS}
              className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 active:scale-95 transition-transform"
            >
              Tentar novamente
            </button>
          </div>
        </div>
      </>
    );

  if (osList.length === 0)
    return (
      <>
        <MobileHeader
          title="OSs a Atender"
          onAddClick={handleAddClick}
          leftVariant="plus"
        />
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6 animate-fadeIn">
          <div className="bg-white border border-gray-200 rounded-xl p-8 max-w-md w-full text-center shadow-sm">
            <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-500" />
            <h2 className="text-base font-semibold text-gray-800 mb-2">
              Nenhuma OS encontrada
            </h2>
            <p className="text-gray-600 text-sm">
              Você não possui ordens de serviço atribuídas no momento.
            </p>
          </div>
        </div>
      </>
    );

  // Lista principal
  return (
    <main className="min-h-screen bg-gray-50">
      <MobileHeader
        title="OSs a Atender"
        onAddClick={handleAddClick}
        leftVariant="plus"
      />

      <div className="p-4 pb-10">
        <AnimatePresence mode="popLayout">
          {osList.map((os) => (
            <OSCard key={os.id_os} os={os} />
          ))}
        </AnimatePresence>
      </div>
    </main>
  );
}
