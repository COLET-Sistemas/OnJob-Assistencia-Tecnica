"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { usuariosAPI } from "@/api/api";
import { useTitle } from "@/context/TitleContext";
import Link from "next/link";
import { Save } from "lucide-react";

const perfis = [
  { key: "perfil_interno", label: "Interno" },
  { key: "perfil_gestor_assistencia", label: "Gestor Assistência" },
  { key: "perfil_tecnico_proprio", label: "Técnico Próprio" },
  { key: "perfil_tecnico_terceirizado", label: "Técnico Terceirizado" },
  { key: "administrador", label: "Administrador" },
];

export default function NovoUsuario() {
  const { setTitle } = useTitle();
  const router = useRouter();
  type FormState = {
    login: string;
    nome: string;
    email: string;
    senha_hash: string;
    id_empresa: string;
    perfil_interno: boolean;
    perfil_gestor_assistencia: boolean;
    perfil_tecnico_proprio: boolean;
    perfil_tecnico_terceirizado: boolean;
    administrador: boolean;
    [key: string]: string | boolean;
  };
  const [form, setForm] = useState<FormState>({
    login: "",
    nome: "",
    email: "",
    senha_hash: "",
    id_empresa: "",
    perfil_interno: false,
    perfil_gestor_assistencia: false,
    perfil_tecnico_proprio: false,
    perfil_tecnico_terceirizado: false,
    administrador: false,
  });
  const [savingData, setSavingData] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Set page title
  React.useEffect(() => {
    setTitle("Novo Usuário");
  }, [setTitle]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    // Limpar erro do campo quando usuário digitar
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
    if (!form.senha_hash) errors.senha_hash = "Campo obrigatório";
    if (!form.id_empresa) errors.id_empresa = "Campo obrigatório";
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
        ...form,
        id_empresa: Number(form.id_empresa),
      };
      await usuariosAPI.create(payload);
      router.push("/admin/cadastro/usuarios");
    } catch {
      setFormErrors({
        submit:
          "Erro ao cadastrar usuário. Verifique os dados e tente novamente.",
      });
    } finally {
      setSavingData(false);
    }
  };

  return (
    <div className="px-2">
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-lg shadow-lg p-6 transition-all duration-300 hover:shadow-xl border-t-4 border-[#7C54BD]"
      >
        {/* Se houver erros, mostrar alerta */}
        {Object.keys(formErrors).length > 0 && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-md shadow-sm">
            <h4 className="font-medium mb-1 text-red-700">
              Por favor, corrija os seguintes erros:
            </h4>
            <ul className="list-disc list-inside">
              {Object.entries(formErrors).map(([field, message]) => (
                <li key={field}>{message}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Informações principais */}
          <div className="space-y-4 md:col-span-2">
            <h2 className="text-lg font-semibold text-[#7C54BD] border-b-2 border-[#F6C647] pb-2 inline-block">
              Informações do Usuário
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Login */}
              <div>
                <label className="block text-sm font-medium text-[#7C54BD] mb-1">
                  Login<span className="text-red-500 ml-1">*</span>
                </label>
                <input
                  type="text"
                  name="login"
                  placeholder="Login do usuário"
                  value={form.login}
                  onChange={handleChange}
                  className={`w-full p-2 border ${
                    formErrors.login ? "border-red-500" : "border-gray-300"
                  } rounded-md focus:ring-2 focus:ring-[#7C54BD] focus:border-transparent transition-all duration-200 shadow-sm placeholder:text-gray-400 text-black`}
                />
                {formErrors.login && (
                  <p className="mt-1 text-sm text-red-500">
                    {formErrors.login}
                  </p>
                )}
              </div>
              {/* Nome */}
              <div>
                <label className="block text-sm font-medium text-[#7C54BD] mb-1">
                  Nome<span className="text-red-500 ml-1">*</span>
                </label>
                <input
                  type="text"
                  name="nome"
                  placeholder="Nome completo"
                  value={form.nome}
                  onChange={handleChange}
                  className={`w-full p-2 border ${
                    formErrors.nome ? "border-red-500" : "border-gray-300"
                  } rounded-md focus:ring-2 focus:ring-[#7C54BD] focus:border-transparent transition-all duration-200 shadow-sm placeholder:text-gray-400 text-black`}
                />
                {formErrors.nome && (
                  <p className="mt-1 text-sm text-red-500">{formErrors.nome}</p>
                )}
              </div>
              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-[#7C54BD] mb-1">
                  Email<span className="text-red-500 ml-1">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  placeholder="E-mail do usuário"
                  value={form.email}
                  onChange={handleChange}
                  className={`w-full p-2 border ${
                    formErrors.email ? "border-red-500" : "border-gray-300"
                  } rounded-md focus:ring-2 focus:ring-[#7C54BD] focus:border-transparent transition-all duration-200 shadow-sm placeholder:text-gray-400 text-black`}
                />
                {formErrors.email && (
                  <p className="mt-1 text-sm text-red-500">
                    {formErrors.email}
                  </p>
                )}
              </div>
              {/* Senha */}
              <div>
                <label className="block text-sm font-medium text-[#7C54BD] mb-1">
                  Senha<span className="text-red-500 ml-1">*</span>
                </label>
                <input
                  type="password"
                  name="senha_hash"
                  placeholder="Senha do usuário"
                  value={form.senha_hash}
                  onChange={handleChange}
                  className={`w-full p-2 border ${
                    formErrors.senha_hash ? "border-red-500" : "border-gray-300"
                  } rounded-md focus:ring-2 focus:ring-[#7C54BD] focus:border-transparent transition-all duration-200 shadow-sm placeholder:text-gray-400 text-black`}
                />
                {formErrors.senha_hash && (
                  <p className="mt-1 text-sm text-red-500">
                    {formErrors.senha_hash}
                  </p>
                )}
              </div>
              {/* Empresa */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-[#7C54BD] mb-1">
                  Empresa (ID)<span className="text-red-500 ml-1">*</span>
                </label>
                <input
                  type="number"
                  name="id_empresa"
                  placeholder="ID da empresa"
                  value={form.id_empresa}
                  onChange={handleChange}
                  className={`w-full p-2 border ${
                    formErrors.id_empresa ? "border-red-500" : "border-gray-300"
                  } rounded-md focus:ring-2 focus:ring-[#7C54BD] focus:border-transparent transition-all duration-200 shadow-sm placeholder:text-gray-400 text-black`}
                />
                {formErrors.id_empresa && (
                  <p className="mt-1 text-sm text-red-500">
                    {formErrors.id_empresa}
                  </p>
                )}
              </div>
              {/* Perfis */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-[#7C54BD] mb-1">
                  Perfis
                </label>
                <div className="flex flex-wrap gap-4">
                  {perfis.map((perfil) => (
                    <label
                      key={perfil.key}
                      className="flex items-center gap-2 text-slate-700"
                    >
                      <input
                        type="checkbox"
                        name={perfil.key}
                        checked={Boolean(form[perfil.key])}
                        onChange={handleChange}
                      />
                      {perfil.label}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Botões */}
        <div className="mt-8 flex justify-end space-x-3">
          <Link
            href="/admin/cadastro/usuarios"
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
                Salvar Usuário
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
