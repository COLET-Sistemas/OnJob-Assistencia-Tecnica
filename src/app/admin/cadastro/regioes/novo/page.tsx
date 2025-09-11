"use client";

import { regioesService } from "@/api/services";
import { useTitle } from "@/context/TitleContext";
import { FormData } from "@/types/admin/cadastro/regioes";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useToast } from "@/components/admin/ui/ToastContainer";
import {
  InputField,
  SelectField,
  LoadingButton,
} from "@/components/admin/form";
import PageHeader from "@/components/admin/ui/PageHeader";

const CadastrarRegiao = () => {
  const router = useRouter();
  const { setTitle } = useTitle();
  const { showSuccess, showError } = useToast();
  const [savingData, setSavingData] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Set page title when component mounts
  useEffect(() => {
    setTitle("Regiões");
  }, [setTitle]);

  // Inicializar formulário com valores padrão
  const [formData, setFormData] = useState<FormData>({
    nome: "",
    descricao: "",
    uf: "RS",
    atendida_empresa: true,
    situacao: "A",
  });

  // Lista de UFs brasileiras
  const ufs = [
    "AC",
    "AL",
    "AP",
    "AM",
    "BA",
    "CE",
    "DF",
    "ES",
    "GO",
    "MA",
    "MT",
    "MS",
    "MG",
    "PA",
    "PB",
    "PR",
    "PE",
    "PI",
    "RJ",
    "RN",
    "RS",
    "RO",
    "RR",
    "SC",
    "SP",
    "SE",
    "TO",
  ];

  // Manipular mudanças nos campos do formulário
  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value, type } = e.target;

    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }

    // Limpar erro do campo quando o usuário começa a digitar
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  // Validar formulário antes de enviar
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.nome.trim()) {
      errors.nome = "Nome da região é obrigatório";
    }

    if (!formData.descricao.trim()) {
      errors.descricao = "Descrição é obrigatória";
    }

    if (!formData.uf) {
      errors.uf = "UF é obrigatória";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Enviar formulário
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setSavingData(true);

    try {
      // Create an object that matches what the API expects
      const regiaoData = {
        nome: formData.nome,
        descricao: formData.descricao,
        uf: formData.uf,
        atendida_empresa: formData.atendida_empresa,
        situacao: formData.situacao,
      };

      const response = await regioesService.create(regiaoData);

      router.push("/admin/cadastro/regioes");

      showSuccess(
        "Cadastro realizado!",
        response as unknown as Record<string, unknown>
      );
    } catch (error) {
      console.error("Erro ao cadastrar região:", error);

      showError(
        "Erro ao cadastrar",
        error as Record<string, unknown> // Passa o erro diretamente, o ToastContainer extrai a mensagem
      );
    } finally {
      setSavingData(false);
    }
  };

  // Loading state handled directly in the component

  return (
    <>
      <PageHeader
        title="Cadastro de Região"
        config={{
          type: "form",
          backLink: "/admin/cadastro/regioes",
          backLabel: "Voltar para lista de regiões",
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Nome da região */}
                  <div>
                    <InputField
                      label="Nome da Região"
                      name="nome"
                      value={formData.nome}
                      error={formErrors.nome}
                      placeholder="Ex: Porto Alegre, Região Sul, etc."
                      required
                      onChange={handleInputChange}
                    />
                  </div>

                  {/* Descrição */}
                  <div>
                    <InputField
                      label="Descrição"
                      name="descricao"
                      value={formData.descricao}
                      error={formErrors.descricao}
                      placeholder="Descrição detalhada da região"
                      required
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* UF */}
                  <div>
                    <SelectField
                      label="UF"
                      name="uf"
                      value={formData.uf}
                      error={formErrors.uf}
                      required
                      onChange={handleInputChange}
                      options={ufs.map((uf) => ({ value: uf, label: uf }))}
                    />
                  </div>

                  {/* Atendida pela empresa (Sim/Não) */}
                  <div className="flex flex-col justify-end pt-6">
                    <span className="block text-sm font-medium text-slate-700 mb-2">
                      Região atendida pela empresa
                    </span>
                    <div className="flex items-center gap-4">
                      <label className="flex items-center cursor-pointer">
                        <input
                          id="atendida_empresa_sim"
                          name="atendida_empresa"
                          type="radio"
                          checked={formData.atendida_empresa === true}
                          onChange={() =>
                            setFormData((prev) => ({
                              ...prev,
                              atendida_empresa: true,
                            }))
                          }
                          className="h-4 w-4 text-[var(--primary)] focus:ring-[var(--primary)] border-gray-300 rounded"
                        />
                        <span className="ml-2 text-sm text-gray-900">Sim</span>
                      </label>
                      <label className="flex items-center cursor-pointer">
                        <input
                          id="atendida_empresa_nao"
                          name="atendida_empresa"
                          type="radio"
                          checked={formData.atendida_empresa === false}
                          onChange={() =>
                            setFormData((prev) => ({
                              ...prev,
                              atendida_empresa: false,
                            }))
                          }
                          className="h-4 w-4 text-[var(--primary)] focus:ring-[var(--primary)] border-gray-300 rounded"
                        />
                        <span className="ml-2 text-sm text-gray-900">Não</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* Footer com botões */}
          <footer className="bg-slate-50 px-8 py-6 border-t border-slate-200">
            <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
              <Link
                href="/admin/cadastro/regioes"
                className="px-6 py-3 text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 hover:border-slate-400 transition-colors text-center font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500"
              >
                Cancelar
              </Link>

              <LoadingButton
                type="submit"
                isLoading={savingData}
                className="bg-[var(--primary)] text-white hover:bg-violet-700 focus:ring-violet-500 shadow-sm"
              >
                <span>Salvar</span>
              </LoadingButton>
            </div>
          </footer>
        </form>
      </main>
    </>
  );
};

export default CadastrarRegiao;
