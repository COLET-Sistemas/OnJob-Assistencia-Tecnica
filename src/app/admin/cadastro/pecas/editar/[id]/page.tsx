"use client";

import api from "@/api/api";
import { useTitle } from "@/context/TitleContext";
import { useToast } from "@/components/admin/ui/ToastContainer";
import { Save } from "lucide-react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import React, { useEffect, useState } from "react";
import { Loading } from "@/components/LoadingPersonalizado";
import PageHeader from "@/components/admin/ui/PageHeader";
import {
  InputField,
  SelectField,
  LoadingButton,
} from "@/components/admin/form";

const unidadesMedida = [
  { value: "PC", label: "Peça" },
  { value: "UN", label: "Unidade" },
  { value: "KG", label: "Quilograma" },
  { value: "G", label: "Grama" },
  { value: "L", label: "Litro" },
  { value: "ML", label: "Mililitro" },
  { value: "M", label: "Metro" },
  { value: "CM", label: "Centímetro" },
  { value: "MM", label: "Milímetro" },
  { value: "M²", label: "Metro Quadrado" },
  { value: "M³", label: "Metro Cúbico" },
];

const situacoes = [
  { value: "A", label: "Ativo" },
  { value: "I", label: "Inativo" },
];

interface FormData {
  codigo_peca: string;
  descricao: string;
  situacao: string;
  unidade_medida: string;
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

  useEffect(() => {
    setTitle("Peças");
  }, [setTitle]);

  useEffect(() => {
    const carregarDados = async () => {
      setLoading(true);
      try {
        // Busca por ID, espera objeto com array 'dados'
        const response = await api.get(`/pecas`, { params: { id } });
        if (
          response &&
          Array.isArray(response.dados) &&
          response.dados.length > 0
        ) {
          const peca = response.dados[0];
          setFormData({
            codigo_peca: peca.codigo_peca,
            descricao: peca.descricao,
            situacao: peca.situacao,
            unidade_medida: peca.unidade_medida,
          });
        } else {
          throw new Error("Peça não encontrada");
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
      const response = await api.put(`/pecas?id=${id}`, {
        codigo_peca: formData.codigo_peca,
        descricao: formData.descricao,
        situacao: formData.situacao,
        unidade_medida: formData.unidade_medida,
      });
      showSuccess(
        "Sucesso",
        response // Passa a resposta diretamente, o ToastContainer extrai a mensagem
      );
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
                      options={situacoes}
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
                      options={unidadesMedida}
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
                  <span>Atualizar</span>
                </span>
              </LoadingButton>
            </div>
          </footer>
        </form>
      </main>
    </>
  );
};

export default EditarPeca;
