import React, { useState } from "react";
import { CheckCircle, X, Copy, Check } from "lucide-react";

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
  const [copied, setCopied] = useState(false);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);

    // Reset copied status after 2 seconds
    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative bg-white rounded-lg shadow-xl max-w-lg w-full mx-4 animate-in fade-in-0 zoom-in-95 duration-200 overflow-hidden">
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
            <div className="flex-shrink-0 w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
              <CheckCircle size={20} className="text-purple-600" />
            </div>
            <div className="flex-1 break-words">
              <p className="text-sm text-gray-600 mb-2 whitespace-normal break-words">
                {message}
              </p>
              {additionalInfo &&
                (typeof additionalInfo === "string" ? (
                  <p className="text-sm text-gray-600 mt-2">{additionalInfo}</p>
                ) : (
                  <div className="mt-3">
                    {Object.entries(additionalInfo).map(([key, value]) => (
                      <div key={key}>
                        <p className="text-xs text-gray-500 mb-1">
                          {key
                            .replace(/_/g, " ")
                            .replace(/^\w/, (c) => c.toUpperCase())}
                          :
                        </p>
                        <div className="bg-purple-50 border border-purple-200 rounded-md p-3 flex items-center justify-between">
                          <p className="text-lg font-mono font-bold text-purple-800 break-all flex-1 mr-2">
                            {value}
                          </p>
                          <button
                            onClick={() => copyToClipboard(value)}
                            className="p-2 rounded-md bg-purple-200 hover:bg-purple-300 text-purple-800 transition-colors"
                            title="Copiar senha"
                          >
                            {copied ? (
                              <Check size={18} className="text-green-600" />
                            ) : (
                              <Copy size={18} />
                            )}
                          </button>
                        </div>
                        <p className="text-xs text-gray-500 mt-2 break-words">
                          Informe esta senha ao usuário. Ele deverá alterá-la no
                          primeiro acesso.
                        </p>
                      </div>
                    ))}
                  </div>
                ))}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50 rounded-b-lg">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700 transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};

export default SuccessModal;
