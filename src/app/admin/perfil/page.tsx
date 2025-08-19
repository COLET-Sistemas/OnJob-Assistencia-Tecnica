"use client";
import React, { useState, useEffect } from "react";
import {
  User,
  Mail,
  Shield,
  Key,
  Eye,
  EyeOff,
  Save,
  Edit,
  Building,
} from "lucide-react";
import { usuariosAPI } from "@/api/api";
import { useTitle } from "@/context/TitleContext";

type Empresa = {
  razao_social: string;
};

type UserData = {
  nome: string;
  email: string;
  login: string;
  empresa?: Empresa;
  perfil_interno?: boolean;
  perfil_gestor_assistencia?: boolean;
  perfil_tecnico_proprio?: boolean;
  perfil_tecnico_terceirizado?: boolean;
  administrador?: boolean;
  [key: string]: unknown;
};

const UserProfile = () => {
  const { setTitle } = useTitle();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditingPassword, setIsEditingPassword] = useState<boolean>(false);
  const [showCurrentPassword, setShowCurrentPassword] =
    useState<boolean>(false);
  const [showNewPassword, setShowNewPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState<boolean>(false);

  const [passwordData, setPasswordData] = useState<{
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  }>({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  useEffect(() => {
    setTitle("Perfil do Usuário");
  }, [setTitle]);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        const response = await usuariosAPI.getAll({ id: 1 });

        const user = Array.isArray(response) ? response[0] : response;
        setUserData(user);
        setError(null);
      } catch (err) {
        console.error("Erro ao buscar dados do usuário:", err);
        setError("Erro ao carregar dados do usuário");
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const profileLabels = {
    perfil_interno: "Perfil Interno",
    perfil_gestor_assistencia: "Gestor de Assistência",
    perfil_tecnico_proprio: "Técnico Próprio",
    perfil_tecnico_terceirizado: "Técnico Terceirizado",
    administrador: "Administrador",
  };

  const handlePasswordChange = (
    field: keyof typeof passwordData,
    value: string
  ) => {
    setPasswordData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handlePasswordSubmit = () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert("As senhas não coincidem!");
      return;
    }
    if (!passwordData.currentPassword || !passwordData.newPassword) {
      alert("Por favor, preencha todos os campos!");
      return;
    }
    // Aqui você implementaria a lógica de alteração de senha
    console.log("Alterando senha...");
    alert("Senha alterada com sucesso!");
    setIsEditingPassword(false);
    setPasswordData({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
  };

  const getActiveProfiles = () => {
    if (!userData) return [];

    return Object.entries(userData)
      .filter(
        ([key, value]) =>
          (key.startsWith("perfil") || key === "administrador") &&
          value === true
      )
      .map(([key]) => profileLabels[key as keyof typeof profileLabels]);
  };

  if (loading) {
    return (
      <div className="min-h-screen p-2 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando dados do usuário...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen p-2 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="min-h-screen p-2 flex items-center justify-center">
        <p className="text-gray-600">Usuário não encontrado</p>
      </div>
    );
  }

  const activeProfiles = getActiveProfiles();

  return (
    <div className="min-h-screen p-2">
      <div className="max-w-8xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Informações Pessoais */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-purple-600 to-purple-700 p-6 text-white">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                  <User size={32} />
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-semibold">{userData.nome}</h2>
                  <p className="text-purple-100 flex items-center mt-1">
                    <Mail size={16} className="mr-2" />
                    {userData.email}
                  </p>
                  <p className="text-purple-100 text-sm mt-1">
                    Login: {userData.login}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6">
              {/* Informações da Empresa */}
              {userData.empresa && (
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-800 mb-2 flex items-center">
                    <Building className="mr-2 text-purple-600" size={18} />
                    Empresa
                  </h3>
                  <p className="text-gray-700">
                    {userData.empresa.razao_social}
                  </p>
                </div>
              )}

              <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                <Shield className="mr-2 text-purple-600" size={20} />
                Perfis de Acesso Ativos
              </h3>

              {activeProfiles.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {activeProfiles.map((profile, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4 border border-purple-200 rounded-lg bg-gradient-to-r from-purple-50 to-yellow-50"
                    >
                      <span className="text-gray-700 font-medium">
                        {profile}
                      </span>
                      <div className="w-4 h-4 rounded-full bg-gradient-to-r from-yellow-400 to-yellow-500 flex items-center justify-center">
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 bg-gray-100 rounded-lg text-center">
                  <p className="text-gray-600">
                    Nenhum perfil ativo encontrado
                  </p>
                </div>
              )}

              {/* Resumo dos perfis ativos */}
              {activeProfiles.length > 0 && (
                <div className="mt-6 p-4 bg-gradient-to-r from-purple-600 to-purple-700 rounded-lg">
                  <h4 className="font-semibold text-white mb-2">
                    Resumo dos Perfis ({activeProfiles.length}):
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {activeProfiles.map((profile, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-white bg-opacity-20 text-white text-sm rounded-full"
                      >
                        {profile}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Alteração de Senha */}
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 p-6 text-white">
              <h3 className="text-xl font-semibold flex items-center">
                <Key className="mr-2" size={20} />
                Segurança
              </h3>
            </div>

            <div className="p-6">
              {!isEditingPassword ? (
                <div>
                  <p className="text-gray-600 mb-4">
                    Mantenha sua conta segura alterando sua senha regularmente.
                  </p>
                  <button
                    onClick={() => setIsEditingPassword(true)}
                    className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-semibold py-3 px-4 rounded-lg transition duration-200 flex items-center justify-center"
                  >
                    <Edit className="mr-2" size={18} />
                    Alterar Senha
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Senha Atual
                    </label>
                    <div className="relative">
                      <input
                        type={showCurrentPassword ? "text" : "password"}
                        value={passwordData.currentPassword}
                        onChange={(e) =>
                          handlePasswordChange(
                            "currentPassword",
                            e.target.value
                          )
                        }
                        className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        required
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setShowCurrentPassword(!showCurrentPassword)
                        }
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showCurrentPassword ? (
                          <EyeOff size={16} />
                        ) : (
                          <Eye size={16} />
                        )}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nova Senha
                    </label>
                    <div className="relative">
                      <input
                        type={showNewPassword ? "text" : "password"}
                        value={passwordData.newPassword}
                        onChange={(e) =>
                          handlePasswordChange("newPassword", e.target.value)
                        }
                        className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showNewPassword ? (
                          <EyeOff size={16} />
                        ) : (
                          <Eye size={16} />
                        )}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Confirmar Nova Senha
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        value={passwordData.confirmPassword}
                        onChange={(e) =>
                          handlePasswordChange(
                            "confirmPassword",
                            e.target.value
                          )
                        }
                        className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        required
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showConfirmPassword ? (
                          <EyeOff size={16} />
                        ) : (
                          <Eye size={16} />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="flex space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={handlePasswordSubmit}
                      className="flex-1 bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-white font-semibold py-2 px-4 rounded-lg transition duration-200 flex items-center justify-center"
                    >
                      <Save className="mr-2" size={16} />
                      Salvar
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditingPassword(false);
                        setPasswordData({
                          currentPassword: "",
                          newPassword: "",
                          confirmPassword: "",
                        });
                      }}
                      className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg transition duration-200"
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
    </div>
  );
};

export default UserProfile;
