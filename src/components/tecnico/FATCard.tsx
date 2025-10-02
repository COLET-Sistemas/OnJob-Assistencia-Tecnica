"use client";
import React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Car,
  CheckCircle,
  FileSearch,
  Clock,
  Bell,
  PauseCircle,
  XCircle,
  UserX,
  Wrench,
} from "lucide-react";

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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function FATCard({ fat }: { fat: any; index: number }) {
  const router = useRouter();
  const [isNavigating, setIsNavigating] = React.useState(false);

  // Get status configuration based on situacao
  const statusId = fat.situacao || 1;
  const status =
    statusConfig[statusId as keyof typeof statusConfig] || statusConfig[1];

  const handleClick = (
    e: React.MouseEvent | React.TouchEvent | React.KeyboardEvent
  ) => {
    // Prevenir múltiplos cliques
    if (isNavigating) {
      return;
    }

    // Evitar propagação do evento para elementos pais
    e.preventDefault();
    e.stopPropagation();

    setIsNavigating(true);



    const targetUrl = `/tecnico/os/fat/${fat.id_fat}`;

    try {

      // Tentar usar router.push primeiro
      router.push(targetUrl);
   

      // Como fallback, também tentar com window.location após um delay
      setTimeout(() => {
        if (window.location.pathname !== targetUrl) {
       
          window.location.href = targetUrl;
        }
        setIsNavigating(false);
      }, 1000);
    } catch (error) {
      console.error(`❌ Erro no router.push:`, error);
      // Fallback usando window.location
      console.log(`🔄 Tentando fallback com window.location`);
      try {
        window.location.href = targetUrl;
      } catch (fallbackError) {
        console.error(`❌ Erro também no fallback:`, fallbackError);
      } finally {
        setIsNavigating(false);
      }
    }
  };

  const handleMouseClick = (e: React.MouseEvent) => handleClick(e);
  const handleTouchEnd = (e: React.TouchEvent) => handleClick(e);

  // Alternativa usando Link como fallback
  const fatUrl = `/tecnico/os/fat/${fat.id_fat}`;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Versão com Link do Next.js como fallback */}
      <Link href={fatUrl} className="block" prefetch={false}>
        <div
          className={`p-4 cursor-pointer hover:bg-slate-50 transition-colors duration-200 ${
            isNavigating ? "opacity-50 pointer-events-none" : ""
          }`}
          onClick={handleMouseClick}
          onTouchEnd={handleTouchEnd}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              handleClick(e);
            }
          }}
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
                <p className="text-xs text-slate-500 mt-0.5">
                  {fat.descricao_situacao || status.label}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {fat.data_atendimento && (
                <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded-md">
                  {fat.data_atendimento}
                </span>
              )}
            </div>
          </div>

          {fat.motivo_atendimento && (
            <p className="text-sm text-slate-600 mt-2 line-clamp-2 bg-slate-50 p-2 rounded">
              {fat.motivo_atendimento}
            </p>
          )}
        </div>
      </Link>
    </div>
  );
}
