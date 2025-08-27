"use client";

import api from "@/api/api";
import { useTitle } from "@/context/TitleContext";
import { Save } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { Loading } from "@/components/LoadingPersonalizado";
import { useToast } from "@/components/admin/ui/ToastContainer";
import {
  InputField,
  SelectField,
  LoadingButton,
} from "@/components/admin/form";
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

const EditarTipoPeca = (props: PageProps) => {
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
    setTitle("Tipos de Peças");
  }, [setTitle]);

  useEffect(() => {
    const carregarDados = async () => {
      setLoading(true);
      try {
        const response = await api.get(`/tipos_pecas?id=${id}`);

        if (
          response &&
          response.tipos_pecas &&
          response.tipos_pecas.length > 0
        ) {
          const tipoPeca = response.tipos_pecas[0];
          setFormData({
            descricao: tipoPeca.descricao,
            situacao: tipoPeca.situacao,
          });
        } else {
          throw new Error("Tipo de peça não encontrado");
        }
      } catch (error) {
        console.error("Erro ao carregar tipo de peça:", error);

        showError(
          "Erro ao carregar dados",
          "Não foi possível carregar os dados do tipo de peça. Tente novamente."
        );

        router.push("/admin/cadastro/tipos_pecas");
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
      const response = await api.put(`/tipos_pecas?id=${id}`, {
        descricao: formData.descricao,
        situacao: formData.situacao,
      });

      router.push("/admin/cadastro/tipos_pecas");

      showSuccess(
        "Atualização realizada!",
        response // Passa a resposta diretamente, o ToastContainer extrai a mensagem
      );
    } catch (error) {
      console.error("Erro ao atualizar tipo de peça:", error);

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
        text="Carregando tipo de peça..."
        size="large"
      />
    );
  }

  return (
    <>
      <PageHeader
        title="Editar Tipo de Peça"
        config={{
          type: "form",
          backLink: "/admin/cadastro/tipos_pecas",
          backLabel: "Voltar para lista de tipos",
        }}
      />

      <main>
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden"
          noValidate
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Informações principais */}
            <div className="space-y-4 md:col-span-2">
              <h2 className="text-lg font-semibold text-[#7C54BD] border-b-2 border-[#F6C647] pb-2 inline-block">
                Informações do Tipo de Peça
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Descrição */}
                <div>
                  <InputField
                    label="Descrição"
                    name="descricao"
                    value={formData.descricao}
                    error={formErrors.descricao}
                    placeholder="Descrição do tipo de peça"
                    required
                    onChange={handleInputChange}
                    className="p-2"
                  />
                </div>

                {/* Situação */}
                <div>
                  <SelectField
                    label="Situação"
                    name="situacao"
                    value={formData.situacao}
                    error={formErrors.situacao}
                    required
                    onChange={handleInputChange}
                    className="p-2 h-[42px]"
                    options={[
                      { value: "A", label: "Ativo" },
                      { value: "I", label: "Inativo" },
                    ]}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Botões */}
          <div className="mt-8 flex justify-end space-x-3">
            <Link
              href="/admin/cadastro/tipos_pecas"
              className="px-5 py-2 bg-gray-100 text-[#7C54BD] rounded-md hover:bg-gray-200 transition-colors shadow-sm hover:shadow-md"
            >
              Cancelar
            </Link>
            <LoadingButton
              type="submit"
              isLoading={savingData}
              className="px-5 py-2 bg-[#7C54BD] text-white rounded-md hover:bg-[#6743a1] shadow-sm hover:shadow-md"
            >
              <span className="flex items-center">
                <Save size={18} className="mr-2" />
                Atualizar Tipo de Peça
              </span>
            </LoadingButton>
          </div>
        </form>
      </main>
    </>
  );
};

export default EditarTipoPeca;
