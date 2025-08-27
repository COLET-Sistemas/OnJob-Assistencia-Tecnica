"use client";

import { usuariosAPI, regioesAPI, usuariosRegioesAPI } from "@/api/api";
import { useTitle } from "@/context/TitleContext";
import { Save, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useToast } from "@/components/admin/ui/ToastContainer";
import PageHeader from "@/components/admin/ui/PageHeader";
import { SelectField, MultiSelect } from "@/components/admin/form";

interface Usuario {
  id: number;
  login: string;
  nome: string;
  email: string;
  perfil_tecnico_proprio: boolean;
  perfil_tecnico_terceirizado: boolean;
  situacao: string;
  empresa?: {
    id_empresa: number;
    razao_social: string;
  };
}

interface Regiao {
  id: number;
  nome: string;
  descricao: string;
  uf: string;
  atendida_empresa: boolean;
  situacao: string;
}

interface FormData {
  id_usuario: number | null;
  regioes: { value: string | number; label: string }[];
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
  success: "Associação de técnico e regiões cadastrada com sucesso!",
  error: "Erro ao cadastrar associações. Verifique os dados e tente novamente.",
} as const;

// Hook customizado para validação simplificada
const useFormValidation = () => {
  const validateForm = useCallback((formData: FormData): FormValidation => {
    const errors: FormErrors = {};

    // Validação para os campos de seleção
    if (!formData.id_usuario) {
      errors.id_usuario = MESSAGES.required;
    }

    if (!formData.regioes || formData.regioes.length === 0) {
      errors.regioes = MESSAGES.required;
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
const CadastrarTecnicosRegioes: React.FC = () => {
  const router = useRouter();
  const { setTitle } = useTitle();
  const { validateForm } = useFormValidation();
  const { showSuccess, showError } = useToast();

  // Estados
  const [formData, setFormData] = useState<FormData>({
    id_usuario: null,
    regioes: [],
  });
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tecnicos, setTecnicos] = useState<Usuario[]>([]);
  const [regioes, setRegioes] = useState<Regiao[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Definir título da página e carregar dados iniciais
  useEffect(() => {
    setTitle("Técnicos e Regiões");

    const fetchData = async () => {
      try {
        // Carregar técnicos
        const tecnicosResponse = await usuariosAPI.getAll({
          apenas_tecnicos: "S",
        });
        setTecnicos(tecnicosResponse);

        // Carregar regiões
        const regioesResponse = await regioesAPI.getAll();
        setRegioes(regioesResponse);
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
        showError("Erro ao carregar dados", error as Record<string, unknown>);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [setTitle, showError]);

  // Manipulador otimizado de mudanças nos campos
  const handleSelectChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const { name, value } = e.target;
      const numValue = value ? parseInt(value, 10) : null;

      setFormData((prev) => ({ ...prev, [name]: numValue }));

      // Limpar erro do campo quando usuário selecionar (apenas se já existe erro)
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

  // Manipulador para o multi-select de regiões
  const handleRegioesChange = useCallback(
    (selectedOptions: { value: string | number; label: string }[]) => {
      setFormData((prev) => ({
        ...prev,
        regioes: selectedOptions as { value: number; label: string }[],
      }));

      // Limpar erro do campo quando usuário selecionar (apenas se já existe erro)
      if (formErrors.regioes) {
        setFormErrors((prev) => {
          const updated = { ...prev };
          delete updated.regioes;
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
        // Criar associações para cada região selecionada
        const promises = formData.regioes.map((regiao) =>
          usuariosRegioesAPI.create({
            id_usuario: formData.id_usuario!,
            id_regiao: regiao.value as number,
          })
        );

        await Promise.all(promises);

        router.push("/admin/cadastro/tecnicos_regioes");

        showSuccess(
          "Cadastro realizado!",
          `Técnico associado a ${formData.regioes.length} ${
            formData.regioes.length === 1 ? "região" : "regiões"
          } com sucesso!`
        );
      } catch (error) {
        console.error("Erro ao associar técnico às regiões:", error);

        showError("Erro ao cadastrar", error as Record<string, unknown>);
      } finally {
        setIsSubmitting(false);
      }
    },
    [formData, validateForm, router, showSuccess, showError]
  );

  return (
    <>
      {isLoading ? (
        <div className="flex justify-center items-center h-32">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--primary)]" />
        </div>
      ) : (
        <PageHeader
          title="Associação de Técnico às Regiões"
          config={{
            type: "form",
            backLink: "/admin/cadastro/tecnicos_regioes",
            backLabel: "Voltar para lista de técnicos X regiões",
          }}
        />
      )}

      <main>
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden"
          noValidate
        >
          <div className="p-8">
            <section>
              <div className="space-y-6">
                <SelectField
                  label="Técnico"
                  name="id_usuario"
                  value={formData.id_usuario || ""}
                  error={formErrors.id_usuario}
                  required
                  onChange={handleSelectChange}
                  options={[
                    { value: "", label: "Selecione um técnico" },
                    ...tecnicos.map((tecnico) => ({
                      value: tecnico.id,
                      label: `${tecnico.nome} (${tecnico.login})`,
                    })),
                  ]}
                />

                <MultiSelect
                  label="Regiões"
                  name="regioes"
                  value={formData.regioes}
                  error={formErrors.regioes}
                  required
                  onChange={handleRegioesChange}
                  options={regioes.map((regiao) => ({
                    value: regiao.id,
                    label: `${regiao.nome} - ${regiao.uf} (${regiao.descricao})`,
                  }))}
                  placeholder="Selecione uma ou mais regiões"
                />
              </div>
            </section>
          </div>

          {/* Footer com botões */}
          <footer className="bg-slate-50 px-8 py-6 border-t border-slate-200">
            <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
              <Link
                href="/admin/cadastro/tecnicos_regioes"
                className="px-6 py-3 text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 hover:border-slate-400 transition-colors text-center font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500"
              >
                Cancelar
              </Link>

              <LoadingButton
                type="submit"
                isLoading={isSubmitting}
                className="bg-[var(--primary)] text-white hover:bg-violet-700 focus:ring-violet-500 shadow-sm"
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

export default CadastrarTecnicosRegioes;
