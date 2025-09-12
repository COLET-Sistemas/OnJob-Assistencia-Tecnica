"use client";

import { useState, useEffect, useCallback } from "react";
import { useTitle } from "@/context/TitleContext";
import { usuariosService } from "@/api/services/usuariosService";
import { useToast } from "@/components/admin/ui/ToastContainer";
import InputField from "@/components/admin/form/InputField";
import LoadingButton from "@/components/admin/form/LoadingButton";
import { criptografarSenha } from "@/utils/cryptoPassword";
import {
  User,
  Mail,
  Phone,
  Shield,
  Check,
  AlertTriangle,
  Key,
  Calendar,
  UserCheck,
} from "lucide-react";

// Tipo para o usuário
interface Usuario {
  id: number;
  nome: string;
  login: string;
  email: string;
  telefone?: string;
  situacao: boolean;
  data_situacao: string;
  perfil_interno?: boolean;
  perfil_gestor_assistencia?: boolean;
  administrador?: boolean;
  perfil_tecnico_proprio?: boolean;
  perfil_tecnico_terceirizado?: boolean;
  senha_provisoria?: boolean;
  empresa?: {
    id_empresa: number;
    razao_social: string;
  };
}

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
    // Verificar comprimento mínimo
    if (password.length < 7) {
      return {
        isValid: false,
        message: "A senha deve ter pelo menos 7 caracteres",
      };
    }

    // Verificar caractere especial
    const specialChars = /[@#$%?!]/;
    if (!specialChars.test(password)) {
      return {
        isValid: false,
        message:
          "A senha deve conter pelo menos um caractere especial (@, #, $, %, ?, !)",
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

      await usuariosService.resetPassword(userData.id, {
        senha_atual: criptografarSenha(passwordData.currentPassword),
        nova_senha: criptografarSenha(passwordData.newPassword),
      });

      showSuccess(
        "Senha alterada com sucesso",
        "Sua senha foi atualizada com sucesso"
      );
      setIsEditingPassword(false);
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error) {
      console.error("Erro ao alterar senha:", error);
      showError(
        "Erro ao alterar senha",
        "Verifique se sua senha atual está correta"
      );
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
      <div className="bg-gradient-to-r from-[var(--primary)]/90 to-[var(--primary)] mb-6 py-6">
        <div className="max-w-8l mx-auto px-8">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/20 backdrop-blur-sm rounded-full">
              <User className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Meu Perfil</h1>
              <p className="text-white/80">
                Gerencie suas informações e segurança
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-8l mx-auto space-y-6 px-8">
        {loading ? (
          <div className="flex flex-col justify-center items-center h-[60vh] bg-white/50 backdrop-blur-sm rounded-xl border border-gray-100 shadow-sm">
            <div className="w-16 h-16 mb-4 relative">
              <div className="absolute inset-0 rounded-full border-t-2 border-r-2 border-[var(--primary)] animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <User size={24} className="text-[var(--primary)]" />
              </div>
            </div>
            <h3 className="text-lg font-medium text-[var(--primary)]">
              Carregando perfil
            </h3>
            <p className="text-gray-500">
              Aguarde enquanto buscamos seus dados...
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Dados do Usuário */}
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-white rounded-xl shadow-sm overflow-hidden h-auto">
                <div className="bg-gradient-to-r from-[var(--primary)] to-[var(--primary)]/80 p-8 flex flex-col items-center">
                  <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center text-[var(--primary)] shadow-lg mb-4">
                    <User size={40} strokeWidth={1.5} />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-1">
                    {userData?.nome}
                  </h3>
                  <p className="text-white/90 text-sm flex items-center gap-1">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-white/20 backdrop-blur-sm`}
                    >
                      {getProfileLabel()}
                    </span>
                  </p>
                </div>

                <div className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                      <div className="p-2 bg-[var(--primary)]/10 rounded-full text-[var(--primary)]">
                        <UserCheck size={18} />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 font-medium">
                          Login
                        </p>
                        <p className="text-[var(--neutral-graphite)] font-medium">
                          {userData?.login || "Não informado"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                      <div className="p-2 bg-[var(--primary)]/10 rounded-full text-[var(--primary)]">
                        <Mail size={18} />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 font-medium">
                          E-mail
                        </p>
                        <p className="text-[var(--neutral-graphite)] font-medium">
                          {userData?.email || "Não informado"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                      <div className="p-2 bg-[var(--primary)]/10 rounded-full text-[var(--primary)]">
                        <Phone size={18} />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 font-medium">
                          Telefone
                        </p>
                        <p className="text-[var(--neutral-graphite)] font-medium">
                          {userData?.telefone || "Não informado"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Status */}
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="p-6">
                  <h3 className="text-lg font-medium mb-6 text-[var(--neutral-graphite)] flex items-center gap-2">
                    <Shield className="h-5 w-5 text-[var(--primary)]" />
                    Status da Conta
                  </h3>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-white border border-gray-100 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-[var(--primary)]/10 rounded-full text-[var(--primary)]">
                          <UserCheck size={18} />
                        </div>
                        <p className="font-medium">Tipo de Perfil</p>
                      </div>
                      <div className="bg-[var(--primary)]/10 px-3 py-1 rounded-full text-[var(--primary)] text-sm font-semibold">
                        {getProfileLabel()}
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-white border border-gray-100 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div
                          className={`p-2 rounded-full ${
                            userData?.situacao
                              ? "bg-green-100 text-green-600"
                              : "bg-red-100 text-red-600"
                          }`}
                        >
                          {userData?.situacao ? (
                            <Check size={18} />
                          ) : (
                            <AlertTriangle size={18} />
                          )}
                        </div>
                        <p className="font-medium">Situação</p>
                      </div>
                      <div
                        className={`px-3 py-1 rounded-full text-sm font-semibold ${
                          userData?.situacao
                            ? "bg-green-100 text-green-600"
                            : "bg-red-100 text-red-600"
                        }`}
                      >
                        {userData?.situacao ? "Ativo" : "Inativo"}
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-white border border-gray-100 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div
                          className={`p-2 rounded-full ${
                            userData?.senha_provisoria
                              ? "bg-yellow-100 text-yellow-600"
                              : "bg-green-100 text-green-600"
                          }`}
                        >
                          <Key size={18} />
                        </div>
                        <p className="font-medium">Senha Provisória</p>
                      </div>
                      <div
                        className={`px-3 py-1 rounded-full text-sm font-semibold ${
                          userData?.senha_provisoria
                            ? "bg-yellow-100 text-yellow-600"
                            : "bg-green-100 text-green-600"
                        }`}
                      >
                        {userData?.senha_provisoria ? "Sim" : "Não"}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Alteração de Senha */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="bg-gradient-to-r from-[var(--primary)]/5 to-transparent p-6 border-b border-gray-100">
                  <h3 className="text-lg font-medium text-[var(--neutral-graphite)] flex items-center gap-2">
                    <Key className="h-5 w-5 text-[var(--primary)]" />
                    Alteração de Senha
                  </h3>
                </div>

                <div className="p-6">
                  {!isEditingPassword ? (
                    <div className="flex flex-col items-center justify-center h-[250px] border border-dashed border-gray-200 rounded-lg bg-gradient-to-b from-gray-50 to-white">
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
                    <div className="space-y-6 bg-white rounded-lg">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <div className="mb-6">
                            <h4 className="text-sm font-semibold text-[var(--primary)] mb-2 flex items-center gap-1.5">
                              <Shield size={14} />
                              Credenciais Atuais
                            </h4>
                            <InputField
                              label="Senha Atual"
                              name="currentPassword"
                              value={passwordData.currentPassword}
                              onChange={(e) =>
                                handlePasswordChange(
                                  "currentPassword",
                                  e.target.value
                                )
                              }
                              type="password"
                              required
                              error={passwordErrors.currentPassword}
                            />
                          </div>

                          <div className="space-y-4">
                            <h4 className="text-sm font-semibold text-[var(--primary)] mb-2 flex items-center gap-1.5">
                              <Key size={14} />
                              Nova Senha
                            </h4>
                            <InputField
                              label="Nova Senha"
                              name="newPassword"
                              value={passwordData.newPassword}
                              onChange={(e) =>
                                handlePasswordChange(
                                  "newPassword",
                                  e.target.value
                                )
                              }
                              type="password"
                              required
                              error={passwordErrors.newPassword}
                            />

                            <InputField
                              label="Confirmar Nova Senha"
                              name="confirmPassword"
                              value={passwordData.confirmPassword}
                              onChange={(e) =>
                                handlePasswordChange(
                                  "confirmPassword",
                                  e.target.value
                                )
                              }
                              type="password"
                              required
                              error={passwordErrors.confirmPassword}
                            />
                          </div>
                        </div>

                        <div>
                          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-100 h-full">
                            <div className="flex items-center gap-2 mb-4">
                              <div className="p-1.5 bg-blue-100 rounded-full text-blue-700">
                                <Shield size={16} />
                              </div>
                              <h4 className="font-medium text-blue-800">
                                Requisitos de Segurança
                              </h4>
                            </div>

                            <div className="space-y-4">
                              <div className="flex items-start gap-3">
                                <div className="mt-0.5 p-1 bg-blue-100 rounded-full text-blue-700">
                                  <Check size={12} />
                                </div>
                                <div>
                                  <p className="text-blue-800 font-medium">
                                    Mínimo de 7 caracteres
                                  </p>
                                  <p className="text-sm text-blue-700/70">
                                    Use pelo menos 7 caracteres para maior
                                    segurança
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-start gap-3">
                                <div className="mt-0.5 p-1 bg-blue-100 rounded-full text-blue-700">
                                  <Check size={12} />
                                </div>
                                <div>
                                  <p className="text-blue-800 font-medium">
                                    Caracteres Especiais
                                  </p>
                                  <p className="text-sm text-blue-700/70">
                                    Inclua pelo menos um caractere especial: @,
                                    #, $, %, ?, !
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-start gap-3">
                                <div className="mt-0.5 p-1 bg-blue-100 rounded-full text-blue-700">
                                  <Check size={12} />
                                </div>
                                <div>
                                  <p className="text-blue-800 font-medium">
                                    Confirmação
                                  </p>
                                  <p className="text-sm text-blue-700/70">
                                    As senhas devem ser idênticas nos campos
                                    &quot;Nova Senha&quot; e &quot;Confirmar
                                    Nova Senha&quot;
                                  </p>
                                </div>
                              </div>
                            </div>
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
                          Salvar Alterações
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

              {/* Informações Completas do Usuário */}
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="bg-gradient-to-r from-[var(--primary)]/5 to-transparent p-6 border-b border-gray-100">
                  <h3 className="text-lg font-medium text-[var(--neutral-graphite)] flex items-center gap-2">
                    <User className="h-5 w-5 text-[var(--primary)]" />
                    Informações Completas
                  </h3>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Perfis de Acesso */}
                    <div className="flex flex-col gap-2">
                      <h4 className="text-sm font-semibold text-gray-600 mb-2">
                        Perfis de Acesso
                      </h4>

                      <div className="flex items-center p-3 rounded-lg border border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                        <div
                          className={`p-2 rounded-full mr-3 ${
                            userData?.perfil_interno
                              ? "bg-green-100 text-green-600"
                              : "bg-gray-100 text-gray-500"
                          }`}
                        >
                          <Check
                            size={16}
                            opacity={userData?.perfil_interno ? 1 : 0.5}
                          />
                        </div>
                        <div>
                          <p className="font-medium text-gray-600">
                            Perfil Interno
                          </p>
                          <p className="text-xs text-gray-600">
                            {userData?.perfil_interno
                              ? "Habilitado"
                              : "Não habilitado"}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center p-3 rounded-lg border border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                        <div
                          className={`p-2 rounded-full mr-3 ${
                            userData?.administrador
                              ? "bg-green-100 text-green-600"
                              : "bg-gray-100 text-gray-500"
                          }`}
                        >
                          <Check
                            size={16}
                            opacity={userData?.administrador ? 1 : 0.5}
                          />
                        </div>
                        <div>
                          <p className="font-medium">Administrador</p>
                          <p className="text-xs text-gray-500">
                            {userData?.administrador
                              ? "Habilitado"
                              : "Não habilitado"}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center p-3 rounded-lg border border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                        <div
                          className={`p-2 rounded-full mr-3 ${
                            userData?.perfil_gestor_assistencia
                              ? "bg-green-100 text-green-600"
                              : "bg-gray-100 text-gray-500"
                          }`}
                        >
                          <Check
                            size={16}
                            opacity={
                              userData?.perfil_gestor_assistencia ? 1 : 0.5
                            }
                          />
                        </div>
                        <div>
                          <p className="font-medium">Gestor de Assistência</p>
                          <p className="text-xs text-gray-500">
                            {userData?.perfil_gestor_assistencia
                              ? "Habilitado"
                              : "Não habilitado"}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center p-3 rounded-lg border border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                        <div
                          className={`p-2 rounded-full mr-3 ${
                            userData?.perfil_tecnico_proprio
                              ? "bg-green-100 text-green-600"
                              : "bg-gray-100 text-gray-500"
                          }`}
                        >
                          <Check
                            size={16}
                            opacity={userData?.perfil_tecnico_proprio ? 1 : 0.5}
                          />
                        </div>
                        <div>
                          <p className="font-medium">Técnico Próprio</p>
                          <p className="text-xs text-gray-500">
                            {userData?.perfil_tecnico_proprio
                              ? "Habilitado"
                              : "Não habilitado"}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center p-3 rounded-lg border border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                        <div
                          className={`p-2 rounded-full mr-3 ${
                            userData?.perfil_tecnico_terceirizado
                              ? "bg-green-100 text-green-600"
                              : "bg-gray-100 text-gray-500"
                          }`}
                        >
                          <Check
                            size={16}
                            opacity={
                              userData?.perfil_tecnico_terceirizado ? 1 : 0.5
                            }
                          />
                        </div>
                        <div>
                          <p className="font-medium">Técnico Terceirizado</p>
                          <p className="text-xs text-gray-500">
                            {userData?.perfil_tecnico_terceirizado
                              ? "Habilitado"
                              : "Não habilitado"}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Informações do Usuário e Empresa */}
                    <div className="flex flex-col gap-2">
                      <h4 className="text-sm font-semibold text-gray-600 mb-2">
                        Informações Adicionais
                      </h4>

                      <div className="flex items-center p-3 rounded-lg border border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                        <div className="p-2 bg-[var(--primary)]/10 rounded-full text-[var(--primary)] mr-3">
                          <Calendar size={16} />
                        </div>
                        <div>
                          <p className="font-medium">Data da Situação</p>
                          <p className="text-xs text-gray-500">
                            {userData?.data_situacao || "Não disponível"}
                          </p>
                        </div>
                      </div>

                      {userData?.empresa && (
                        <div className="flex items-center p-3 rounded-lg border border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                          <div className="p-2 bg-[var(--primary)]/10 rounded-full text-[var(--primary)] mr-3">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className="lucide lucide-building"
                            >
                              <rect
                                width="16"
                                height="20"
                                x="4"
                                y="2"
                                rx="2"
                                ry="2"
                              />
                              <path d="M9 22v-4h6v4" />
                              <path d="M8 6h.01" />
                              <path d="M16 6h.01" />
                              <path d="M12 6h.01" />
                              <path d="M12 10h.01" />
                              <path d="M12 14h.01" />
                              <path d="M16 10h.01" />
                              <path d="M16 14h.01" />
                              <path d="M8 10h.01" />
                              <path d="M8 14h.01" />
                            </svg>
                          </div>
                          <div>
                            <p className="font-medium">Empresa</p>
                            <p className="text-xs text-gray-500">
                              {userData.empresa.razao_social} (ID:{" "}
                              {userData.empresa.id_empresa})
                            </p>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center p-3 rounded-lg border border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                        <div className="p-2 bg-[var(--primary)]/10 rounded-full text-[var(--primary)] mr-3">
                          <Key size={16} />
                        </div>
                        <div>
                          <p className="font-medium">Status da Senha</p>
                          <p className="text-xs text-gray-500">
                            {userData?.senha_provisoria
                              ? "Senha provisória (necessário alterar)"
                              : "Senha definitiva"}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center p-3 rounded-lg border border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                        <div className="p-2 bg-[var(--primary)]/10 rounded-full text-[var(--primary)] mr-3">
                          <UserCheck size={16} />
                        </div>
                        <div>
                          <p className="font-medium">ID do Usuário</p>
                          <p className="text-xs text-gray-500">
                            {userData?.id || "N/A"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
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
