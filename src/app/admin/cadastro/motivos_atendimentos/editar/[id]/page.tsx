"use client";

import api from "@/api/api";
import { useTitle } from "@/context/TitleContext";
import { Save } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { Loading } from "@/components/LoadingPersonalizado";
import { useToast } from "@/components/admin/ui/ToastContainer";

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
    <div className="px-2">
      {/* Formulário */}
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-lg shadow-lg p-6 transition-all duration-300 hover:shadow-xl border-t-4 border-[#7C54BD]"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Informações principais */}
          <div className="space-y-4 md:col-span-2">
            <h2 className="text-lg font-semibold text-[#7C54BD] border-b-2 border-[#F6C647] pb-2 inline-block">
              Informações do Motivo de Atendimento
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  placeholder="Descrição do motivo de atendimento"
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
                  <option value="A">Ativo</option>
                  <option value="I">Inativo</option>
                </select>
                {formErrors.situacao && (
                  <p className="mt-1 text-sm text-red-500">
                    {formErrors.situacao}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Botões */}
        <div className="mt-8 flex justify-end space-x-3">
          <Link
            href="/admin/cadastro/motivos_atendimentos"
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
                Atualizar Motivo
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditarMotivoAtendimento;
