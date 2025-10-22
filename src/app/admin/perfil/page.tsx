"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useTitle } from "@/context/TitleContext";
import { usuariosService } from "@/api/services/usuariosService";
import { useToast } from "@/components/admin/ui/ToastContainer";

import LoadingButton from "@/components/admin/form/LoadingButton";
import { Eye, EyeOff, Lock } from "lucide-react";
import PageHeader from "@/components/admin/ui/PageHeader";
import { Loading } from "@/components/LoadingPersonalizado";
import { criptografarSenha } from "@/utils/cryptoPassword";
import {
  User,
  Mail,
  Shield,
  Check,
  Key,
  Calendar,
  UserCheck,
} from "lucide-react";
import type { Usuario } from "@/types/admin/cadastro/usuarios";

// Tipo Usuario agora é importado de @/types/admin/cadastro/usuarios

// Tipo para os dados de senha
interface PasswordData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

const PerfilPage = () => {
  const { setTitle } = useTitle();
  const { showSuccess, showError } = useToast();

  // Estados
  const [userData, setUserData] = useState<Usuario | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditingPassword, setIsEditingPassword] = useState(false);
  const [loadingPassword, setLoadingPassword] = useState(false);
  const [passwordData, setPasswordData] = useState<PasswordData>({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>(
    {}
  );
  // Estados para exibir/ocultar senha
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Buscar dados do usuário
  const fetchUserData = useCallback(async () => {
    try {
      setLoading(true);
      const userId = localStorage.getItem("id_usuario");

      if (!userId) {
        showError("Erro", "ID de usuário não encontrado");
        return;
      }

      // Utilizando a API com o endpoint /usuarios?id=
      const response = await usuariosService.getById(userId);
      setUserData(response);
      console.log(response);
    } catch (error) {
      console.error("Erro ao buscar dados do usuário:", error);
      showError(
        "Erro ao carregar perfil",
        "Não foi possível obter os dados do usuário"
      );
    } finally {
      setLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    setTitle("Meu Perfil");
    fetchUserData();
  }, [setTitle, fetchUserData]);

  // Manipuladores de alteração de senha
  const handlePasswordChange = (field: keyof PasswordData, value: string) => {
    setPasswordData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Limpar erro ao digitar
    if (passwordErrors[field]) {
      setPasswordErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  // Validar senha
  const validatePassword = (
    password: string
  ): { isValid: boolean; message?: string } => {
    // Verificar comprimento mínimo (8)
    if (password.length < 8) {
      return {
        isValid: false,
        message: "A senha deve conter pelo menos 8 caracteres.",
      };
    }
    const specialChars = /[@#$%?!*&]/;
    if (!specialChars.test(password)) {
      return {
        isValid: false,
        message:
          "A senha deve conter pelo menos um caractere especial: @, #, $, %, ?, !, *, &",
      };
    }
    return { isValid: true };
  };

  // Validar formulário de senha
  const validatePasswordForm = (): boolean => {
    const errors: Record<string, string> = {};

    // Validar senha atual
    if (!passwordData.currentPassword.trim()) {
      errors.currentPassword = "Senha atual é obrigatória";
    }

    // Validar nova senha
    if (!passwordData.newPassword.trim()) {
      errors.newPassword = "Nova senha é obrigatória";
    } else {
      const validation = validatePassword(passwordData.newPassword);
      if (!validation.isValid) {
        errors.newPassword = validation.message || "Senha inválida";
      }
    }

    // Validar confirmação de senha
    if (!passwordData.confirmPassword.trim()) {
      errors.confirmPassword = "Confirmação de senha é obrigatória";
    } else if (passwordData.newPassword !== passwordData.confirmPassword) {
      errors.confirmPassword = "As senhas não coincidem";
    }

    setPasswordErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Enviar alteração de senha
  const handlePasswordSubmit = async () => {
    if (!validatePasswordForm()) {
      return;
    }
    try {
      setLoadingPassword(true);
      if (!userData?.id) {
        showError("Erro", "Não foi possível identificar o usuário");
        return;
      }
      // Chamada da API
      const response = await usuariosService.resetPassword(userData.id, {
        senha_atual: criptografarSenha(passwordData.currentPassword),
        nova_senha: criptografarSenha(passwordData.newPassword),
      });
      // Mensagem do retorno da API
      let msg = "Senha alterada com sucesso.";
      if (response && typeof response === "object") {
        if ("mensagem" in response && typeof response.mensagem === "string") {
          msg = response.mensagem;
        } else if (
          "message" in response &&
          typeof response.message === "string"
        ) {
          msg = response.message;
        } else if ("msg" in response && typeof response.msg === "string") {
          msg = response.msg;
        }
      }
      showSuccess("Senha alterada", msg);
      setIsEditingPassword(false);
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error) {
      console.error("Erro ao alterar senha:", error);
      let msg = "Verifique se sua senha atual está correta.";
      if (
        error &&
        typeof error === "object" &&
        "response" in error &&
        error.response &&
        typeof error.response === "object" &&
        "data" in error.response &&
        error.response.data &&
        typeof error.response.data === "object" &&
        "message" in error.response.data &&
        typeof error.response.data.message === "string"
      ) {
        msg = error.response.data.message;
      }
      showError("Erro ao alterar senha", msg);
    } finally {
      setLoadingPassword(false);
    }
  };

  // Obter label para o perfil do usuário
  const getProfileLabel = () => {
    if (!userData) return "N/A";

    if (userData.administrador) return "Administrador";
    if (userData.perfil_gestor_assistencia) return "Gestor";
    if (userData.perfil_interno) return "Interno";
    if (userData.perfil_tecnico_proprio) return "Técnico Próprio";
    if (userData.perfil_tecnico_terceirizado) return "Técnico Terceirizado";

    return "Usuário";
  };

  return (
    <>
      <PageHeader
        title="Meu Perfil"
        config={{ type: "form", backLink: "admin/dashboard" }}
      />

      <div className="max-w-8l mx-auto space-y-6">
        {loading ? (
          <Loading
            fullScreen={true}
            preventScroll={false}
            text="Carregando perfil..."
            size="large"
          />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Dados do Usuário */}
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-white rounded-xl shadow-sm overflow-hidden h-auto">
                <div className="p-6 h-full flex flex-col">
                  <h3 className="text-lg font-medium mb-6 text-[var(--neutral-graphite)] flex items-center gap-2">
                    <User className="h-5 w-5 text-[var(--primary)]" />
                    Dados do Usuário
                  </h3>

                  <div className="bg-gradient-to-r from-[var(--primary)]/10 to-transparent p-4 rounded-lg mb-6 flex items-center gap-4">
                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-[var(--primary)] shadow-sm">
                      <User size={30} strokeWidth={1.5} />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-[var(--neutral-graphite)] mb-1">
                        {userData?.nome}
                      </h3>
                      <p className="text-gray-500 text-sm flex items-center gap-1">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-[var(--primary)]/10 text-[var(--primary)]`}
                        >
                          {getProfileLabel()}
                        </span>
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center gap-4 p-4 bg-white border border-gray-100 rounded-lg">
                      <div className="p-2 bg-[var(--primary)]/10 rounded-full text-[var(--primary)]">
                        <UserCheck size={18} />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 font-medium">
                          Login
                        </p>
                        <p className="text-[var(--neutral-graphite)] font-semibold">
                          {userData?.login || "Não informado"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 p-4 bg-white border border-gray-100 rounded-lg">
                      <div className="p-2 bg-[var(--primary)]/10 rounded-full text-[var(--primary)]">
                        <Mail size={18} />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 font-medium">
                          E-mail
                        </p>
                        <p className="text-[var(--neutral-graphite)] font-semibold">
                          {userData?.email || "Não informado"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 p-4 bg-white border border-gray-100 rounded-lg">
                      <div className="p-2 bg-[var(--primary)]/10 rounded-full text-[var(--primary)]">
                        <Shield size={18} />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 font-medium">
                          Situação
                        </p>
                        <p className="text-[var(--neutral-graphite)] font-semibold">
                          {userData?.situacao === "A" ? "Ativo" : "Inativo"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 p-4 bg-white border border-gray-100 rounded-lg">
                      <div className="p-2 bg-[var(--primary)]/10 rounded-full text-[var(--primary)]">
                        <Calendar size={18} />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 font-medium">
                          Data de Situação
                        </p>
                        <p className="text-[var(--neutral-graphite)] font-semibold">
                          {userData?.data_situacao || "Não informado"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Alteração de Senha */}
            <div className="lg:col-span-2 space-y-6">
              {/* Informações Completas do Usuário */}
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="p-6 h-full flex flex-col">
                  <h3 className="text-lg font-medium mb-7 text-[var(--neutral-graphite)] flex items-center gap-2">
                    <UserCheck className="h-5 w-5 text-[var(--primary)]" />
                    Perfis de Acesso
                  </h3>

                  <div className="flex flex-wrap gap-3 mb-4">
                    {[
                      {
                        key: "perfil_interno",
                        label: "Perfil Interno",
                        enabled: userData?.perfil_interno,
                      },
                      {
                        key: "administrador",
                        label: "Administrador",
                        enabled: userData?.administrador,
                      },
                      {
                        key: "perfil_gestor_assistencia",
                        label: "Gestor de Assistência",
                        enabled: userData?.perfil_gestor_assistencia,
                      },
                      {
                        key: "perfil_tecnico_proprio",
                        label: "Técnico Próprio",
                        enabled: userData?.perfil_tecnico_proprio,
                      },
                      {
                        key: "perfil_tecnico_terceirizado",
                        label: "Técnico Terceirizado",
                        enabled: userData?.perfil_tecnico_terceirizado,
                      },
                    ].map((perfil) => (
                      <button
                        key={perfil.key}
                        type="button"
                        disabled
                        className={`px-4 py-2 rounded-lg border text-sm font-medium flex items-center gap-2 shadow-sm select-none
                          ${
                            perfil.enabled
                              ? "bg-[var(--primary)] text-white border-[var(--primary)] cursor-default"
                              : "bg-white text-[var(--primary)] border-[var(--primary)]/40 cursor-default opacity-60"
                          }
                        `}
                        style={{ minWidth: 170 }}
                        tabIndex={-1}
                      >
                        <Check
                          size={16}
                          className={
                            perfil.enabled ? "opacity-100" : "opacity-40"
                          }
                        />
                        {perfil.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="p-6 h-full flex flex-col">
                  <h3 className="text-lg font-medium mb-4 text-[var(--neutral-graphite)] flex items-center gap-2">
                    <Key className="h-5 w-5 text-[var(--primary)]" />
                    Alteração de Senha
                  </h3>

                  {!isEditingPassword ? (
                    <div className="flex flex-col items-center justify-center py-12 border border-dashed border-gray-200 rounded-lg bg-gray-50">
                      <div className="w-16 h-16 bg-[var(--primary)]/10 rounded-full flex items-center justify-center text-[var(--primary)] mb-4">
                        <Key size={30} />
                      </div>
                      <p className="text-gray-600 mb-6 text-center max-w-md">
                        Para alterar sua senha, clique no botão abaixo.
                        <br />
                        Lembre-se de criar uma senha forte e segura.
                      </p>
                      <button
                        onClick={() => setIsEditingPassword(true)}
                        className="px-6 py-2.5 bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary)]/90 transition flex items-center gap-2 shadow-sm"
                      >
                        <Key size={16} />
                        Alterar Senha
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          {/* Senha Atual */}
                          <div className="mb-6">
                            <label className="block text-sm font-semibold mb-3 text-gray-800">
                              Senha Atual
                            </label>
                            <div className="relative">
                              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <Lock className="h-5 w-5 text-[var(--primary)]" />
                              </div>
                              <input
                                type={showCurrentPassword ? "text" : "password"}
                                name="currentPassword"
                                value={passwordData.currentPassword}
                                onChange={(e) =>
                                  handlePasswordChange(
                                    "currentPassword",
                                    e.target.value
                                  )
                                }
                                className="w-full pl-12 pr-12 py-3 border-2 border-gray-200 rounded-xl focus:border-[var(--primary)] transition-all duration-300 text-gray-700 placeholder-gray-500 bg-white focus:bg-white focus:shadow-xl focus:shadow-[var(--primary)]/10"
                                placeholder="Digite sua senha atual"
                                required
                                disabled={loadingPassword}
                              />
                              <button
                                type="button"
                                onClick={() =>
                                  setShowCurrentPassword((v) => !v)
                                }
                                className="absolute inset-y-0 right-0 pr-4 flex items-center"
                                disabled={loadingPassword}
                                tabIndex={-1}
                              >
                                {showCurrentPassword ? (
                                  <EyeOff className="h-5 w-5 text-gray-400 hover:text-[var(--primary)] transition-colors" />
                                ) : (
                                  <Eye className="h-5 w-5 text-gray-400 hover:text-[var(--primary)] transition-colors" />
                                )}
                              </button>
                            </div>
                            {passwordErrors.currentPassword && (
                              <p className="text-xs text-red-600 mt-1">
                                {passwordErrors.currentPassword}
                              </p>
                            )}
                          </div>

                          {/* Nova Senha */}
                          <div className="space-y-4">
                            <div>
                              <label className="block text-sm font-semibold mb-3 text-gray-800">
                                Nova Senha
                              </label>
                              <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                  <Lock className="h-5 w-5 text-[var(--primary)]" />
                                </div>
                                <input
                                  type={showNewPassword ? "text" : "password"}
                                  name="newPassword"
                                  value={passwordData.newPassword}
                                  onChange={(e) =>
                                    handlePasswordChange(
                                      "newPassword",
                                      e.target.value
                                    )
                                  }
                                  className="w-full pl-12 pr-12 py-3 border-2 border-gray-200 rounded-xl focus:border-[var(--primary)] transition-all duration-300 text-gray-700 placeholder-gray-500 bg-white focus:bg-white focus:shadow-xl focus:shadow-[var(--primary)]/10"
                                  placeholder="Digite sua nova senha"
                                  required
                                  disabled={loadingPassword}
                                />
                                <button
                                  type="button"
                                  onClick={() => setShowNewPassword((v) => !v)}
                                  className="absolute inset-y-0 right-0 pr-4 flex items-center"
                                  disabled={loadingPassword}
                                  tabIndex={-1}
                                >
                                  {showNewPassword ? (
                                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-[var(--primary)] transition-colors" />
                                  ) : (
                                    <Eye className="h-5 w-5 text-gray-400 hover:text-[var(--primary)] transition-colors" />
                                  )}
                                </button>
                              </div>
                              {passwordErrors.newPassword && (
                                <p className="text-xs text-red-600 mt-1">
                                  {passwordErrors.newPassword}
                                </p>
                              )}
                            </div>

                            {/* Confirmar Nova Senha */}
                            <div>
                              <label className="block text-sm font-semibold mb-3 text-gray-800">
                                Confirmar Nova Senha
                              </label>
                              <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                  <Lock className="h-5 w-5 text-[var(--primary)]" />
                                </div>
                                <input
                                  type={
                                    showConfirmPassword ? "text" : "password"
                                  }
                                  name="confirmPassword"
                                  value={passwordData.confirmPassword}
                                  onChange={(e) =>
                                    handlePasswordChange(
                                      "confirmPassword",
                                      e.target.value
                                    )
                                  }
                                  className="w-full pl-12 pr-12 py-3 border-2 border-gray-200 rounded-xl focus:border-[var(--primary)] transition-all duration-300 text-gray-700 placeholder-gray-500 bg-white focus:bg-white focus:shadow-xl focus:shadow-[var(--primary)]/10"
                                  placeholder="Confirme sua nova senha"
                                  required
                                  disabled={loadingPassword}
                                />
                                <button
                                  type="button"
                                  onClick={() =>
                                    setShowConfirmPassword((v) => !v)
                                  }
                                  className="absolute inset-y-0 right-0 pr-4 flex items-center"
                                  disabled={loadingPassword}
                                  tabIndex={-1}
                                >
                                  {showConfirmPassword ? (
                                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-[var(--primary)] transition-colors" />
                                  ) : (
                                    <Eye className="h-5 w-5 text-gray-400 hover:text-[var(--primary)] transition-colors" />
                                  )}
                                </button>
                              </div>
                              {passwordErrors.confirmPassword && (
                                <p className="text-xs text-red-600 mt-1">
                                  {passwordErrors.confirmPassword}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>

                        <div>
                          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-100 h-full">
                            <h4 className="font-medium text-blue-700 mb-3 flex items-center gap-2">
                              <Shield size={18} />
                              Requisitos de senha
                            </h4>
                            <ul className="space-y-2 text-sm text-blue-800">
                              <li className="flex items-center gap-2">
                                <Check size={16} className="text-green-600" />
                                No mínimo 8 caracteres
                              </li>
                              <li className="flex items-center gap-2">
                                <Check size={16} className="text-green-600" />
                                Pelo menos um caractere especial: @, #, $, %, ?,
                                !, *, _, &, -
                              </li>
                              <li className="flex items-center gap-2">
                                <Check size={16} className="text-green-600" />
                                Diferente da senha atual
                              </li>
                            </ul>
                          </div>
                        </div>
                      </div>

                      <div className="flex space-x-4 pt-4 border-t border-gray-100 mt-6">
                        <LoadingButton
                          onClick={handlePasswordSubmit}
                          isLoading={loadingPassword}
                          disabled={loadingPassword}
                          className="bg-[var(--primary)] text-white hover:bg-[var(--primary)]/90"
                        >
                          Salvar
                        </LoadingButton>

                        <button
                          onClick={() => {
                            setIsEditingPassword(false);
                            setPasswordData({
                              currentPassword: "",
                              newPassword: "",
                              confirmPassword: "",
                            });
                            setPasswordErrors({});
                          }}
                          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition border border-gray-200"
                          disabled={loadingPassword}
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default PerfilPage;
