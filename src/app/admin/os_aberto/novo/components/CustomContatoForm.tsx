import React from "react";
import { motion } from "framer-motion";

import { clientesService } from "@/api/services/clientesService";
import { ClienteContato } from "@/types/admin/cadastro/clientes";
import { useToast } from "@/components/admin/ui/ToastContainer";

interface CustomContatoFormProps {
  customContatoNome: string;
  setCustomContatoNome: (value: string) => void;
  customContatoNomeCompleto?: string;
  setCustomContatoNomeCompleto?: (value: string) => void;
  customContatoCargo?: string;
  setCustomContatoCargo?: (value: string) => void;
  customContatoEmail: string;
  setCustomContatoEmail: (value: string) => void;
  customContatoTelefone: string;
  setCustomContatoTelefone: (value: string) => void;
  customContatoWhatsapp: string;
  setCustomContatoWhatsapp: (value: string) => void;
  recebeAvisoOS?: boolean;
  setRecebeAvisoOS?: (value: boolean) => void;
  showNameError?: boolean;
  saveToClient?: boolean;
  setSaveToClient?: (value: boolean) => void;
  clienteId?: number;
  onContactSaved?: (savedContact: ClienteContato) => void;
}

const CustomContatoForm: React.FC<CustomContatoFormProps> = ({
  customContatoNome,
  setCustomContatoNome,
  customContatoNomeCompleto = "",
  setCustomContatoNomeCompleto = () => {},
  customContatoCargo = "",
  setCustomContatoCargo = () => {},
  customContatoEmail,
  setCustomContatoEmail,
  customContatoTelefone,
  setCustomContatoTelefone,
  customContatoWhatsapp,
  setCustomContatoWhatsapp,
  recebeAvisoOS = false,
  setRecebeAvisoOS = () => {},
  showNameError = false,
  saveToClient = false,
  setSaveToClient,
  clienteId,
  onContactSaved,
}) => {
  const { showSuccess, showError } = useToast();
  const [isSavingContact, setIsSavingContact] = React.useState(false);
  const [contactSaved, setContactSaved] = React.useState(false);
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
      className="grid grid-cols-1 gap-4 overflow-hidden"
    >
      {!contactSaved && setSaveToClient && clienteId && (
        <div className="border-b border-gray-200 pb-4 mb-2">
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={saveToClient}
              onChange={(e) => setSaveToClient(e.target.checked)}
              className="rounded text-[var(--primary)] focus:ring-[var(--primary)] h-4 w-4"
            />
            <span className="text-sm text-gray-700">
              Salvar este contato no cadastro do cliente
            </span>
          </label>
        </div>
      )}
      {contactSaved ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="text-center py-2 text-gray-600"
        >
          <p className="font-normal text-gregrayen-600">
            Deve selecionar o contato criado na lista de contato acima.
          </p>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nome ou Apelido <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={customContatoNome}
              onChange={(e) => setCustomContatoNome(e.target.value)}
              maxLength={20}
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

          {saveToClient && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome Completo <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={customContatoNomeCompleto}
                onChange={(e) => setCustomContatoNomeCompleto?.(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 text-gray-900 rounded-md shadow-sm
                focus:outline-none focus:ring-[var(--primary)] focus:border-[var(--primary)]
                transition-all duration-200"
                placeholder="Nome completo do contato"
                required
              />
              {showNameError && !customContatoNomeCompleto.trim() && (
                <p className="text-red-500 text-sm mt-1">
                  Nome Completo é obrigatório
                </p>
              )}
            </div>
          )}

          {saveToClient && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cargo
              </label>
              <input
                type="text"
                value={customContatoCargo}
                onChange={(e) => setCustomContatoCargo?.(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 text-gray-900 rounded-md shadow-sm
                focus:outline-none focus:ring-[var(--primary)] focus:border-[var(--primary)]
                transition-all duration-200"
                placeholder="Cargo do contato"
              />
            </div>
          )}

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
              <p className="text-red-500 text-sm mt-1">
                Digite um email válido
              </p>
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

          {saveToClient && (
            <div>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={recebeAvisoOS}
                  onChange={(e) => setRecebeAvisoOS?.(e.target.checked)}
                  className="rounded text-[var(--primary)] focus:ring-[var(--primary)] h-4 w-4"
                />
                <span className="text-sm text-gray-700">
                  Recebe aviso de OS
                </span>
              </label>
            </div>
          )}
        </div>
      )}
      {!contactSaved && saveToClient && clienteId && (
        <div className="mt-4">
          <button
            type="button"
            onClick={async () => {
              if (
                !customContatoNome.trim() ||
                (saveToClient && !customContatoNomeCompleto.trim())
              ) {
                return;
              }

              setIsSavingContact(true);

              try {
                const contatoData = {
                  nome: customContatoNome.trim(),
                  nome_completo: customContatoNomeCompleto?.trim() || undefined,
                  cargo: customContatoCargo?.trim() || undefined,
                  email: customContatoEmail.trim() || "",
                  telefone: customContatoTelefone.trim() || "",
                  whatsapp: customContatoWhatsapp.trim() || undefined,
                  situacao: "A",
                  recebe_aviso_os: recebeAvisoOS,
                };

                const result = await clientesService.createContact(
                  clienteId,
                  contatoData
                );

                showSuccess(
                  "Contato salvo com sucesso",
                  result.mensagem ||
                    "O contato foi adicionado à lista de contatos do cliente."
                );

                setContactSaved(true);

                if (onContactSaved) {
                  onContactSaved(result.contato);
                }
              } catch (error) {
                console.error("Erro ao salvar contato:", error);

                const errorMessage =
                  error instanceof Error
                    ? error.message
                    : "Ocorreu um erro ao salvar o contato.";

                if (
                  errorMessage.includes("cadastrado com sucesso") ||
                  errorMessage.includes("sucesso") ||
                  errorMessage.toLowerCase().includes("contato criado")
                ) {
                  showSuccess("Contato salvo com sucesso", errorMessage);

                  setContactSaved(true);

                  if (clienteId) {
                    try {
                      const contactsResponse =
                        await clientesService.getContacts(clienteId);
                      const lastContact =
                        contactsResponse.contatos[
                          contactsResponse.contatos.length - 1
                        ];
                      if (lastContact && onContactSaved) {
                        onContactSaved(lastContact);
                      }
                    } catch (fetchError) {
                      console.error(
                        "Erro ao buscar contato recém-criado:",
                        fetchError
                      );
                    }
                  }
                } else {
                  showError("Erro ao salvar contato", errorMessage);
                }
              } finally {
                setIsSavingContact(false);
              }
            }}
            disabled={
              isSavingContact ||
              !customContatoNome.trim() ||
              (saveToClient && !customContatoNomeCompleto.trim())
            }
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              isSavingContact ||
              !customContatoNome.trim() ||
              (saveToClient && !customContatoNomeCompleto.trim())
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-[var(--primary)] text-white hover:bg-violet-700"
            }`}
          >
            {isSavingContact ? (
              <>
                <span className="inline-block animate-spin mr-2">⏳</span>
                Salvando contato...
              </>
            ) : (
              "Salvar Contato"
            )}
          </button>
        </div>
      )}
    </motion.div>
  );
};

export default CustomContatoForm;
