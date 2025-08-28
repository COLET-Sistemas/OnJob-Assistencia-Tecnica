"use client";

import { usuariosAPI, regioesAPI, usuariosRegioesAPI } from "@/api/api";
import { useTitle } from "@/context/TitleContext";
import { Save, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useToast } from "@/components/admin/ui/ToastContainer";
import PageHeader from "@/components/admin/ui/PageHeader";
import { MultiSelect } from "@/components/admin/form";

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

interface UsuarioRegiao {
  id_usuario: number;
  nome_usuario: string;
  id_regiao: number;
  nome_regiao: string;
  data_cadastro: string;
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
  success: "Associação de técnico e regiões atualizada com sucesso!",
  error: "Erro ao atualizar associações. Verifique os dados e tente novamente.",
  loading: "Carregando informações do técnico e suas regiões...",
  notFound: "Técnico não encontrado",
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
const EditarTecnicosRegioes: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const userId = searchParams.get("id");

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
  const [tecnico, setTecnico] = useState<Usuario | null>(null);
  const [regioes, setRegioes] = useState<Regiao[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Definir título da página e carregar dados iniciais
  useEffect(() => {
    setTitle("Gerenciar Regiões do Técnico");

    const fetchData = async () => {
      if (!userId) {
        showError("Erro", { message: "ID do técnico não especificado" });
        router.push("/admin/cadastro/tecnicos_regioes");
        return;
      }

      try {
        // Carregar em paralelo para melhor performance
        const [tecnicoResponse, regioesResponse, associacoesResponse] =
          await Promise.all([
            // Carregar apenas o técnico específico pelo ID usando parâmetro id
            usuariosAPI
              .getAll({ id: Number(userId) })
              .then((response) => response[0]),

            // Carregar todas as regiões disponíveis
            regioesAPI.getAll(),

            // Carregar associações existentes para o técnico
            usuariosRegioesAPI.getAll({
              id_usuario: userId,
              incluir_inativos: "S",
            }),
          ]);

        // Atualizar estados com os dados obtidos
        setTecnico(tecnicoResponse); // Armazenar apenas o técnico específico
        setRegioes(regioesResponse);

        // Preparar regiões selecionadas com base nas associações existentes
        const regioesDoTecnico = (associacoesResponse || []).map(
          (assoc: UsuarioRegiao) => ({
            value: assoc.id_regiao,
            label: `${
              regioesResponse.find((r: Regiao) => r.id === assoc.id_regiao)
                ?.nome || assoc.nome_regiao
            } - ${
              regioesResponse.find((r: Regiao) => r.id === assoc.id_regiao)
                ?.uf || ""
            }`,
          })
        );

        // Atualizar formulário com dados existentes - o técnico já foi carregado diretamente pelo ID
        setFormData({
          id_usuario: Number(userId),
          regioes: regioesDoTecnico,
        });
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
        showError("Erro ao carregar dados", error as Record<string, unknown>);
        router.push("/admin/cadastro/tecnicos_regioes");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [setTitle, showError, userId, router]);

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
        // Extrair os ids das regiões selecionadas
        const regioesIds = formData.regioes.map((r) => Number(r.value));

        // Enviar uma única requisição com o id do usuário e todas as regiões
        await usuariosRegioesAPI.update(formData.id_usuario!, {
          id_usuario: formData.id_usuario!,
          id_regiao: regioesIds,
        });

        router.push("/admin/cadastro/tecnicos_regioes");

        showSuccess(
          "Atualização realizada!",
          `Associações do técnico atualizadas com sucesso!`
        );
      } catch (error) {
        console.error("Erro ao atualizar associações:", error);

        showError("Erro ao atualizar", error as Record<string, unknown>);
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
        <>
          <PageHeader
            title="Gerenciar Regiões do Técnico"
            config={{
              type: "form",
              backLink: "/admin/cadastro/tecnicos_regioes",
              backLabel: "Voltar para lista de técnicos X regiões",
            }}
          />
          <div className="bg-blue-50 p-4 rounded-lg mb-6 border border-blue-100">
            <p className="text-blue-700 text-sm">
              Adicione ou remova regiões de atendimento para este técnico. O
              técnico permanecerá o mesmo.
            </p>
          </div>
        </>
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
                <div className="mb-6">
                  <h3 className="font-semibold text-lg text-slate-800 mb-3">
                    Detalhes do Técnico
                  </h3>
                  <div className="p-4 border border-slate-200 rounded-lg bg-slate-50 flex items-center">
                    <div className="bg-[var(--primary)] text-white p-2 rounded-full mr-3 flex items-center justify-center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
                        <circle cx="12" cy="7" r="4"></circle>
                      </svg>
                    </div>
                    {tecnico && (
                      <div className="flex flex-col">
                        <span className="font-medium text-gray-900">
                          {tecnico.nome}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-500">
                            Login: {tecnico.login}
                          </span>
                          <span className="h-1 w-1 rounded-full bg-slate-300"></span>
                          <span className="text-xs text-slate-500">
                            ID: {tecnico.id}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="mt-2 text-xs text-slate-500 italic">
                    Não é possível alterar o técnico nesta tela. Para associar
                    outro técnico às regiões, volte à lista e crie uma nova
                    associação.
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-lg text-slate-800 mb-3">
                    Gerenciar Regiões
                  </h3>
                  <div className="p-4 border border-slate-200 rounded-lg mb-4">
                    <div className="flex items-center mb-3">
                      <div className="bg-green-100 text-green-800 p-1.5 rounded-full mr-3 flex items-center justify-center">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path>
                          <circle cx="12" cy="10" r="3"></circle>
                        </svg>
                      </div>
                      <span className="font-medium text-slate-700">
                        Selecione as regiões que este técnico pode atender
                      </span>
                    </div>

                    <MultiSelect
                      label="Regiões de Atendimento"
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

                    <div className="mt-3 text-xs text-slate-500">
                      Um técnico pode atender a múltiplas regiões. Selecione
                      todas as regiões em que este técnico deve estar
                      disponível.
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* Footer com botões */}
          <footer className="bg-slate-50 px-8 py-6 border-t border-slate-200">
            <div className="flex flex-col sm:flex-row gap-3 sm:justify-between">
              <div>
                {formData.regioes.length > 0 ? (
                  <div className="text-sm text-slate-600 flex items-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="mr-2 text-green-600"
                    >
                      <path d="M20 6 9 17l-5-5"></path>
                    </svg>
                    {formData.regioes.length}{" "}
                    {formData.regioes.length === 1
                      ? "região selecionada"
                      : "regiões selecionadas"}
                  </div>
                ) : (
                  <div className="text-sm text-amber-600 flex items-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="mr-2"
                    >
                      <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                      <line x1="12" x2="12" y1="9" y2="13"></line>
                      <line x1="12" x2="12.01" y1="17" y2="17"></line>
                    </svg>
                    Nenhuma região selecionada
                  </div>
                )}
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
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
                    <span>Salvar Alterações</span>
                  </span>
                </LoadingButton>
              </div>
            </div>
          </footer>
        </form>
      </main>
    </>
  );
};

export default EditarTecnicosRegioes;
