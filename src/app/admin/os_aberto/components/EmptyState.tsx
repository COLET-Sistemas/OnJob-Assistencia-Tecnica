import React from "react";
import { AlertCircle, Check } from "lucide-react";

interface EmptyStateProps {
  resetFilters: () => void;
}

const EmptyState: React.FC<EmptyStateProps> = ({ resetFilters }) => {
  return (
    <div className="text-center py-16 bg-white rounded-xl shadow-sm border border-gray-100 p-10 animate-fadeIn">
      <div className="mx-auto w-24 h-24 bg-indigo-50 rounded-full flex items-center justify-center mb-6">
        <AlertCircle className="w-12 h-12 text-indigo-400" />
      </div>
      <h3 className="text-xl font-bold text-gray-900 mb-3">
        Nenhuma OS encontrada
      </h3>
      <p className="text-gray-600 max-w-md mx-auto leading-relaxed mb-8">
        Não há ordens de serviço pendentes no momento ou que correspondam aos
        filtros aplicados.
      </p>
      <div className="flex justify-center gap-4">
        <button
          type="button"
          onClick={resetFilters}
          className="px-4 py-2 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg font-medium 
                   transition-colors transform hover:scale-105 active:scale-95 duration-200
                   flex items-center gap-2 shadow-sm"
        >
          <Check className="w-4 h-4" />
          Ativar todos os filtros
        </button>
      </div>
    </div>
  );
};

export default React.memo(EmptyState);
