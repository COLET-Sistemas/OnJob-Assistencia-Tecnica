"use client";
import React, { useMemo } from "react";
import {
  Wrench,
  AlertTriangle,
  CheckCircle,
  Clock,
  Bell,
  Car,
  PauseCircle,
  FileSearch,
  XCircle,
  UserX,
} from "lucide-react";

type StatusInfo = {
  label: string;
  className: string;
  icon: React.ReactNode;
};

export default function StatusBadge({
  status,
  className = "",
}: {
  status: string;
  className?: string;
}) {
  const statusMapping: Record<string, StatusInfo> = useMemo(
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

  const getStatusInfo = (): StatusInfo => {
    if (statusMapping[status]) return statusMapping[status];

    const statusStr = (status || "").toLowerCase();
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
      className: "bg-gray-100 text-gray-700 border border-gray-200",
      icon: <AlertTriangle className="w-3.5 h-3.5 text-gray-500" />,
    };
  };

  const info = getStatusInfo();

  return (
    <div
      className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${info.className} ${className}`}
    >
      {info.icon}
      <span>{info.label}</span>
    </div>
  );
}
