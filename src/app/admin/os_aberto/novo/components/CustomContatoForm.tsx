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
  showNameError?: boolean;
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
  showNameError = false,
}) => {
  // Função para aplicar máscara de telefone/celular brasileiro
  const applyPhoneMask = (value: string): string => {
    // Remove tudo que não é número
    const numbers = value.replace(/\D/g, "");

    // Aplica a máscara baseada no tamanho
    if (numbers.length <= 10) {
      // Telefone fixo: (11) 1234-5678
      return numbers
        .replace(/(\d{2})(\d)/, "($1) $2")
        .replace(/(\d{4})(\d)/, "$1-$2");
    } else {
      // Celular: (11) 91234-5678
      return numbers
        .replace(/(\d{2})(\d)/, "($1) $2")
        .replace(/(\d{5})(\d)/, "$1-$2");
    }
  };

  // Função para validar e formatar email em tempo real
  const formatEmail = (value: string): string => {
    // Remove espaços e converte para minúsculas
    return value.replace(/\s/g, "").toLowerCase();
  };

  // Handler para telefone
  const handleTelefoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const maskedValue = applyPhoneMask(e.target.value);
    setCustomContatoTelefone(maskedValue);
  };

  // Handler para WhatsApp
  const handleWhatsappChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const maskedValue = applyPhoneMask(e.target.value);
    setCustomContatoWhatsapp(maskedValue);
  };

  // Handler para email
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formattedEmail = formatEmail(e.target.value);
    setCustomContatoEmail(formattedEmail);
  };

  // Função para validar email
  const isValidEmail = (email: string): boolean => {
    if (!email) return true; // Campo opcional
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

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
              showNameError && !customContatoNome.trim()
                ? "border-red-300"
                : "border-gray-300"
            }`}
          placeholder="Nome do contato"
          required
        />
        {showNameError && !customContatoNome.trim() && (
          <p className="text-red-500 text-sm mt-1">
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
          onChange={handleEmailChange}
          className={`placeholder-gray-400 w-full px-3 py-2 border rounded-md shadow-sm
             focus:outline-none focus:ring-[var(--primary)] focus:border-[var(--primary)]
            transition-all duration-200 hover:border-gray-400 text-gray-700
            ${
              customContatoEmail && !isValidEmail(customContatoEmail)
                ? "border-red-300"
                : "border-gray-300"
            }`}
          placeholder="Email do contato (opcional)"
        />
        {customContatoEmail && !isValidEmail(customContatoEmail) && (
          <p className="text-red-500 text-sm mt-1">Digite um email válido</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Telefone
        </label>
        <input
          type="tel"
          value={customContatoTelefone}
          onChange={handleTelefoneChange}
          maxLength={15}
          className="placeholder-gray-400 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm
             focus:outline-none focus:ring-[var(--primary)] focus:border-[var(--primary)]
            transition-all duration-200 hover:border-gray-400 text-gray-700"
          placeholder="(11) 1234-5678"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          WhatsApp
        </label>
        <input
          type="tel"
          value={customContatoWhatsapp}
          onChange={handleWhatsappChange}
          maxLength={15}
          className="placeholder-gray-400 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm
             focus:outline-none focus:ring-[var(--primary)] focus:border-[var(--primary)]
            transition-all duration-200 hover:border-gray-400 text-gray-700"
          placeholder="(11) 91234-5678"
        />
      </div>
    </motion.div>
  );
};

export default CustomContatoForm;
