"use client";

import {
  AlertTriangle,
  Database,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Settings,
  Shield,
  User,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import packageInfo from "../../package.json";

// ✅ Import da função utilitária
import { criptografarSenha } from "@/utils/cryptoPassword";

interface Empresa {
  id_empresa: number;
  razao_social: string;
  cnpj: string;
  nome_bd: string;
  endereco: string;
  numero: string;
  bairro: string;
  cidade: string;
  uf: string;
  cep: string;
  latitude: number;
  longitude: number;
  licenca_demo: boolean;
  usuarios_ativos?: number;
  usuarios_cadastrados?: number;
  usuarios_licenciados?: number;
  data_validade?: string;
}

interface LoginResponse {
  token: string;
  nome_usuario: string;
  id_usuario: number;
  email: string;
  perfil: {
    interno: boolean;
    gestor: boolean;
    tecnico_proprio: boolean;
    tecnico_terceirizado: boolean;
    admin: boolean;
  };
  empresa?: Empresa;
  versao_api?: string | number;
  senha_provisoria?: boolean;
}

interface LoginRequest {
  login: string;
  senha_criptografada: string;
}

export default function LoginPage() {
  const [login, setLogin] = useState("");
  const [senha, setSenha] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loadingAdmin, setLoadingAdmin] = useState(false);
  const [loadingTech, setLoadingTech] = useState(false);
  const [error, setError] = useState("");
  const [isMobile, setIsMobile] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [redirectReason, setRedirectReason] = useState<string | null>(null);

  const loginInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    setIsMounted(true);

    // Verificar se há mensagem de redirecionamento armazenada
    if (typeof window !== "undefined") {
      const reason = sessionStorage.getItem("loginRedirectReason");
      if (reason) {
        setRedirectReason(reason);
        setError(reason);
        sessionStorage.removeItem("loginRedirectReason");
      }
    }
  }, []);

  useEffect(() => {
    const checkDevice = () => {
      if (typeof window === "undefined") return;

      const userAgent = navigator.userAgent.toLowerCase();
      const isMobileDevice =
        /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/.test(
          userAgent
        );
      const isSmallScreen = window.innerWidth <= 1024;
      const isTouchDevice =
        "ontouchstart" in window || navigator.maxTouchPoints > 0;

      setIsMobile(isMobileDevice || isSmallScreen || isTouchDevice);
    };

    const timer = setTimeout(checkDevice, 100);
    window.addEventListener("resize", checkDevice);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", checkDevice);
    };
  }, []);

  useEffect(() => {
    if (loginInputRef.current) {
      loginInputRef.current.focus();
    }
  }, []);

  const authenticate = async (): Promise<LoginResponse | null> => {
    try {
      const loginData: LoginRequest = {
        login,
        senha_criptografada: criptografarSenha(senha),
      };

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(loginData),
      });

      if (!response.ok) throw new Error("Credenciais inválidas");

      const data: LoginResponse = await response.json();
      return data;
    } catch (error) {
      console.error("Erro na autenticação:", error);
      return null;
    }
  };

  const hasAdminAccess = (perfil: LoginResponse["perfil"]) =>
    perfil.interno || perfil.gestor || perfil.admin;

  const hasTechAccess = (perfil: LoginResponse["perfil"]) =>
    perfil.tecnico_proprio || perfil.tecnico_terceirizado;

  const handleAdminAccess = async () => {
    if (!login.trim() || !senha.trim()) {
      setError("Por favor, preencha todos os campos.");
      return;
    }

    setLoadingAdmin(true);
    setError("");

    try {
      const authData = await authenticate();

      if (!authData) {
        setError("Erro na autenticação. Verifique suas credenciais.");
        return;
      }

      if (hasAdminAccess(authData.perfil)) {
        // Dados principais fora do objeto empresa
        localStorage.setItem("email", authData.email);
        localStorage.setItem("id_usuario", String(authData.id_usuario));
        localStorage.setItem("nome_usuario", authData.nome_usuario);
        localStorage.setItem("token", authData.token);
        localStorage.setItem("perfil", JSON.stringify(authData.perfil));
        localStorage.setItem("versao_api", String(authData.versao_api));

        // Objeto empresa completo
        if (authData.empresa) {
          const empresaObj = {
            nome_bd: authData.empresa.nome_bd || "",
            razao_social: authData.empresa.razao_social || "",
            id_empresa: authData.empresa.id_empresa,
            cnpj: authData.empresa.cnpj || "",
            usuarios_ativos: authData.empresa.usuarios_ativos || 0,
            usuarios_cadastrados: authData.empresa.usuarios_cadastrados || 0,
            usuarios_licenciados: authData.empresa.usuarios_licenciados || 0,
            latitude: Number(authData.empresa.latitude) || "",
            longitude: Number(authData.empresa.longitude) || "",
            data_validade: authData.empresa.data_validade || "",
            licenca_demo: !!authData.empresa.licenca_demo,
            cep: authData.empresa.cep || "",
            bairro: authData.empresa.bairro || "",
            cidade: authData.empresa.cidade || "",
            endereco: authData.empresa.endereco || "",
            numero: authData.empresa.numero || "",
            uf: authData.empresa.uf || "",
          };
          localStorage.setItem("empresa", JSON.stringify(empresaObj));
        }

        // Verificar se a senha é provisória
        if (authData.senha_provisoria) {
          router.push("/alterar-senha");
        } else {
          router.push("/admin/dashboard");
        }
      } else {
        setError(
          "Usuário não tem permissão para acessar o Módulo Administrativo."
        );
      }
    } catch (error) {
      console.error("Erro no handleAdminAccess:", error);
      setError("Erro interno. Tente novamente.");
    } finally {
      setLoadingAdmin(false);
    }
  };

  const handleTechAccess = async () => {
    if (!login.trim() || !senha.trim()) {
      setError("Por favor, preencha todos os campos.");
      return;
    }

    setLoadingTech(true);
    setError("");

    try {
      const authData = await authenticate();

      if (!authData) {
        setError("Erro na autenticação. Verifique suas credenciais.");
        return;
      }

      if (hasTechAccess(authData.perfil)) {
        // Dados principais fora do objeto empresa
        localStorage.setItem("email", authData.email);
        localStorage.setItem("id_usuario", String(authData.id_usuario));
        localStorage.setItem("nome_usuario", authData.nome_usuario);
        localStorage.setItem("token", authData.token);
        localStorage.setItem("perfil", JSON.stringify(authData.perfil));
        localStorage.setItem("versao_api", String(authData.versao_api));

        // Objeto empresa completo
        if (authData.empresa) {
          const empresaObj = {
            nome_bd: authData.empresa.nome_bd || "",
            razao_social: authData.empresa.razao_social || "",
            id_empresa: authData.empresa.id_empresa,
            cnpj: authData.empresa.cnpj || "",
            usuarios_ativos: authData.empresa.usuarios_ativos || 0,
            usuarios_cadastrados: authData.empresa.usuarios_cadastrados || 0,
            usuarios_licenciados: authData.empresa.usuarios_licenciados || 0,
            latitude: authData.empresa.latitude || "",
            longitude: authData.empresa.longitude || "",
            data_validade: authData.empresa.data_validade || "",
            licenca_demo: !!authData.empresa.licenca_demo,
            cep: authData.empresa.cep || "",
            bairro: authData.empresa.bairro || "",
            cidade: authData.empresa.cidade || "",
            endereco: authData.empresa.endereco || "",
            numero: authData.empresa.numero || "",
            uf: authData.empresa.uf || "",
          };
          localStorage.setItem("empresa", JSON.stringify(empresaObj));
        }

        // Verificar se a senha é provisória
        if (authData.senha_provisoria) {
          router.push("/alterar-senha");
        } else {
          router.push("/tecnico/dashboard");
        }
      } else {
        setError("Usuário não tem permissão para acessar o Módulo Técnico.");
      }
    } catch (error) {
      console.error("Erro no handleTechAccess:", error);
      setError("Erro interno. Tente novamente.");
    } finally {
      setLoadingTech(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && login.trim() && senha.trim()) {
      e.preventDefault();

      if (loadingAdmin || loadingTech) return;

      if (isMobile) {
        handleTechAccess();
      } else {
        handleAdminAccess();
      }
    }
  };

  if (!isMounted) return null;

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-[55%] bg-[#F6C647] relative overflow-hidden">
        <div className="absolute inset-0 opacity-15">
          <div className="absolute top-20 left-10 w-32 h-32 rounded-full border-2 border-[#75FABD]"></div>
          <div className="absolute top-40 right-20 w-24 h-24 rounded-full bg-[#7C54BD] opacity-20"></div>
          <div className="absolute bottom-32 left-1/4 w-16 h-16 rotate-45 border-2 border-[#7C54BD]"></div>
          <div className="absolute bottom-20 right-1/3 w-20 h-20 rounded-full border border-white"></div>
          <div className="absolute top-1/2 left-1/2 w-12 h-12 rounded-full bg-[#75FABD] opacity-20"></div>
        </div>

        <div className="relative z-10 flex flex-col justify-center px-12 py-16 text-white">
          <div className="mb-12">
            <div className="mb-6">
              <Image
                src="/images/logoEscrito.png"
                alt="OnJob Sistema de Assistência Técnica"
                width={320}
                height={100}
                priority
                className="h-36 w-auto object-contain"
              />
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-5xl font-bold mb-6 leading-tight">
              Sistema de
              <span className="block text-[#7C54BD]  bg-clip-text ">
                Assistencia Técnica
              </span>
            </h2>
            <p className="text-gray-800 text-xl leading-relaxed font-light">
              Plataforma integrada para otimização de processos de trabalho, com
              módulos administrativos e operacionais modernos.
            </p>
          </div>

          <div className="space-y-8">
            <div className="flex items-center space-x-5">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-[#7C54BD] shadow-lg">
                <Settings className="w-6 h-6 text-[#75FABD]" />
              </div>
              <div>
                <h3 className="font-semibold text-lg text-gray-800">
                  Módulo Administrativo
                </h3>
                <p className="text-gray-700 text-sm leading-relaxed">
                  Gestão completa de usuários, criação de ordens de serviço,
                  relatórios avançados e configurações
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-5">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-[#75FABD] shadow-lg">
                <Shield className="w-6 h-6 text-[#7C54BD]" />
              </div>
              <div>
                <h3 className="font-semibold text-lg text-gray-800">
                  Módulo Técnico
                </h3>
                <p className="text-gray-700 text-sm leading-relaxed">
                  Interface otimizada para técnicos com recursos mobile e
                  operações de campo
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-5">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-[#7C54BD] shadow-lg">
                <Database className="w-6 h-6 text-[#75FABD]" />
              </div>
              <div>
                <h3 className="font-semibold text-lg text-gray-800">
                  Segurança Avançada
                </h3>
                <p className="text-gray-700 text-sm leading-relaxed">
                  Criptografia de última geração e controle de acesso multinível
                </p>
              </div>
            </div>
          </div>

          <div className="mt-16 pt-8 border-t border-gray-700/20">
            <div className="text-center">
              <p className="text-gray-700 text-sm">
                Tecnologia que transforma a forma como você trabalha
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full lg:w-[45%] flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md">
          <div className="lg:hidden text-center mb-8">
            <div className="flex justify-center mb-6">
              <Image
                src="/images/logoEscrito.png"
                alt="OnJob Sistema de Assistência Técnica"
                width={200}
                height={50}
                priority
                className="h-12 w-auto object-contain"
              />
            </div>
            <h2 className="text-xl font-semibold mb-2 text-gray-800">
              Sistema de Gestão Profissional
            </h2>
            <p className="text-gray-600">Faça login para continuar</p>
          </div>

          <div className="hidden lg:block text-center mb-10">
            <div className="w-25 h-25 rounded-3xl flex items-center justify-center mx-auto mb-6 bg-[#7C54BD] shadow-xl">
              <div className="w-18 h-18 rounded-2xl bg-[#F6C647] flex items-center justify-center">
                <Image
                  src="/images/logo.png"
                  alt="OnJob Logo"
                  width={25}
                  height={25}
                  className="h-14 w-14 object-contain"
                />
              </div>
            </div>
            <h2 className="text-3xl font-bold mb-3 text-gray-800">
              Bem-vindo de volta
            </h2>
            <p className="text-gray-600 text-lg">
              Acesse sua conta para continuar
            </p>
          </div>

          {error && (
            <div
              className={`mb-6 p-4 ${
                redirectReason
                  ? "bg-amber-50 border-amber-200"
                  : "bg-red-50 border-red-200"
              } border rounded-2xl flex items-start space-x-3 animate-shake shadow-sm`}
            >
              <AlertTriangle
                className={`w-5 h-5 ${
                  redirectReason ? "text-amber-500" : "text-red-500"
                } mt-0.5 flex-shrink-0`}
              />
              <p
                className={`${
                  redirectReason ? "text-amber-700" : "text-red-700"
                } text-sm`}
              >
                {error}
              </p>
            </div>
          )}

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold mb-3 text-gray-800">
                Usuário
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-[#7C54BD]" />
                </div>
                <input
                  ref={loginInputRef}
                  type="text"
                  value={login}
                  onChange={(e) => setLogin(e.target.value.toLowerCase())}
                  onKeyPress={handleKeyPress}
                  className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-2xl focus:border-[#7C54BD] transition-all duration-300 text-gray-700 placeholder-gray-500 bg-white focus:bg-white focus:shadow-xl focus:shadow-[#7C54BD]/10"
                  placeholder="Digite seu usuário"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-3 text-gray-800">
                Senha
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-[#7C54BD]" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="w-full pl-12 pr-12 py-4 border-2 border-gray-200 rounded-2xl focus:border-[#7C54BD] transition-all duration-300 text-gray-700 placeholder-gray-500 bg-white focus:bg-white focus:shadow-xl focus:shadow-[#7C54BD]/10"
                  placeholder="Digite sua senha"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-[#7C54BD] transition-colors" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 hover:text-[#7C54BD] transition-colors" />
                  )}
                </button>
              </div>
            </div>

            <div className="space-y-4 pt-6">
              {/* Botão Administrativo - só aparece em desktop */}
              {!isMobile && (
                <button
                  onClick={handleAdminAccess}
                  disabled={
                    loadingAdmin ||
                    loadingTech ||
                    !login.trim() ||
                    !senha.trim()
                  }
                  className={`w-full text-white font-semibold py-4 px-6 rounded-2xl transition-all duration-300 flex items-center justify-center space-x-3 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-xl hover:shadow-[#75FABD]/25 transform hover:-translate-y-1 active:scale-95 bg-[#75FABD] ${
                    loadingAdmin ? "animate-pulse scale-95" : ""
                  }`}
                >
                  {loadingAdmin ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Validando...</span>
                    </>
                  ) : (
                    <>
                      <Settings className="w-5 h-5" />
                      <span>Acessar Módulo Administrativo</span>
                    </>
                  )}
                </button>
              )}

              {/* Botão Técnico */}
              <button
                onClick={handleTechAccess}
                disabled={
                  loadingAdmin || loadingTech || !login.trim() || !senha.trim()
                }
                className={`w-full text-white font-semibold py-4 px-6 rounded-2xl transition-all duration-300 flex items-center justify-center space-x-3 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-xl hover:shadow-[#7C54BD]/25 transform hover:-translate-y-1 active:scale-95 bg-[#7C54BD] ${
                  loadingTech ? "animate-pulse scale-95" : ""
                }`}
              >
                {loadingTech ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Validando...</span>
                  </>
                ) : (
                  <>
                    <Shield className="w-5 h-5" />
                    <span>Acessar Módulo Técnico</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="mt-10 pt-6 border-t border-gray-200 text-center">
            <div className="mb-4">
              <a
                href="/dashboard-panel"
                className="inline-flex items-center text-sm text-[#7C54BD] hover:text-[#5A3B95] transition-colors"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 mr-1"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2"
                  />
                </svg>
                Acessar Painel de Monitoramento
              </a>
            </div>
            <p className="text-gray-500 text-xs">
              © 2025 OnJob Sistemas. Todos os direitos reservados - Versão{" "}
              {packageInfo.version}
            </p>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes shake {
          0%,
          100% {
            transform: translateX(0);
          }
          25% {
            transform: translateX(-5px);
          }
          75% {
            transform: translateX(5px);
          }
        }

        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
      `}</style>
    </div>
  );
}
