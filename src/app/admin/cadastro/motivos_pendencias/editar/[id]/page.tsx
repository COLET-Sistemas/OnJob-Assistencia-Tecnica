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

const EditarMotivoPendencia = (props: PageProps) => {
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
    setTitle("Motivos de Pendências");
  }, [setTitle]);

  useEffect(() => {
    const carregarDados = async () => {
      setLoading(true);
      try {
        const response = await api.get(`/motivos_pendencia_os?id=${id}`);

        if (response && response.length > 0) {
          const motivo = response[0];
          setFormData({
            descricao: motivo.descricao,
            situacao: motivo.situacao,
          });
        } else {
          throw new Error("Motivo de pendência não encontrado");
        }
      } catch (error) {
        console.error("Erro ao carregar motivo de pendencia:", error);
        showError(
          "Erro ao carregar dados",
          "Não foi possível carregar os dados do motivo. Tente novamente."
        );
        router.push("/admin/cadastro/motivos_pendencias");
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
      const response = await api.put(`/motivos_pendencia_os?id=${id}`, {
        descricao: formData.descricao,
        situacao: formData.situacao,
      });

      router.push("/admin/cadastro/motivos_pendencias");

      showSuccess(
        "Atualização realizada!",
        response // Passa a resposta diretamente, o ToastContainer extrai a mensagem
      );
    } catch (error) {
      console.error("Erro ao atualizar motivo de pendência:", error);

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
        text="Carregando motivos de pendência..."
        size="large"
      />
    );
  }

  return (
    <>
      <PageHeader
        title="Editar Motivo de Pendência"
        config={{
          type: "form",
          backLink: "/admin/cadastro/motivos_pendencias",
          backLabel: "Voltar para lista de motivos",
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
                {/* Descrição */}
                <InputField
                  label="Descrição do Motivo"
                  name="descricao"
                  value={formData.descricao}
                  error={formErrors.descricao}
                  placeholder="Ex: Aguardando peças, Falta de ferramentas, Cliente ausente..."
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
                href="/admin/cadastro/motivos_pendencias"
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

export default EditarMotivoPendencia;
