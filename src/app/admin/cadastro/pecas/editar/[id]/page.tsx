"use client";

import api from "@/api/api";
import { useTitle } from "@/context/TitleContext";
import { useToast } from "@/components/admin/ui/ToastContainer";
import { Save } from "lucide-react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import React, { useEffect, useState } from "react";
import { Loading } from "@/components/LoadingPersonalizado";

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
    setTitle("Editar Peça");
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
    <div className="px-2">
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-lg shadow-lg p-6 transition-all duration-300 hover:shadow-xl border-t-4 border-[#7C54BD]"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4 md:col-span-2">
            <h2 className="text-lg font-semibold text-[#7C54BD] border-b-2 border-[#F6C647] pb-2 inline-block">
              Informações da Peça
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Código da Peça */}
              <div>
                <label
                  htmlFor="codigo_peca"
                  className="block text-sm font-medium text-[#7C54BD] mb-1"
                >
                  Código da Peça<span className="text-red-500 ml-1">*</span>
                </label>
                <input
                  type="text"
                  id="codigo_peca"
                  name="codigo_peca"
                  placeholder="Código da peça"
                  value={formData.codigo_peca}
                  onChange={handleInputChange}
                  className={`w-full p-2 border ${
                    formErrors.codigo_peca
                      ? "border-red-500"
                      : "border-gray-300"
                  } rounded-md focus:ring-2 focus:ring-[#7C54BD] focus:border-transparent transition-all duration-200 shadow-sm placeholder:text-gray-400 text-black`}
                />
                {formErrors.codigo_peca && (
                  <p className="mt-1 text-sm text-red-500">
                    {formErrors.codigo_peca}
                  </p>
                )}
              </div>
              {/* Descrição */}
              <div>
                <label
                  htmlFor="descricao"
                  className="block text-sm font-medium text-[#7C54BD] mb-1"
                >
                  Descrição<span className="text-red-500 ml-1">*</span>
                </label>
                <input
                  type="text"
                  id="descricao"
                  name="descricao"
                  placeholder="Descrição da peça"
                  value={formData.descricao}
                  onChange={handleInputChange}
                  className={`w-full p-2 border ${
                    formErrors.descricao ? "border-red-500" : "border-gray-300"
                  } rounded-md focus:ring-2 focus:ring-[#7C54BD] focus:border-transparent transition-all duration-200 shadow-sm placeholder:text-gray-400 text-black`}
                />
                {formErrors.descricao && (
                  <p className="mt-1 text-sm text-red-500">
                    {formErrors.descricao}
                  </p>
                )}
              </div>
              {/* Situação */}
              <div>
                <label
                  htmlFor="situacao"
                  className="block text-sm font-medium text-[#7C54BD] mb-1"
                >
                  Situação<span className="text-red-500 ml-1">*</span>
                </label>
                <select
                  id="situacao"
                  name="situacao"
                  value={formData.situacao}
                  onChange={handleInputChange}
                  className={`w-full p-2 h-[42px] border ${
                    formErrors.situacao ? "border-red-500" : "border-gray-300"
                  } rounded-md focus:ring-2 focus:ring-[#7C54BD] focus:border-transparent transition-all duration-200 shadow-sm text-black`}
                >
                  {situacoes.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
                {formErrors.situacao && (
                  <p className="mt-1 text-sm text-red-500">
                    {formErrors.situacao}
                  </p>
                )}
              </div>
              {/* Unidade de Medida */}
              <div>
                <label
                  htmlFor="unidade_medida"
                  className="block text-sm font-medium text-[#7C54BD] mb-1"
                >
                  Unidade de Medida<span className="text-red-500 ml-1">*</span>
                </label>
                <select
                  id="unidade_medida"
                  name="unidade_medida"
                  value={formData.unidade_medida}
                  onChange={handleInputChange}
                  className={`w-full p-2 h-[42px] border ${
                    formErrors.unidade_medida
                      ? "border-red-500"
                      : "border-gray-300"
                  } rounded-md focus:ring-2 focus:ring-[#7C54BD] focus:border-transparent transition-all duration-200 shadow-sm text-black`}
                >
                  {unidadesMedida.map((u) => (
                    <option key={u.value} value={u.value}>
                      {u.value}
                    </option>
                  ))}
                </select>
                {formErrors.unidade_medida && (
                  <p className="mt-1 text-sm text-red-500">
                    {formErrors.unidade_medida}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
        {/* Botões */}
        <div className="mt-8 flex justify-end space-x-3">
          <Link
            href="/admin/cadastro/pecas"
            className="px-5 py-2 bg-gray-100 text-[#7C54BD] rounded-md hover:bg-gray-200 transition-colors shadow-sm hover:shadow-md"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={savingData}
            className="px-5 py-2 bg-[#7C54BD] text-white rounded-md hover:bg-[#6743a1] transition-all flex items-center shadow-sm hover:shadow-md"
          >
            {savingData ? (
              <>
                <span className="mr-2">Salvando</span>
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
              </>
            ) : (
              <>
                <Save size={18} className="mr-2" />
                Atualizar Peça
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditarPeca;
