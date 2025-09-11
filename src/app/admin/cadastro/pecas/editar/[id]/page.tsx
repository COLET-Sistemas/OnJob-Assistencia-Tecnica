"use client";

import { tiposPecasService, pecasService } from "@/api/services";
import { useTitle } from "@/context/TitleContext";
import { useToast } from "@/components/admin/ui/ToastContainer";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import React, { useEffect, useState } from "react";
import { Loading } from "@/components/LoadingPersonalizado";
import PageHeader from "@/components/admin/ui/PageHeader";
import {
  InputField,
  SelectField,
  LoadingButton,
  CustomSelect,
} from "@/components/admin/form";
import { UNIDADES_MEDIDA, SITUACOES } from "@/utils/constants";

interface FormData {
  codigo_peca: string;
  descricao: string;
  situacao: string;
  unidade_medida: string;
  id_tipo_peca?: number;
}

import { OptionType } from "@/components/admin/form/CustomSelect";

interface TipoPecaOption extends OptionType {
  value: number;
}

const EditarPeca = () => {
  const params = useParams();
  const id = params.id;
  const router = useRouter();
  const { setTitle } = useTitle();
  const { showSuccess, showError } = useToast();
  const [savingData, setSavingData] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState<FormData>({
    codigo_peca: "",
    descricao: "",
    situacao: "A",
    unidade_medida: "UN",
  });
  const [loading, setLoading] = useState(true);

  // Estados para o tipo de peça
  const [tipoPecaInput, setTipoPecaInput] = useState("");
  const [tipoPecaOptions, setTipoPecaOptions] = useState<TipoPecaOption[]>([]);
  const [selectedTipoPeca, setSelectedTipoPeca] =
    useState<TipoPecaOption | null>(null);
  const [isSearchingTipoPeca, setIsSearchingTipoPeca] = useState(false);

  useEffect(() => {
    setTitle("Peças");
  }, [setTitle]);

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

      const options = response.dados.map((tipoPeca) => ({
        // Ensure id is a number by using Number() conversion if needed
        value: Number(tipoPeca.id),
        label: tipoPeca.descricao,
      }));

      setTipoPecaOptions(options);
    } catch (error) {
      console.error("Erro ao buscar tipos de peça:", error);
    } finally {
      setIsSearchingTipoPeca(false);
    }
  };

  const handleTipoPecaChange = (selectedOption: OptionType | null) => {
    // Cast to TipoPecaOption if not null and value is a number
    const typedOption =
      selectedOption && typeof selectedOption.value === "number"
        ? (selectedOption as TipoPecaOption)
        : null;

    setSelectedTipoPeca(typedOption);

    if (typedOption) {
      setFormData((prev) => ({ ...prev, id_tipo_peca: typedOption.value }));

      // Limpar erro se existir
      if (formErrors.id_tipo_peca) {
        setFormErrors((prev) => {
          const updated = { ...prev };
          delete updated.id_tipo_peca;
          return updated;
        });
      }
    } else {
      setFormData((prev) => {
        const updated = { ...prev };
        delete updated.id_tipo_peca;
        return updated;
      });
    }
  };

  useEffect(() => {
    const carregarDados = async () => {
      setLoading(true);
      try {
        // Garantimos que id é uma string ou número
        const pecaId = typeof id === "string" ? id : String(id);
        const peca = await pecasService.getById(pecaId);
        setFormData({
          codigo_peca: peca.codigo_peca,
          descricao: peca.descricao,
          situacao: peca.situacao,
          unidade_medida: peca.unidade_medida,
          id_tipo_peca: peca.id_tipo_peca,
        });

        // Se tiver tipo_peca, configura o select
        if (peca.id_tipo_peca && peca.tipo_peca) {
          setSelectedTipoPeca({
            value: Number(peca.id_tipo_peca), // Ensure id is a number
            label: peca.tipo_peca,
          });
        }
      } catch (error) {
        console.error("Erro ao carregar peça:", error);
        showError("Erro ao carregar dados", error as Record<string, unknown>);
        router.push("/admin/cadastro/pecas");
      } finally {
        setLoading(false);
      }
    };
    if (id) carregarDados();
  }, [id, router, showError]);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    let newValue = value;
    if (name === "codigo_peca") {
      newValue = value.toUpperCase();
    }
    setFormData((prev) => ({ ...prev, [name]: newValue }));
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
    if (!formData.codigo_peca) errors.codigo_peca = "Campo obrigatório";
    if (!formData.descricao) errors.descricao = "Campo obrigatório";
    if (!formData.situacao) errors.situacao = "Campo obrigatório";
    if (!formData.unidade_medida) errors.unidade_medida = "Campo obrigatório";
    if (!formData.id_tipo_peca)
      errors.id_tipo_peca = "Selecione um tipo de peça";
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
      // Garantimos que id é uma string ou número
      const pecaId = typeof id === "string" ? id : String(id);
      await pecasService.update(pecaId, {
        codigo_peca: formData.codigo_peca,
        descricao: formData.descricao,
        situacao: formData.situacao,
        unidade_medida: formData.unidade_medida,
        id_tipo_peca: formData.id_tipo_peca,
      });
      showSuccess("Sucesso", "Peça atualizada com sucesso");
      router.push("/admin/cadastro/pecas");
    } catch (error) {
      console.error("Erro ao atualizar peça:", error);

      showError(
        "Erro ao atualizar",
        error as Record<string, unknown> // Passa o erro diretamente, o ToastContainer extrai a mensagem
      );
    } finally {
      setSavingData(false);
    }
  };

  // Custom styles are now imported from CustomSelect component

  if (loading) {
    return (
      <Loading
        fullScreen={true}
        preventScroll={false}
        text="Carregando peça..."
        size="large"
      />
    );
  }

  return (
    <>
      <PageHeader
        title="Editar Peça"
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
                  <div className="md:col-span-5">
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

                  {/* Situação */}
                  <div className="md:col-span-2">
                    <SelectField
                      label="Situação"
                      name="situacao"
                      value={formData.situacao}
                      onChange={handleInputChange}
                      error={formErrors.situacao}
                      required
                      options={SITUACOES}
                    />
                  </div>

                  {/* Unidade de Medida */}
                  <div className="md:col-span-2">
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
   
                  <span>Salvar</span>
  
              </LoadingButton>
            </div>
          </footer>
        </form>
      </main>
    </>
  );
};

export default EditarPeca;
