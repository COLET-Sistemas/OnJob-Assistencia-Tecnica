import React from "react";
import { motion } from "framer-motion";

interface CustomContatoFormProps {
  customContatoNome: string;
  setCustomContatoNome: (value: string) => void;
  customContatoEmail: string;
  setCustomContatoEmail: (value: string) => void;
  customContatoTelefone: string;
  setCustomContatoTelefone: (value: string) => void;
  customContatoWhatsapp: string;
  setCustomContatoWhatsapp: (value: string) => void;
}

const CustomContatoForm: React.FC<CustomContatoFormProps> = ({
  customContatoNome,
  setCustomContatoNome,
  customContatoEmail,
  setCustomContatoEmail,
  customContatoTelefone,
  setCustomContatoTelefone,
  customContatoWhatsapp,
  setCustomContatoWhatsapp,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.3 }}
      className="grid grid-cols-1 md:grid-cols-2 gap-4 overflow-hidden"
    >
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Nome do Contato <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={customContatoNome}
          onChange={(e) => setCustomContatoNome(e.target.value)}
          className={`w-full px-3 py-2 border text-gray-900 rounded-md shadow-sm 
            focus:outline-none focus:ring-[var(--primary)] focus:border-[var(--primary)] 
            transition-all duration-200
            ${
              !customContatoNome.trim() ? "border-red-300" : "border-gray-300"
            }`}
          placeholder="Nome do contato"
          required
        />
        {!customContatoNome.trim() && (
          <p className="text-red-500 text-sm mt-1 animate-pulse">
            Nome do contato é obrigatório
          </p>
        )}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Email
        </label>
        <input
          type="email"
          value={customContatoEmail}
          onChange={(e) => setCustomContatoEmail(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm 
            focus:outline-none focus:ring-[var(--primary)] focus:border-[var(--primary)]
            transition-all duration-200 hover:border-gray-400"
          placeholder="Email do contato"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Telefone
        </label>
        <input
          type="text"
          value={customContatoTelefone}
          onChange={(e) => setCustomContatoTelefone(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm 
            focus:outline-none focus:ring-[var(--primary)] focus:border-[var(--primary)]
            transition-all duration-200 hover:border-gray-400"
          placeholder="Telefone do contato"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          WhatsApp
        </label>
        <input
          type="text"
          value={customContatoWhatsapp}
          onChange={(e) => setCustomContatoWhatsapp(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm 
            focus:outline-none focus:ring-[var(--primary)] focus:border-[var(--primary)]
            transition-all duration-200 hover:border-gray-400"
          placeholder="WhatsApp do contato (opcional)"
        />
      </div>
    </motion.div>
  );
};

export default CustomContatoForm;
