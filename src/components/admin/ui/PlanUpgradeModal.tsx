"use client";

import React from "react";
import { Lock, X, Zap, Crown } from "lucide-react";
import { useRouter } from "next/navigation";

interface PlanUpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PlanUpgradeModal: React.FC<PlanUpgradeModalProps> = ({
  isOpen,
  onClose,
}) => {
  const router = useRouter();

  const handleKnowPlans = () => {
    onClose();
    router.push("/admin/planos");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-md transform rounded-lg bg-white p-6 shadow-xl transition-all">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-amber-100 rounded-full">
                <Lock className="h-5 w-5 text-amber-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">
                Recurso Premium
              </h3>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div className="text-center mb-6">
            <div className="mb-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-amber-100 to-orange-100 rounded-full mb-3">
                <Crown className="h-4 w-4 text-amber-600" />
                <span className="text-sm font-medium text-amber-800">
                  Premium Feature
                </span>
              </div>
            </div>

            <p className="text-gray-600 text-sm leading-relaxed mb-4">
              Este recurso só está disponível nos planos <strong>GOLD</strong> e{" "}
              <strong>PLATINUM</strong>. Conheça nossos planos.
            </p>

            <div className="bg-gradient-to-r from-violet-50 to-indigo-50 rounded-lg p-4 mb-4">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Zap className="h-4 w-4 text-violet-600" />
                <span className="text-sm font-medium text-violet-800">
                  Upgrade para acessar
                </span>
              </div>
              <p className="text-xs text-violet-600">
                Técnicos Terceirizados e outros recursos avançados
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              Fechar
            </button>
            <button
              onClick={handleKnowPlans}
              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-violet-600 to-indigo-600 rounded-lg hover:from-violet-700 hover:to-indigo-700 transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-violet-500 shadow-sm"
            >
              Conhecer Planos
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlanUpgradeModal;
