"use client";

import React from "react";
import { Lock, X, Zap, Crown, Star, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";

type PlanScope = "gold_platinum" | "platinum_only";

interface PlanUpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  badgeText?: string;
  planScope?: PlanScope;
  allowedPlansMessage?: React.ReactNode;
  highlightTitle?: string;
  highlightNote?: string;
}

const PlanUpgradeModal: React.FC<PlanUpgradeModalProps> = ({
  isOpen,
  onClose,
  title: _title = "Recurso Premium",
  badgeText,
  planScope = "gold_platinum",
  allowedPlansMessage,
  highlightTitle = "Upgrade para acessar",
  highlightNote,
}) => {
  const router = useRouter();
  const isPlatinumOnly = planScope === "platinum_only";
  const headerTitle = _title;

  const computedBadgeText =
    badgeText ||
    (isPlatinumOnly
      ? "Disponível no Plano Platinum"
      : "Disponível nos Planos Gold e Platinum");

  const computedAllowedPlansMessage =
    allowedPlansMessage ||
    (isPlatinumOnly ? (
      <>
        Este recurso esta disponível apenas para empresas no plano{" "}
        <strong>PLATINUM</strong>. Conheca nossos planos.
      </>
    ) : (
      <>
        Este recurso esta disponível nos planos <strong>GOLD</strong> e{" "}
        <strong>PLATINUM</strong>. Conheca nossos planos.
      </>
    ));

  const computedHighlightNote =
    highlightNote ||
    (isPlatinumOnly
      ? "Faca upgrade para o plano Platinum e liberar este recurso."
      : "Faca upgrade para liberar este recurso nos planos Gold ou Platinum.");

  const handleKnowPlans = () => {
    onClose();
    router.push("/admin/planos");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-md transition-all duration-300"
        onClick={onClose}
      />

      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-lg transform rounded-2xl bg-white shadow-2xl transition-all duration-300 animate-in slide-in-from-bottom-4 fade-in-0">
          {/* Header */}
          <div className="relative overflow-hidden rounded-t-2xl bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 px-6 py-8">
            <div className="absolute inset-0 bg-white/10 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.3)_1px,transparent_0)] [background-size:20px_20px]" />

            <div className="relative flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
                  <Lock className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">
                    {headerTitle}
                  </h3>
                  <div className="mt-1 inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 backdrop-blur-sm">
                    <Crown className="h-3 w-3 text-amber-200" />
                    <span className="text-xs font-medium text-white">
                      {computedBadgeText}
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white/80 backdrop-blur-sm transition-all hover:bg-white/30 hover:text-white cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Conteudo principal */}
          <div className="px-6 py-6">
            {/* Mensagem principal */}
            <div className="mb-6 text-center">
              <p className="text-gray-700 leading-relaxed">
                {computedAllowedPlansMessage}
              </p>
            </div>

            {/* Card de destaque */}
            <div className="mb-6 overflow-hidden rounded-xl border border-violet-100 bg-gradient-to-br from-violet-50 via-purple-50 to-indigo-50 p-5">
              <div className="mb-3 flex items-center justify-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-100">
                  <Zap className="h-4 w-4 text-violet-600" />
                </div>
                <span className="font-semibold text-violet-800">
                  {highlightTitle}
                </span>
              </div>
              <p className="text-center text-sm text-violet-700 leading-relaxed">
                {computedHighlightNote}
              </p>

              {/* Beneficios adicionais */}
              <div className="mt-4 space-y-2">
                <div className="flex items-center gap-2 text-sm text-violet-700">
                  <Star className="h-3 w-3 fill-violet-400 text-violet-400" />
                  <span>Recursos avancados de gestao</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-violet-700">
                  <Star className="h-3 w-3 fill-violet-400 text-violet-400" />
                  <span>Suporte prioritario</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-violet-700">
                  <Star className="h-3 w-3 fill-violet-400 text-violet-400" />
                  <span>Relatorios detalhados</span>
                </div>
              </div>
            </div>

            {/* Botoes */}
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 rounded-lg border-2 border-gray-200 bg-white px-4 py-3 font-medium text-gray-700 transition-all hover:border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 cursor-pointer"
              >
                Fechar
              </button>
              <button
                onClick={handleKnowPlans}
                className="group flex-1 rounded-lg bg-gradient-to-r from-violet-600 to-purple-600 px-4 py-3 font-semibold text-white shadow-lg transition-all hover:from-violet-700 hover:to-purple-700 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 active:scale-[0.98] cursor-pointer"
              >
                <span className="flex items-center justify-center gap-2">
                  Ver Planos
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlanUpgradeModal;
