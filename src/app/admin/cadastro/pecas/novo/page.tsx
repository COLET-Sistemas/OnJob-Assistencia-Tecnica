"use client";

import { pecasService, tiposPecasService } from "@/api/services";
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
import CustomSelect, { OptionType } from "@/components/admin/form/CustomSelect";
import { UNIDADES_MEDIDA } from "@/utils/constants";

// Interface para o formulário
interface FormData {
  codigo_peca: string;
  descricao: string;
  unidade_medida: string;
  situacao?: string;
  id_tipo_peca?: number;
}

// Define TipoPecaOption to ensure type compatibility with CustomSelect's OptionType
// but also enforce that value is always a number for our specific use case
interface TipoPecaOption extends Omit<OptionType, "value"> {
  value: number;
}

const CadastrarPeca = () => {
  const router = useRouter();
  const { setTitle } = useTitle();
  const { showSuccess, showError } = useToast();
  const [savingData, setSavingData] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Estados para o tipo de peça
  const [tipoPecaInput, setTipoPecaInput] = useState("");
  const [tipoPecaOptions, setTipoPecaOptions] = useState<TipoPecaOption[]>([]);
  const [selectedTipoPeca, setSelectedTipoPeca] =
    useState<TipoPecaOption | null>(null);
  const [isSearchingTipoPeca, setIsSearchingTipoPeca] = useState(false);

  useEffect(() => {
    setTitle("Peças");
  }, [setTitle]);

  const [formData, setFormData] = useState<FormData>({
    codigo_peca: "",
    descricao: "",
    unidade_medida: "UN",
  });

  // Função para buscar tipos de peça quando o input tiver pelo menos 3 caracteres
  const handleTipoPecaInputChange = (inputValue: string) => {
    setTipoPecaInput(inputValue);

    if (inputValue.length >= 3 && !isSearchingTipoPeca) {
      setIsSearchingTipoPeca(true);
      searchTiposPeca(inputValue);
    }
  };

  const searchTiposPeca = async (term: string) => {
    try {
      const response = await tiposPecasService.search(term);

      const options = response.dados.map(
        (tipoPeca) =>
          ({
            value: tipoPeca.id,
            label: tipoPeca.descricao,
          } as TipoPecaOption)
      );

      setTipoPecaOptions(options);
    } catch (error) {
      console.error("Erro ao buscar tipos de peça:", error);
    } finally {
      setIsSearchingTipoPeca(false);
    }
  };

  const handleTipoPecaChange = (selectedOption: OptionType | null) => {
    // Convert OptionType to TipoPecaOption if not null
    const tipoPecaOption = selectedOption
      ? ({
          ...selectedOption,
          value: Number(selectedOption.value),
        } as TipoPecaOption)
      : null;

    setSelectedTipoPeca(tipoPecaOption);

    if (tipoPecaOption) {
      setFormData((prev) => ({ ...prev, id_tipo_peca: tipoPecaOption.value }));

      // Limpar erro se existir
      if (formErrors.id_tipo_peca) {
        setFormErrors((prev) => ({ ...prev, id_tipo_peca: "" }));
      }
    } else {
      setFormData((prev) => {
        const updated = { ...prev };
        delete updated.id_tipo_peca;
        return updated;
      });
    }
  };

  // Custom styles are now imported from CustomSelect component

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

    if (!formData.id_tipo_peca) {
      errors.id_tipo_peca = "Selecione um tipo de peça";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Enviar formulário
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    setSavingData(true);

    try {
      const pecaData = {
        codigo_peca: formData.codigo_peca,
        descricao: formData.descricao,
        unidade_medida: formData.unidade_medida,
        id_tipo_peca: formData.id_tipo_peca!,
        situacao: "A",
        tipo_peca: selectedTipoPeca?.label || "",
      };

      const response = await pecasService.create(pecaData);
      showSuccess(
        "Sucesso",
        response as unknown as Record<string, unknown> // Type assertion to match expected type
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
                      options={UNIDADES_MEDIDA}
                    />
                  </div>

                  {/* Tipo de Peça */}
                  <div className="md:col-span-12 mt-4">
                    <CustomSelect
                      id="tipo_peca"
                      label="Tipo de Peça"
                      required
                      placeholder="Digite pelo menos 3 caracteres para buscar..."
                      inputValue={tipoPecaInput}
                      onInputChange={handleTipoPecaInputChange}
                      onChange={handleTipoPecaChange}
                      options={tipoPecaOptions}
                      value={selectedTipoPeca}
                      isLoading={isSearchingTipoPeca}
                      error={formErrors.id_tipo_peca}
                      minCharsToSearch={3}
                      noOptionsMessageFn={({ inputValue }) =>
                        inputValue.length < 3
                          ? "Digite pelo menos 3 caracteres para buscar..."
                          : "Nenhum tipo de peça encontrado"
                      }
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
