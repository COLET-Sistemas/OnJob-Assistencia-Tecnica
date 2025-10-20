import React, { useState, useEffect } from "react";

interface OcorrenciaModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (descricao: string) => void;
  loading?: boolean;
  title?: string;
  label?: string;
  id_os?: number;
  required?: boolean; 
}

const OcorrenciaModal: React.FC<OcorrenciaModalProps> = ({
  open,
  onClose,
  onSave,
  loading = false,
  title = "Registrar Ocorrência",
  label = "Descrição da ocorrência (opcional)",
  required = false, 
}) => {
  const [descricao, setDescricao] = useState("");

  // Limpa o input quando o modal abre ou fecha
  useEffect(() => {
    if (!open) {
      setDescricao("");
    }
  }, [open]);

  const handleClose = () => {
    setDescricao("");
    onClose();
  };

  const handleSave = () => {
    onSave(descricao);
  };

  // Verifica se o botão deve estar desabilitado
  const isButtonDisabled = loading || (required && descricao.trim() === "");

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-sm">
        <h2 className="text-lg font-semibold mb-4 text-slate-900">{title}</h2>
        <label className="block text-sm text-slate-700 mb-2">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        <input
          type="text"
          className="w-full border border-slate-300 rounded-lg px-3 py-2 mb-4 
             focus:outline-none focus:ring-2 text-slate-600 focus:ring-[#7B54BE] 
             placeholder-slate-400"
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
          placeholder={
            required
              ? "Digite uma descrição (obrigatório)"
              : "Digite uma descrição"
          }
          disabled={loading}
          autoFocus
        />

        <div className="flex gap-3 mt-2">
          <button
            className="flex-1 px-4 py-2 rounded-lg bg-slate-100 text-slate-700 font-medium hover:bg-slate-200 transition-colors"
            onClick={handleClose}
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
              isButtonDisabled
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-[#7B54BE] text-white hover:bg-[#6841b1]"
            }`}
            onClick={handleSave}
            disabled={isButtonDisabled}
          >
            {loading ? "Salvando..." : "Prosseguir"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default OcorrenciaModal;
