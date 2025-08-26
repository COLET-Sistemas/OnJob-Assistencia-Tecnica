"use client";

import api from "@/api/api";
import { useTitle } from "@/context/TitleContext";
import { Save, AlertCircle, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { Loading } from "@/components/LoadingPersonalizado";
import { useToast } from "@/components/admin/ui/ToastContainer";
import PageHeader from "@/components/admin/ui/PageHeader";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

interface FormData {
  descricao: string;
  situacao: string;
}

const EditarMotivoAtendimento = (props: PageProps) => {
  const params = React.use(props.params);
  const id = parseInt(params.id);
  const router = useRouter();
  const { setTitle } = useTitle();
  const { showSuccess, showError } = useToast();
  const [savingData, setSavingData] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState<FormData>({
    descricao: "",
    situacao: "A",
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setTitle("Editar Motivo de Atendimento");
  }, [setTitle]);

  useEffect(() => {
    const carregarDados = async () => {
      setLoading(true);
      try {
        const response = await api.get(`/motivos_atendimento?id=${id}`);

        if (response && response.length > 0) {
          const motivo = response[0];
          setFormData({
            descricao: motivo.descricao,
            situacao: motivo.situacao,
          });
        } else {
          throw new Error("Motivo de atendimento não encontrado");
        }
      } catch (error) {
        console.error("Erro ao carregar motivo de atendimento:", error);
        showError(
          "Erro ao carregar dados",
          "Não foi possível carregar os dados do motivo. Tente novamente."
        );
        router.push("/admin/cadastro/motivos_atendimentos");
      } finally {
        setLoading(false);
      }
    };

    carregarDados();
  }, [id, router, showError]);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;

    setFormData((prev) => ({ ...prev, [name]: value }));

    if (formErrors[name]) {
      setFormErrors((prev) => {
        const updated = { ...prev };
        delete updated[name];
        return updated;
      });
    }
  };

  const validarFormulario = () => {
    const errors: Record<string, string> = {};

    if (!formData.descricao) errors.descricao = "Campo obrigatório";
    if (!formData.situacao) errors.situacao = "Campo obrigatório";

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validarFormulario()) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    setSavingData(true);

    try {
      const response = await api.put(`/motivos_atendimento?id=${id}`, {
        descricao: formData.descricao,
        situacao: formData.situacao,
      });

      router.push("/admin/cadastro/motivos_atendimentos");

      showSuccess(
        "Atualização realizada!",
        response // Passa a resposta diretamente, o ToastContainer extrai a mensagem
      );
    } catch (error) {
      console.error("Erro ao atualizar motivo de atendimento:", error);

      showError(
        "Erro ao atualizar",
        error as Record<string, unknown> // Passa o erro diretamente, o ToastContainer extrai a mensagem
      );
    } finally {
      setSavingData(false);
    }
  };

  if (loading) {
    return (
      <Loading
        fullScreen={true}
        preventScroll={false}
        text="Carregando motivos de atendimento..."
        size="large"
      />
    );
  }

  return (
    <>
      <PageHeader
        title="Editar Motivo de Atendimento"
        config={{
          type: "form",
          backLink: "/admin/cadastro/motivos_atendimentos",
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
                  Edite os dados do motivo de atendimento
                </p>
              </header>

              <div className="space-y-6">
                {/* Descrição */}
                <div className="space-y-1">
                  <label
                    htmlFor="descricao"
                    className="block text-sm font-medium text-slate-700 transition-colors"
                  >
                    Descrição do Motivo
                    <span
                      className="text-red-500 ml-1"
                      aria-label="obrigatório"
                    >
                      *
                    </span>
                  </label>

                  <div className="relative">
                    <input
                      type="text"
                      id="descricao"
                      name="descricao"
                      value={formData.descricao}
                      onChange={handleInputChange}
                      placeholder="Ex: Solicitação de informações, Reclamação, Sugestão..."
                      className={`
                        w-full px-4 py-3 rounded-lg border transition-all duration-200
                        focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500
                        placeholder:text-slate-400 text-slate-900
                        ${
                          formErrors.descricao
                            ? "border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-500/20"
                            : "border-slate-300 bg-white hover:border-slate-400"
                        }
                      `}
                      aria-invalid={!!formErrors.descricao}
                    />
                  </div>

                  {formErrors.descricao && (
                    <div
                      role="alert"
                      className="flex items-center gap-1 text-sm text-red-600 animate-in fade-in slide-in-from-top-1 duration-200"
                    >
                      <AlertCircle className="h-4 w-4 flex-shrink-0" />
                      <span>{formErrors.descricao}</span>
                    </div>
                  )}
                </div>

                {/* Situação */}
                <div className="space-y-1">
                  <label
                    htmlFor="situacao"
                    className="block text-sm font-medium text-slate-700 transition-colors"
                  >
                    Situação
                    <span
                      className="text-red-500 ml-1"
                      aria-label="obrigatório"
                    >
                      *
                    </span>
                  </label>

                  <div className="relative">
                    <select
                      id="situacao"
                      name="situacao"
                      value={formData.situacao}
                      onChange={handleInputChange}
                      className={`
                        w-full px-4 py-3 rounded-lg border transition-all duration-200
                        focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500
                        text-slate-900
                        ${
                          formErrors.situacao
                            ? "border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-500/20"
                            : "border-slate-300 bg-white hover:border-slate-400"
                        }
                      `}
                      aria-invalid={!!formErrors.situacao}
                    >
                      <option value="A">Ativo</option>
                      <option value="I">Inativo</option>
                    </select>
                  </div>

                  {formErrors.situacao && (
                    <div
                      role="alert"
                      className="flex items-center gap-1 text-sm text-red-600 animate-in fade-in slide-in-from-top-1 duration-200"
                    >
                      <AlertCircle className="h-4 w-4 flex-shrink-0" />
                      <span>{formErrors.situacao}</span>
                    </div>
                  )}
                </div>
              </div>
            </section>
          </div>

          {/* Footer com botões */}
          <footer className="bg-slate-50 px-8 py-6 border-t border-slate-200">
            <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
              <Link
                href="/admin/cadastro/motivos_atendimentos"
                className="px-6 py-3 text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 hover:border-slate-400 transition-colors text-center font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500"
              >
                Cancelar
              </Link>

              <button
                type="submit"
                disabled={savingData}
                className="relative px-6 py-3 rounded-lg font-medium transition-all duration-200 bg-[var(--primary)] text-white hover:bg-violet-700 focus:ring-violet-500 shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {savingData && (
                  <Loader2 className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-5 w-5 animate-spin" />
                )}
                <span
                  className={`${
                    savingData ? "opacity-0" : "opacity-100"
                  } flex items-center justify-center gap-2`}
                >
                  <Save className="h-4 w-4" />
                  <span>Atualizar</span>
                </span>
              </button>
            </div>
          </footer>
        </form>
      </main>
    </>
  );
};

export default EditarMotivoAtendimento;
