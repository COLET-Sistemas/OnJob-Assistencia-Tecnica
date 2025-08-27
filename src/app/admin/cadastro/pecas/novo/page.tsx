"use client";

import { pecasAPI } from "@/api/api";
import { useTitle } from "@/context/TitleContext";
import { useToast } from "@/components/admin/ui/ToastContainer";
import { Save } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import PageHeader from "@/components/admin/ui/PageHeader";
import {
  InputField,
  SelectField,
  LoadingButton,
} from "@/components/admin/form";

// Interface para o formulário
interface FormData {
  codigo_peca: string;
  descricao: string;
  unidade_medida: string;
  situacao?: string;
}

const CadastrarPeca = () => {
  const router = useRouter();
  const { setTitle } = useTitle();
  const { showSuccess, showError } = useToast();
  const [savingData, setSavingData] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    setTitle("Peças");
  }, [setTitle]);

  const [formData, setFormData] = useState<FormData>({
    codigo_peca: "",
    descricao: "",
    unidade_medida: "UN",
  });

  const unidadesMedida = [
    "PC",
    "UN",
    "KG",
    "G",
    "L",
    "ML",
    "M",
    "CM",
    "MM",
    "M²",
    "M³",
  ];

  // Manipular mudanças nos campos do formulário
  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value, type } = e.target;
    let newValue = value;
    if (name === "codigo_peca") {
      newValue = value.toUpperCase();
    }
    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: newValue }));
    }
    // Limpar erro do campo quando o usuário começa a digitar
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  // Validar formulário antes de enviar
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.codigo_peca.trim()) {
      errors.codigo_peca = "Código da peça é obrigatório";
    }

    if (!formData.descricao.trim()) {
      errors.descricao = "Descrição é obrigatória";
    }

    if (!formData.unidade_medida) {
      errors.unidade_medida = "Unidade de medida é obrigatória";
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
      // Adiciona o campo situacao como 'A' antes de enviar para a API
      const pecaData = {
        ...formData,
        situacao: "A",
      };

      const response = await pecasAPI.create(pecaData);
      showSuccess(
        "Sucesso",
        response // Passa a resposta diretamente, o ToastContainer extrai a mensagem
      );
      router.push("/admin/cadastro/pecas");
    } catch (error) {
      console.error("Erro ao cadastrar peça:", error);

      showError(
        "Erro ao cadastrar",
        error as Record<string, unknown> // Passa o erro diretamente, o ToastContainer extrai a mensagem
      );
    } finally {
      setSavingData(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Cadastro de Peça"
        config={{
          type: "form",
          backLink: "/admin/cadastro/pecas",
          backLabel: "Voltar para lista de peças",
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
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                  {/* Código da peça */}
                  <div className="md:col-span-3">
                    <InputField
                      label="Código da Peça"
                      name="codigo_peca"
                      value={formData.codigo_peca}
                      onChange={handleInputChange}
                      error={formErrors.codigo_peca}
                      placeholder="Ex: RBB-PRFT"
                      required
                    />
                  </div>

                  {/* Descrição */}
                  <div className="md:col-span-6">
                    <InputField
                      label="Descrição"
                      name="descricao"
                      value={formData.descricao}
                      onChange={handleInputChange}
                      error={formErrors.descricao}
                      placeholder="Ex: Rebimboca da Parafuseta"
                      required
                    />
                  </div>

                  {/* Unidade de Medida */}
                  <div className="md:col-span-3">
                    <SelectField
                      label="Unidade"
                      name="unidade_medida"
                      value={formData.unidade_medida}
                      onChange={handleInputChange}
                      error={formErrors.unidade_medida}
                      required
                      options={unidadesMedida.map((unidade) => ({
                        value: unidade,
                        label: unidade,
                      }))}
                    />
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* Footer com botões */}
          <footer className="bg-slate-50 px-8 py-6 border-t border-slate-200">
            <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
              <Link
                href="/admin/cadastro/pecas"
                className="px-6 py-3 text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 hover:border-slate-400 transition-colors text-center font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500"
              >
                Cancelar
              </Link>

              <LoadingButton
                type="submit"
                isLoading={savingData}
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

export default CadastrarPeca;
