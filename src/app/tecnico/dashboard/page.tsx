"use client";
import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  Wrench,
  User,
  AlertTriangle,
  CheckCircle,
  Clock,
  Settings,
  MapPin,
} from "lucide-react";
import {
  ordensServicoService,
  type OSItem,
} from "@/api/services/ordensServicoService";
import { Loading } from "@/components/LoadingPersonalizado";

const StatusBadge = React.memo(({ status }: { status: string }) => {
  const statusInfo = useMemo(() => {
    const statusStr = status.toLowerCase();

    switch (statusStr) {
      case "pendente":
        return {
          color: "bg-amber-50 text-amber-700 border-amber-200 ring-amber-100",
          icon: <AlertTriangle className="w-3.5 h-3.5" />,
          label: "Pendente",
        };
      case "a atender":
        return {
          color: "bg-blue-50 text-blue-700 border-blue-200 ring-blue-100",
          icon: <Clock className="w-3.5 h-3.5" />,
          label: "A Atender",
        };
      case "em execução":
        return {
          color:
            "bg-orange-50 text-orange-700 border-orange-200 ring-orange-100",
          icon: <Wrench className="w-3.5 h-3.5" />,
          label: "Em Execução",
        };
      case "finalizada":
        return {
          color:
            "bg-emerald-50 text-emerald-700 border-emerald-200 ring-emerald-100",
          icon: <CheckCircle className="w-3.5 h-3.5" />,
          label: "Finalizada",
        };
      default:
        return {
          color: "bg-slate-50 text-slate-700 border-slate-200 ring-slate-100",
          icon: <AlertTriangle className="w-3.5 h-3.5" />,
          label: status,
        };
    }
  }, [status]);

  return (
    <div
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium ring-1 transition-all duration-200 ${statusInfo.color}`}
    >
      {statusInfo.icon}
      <span>{statusInfo.label}</span>
    </div>
  );
});
StatusBadge.displayName = "StatusBadge";

const OSCard = React.memo(({ os }: { os: OSItem }) => {
  const formatDate = useCallback((dateStr: string | null) => {
    if (!dateStr || dateStr.trim() === "") return "Não definida";
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;
      // Formatar como dd/MM/yyyy HH:mm
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

  // Card compacto, sem botão expandir, valores à esquerda, situação à direita, nome do cliente ao lado do número da OS
  return (
    <article className="group bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden transition-all duration-300 hover:shadow-lg hover:border-slate-300 hover:-translate-y-0.5">
      <div className="flex flex-row items-center justify-between gap-2 px-4 py-3">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <span className="text-xs font-bold text-white bg-gradient-to-r from-indigo-600 to-purple-600 px-3 py-1 rounded shadow-sm whitespace-nowrap">
            #{os.id_os}
          </span>
          <span className="text-sm font-semibold text-slate-800 truncate max-w-xs">
            {os.cliente?.nome}
          </span>
        </div>
        <div className="flex items-center gap-2 min-w-0">
          <StatusBadge status={os.situacao_os?.descricao || ""} />
        </div>
      </div>
      <div className="flex flex-col sm:flex-row items-start justify-start gap-2 px-4 pb-2">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-slate-400" />
          <span className="text-xs text-slate-700">
            {os.cliente?.cidade}, {os.cliente?.uf}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Settings className="w-4 h-4 text-slate-500" />
          <span className="text-xs text-slate-700 font-semibold">
            {os.maquina?.modelo}
          </span>
          {os.maquina?.numero_serie && (
            <span className="text-xs text-slate-400 font-mono ml-2">
              S/N: {os.maquina.numero_serie}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-blue-500" />
          <span className="text-xs text-blue-700 font-semibold">
            {formatDate(os.data_agendada)}
          </span>
        </div>
        {os.tecnico && (
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-purple-600" />
            <span className="text-xs text-purple-700 font-semibold">
              {os.tecnico.nome}
            </span>
            {os.tecnico.tipo && (
              <span className="text-xs text-purple-600 bg-purple-100 px-2 py-0.5 rounded-full ml-1">
                {os.tecnico.tipo}
              </span>
            )}
          </div>
        )}
      </div>
    </article>
  );
});

// Removido bloco duplicado do card antigo
OSCard.displayName = "OSCard";

export default function OSAbertoMobile() {
  const [osList, setOsList] = useState<OSItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchOS = async () => {
      setLoading(true);
      setError("");

      try {
        const response = await ordensServicoService.getPendentes();
        setOsList(response.dados);
      } catch {
        setError("Erro ao carregar ordens de serviço em aberto.");
      } finally {
        setLoading(false);
      }
    };

    fetchOS();
  }, []);

  const statsData = useMemo(() => {
    const total = osList.length;
    const pendentes = osList.filter((os) =>
      os.situacao_os?.descricao.toLowerCase().includes("pendente")
    ).length;
    const emExecucao = osList.filter((os) =>
      os.situacao_os?.descricao.toLowerCase().includes("execução")
    ).length;
    const aAtender = osList.filter((os) =>
      os.situacao_os?.descricao.toLowerCase().includes("atender")
    ).length;

    return { total, pendentes, emExecucao, aAtender };
  }, [osList]);

  if (loading) {
    return (
      <Loading
        fullScreen={true}
        preventScroll={false}
        text="Carregando motivos de atendimento..."
        size="large"
      />
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-8 max-w-md w-full text-center shadow-lg">
          <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center bg-red-100 rounded-full">
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-lg font-bold text-red-700 mb-2">Erro</h2>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-2 px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  if (osList.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-8 max-w-md w-full text-center shadow-lg">
          <CheckCircle className="w-12 h-12 mx-auto mb-4 text-emerald-500" />
          <h2 className="text-lg font-bold text-slate-800 mb-2">
            Nenhuma OS em aberto
          </h2>
          <p className="text-slate-600">
            Você não possui ordens de serviço pendentes no momento.
          </p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8 px-2 sm:px-6 lg:px-12">
      {/* Estatísticas rápidas */}
      <section className="mb-8 max-w-5xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-4 flex flex-col items-center border border-slate-200 shadow-sm">
            <span className="text-xs text-slate-500 mb-1">Total</span>
            <span className="text-2xl font-bold text-indigo-700">
              {statsData.total}
            </span>
          </div>
          <div className="bg-white rounded-xl p-4 flex flex-col items-center border border-slate-200 shadow-sm">
            <span className="text-xs text-slate-500 mb-1">Pendentes</span>
            <span className="text-2xl font-bold text-amber-600">
              {statsData.pendentes}
            </span>
          </div>
          <div className="bg-white rounded-xl p-4 flex flex-col items-center border border-slate-200 shadow-sm">
            <span className="text-xs text-slate-500 mb-1">A Atender</span>
            <span className="text-2xl font-bold text-blue-600">
              {statsData.aAtender}
            </span>
          </div>
          <div className="bg-white rounded-xl p-4 flex flex-col items-center border border-slate-200 shadow-sm">
            <span className="text-xs text-slate-500 mb-1">Em Execução</span>
            <span className="text-2xl font-bold text-orange-600">
              {statsData.emExecucao}
            </span>
          </div>
        </div>
      </section>

      {/* Lista de OSs */}
      <section className="max-w-5xl mx-auto space-y-6">
        {osList.map((os) => (
          <OSCard key={os.id_os} os={os} />
        ))}
      </section>
    </main>
  );
}
