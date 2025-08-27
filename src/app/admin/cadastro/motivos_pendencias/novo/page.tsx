"use client";

import { motivosPendenciaAPI } from "@/api/api";
import { useTitle } from "@/context/TitleContext";
import { Save, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { useToast } from "@/components/admin/ui/ToastContainer";
import PageHeader from "@/components/admin/ui/PageHeader";
import { InputField } from "@/components/admin/form";

interface FormData {
  descricao: string;
}

interface FormErrors {
  [key: string]: string;
}

interface FormValidation {
  isValid: boolean;
  errors: FormErrors;
}

// Constants para evitar magic numbers e facilitar manutenção
const MESSAGES = {
  required: "Este campo é obrigatório",
  success: "Motivo de pendência cadastrado com sucesso!",
  error:
    "Erro ao cadastrar motivo de pendência. Verifique os dados e tente novamente.",
} as const;

// Hook customizado para validação simplificada
const useFormValidation = () => {
  const validateForm = useCallback((formData: FormData): FormValidation => {
    const errors: FormErrors = {};

    // Validar apenas se o campo não está vazio
    if (!formData.descricao.trim()) {
      errors.descricao = MESSAGES.required;
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  }, []);

  return { validateForm };
};

// Componente de Loading Button
interface LoadingButtonProps {
  isLoading: boolean;
  children: React.ReactNode;
  className?: string;
  type?: "button" | "submit";
  disabled?: boolean;
  onClick?: () => void;
}

const LoadingButton: React.FC<LoadingButtonProps> = ({
  isLoading,
  children,
  className = "",
  type = "button",
  disabled = false,
  onClick,
}) => (
  <button
    type={type}
    disabled={isLoading || disabled}
    onClick={onClick}
    className={`
      relative px-6 py-3 rounded-lg font-medium transition-all duration-200
      focus:outline-none focus:ring-2 focus:ring-offset-2
      disabled:opacity-50 disabled:cursor-not-allowed
      ${className}
    `}
  >
    {isLoading && (
      <Loader2 className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-5 w-5 animate-spin" />
    )}
    <span className={isLoading ? "opacity-0" : "opacity-100"}>{children}</span>
  </button>
);

// Componente principal
const CadastrarMotivoPendencia: React.FC = () => {
  const router = useRouter();
  const { setTitle } = useTitle();
  const { validateForm } = useFormValidation();
  const { showSuccess, showError } = useToast();

  // Estados
  const [formData, setFormData] = useState<FormData>({ descricao: "" });
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Ref para o primeiro input
  const descricaoInputRef = useRef<HTMLInputElement>(null!);

  // Definir título da página e focar no input
  useEffect(() => {
    setTitle("Motivos de Pendências");
    descricaoInputRef.current?.focus();
  }, [setTitle]);

  // Manipulador otimizado de mudanças nos campos
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target;

      setFormData((prev) => ({ ...prev, [name]: value }));

      // Limpar erro do campo quando usuário digitar (apenas se já existe erro)
      if (formErrors[name]) {
        setFormErrors((prev) => {
          const updated = { ...prev };
          delete updated[name];
          return updated;
        });
      }
    },
    [formErrors]
  );

  // Envio do formulário
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      // Validar apenas no momento do submit
      const validation = validateForm(formData);

      if (!validation.isValid) {
        setFormErrors(validation.errors);
        // Scroll suave para o topo
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }

      setIsSubmitting(true);

      try {
        const response = await motivosPendenciaAPI.create({
          descricao: formData.descricao.trim(),
        });

        router.push("/admin/cadastro/motivos_pendencias");

        showSuccess(
          "Cadastro realizado!",
          response // Passa a resposta diretamente, o ToastContainer extrai a mensagem
        );
      } catch (error) {
        console.error("Erro ao cadastrar motivo de pendência:", error);

        showError(
          "Erro ao cadastrar",
          error as Record<string, unknown> // Passa o erro diretamente, o ToastContainer extrai a mensagem
        );
      } finally {
        setIsSubmitting(false);
      }
    },
    [formData, validateForm, router, showSuccess, showError]
  );

  return (
    <>
      <PageHeader
        title="Cadastro de Motivo de Pendência"
        config={{
          type: "form",
          backLink: "/admin/cadastro/motivos_pendencias",
          backLabel: "Voltar para lista de motivos",
        }}
      />

      <main>
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden"
          noValidate
        >
          <div className="p-8">
            <section>
              <header className="mb-6">
                <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                  <div className="w-2 h-2 bg-[var(--primary)] rounded-full" />
                  Informações do Motivo
                </h2>
                <p className="text-slate-600 text-sm mt-1">
                  Preencha os dados abaixo para cadastrar o motivo de pendência.
                </p>
              </header>

              <div className="space-y-6">
                <InputField
                  label="Descrição da Pendência"
                  name="descricao"
                  value={formData.descricao}
                  error={formErrors.descricao}
                  placeholder="Ex: Verificar o placeholeder Sugestão..."
                  required
                  onChange={handleInputChange}
                  inputRef={descricaoInputRef}
                />
              </div>
            </section>
          </div>

          {/* Footer com botões */}
          <footer className="bg-slate-50 px-8 py-6 border-t border-slate-200">
            <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
              <Link
                href="/admin/cadastro/motivos_pendencias"
                className="px-6 py-3 text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 hover:border-slate-400 transition-colors text-center font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500"
              >
                Cancelar
              </Link>

              <LoadingButton
                type="submit"
                isLoading={isSubmitting}
                className="bg-violet-600 text-white hover:bg-violet-700 focus:ring-violet-500 shadow-sm"
              >
                <span className="flex items-center justify-center gap-2">
                  <Save className="h-4 w-4" />
                  <span>Salvar</span>
                </span>
              </LoadingButton>
            </div>
          </footer>
        </form>
      </main>
    </>
  );
};

export default CadastrarMotivoPendencia;
