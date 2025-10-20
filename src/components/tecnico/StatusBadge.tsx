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
  descricao,
  className = "",
}: {
  status: string;
  descricao?: string;
  className?: string;
}) {
  const statusMapping: Record<string, StatusInfo> = useMemo(
    () => ({
      "1": {
        label: "Pendente",
        className: "bg-gray-100 text-gray-700 border border-gray-200",
        icon: <Clock className="w-3.5 h-3.5 text-gray-500" />,
      },
      "2": {
        label: "A atender",
        className: "bg-blue-100 text-blue-700 border border-blue-200",
        icon: <Bell className="w-3.5 h-3.5 text-blue-600" />,
      },
      "3": {
        label: "Em deslocamento",
        className: "bg-purple-100 text-purple-700 border border-purple-200",
        icon: <Car className="w-3.5 h-3.5 text-purple-600" />,
      },
      "4": {
        label: "Em atendimento",
        className: "bg-orange-100 text-orange-700 border border-orange-200",
        icon: <Wrench className="w-3.5 h-3.5 text-orange-600" />,
      },
      "5": {
        label: "Atendimento interrompido",
        className: "bg-amber-100 text-amber-700 border border-amber-200",
        icon: <PauseCircle className="w-3.5 h-3.5 text-amber-600" />,
      },
      "6": {
        label: "Em Revisão",
        className: "bg-indigo-100 text-indigo-700 border border-indigo-200",
        icon: <FileSearch className="w-3.5 h-3.5 text-indigo-600" />,
      },
      "7": {
        label: "Concluída",
        className: "bg-green-100 text-green-700 border border-green-200",
        icon: <CheckCircle className="w-3.5 h-3.5 text-green-600" />,
      },
      "8": {
        label: "Cancelada",
        className: "bg-red-100 text-red-700 border border-red-200",
        icon: <XCircle className="w-3.5 h-3.5 text-red-600" />,
      },
      "9": {
        label: "Cancelada pelo Cliente",
        className: "bg-rose-100 text-rose-700 border border-rose-200",
        icon: <UserX className="w-3.5 h-3.5 text-rose-600" />,
      },
    }),
    []
  );

  const info = statusMapping[status] ?? {
    label: status,
    className: "bg-gray-100 text-gray-700 border border-gray-200",
    icon: <AlertTriangle className="w-3.5 h-3.5 text-gray-500" />,
  };

  return (
    <div
      className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${info.className} ${className}`}
    >
      {info.icon}
      <span>{descricao || info.label}</span>
    </div>
  );
}
