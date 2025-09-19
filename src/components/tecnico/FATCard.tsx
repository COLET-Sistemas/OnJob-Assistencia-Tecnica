"use client";
import React, { useState } from "react";
import {
  Car,
  ChevronRight,
  User,
  AlertTriangle,
  CheckCircle,
  FileSearch,
  MessageSquare,
  Settings,
  Package,
  Clock,
  Bell,
  PauseCircle,
  XCircle,
  UserX,
  SquareUserRound,
  Wrench,
} from "lucide-react";

// Status mapping for id_motivo_atendimento
const statusConfig = {
  1: {
    label: "Pendente",
    className: "bg-gray-100 text-gray-700 border border-gray-200",
    icon: <Clock className="w-3.5 h-3.5 text-gray-500" />,
  },
  2: {
    label: "A atender",
    className: "bg-blue-100 text-blue-700 border border-blue-200",
    icon: <Bell className="w-3.5 h-3.5 text-blue-600" />,
  },
  3: {
    label: "Em deslocamento",
    className: "bg-purple-100 text-purple-700 border border-purple-200",
    icon: <Car className="w-3.5 h-3.5 text-purple-600" />,
  },
  4: {
    label: "Em atendimento",
    className: "bg-orange-100 text-orange-700 border border-orange-200",
    icon: <Wrench className="w-3.5 h-3.5 text-orange-600" />,
  },
  5: {
    label: "Atendimento interrompido",
    className: "bg-amber-100 text-amber-700 border border-amber-200",
    icon: <PauseCircle className="w-3.5 h-3.5 text-amber-600" />,
  },
  6: {
    label: "Em Revisão",
    className: "bg-indigo-100 text-indigo-700 border border-indigo-200",
    icon: <FileSearch className="w-3.5 h-3.5 text-indigo-600" />,
  },
  7: {
    label: "Concluída",
    className: "bg-green-100 text-green-700 border border-green-200",
    icon: <CheckCircle className="w-3.5 h-3.5 text-green-600" />,
  },
  8: {
    label: "Cancelada",
    className: "bg-red-100 text-red-700 border border-red-200",
    icon: <XCircle className="w-3.5 h-3.5 text-red-600" />,
  },
  9: {
    label: "Cancelada pelo Cliente",
    className: "bg-rose-100 text-rose-700 border border-rose-200",
    icon: <UserX className="w-3.5 h-3.5 text-rose-600" />,
  },
};

// Minimal Field helper used by the FATCard component
const Field = React.memo(
  ({
    label,
    value,
    icon,
  }: {
    label: string;
    value: string | React.ReactNode | null | undefined;
    icon?: React.ReactNode;
  }) => {
    if (!value || (typeof value === "string" && value === "Não informado"))
      return null;

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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function FATCard({ fat }: { fat: any; index: number }) {
  const [expanded, setExpanded] = useState(false);

  // Get status configuration based on situacao
  const statusId = fat.situacao || 1;
  const status =
    statusConfig[statusId as keyof typeof statusConfig] || statusConfig[1];

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div
        className="p-4 cursor-pointer hover:bg-slate-50 transition-colors duration-200"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center shadow-sm ${status.className}`}
            >
              {status.icon}
            </div>
            <div>
              <h4 className="font-semibold text-slate-900 text-sm">
                FAT #{fat.id_fat}
              </h4>

              <p className="text-xs text-slate-500 mt-0.5">{status.label}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {fat.data_atendimento && (
              <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded-md">
                {fat.data_atendimento}
              </span>
            )}
            <ChevronRight
              className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
                expanded ? "rotate-90" : ""
              }`}
            />
          </div>
        </div>

        {!expanded && fat.motivo_atendimento && (
          <p className="text-sm text-slate-600 mt-2 line-clamp-2 bg-slate-50 p-2 rounded">
            {fat.motivo_atendimento}
          </p>
        )}
      </div>

      {expanded && (
        <div className="border-t border-slate-100 bg-slate-50">
          <div className="p-4 space-y-4">
            <Field label="Motivo" value={fat.motivo_atendimento} />

            <Field
              label="Técnico"
              value={fat.tecnico.nome}
              icon={<SquareUserRound className="w-3 h-3" />}
            />
            <Field
              label="Atendente no Local"
              value={
                fat.contato_atendente
                  ? `${fat.nome_atendente} - (${fat.contato_atendente})`
                  : fat.nome_atendente
              }
              icon={<User className="w-3 h-3" />}
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
            <Field
              label="Sugestões"
              value={fat.sugestoes}
              icon={<MessageSquare className="w-3 h-3" />}
            />
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

            {fat.deslocamentos && fat.deslocamentos.length > 0 && (
              <div className="mt-6">
                <div className="flex items-center gap-2 mb-3">
                  <Car className="w-4 h-4 text-slate-600" />
                  <h5 className="text-sm font-semibold text-slate-700">
                    Deslocamentos
                  </h5>
                </div>
                <div className="space-y-3">
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {fat.deslocamentos.map((desl: any, deslIndex: number) => (
                    <div
                      key={deslIndex}
                      className="bg-white rounded-lg p-4 border border-slate-200"
                    >
                      <div className="grid grid-cols-2 gap-4 mb-3">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
                          <div>
                            <span className="text-xs text-slate-500">Ida</span>
                            <p className="text-sm font-medium text-slate-900">
                              {desl.km_ida?.toFixed(1)}km
                            </p>
                            <p className="text-xs text-slate-600">
                              {desl.tempo_ida_min} minutos
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                          <div>
                            <span className="text-xs text-slate-500">
                              Volta
                            </span>
                            <p className="text-sm font-medium text-slate-900">
                              {desl.km_volta?.toFixed(1)}km
                            </p>
                            <p className="text-xs text-slate-600">
                              {desl.tempo_volta_min} minutos
                            </p>
                          </div>
                        </div>
                      </div>
                      {desl.observacoes && (
                        <div className="pt-3 border-t border-slate-100">
                          <p className="text-xs text-slate-500 mb-1">
                            Observações:
                          </p>
                          <p className="text-sm text-slate-700 bg-slate-50 p-2 rounded">
                            {desl.observacoes}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {fat.pecas_utilizadas && fat.pecas_utilizadas.length > 0 && (
              <div className="mt-6">
                <div className="flex items-center gap-2 mb-3">
                  <Package className="w-4 h-4 text-slate-600" />
                  <h5 className="text-sm font-semibold text-slate-700">
                    Peças Utilizadas ({fat.pecas_utilizadas.length})
                  </h5>
                </div>
                <div className="space-y-2">
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {fat.pecas_utilizadas.map((peca: any, pecaIndex: number) => (
                    <div
                      key={pecaIndex}
                      className="bg-white rounded-lg p-3 border border-slate-200"
                    >
                      <div className="flex items-start gap-3">
                        <Package className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium text-slate-900 truncate">
                              {peca.codigo}
                            </span>
                            <span className="text-xs text-slate-600 bg-slate-100 px-2 py-1 rounded flex-shrink-0 ml-2">
                              Qtd: {Number(peca.quantidade).toFixed(0)}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 leading-relaxed">
                            {peca.descricao}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
