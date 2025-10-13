"use client";

import { services } from "@/api";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useEffect, useState, useRef } from "react";
import { Loading } from "@/components/LoadingPersonalizado";
import { useToast } from "@/components/admin/ui/ToastContainer";
import { InputField, LoadingButton } from "@/components/admin/form";
import PageHeader from "@/components/admin/ui/PageHeader";
import AdminAuthGuard from "@/components/admin/common/AdminAuthGuard";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

// Definindo os perfis disponíveis
const perfis = [
  { key: "perfil_interno", label: "Interno" },
  { key: "perfil_gestor_assistencia", label: "Gestor Assistência" },
  { key: "perfil_tecnico_proprio", label: "Técnico Próprio" },
  { key: "perfil_tecnico_terceirizado", label: "Técnico Terceirizado" },
  { key: "administrador", label: "Administrador" },
];

interface FormData {
  login: string;
  nome: string;
  email: string;
  situacao: string;
  perfil_interno: boolean;
  perfil_gestor_assistencia: boolean;
  perfil_tecnico_proprio: boolean;
  perfil_tecnico_terceirizado: boolean;
  administrador: boolean;
  [key: string]: string | boolean;
}

// Cache global para evitar múltiplas chamadas do mesmo usuário
const userCache = new Map<number, FormData>();
const loadingPromises = new Map<number, Promise<FormData>>();

const EditarUsuario = (props: PageProps) => {
  const params = React.use(props.params);
  const id = parseInt(params.id);
  const router = useRouter();
  const { showSuccess, showError } = useToast();
  const [savingData, setSavingData] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState<FormData>({
    login: "",
    nome: "",
    email: "",
    situacao: "A",
    perfil_interno: false,
    perfil_gestor_assistencia: false,
    perfil_tecnico_proprio: false,
    perfil_tecnico_terceirizado: false,
    administrador: false,
  });
  const [loading, setLoading] = useState(true);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    const loadUserData = async () => {
      if (!mountedRef.current) return;

      try {
        setLoading(true);
        if (userCache.has(id)) {
          const cachedData = userCache.get(id);
          if (cachedData) {
            setFormData(cachedData);
            setLoading(false);
            return;
          }
        }

        if (loadingPromises.has(id)) {
          const existingPromise = loadingPromises.get(id);
          if (existingPromise) {
            const data = await existingPromise;
            if (mountedRef.current) {
              setFormData(data);
              setLoading(false);
            }
            return;
          }
        }

        const loadPromise = services.usuariosService
          .getAll({
            id: id.toString(),
          })
          .then((response) => {
            if (
              !response ||
              !Array.isArray(response) ||
              response.length === 0
            ) {
              throw new Error("Usuário não encontrado");
            }

            const usuario = response[0];
            const userData = {
              login: usuario.login,
              nome: usuario.nome,
              email: usuario.email,
              situacao: usuario.situacao,
              perfil_interno: usuario.perfil_interno,
              perfil_gestor_assistencia: usuario.perfil_gestor_assistencia,
              perfil_tecnico_proprio: usuario.perfil_tecnico_proprio,
              perfil_tecnico_terceirizado: usuario.perfil_tecnico_terceirizado,
              administrador: usuario.administrador,
            };

            userCache.set(id, userData);

            return userData;
          })
          .finally(() => {
            loadingPromises.delete(id);
          });
        loadingPromises.set(id, loadPromise);

        const userData = await loadPromise;

        if (!mountedRef.current) return;

        setFormData(userData);
      } catch (error) {
        if (!mountedRef.current) return;

        console.error("Erro ao carregar usuário:", error);
        showError(
          "Erro ao carregar dados",
          "Não foi possível carregar os dados do usuário. Tente novamente."
        );
        router.push("/admin/administracao/usuarios");
      } finally {
        if (mountedRef.current) {
          setLoading(false);
        }
      }
    };

    loadUserData();
  }, [id, showError, router]);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData((prev) => ({
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

  const handlePerfilChange = (perfilKey: string) => {
    setFormData((prev) => ({
      ...prev,
      [perfilKey]: !prev[perfilKey],
    }));

    if (formErrors.perfil) {
      setFormErrors((prev) => {
        const updated = { ...prev };
        delete updated.perfil;
        return updated;
      });
    }
  };

  const validarFormulario = () => {
    const errors: Record<string, string> = {};

    if (!formData.nome) errors.nome = "Campo obrigatório";
    if (!formData.email) errors.email = "Campo obrigatório";

    // Verifica se pelo menos um perfil foi selecionado
    const temPerfil = perfis.some((perfil) => Boolean(formData[perfil.key]));
    if (!temPerfil) {
      errors.perfil = "Selecione pelo menos um perfil";
    }

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
      await services.usuariosService.update(id, {
        nome: formData.nome,
        email: formData.email,
        //situacao: formData.situacao,
        perfil_interno: formData.perfil_interno,
        perfil_gestor_assistencia: formData.perfil_gestor_assistencia,
        perfil_tecnico_proprio: formData.perfil_tecnico_proprio,
        perfil_tecnico_terceirizado: formData.perfil_tecnico_terceirizado,
        administrador: formData.administrador,
      });

      userCache.delete(id);

      router.push("/admin/administracao/usuarios");
      showSuccess("Atualização realizada!", "Usuário atualizado com sucesso.");
    } catch (error) {
      console.error("Erro ao atualizar usuário:", error);
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
        text="Carregando dados do usuário..."
        size="large"
      />
    );
  }

  return (
    <AdminAuthGuard>
      <PageHeader
        title="Editar Usuário"
        config={{
          type: "form",
          backLink: "/admin/administracao/usuarios",
          backLabel: "Voltar para lista de usuários",
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
                {/* Nome e Email */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <InputField
                    label="Login"
                    name="login"
                    value={formData.nome}
                    error={formErrors.nome}
                    placeholder="Login do usuário"
                    onChange={handleInputChange}
                    disabled
                    className="disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed"
                  />
                  <InputField
                    label="Nome"
                    name="nome"
                    value={formData.nome}
                    error={formErrors.nome}
                    placeholder="Nome completo"
                    required
                    onChange={handleInputChange}
                  />

                  <InputField
                    label="Email"
                    name="email"
                    type="email"
                    value={formData.email}
                    error={formErrors.email}
                    placeholder="E-mail do usuário"
                    required
                    onChange={handleInputChange}
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
                        onClick={() => handlePerfilChange(perfil.key)}
                        className={`
                          px-4 py-2 rounded-md font-medium transition-all
                          ${
                            formData[perfil.key]
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

                {/* Situação */}
                <div className="mt-4">
                  <label className="block text-md font-medium text-slate-700 mb-2">
                    Situação
                  </label>
                  <div className="flex gap-4">
                    <label className="inline-flex items-center">
                      <input
                        type="radio"
                        name="situacao"
                        value="A"
                        checked={formData.situacao === "A"}
                        onChange={handleInputChange}
                        className="form-radio h-5 w-5 text-violet-600"
                      />
                      <span className="ml-2 text-gray-700">Ativo</span>
                    </label>
                    <label className="inline-flex items-center">
                      <input
                        type="radio"
                        name="situacao"
                        value="I"
                        checked={formData.situacao === "I"}
                        onChange={handleInputChange}
                        className="form-radio h-5 w-5 text-violet-600"
                      />
                      <span className="ml-2 text-gray-700">Inativo</span>
                    </label>
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
    </AdminAuthGuard>
  );
};

export default EditarUsuario;
