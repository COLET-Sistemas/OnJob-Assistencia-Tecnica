"use client";

import api from "@/api/api";
import LicenseGuard from "@/components/admin/common/LicenseGuard";
import { useTitle } from "@/context/TitleContext";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { useToast } from "@/components/admin/ui/ToastContainer";
import PageHeader from "@/components/admin/ui/PageHeader";
import { InputField, LoadingButton } from "@/components/admin/form";

// Interfaces separadas para melhor organização
interface FormData {
  descricao: string;
  codigo_erp: string;
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
  success: "Tipo de peça cadastrado com sucesso!",
  error:
    "Erro ao cadastrar tipo de peça. Verifique os dados e tente novamente.",
} as const;

// Hook customizado para validação simplificada
const useFormValidation = () => {
  const validateForm = useCallback((formData: FormData): FormValidation => {
    const errors: FormErrors = {};

    // Validar se os campos obrigatórios não estão vazios
    if (!formData.descricao.trim()) {
      errors.descricao = MESSAGES.required;
    }

    if (!formData.codigo_erp.trim()) {
      errors.codigo_erp = MESSAGES.required;
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  }, []);

  return { validateForm };
};

// Componente principal
const CadastrarTipoPeca: React.FC = () => {
  const router = useRouter();
  const { setTitle } = useTitle();
  const { validateForm } = useFormValidation();
  const { showSuccess, showError } = useToast();

  // Estados
  const [formData, setFormData] = useState<FormData>({
    descricao: "",
    codigo_erp: "",
  });
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Ref para o primeiro input
  const descricaoInputRef = useRef<HTMLInputElement>(null!);

  // Definir título da página e focar no input
  useEffect(() => {
    setTitle("Tipos de Peças");
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
        const response = (await api.post("/tipos_pecas", {
          descricao: formData.descricao.trim(),
          codigo_erp: formData.codigo_erp.trim(),
        })) as Record<string, unknown>;

        router.push("/admin/cadastro/tipos_pecas");

        showSuccess(
          "Cadastro realizado!",
          response // Passa a resposta diretamente, o ToastContainer extrai a mensagem
        );
      } catch (error) {
        console.error("Erro ao cadastrar tipo de peça:", error);

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
    <LicenseGuard feature="tipos_pecas">
      <PageHeader
        title="Cadastro de Tipo de Peça"
        config={{
          type: "form",
          backLink: "/admin/cadastro/tipos_pecas",
          backLabel: "Voltar para lista de tipos",
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
              <div className="space-y-6">
                <InputField
                  label="Código ERP"
                  name="codigo_erp"
                  value={formData.codigo_erp}
                  error={formErrors.codigo_erp}
                  placeholder="Ex: PECA001..."
                  required
                  onChange={handleInputChange}
                />

                <InputField
                  label="Descrição do Tipo"
                  name="descricao"
                  value={formData.descricao}
                  error={formErrors.descricao}
                  placeholder="Ex: Ferramentas, Eletrônicos, Acessórios..."
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
                href="/admin/cadastro/tipos_pecas"
                className="px-6 py-3 text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 hover:border-slate-400 transition-colors text-center font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500"
              >
                Cancelar
              </Link>

              <LoadingButton
                type="submit"
                isLoading={isSubmitting}
                className="bg-[var(--primary)] text-white hover:bg-violet-700 focus:ring-violet-500 shadow-sm"
              >
                <span>Salvar</span>
              </LoadingButton>
            </div>
          </footer>
        </form>
      </main>
    </LicenseGuard>
  );
};

export default CadastrarTipoPeca;
