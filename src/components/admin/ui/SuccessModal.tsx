import React from "react";
import { CheckCircle, X } from "lucide-react";

interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  message: string;
  additionalInfo?: string | Record<string, string>;
}

const SuccessModal: React.FC<SuccessModalProps> = ({
  isOpen,
  onClose,
  message,
  additionalInfo,
}) => {
  if (!isOpen) return null;

  const renderAdditionalInfo = () => {
    if (!additionalInfo) return null;

    if (typeof additionalInfo === "string") {
      return <p className="text-sm text-gray-600 mt-2">{additionalInfo}</p>;
    }

    return (
      <div className="mt-4 bg-gray-50 p-4 rounded-md border border-gray-200">
        {Object.entries(additionalInfo).map(([key, value]) => (
          <div
            key={key}
            className="flex items-center justify-between mb-1 last:mb-0"
          >
            <span className="text-sm font-medium text-gray-700">
              {key.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase())}:
            </span>
            <span className="text-sm font-semibold text-gray-900 bg-white px-3 py-1 rounded border border-gray-200">
              {value}
            </span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4 animate-in fade-in-0 zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Operação realizada com sucesso
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle size={20} className="text-green-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-600">{message}</p>
              {renderAdditionalInfo()}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50 rounded-b-lg">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-white bg-violet-600 rounded-md hover:bg-violet-700 transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};

export default SuccessModal;
