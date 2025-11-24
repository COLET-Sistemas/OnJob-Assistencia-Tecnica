"use client";

import React from "react";
import { useLicenca } from "@/hooks";
import { Loading } from "@/components/LoadingPersonalizado";
import PlanUpgradeModal from "@/components/admin/ui/PlanUpgradeModal";
import { Lock, Crown } from "lucide-react";

interface LicenseGuardProps {
  children: React.ReactNode;
  feature: "pecas" | "tipos_pecas";
  fallback?: React.ReactNode;
}

const LicenseGuard: React.FC<LicenseGuardProps> = ({
  children,
  feature,
  fallback,
}) => {
  const { loading, isFeatureRestricted } = useLicenca();
  const [showModal, setShowModal] = React.useState(false);

  if (loading) {
    return (
      <Loading
        fullScreen={true}
        preventScroll={false}
        text="Verificando licença..."
        size="large"
      />
    );
  }

  const isRestricted = isFeatureRestricted(feature);

  if (isRestricted) {
    return (
      <>
        {fallback || (
          <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
              {/* Icon */}
              <div className="mb-6">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-amber-100 to-orange-100 rounded-2xl mb-4">
                  <Lock className="h-8 w-8 text-amber-600" />
                </div>
              </div>

              {/* Title */}
              <h1 className="text-2xl font-bold text-gray-900 mb-3">
                Recurso Premium
              </h1>

              {/* Description */}
              <p className="text-gray-600 mb-6 leading-relaxed">
                Este recurso só está disponível nos planos{" "}
                <strong className="text-amber-600">GOLD</strong> e{" "}
                <strong className="text-amber-600">PLATINUM</strong>.
              </p>

              {/* Premium Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-violet-100 to-indigo-100 rounded-full mb-6">
                <Crown className="h-4 w-4 text-violet-600" />
                <span className="text-sm font-medium text-violet-800">
                  Upgrade Necessário
                </span>
              </div>

              {/* Action Button */}
              <button
                onClick={() => setShowModal(true)}
                className="w-full px-6 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-violet-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                Conhecer Planos
              </button>

              {/* Additional Info */}
              <p className="text-xs text-gray-500 mt-4">
                Entre em contato para fazer upgrade do seu plano
              </p>
            </div>
          </div>
        )}

        {/* Modal */}
        <PlanUpgradeModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
        />
      </>
    );
  }

  return <>{children}</>;
};

export default LicenseGuard;
