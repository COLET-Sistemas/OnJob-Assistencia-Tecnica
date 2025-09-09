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
  codigo_erp: string;
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
    codigo_erp: "",
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
        // Utilizar o tiposPecasService para obter os dados
        const params = { id: id.toString() };
        interface TiposPecaResponse {
          dados: Array<{
            id: number;
            descricao: string;
            codigo_erp: string;
            situacao: string;
          }>;
        }
        const response = await api.get<TiposPecaResponse>(`/tipos_pecas`, {
          params,
        });

        if (response && response.dados && response.dados.length > 0) {
          const tipoPeca = response.dados[0];
          setFormData({
            descricao: tipoPeca.descricao,
            codigo_erp: tipoPeca.codigo_erp || "",
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
    if (!formData.codigo_erp) errors.codigo_erp = "Campo obrigatório";
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
      // Utilizar o endpoint correto com os parâmetros
      const response = (await api.put(`/tipos_pecas?id=${id}`, {
        descricao: formData.descricao,
        codigo_erp: formData.codigo_erp,
        situacao: formData.situacao,
      })) as Record<string, unknown>;

      router.push("/admin/cadastro/tipos_pecas");

      showSuccess("Atualização realizada!", response);
    } catch (error) {
      console.error("Erro ao atualizar tipo de peça:", error);

      showError("Erro ao atualizar", error as Record<string, unknown>);
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
          <div className="p-8">
            <section>
              <div className="space-y-6">
                {/* Código ERP */}
                <InputField
                  label="Código ERP"
                  name="codigo_erp"
                  value={formData.codigo_erp}
                  error={formErrors.codigo_erp}
                  placeholder="Ex: PECA001..."
                  required
                  onChange={handleInputChange}
                />

                {/* Descrição */}
                <InputField
                  label="Descrição do Tipo"
                  name="descricao"
                  value={formData.descricao}
                  error={formErrors.descricao}
                  placeholder="Ex: Ferramentas, Eletrônicos, Acessórios..."
                  required
                  onChange={handleInputChange}
                />

                {/* Situação */}
                <SelectField
                  label="Situação"
                  name="situacao"
                  value={formData.situacao}
                  options={[
                    { value: "A", label: "Ativo" },
                    { value: "I", label: "Inativo" },
                  ]}
                  error={formErrors.situacao}
                  required
                  onChange={handleInputChange}
                />
              </div>
            </section>
          </div>

          {/* Footer com botões */}
          <footer className="bg-slate-50 px-8 py-6 border-t border-slate-200">
            <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
              <Link
                href="/admin/cadastro/tipos_pecas"
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

export default EditarTipoPeca;
