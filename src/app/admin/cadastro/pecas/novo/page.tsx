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
    <div className="px-2">
      <div className="max-w-8xl mx-auto">
        <PageHeader
          title="Cadastro de Peças"
          config={{
            type: "form",
            backLink: "/admin/cadastro/pecas",
            backLabel: "Voltar para lista de peças",
          }}
        />
        <div className="bg-white rounded-lg shadow-lg overflow-hidden transition-all duration-300 hover:shadow-xl border-t-4 border-[var(--primary)]">
          <form onSubmit={handleSubmit} className="p-8">
            {/* Se houver erros, mostrar alerta */}
            {Object.keys(formErrors).length > 0 && (
              <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-md shadow-sm">
                <h4 className="font-medium mb-1 text-red-700">
                  Por favor, corrija os seguintes erros:
                </h4>
                <ul className="list-disc list-inside">
                  {Object.entries(formErrors).map(([field, message]) => (
                    <li key={field}>{message}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Informações básicas da peça */}

            <div className="mb-6">
              <div className="flex flex-wrap gap-4">
                {/* Código da peça */}
                <div className="w-[20%]">
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
                <div className="flex-1">
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
                <div className="w-[15%]">
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

            {/* Botões do formulário */}
            <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200">
              <Link
                href="/admin/cadastro/pecas"
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors duration-200 font-medium flex items-center gap-2"
              >
                Cancelar
              </Link>
              <LoadingButton
                type="submit"
                isLoading={savingData}
                className="bg-[var(--primary)] text-white hover:bg-[var(--primary)]/90"
              >
                <span className="flex items-center justify-center gap-2">
                  <Save className="h-4 w-4" />
                  <span>Salvar</span>
                </span>
              </LoadingButton>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CadastrarPeca;
