"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { usuariosService as usuariosAPI } from "@/api/services/usuariosService";
import Link from "next/link";
import PageHeader from "@/components/admin/ui/PageHeader";
import { InputField } from "@/components/admin/form";
import SuccessModal from "@/components/admin/ui/SuccessModal";
import { useToast } from "@/components/admin/ui/ToastContainer";

const perfis = [
  { key: "perfil_interno", label: "Interno" },
  { key: "perfil_gestor_assistencia", label: "Gestor Assistência" },
  { key: "perfil_tecnico_proprio", label: "Técnico Próprio" },
  { key: "perfil_tecnico_terceirizado", label: "Técnico Terceirizado" },
  { key: "administrador", label: "Administrador" },
];

export default function NovoUsuario() {
  const router = useRouter();
  type FormState = {
    login: string;
    nome: string;
    email: string;
    id_empresa: string;
    situacao: string;
    perfil_interno: boolean;
    perfil_gestor_assistencia: boolean;
    perfil_tecnico_proprio: boolean;
    perfil_tecnico_terceirizado: boolean;
    administrador: boolean;
    [key: string]: string | boolean;
  };
  // Inicializa o formulário com id_empresa como string vazia, será atualizado no useEffect
  const [form, setForm] = useState<FormState>({
    login: "",
    nome: "",
    email: "",
    id_empresa: "",
    perfil_interno: false,
    perfil_gestor_assistencia: false,
    perfil_tecnico_proprio: false,
    perfil_tecnico_terceirizado: false,
    administrador: false,
    situacao: "A",
  });
  const [savingData, setSavingData] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [successModal, setSuccessModal] = useState({
    isOpen: false,
    message: "",
    additionalInfo: {} as Record<string, string>,
  });
  const { showError } = useToast();

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const empresaData = localStorage.getItem("empresa");
        if (empresaData) {
          const empresa = JSON.parse(empresaData);
          if (empresa && empresa.id_empresa) {
            setForm((prev) => ({
              ...prev,
              id_empresa: empresa.id_empresa.toString(),
            }));
          }
        }
      } catch (error) {
        console.error("Erro ao recuperar dados da empresa:", error);
      }
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    if (formErrors[name]) {
      setFormErrors((prev) => {
        const updated = { ...prev };
        delete updated[name];
        return updated;
      });
    }
  };

  // Validação dos campos obrigatórios
  const validarFormulario = () => {
    const errors: Record<string, string> = {};
    if (!form.login) errors.login = "Campo obrigatório";
    if (!form.nome) errors.nome = "Campo obrigatório";
    if (!form.email) errors.email = "Campo obrigatório";

    // Verifica se pelo menos um perfil foi selecionado
    const temPerfil = perfis.some((perfil) => Boolean(form[perfil.key]));
    if (!temPerfil) {
      errors.perfil = "Selecione pelo menos um perfil";
    }

    // A validação do id_empresa foi removida pois agora é carregado automaticamente do localStorage
    if (!form.id_empresa)
      errors.id_empresa = "Não foi possível recuperar o ID da empresa";

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validarFormulario()) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    setSavingData(true);
    try {
      const payload = {
        login: form.login,
        nome: form.nome,
        email: form.email,
        id_empresa: Number(form.id_empresa),
        situacao: form.situacao === "A",
        perfil_interno: form.perfil_interno,
        perfil_gestor_assistencia: form.perfil_gestor_assistencia,
        perfil_tecnico_proprio: form.perfil_tecnico_proprio,
        perfil_tecnico_terceirizado: form.perfil_tecnico_terceirizado,
        administrador: form.administrador,
      };
      const response = await usuariosAPI.create(payload);

      // Extrair mensagem e senha provisória da resposta
      const { mensagem, senha_provisoria } = response as unknown as {
        mensagem: string;
        senha_provisoria: string;
      };

      // Mostrar modal com os dados do retorno
      setSuccessModal({
        isOpen: true,
        message: mensagem || "Usuário criado com sucesso",
        additionalInfo: senha_provisoria ? { senha_provisoria } : {},
      });
      setSavingData(false);
    } catch (error) {
      let errorMessage = "Verifique os dados e tente novamente";

      if (error instanceof Error) {
        try {
          const errorString = error.message;
          const match = errorString.match(/"erro"\s*:\s*"([^"]+)"/);
          if (match && match[1]) {
            errorMessage = match[1];
          } else {
          }
        } catch {
          errorMessage = error.message;
        }
      }
      showError("Erro ao cadastrar usuário", errorMessage);
      setFormErrors({
        submit: errorMessage,
      });

      setSavingData(false);
    }
  };

  const handleCloseSuccessModal = () => {
    setSuccessModal((prev) => ({ ...prev, isOpen: false }));
    router.push("/admin/administracao/usuarios");
  };

  return (
    <>
      <PageHeader
        title="Cadastro de Usuário"
        config={{
          type: "form",
          backLink: "/admin/administracao/usuarios",
          backLabel: "Voltar para lista de usuários",
        }}
      />

      {/* Modal de sucesso */}
      <SuccessModal
        isOpen={successModal.isOpen}
        onClose={handleCloseSuccessModal}
        message={successModal.message}
        additionalInfo={successModal.additionalInfo}
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
                {/* Erro do formulário */}
                {formErrors.submit && (
                  <div className="bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded-md flex items-start gap-2">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 mt-0.5 flex-shrink-0"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <div>
                      <p className="font-medium">{formErrors.submit}</p>
                    </div>
                  </div>
                )}

                {/* Nome, Login, Email */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <InputField
                    label="Nome"
                    name="nome"
                    value={form.nome}
                    error={formErrors.nome}
                    placeholder="Nome completo"
                    required
                    autoFocus
                    onChange={handleChange}
                  />
                  <InputField
                    label="Login"
                    name="login"
                    value={form.login}
                    error={formErrors.login}
                    placeholder="Login do usuário"
                    required
                    onChange={handleChange}
                  />
                  <InputField
                    label="Email"
                    name="email"
                    type="email"
                    value={form.email}
                    error={formErrors.email}
                    placeholder="E-mail do usuário"
                    required
                    onChange={handleChange}
                  />
                </div>

                {/* Perfis com botões estilizados */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="block text-md font-medium text-slate-700">
                      Perfis <span className="text-red-500">*</span>
                    </label>
                    {formErrors.perfil && (
                      <span className="text-sm text-red-500">
                        {formErrors.perfil}
                      </span>
                    )}
                  </div>
                  <div
                    className={`flex flex-wrap gap-3 ${
                      formErrors.perfil
                        ? "border border-red-300 p-3 rounded-md bg-red-50"
                        : ""
                    }`}
                  >
                    {perfis.map((perfil) => (
                      <button
                        key={perfil.key}
                        type="button"
                        onClick={() => {
                          const name = perfil.key;
                          setForm((prev) => ({
                            ...prev,
                            [name]: !prev[name],
                          }));
                          if (formErrors.perfil) {
                            setFormErrors((prev) => {
                              const updated = { ...prev };
                              delete updated.perfil;
                              return updated;
                            });
                          }
                        }}
                        className={`
                          px-4 py-2 rounded-md font-medium transition-all
                          ${
                            form[perfil.key]
                              ? "bg-violet-600 text-white shadow-md hover:bg-violet-700"
                              : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 hover:border-gray-400"
                          }
                          focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-violet-500
                        `}
                      >
                        {perfil.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* Footer com botões */}
          <footer className="bg-slate-50 px-8 py-6 border-t border-slate-200">
            <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
              <Link
                href="/admin/administracao/usuarios"
                className="px-6 py-3 text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 hover:border-slate-400 transition-colors text-center font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500"
              >
                Cancelar
              </Link>
              <button
                type="submit"
                disabled={savingData}
                className="px-6 py-3 bg-[var(--primary)] text-white hover:bg-violet-700 rounded-lg font-medium transition-colors shadow-sm flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-violet-500"
              >
                {savingData ? (
                  <>
                    <span className="mr-2">Salvando</span>
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                  </>
                ) : (
                  <>Salvar</>
                )}
              </button>
            </div>
          </footer>
        </form>
      </main>
    </>
  );
}
