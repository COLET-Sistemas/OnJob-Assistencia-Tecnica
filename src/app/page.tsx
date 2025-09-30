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
  BarChart3,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import packageInfo from "../../package.json";

// Import do serviço de login
import { LoginService } from "@/api/services/login";

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

  const handleAdminAccess = async () => {
    if (!login.trim() || !senha.trim()) {
      setError("Por favor, preencha todos os campos.");
      return;
    }

    setLoadingAdmin(true);
    setError("");

    try {
      const authData = await LoginService.authenticate(login, senha);

      if (LoginService.hasAdminAccess(authData.perfil)) {
        LoginService.saveUserData(authData);

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
      setError(
        error instanceof Error
          ? error.message
          : "Erro interno. Tente novamente."
      );
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
      const authData = await LoginService.authenticate(login, senha);

      if (!LoginService.hasTechAccess(authData.perfil)) {
        setError(
          "Usuário não possui perfil técnico. Acesso negado ao Módulo Técnico."
        );
        return;
      }

      const { tecnico_proprio, tecnico_terceirizado } = authData.perfil;

      if (!tecnico_proprio && !tecnico_terceirizado) {
        setError(
          "Usuário não é técnico próprio nem terceirizado. Acesso negado."
        );
        return;
      }

      LoginService.saveUserData(authData);

      if (authData.senha_provisoria) {
        router.push("/alterar-senha");
      } else {
        router.push("/tecnico/dashboard");
      }
    } catch (error) {
      console.error("Erro no handleTechAccess:", error);
      setError(
        error instanceof Error
          ? error.message
          : "Erro interno. Tente novamente."
      );
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
    <div className="min-h-screen flex bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Left Panel - Desktop Only */}
      <div className="hidden lg:flex lg:w-[55%] bg-gradient-to-br from-[#7B54BE] via-[#6844AA] to-[#553499] relative overflow-hidden">
        {/* Animated Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-40 h-40 rounded-full border-4 border-[#FDAD15]"></div>
          <div className="absolute top-40 right-20 w-32 h-32 rounded-full bg-[#FDAD15] opacity-30 blur-3xl"></div>
          <div className="absolute bottom-32 left-1/4 w-24 h-24 rotate-45 border-4 border-[#FDAD15]"></div>
          <div className="absolute bottom-20 right-1/3 w-28 h-28 rounded-full border-2 border-white opacity-40"></div>
          <div className="absolute top-1/2 left-1/2 w-16 h-16 rounded-full bg-[#FDAD15] opacity-20"></div>
          <div className="absolute top-1/3 right-1/4 w-20 h-20 rotate-12 border-2 border-white opacity-30"></div>
        </div>

        <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent"></div>

        <div className="relative z-10 flex flex-col justify-center px-16 py-12 text-white">
          {/* Logo Section */}
          <div className="mb-12">
            <div className="flex items-center space-x-4 mb-8">
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
          </div>

          {/* Main Heading */}
          <div className="mb-12">
            <h2 className="text-5xl font-bold mb-6 leading-tight">
              Sistema de
              <span className="block bg-gradient-to-r from-[#FDAD15] to-[#FFC845] bg-clip-text text-transparent">
                Assistência Técnica
              </span>
            </h2>
            <p className="text-white/90 text-xl leading-relaxed font-light">
              Plataforma integrada para otimização de processos de trabalho, com
              módulos administrativos e operacionais modernos.
            </p>
          </div>

          {/* Features */}
          <div className="space-y-6">
            <div className="flex items-start space-x-4 bg-white/5 backdrop-blur-sm rounded-2xl p-5 border border-white/10 hover:bg-white/10 transition-all duration-300">
              <div className="w-14 h-14 rounded-xl flex items-center justify-center bg-gradient-to-br from-[#FDAD15] to-[#E89D05] shadow-lg flex-shrink-0">
                <Settings className="w-7 h-7 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-lg text-white mb-1">
                  Módulo Administrativo
                </h3>
                <p className="text-white/80 text-sm leading-relaxed">
                  Gestão completa de usuários, criação de ordens de serviço,
                  relatórios avançados e configurações
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4 bg-white/5 backdrop-blur-sm rounded-2xl p-5 border border-white/10 hover:bg-white/10 transition-all duration-300">
              <div className="w-14 h-14 rounded-xl flex items-center justify-center bg-gradient-to-br from-[#7B54BE] to-[#553499] shadow-lg flex-shrink-0">
                <Shield className="w-7 h-7 text-[#FDAD15]" />
              </div>
              <div>
                <h3 className="font-semibold text-lg text-white mb-1">
                  Módulo Técnico
                </h3>
                <p className="text-white/80 text-sm leading-relaxed">
                  Interface otimizada para técnicos com recursos mobile e
                  operações de campo
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4 bg-white/5 backdrop-blur-sm rounded-2xl p-5 border border-white/10 hover:bg-white/10 transition-all duration-300">
              <div className="w-14 h-14 rounded-xl flex items-center justify-center bg-gradient-to-br from-[#FDAD15] to-[#E89D05] shadow-lg flex-shrink-0">
                <Database className="w-7 h-7 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-lg text-white mb-1">
                  Segurança Avançada
                </h3>
                <p className="text-white/80 text-sm leading-relaxed">
                  Criptografia de última geração e controle de acesso multinível
                </p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-12 pt-8 border-t border-white/10">
            <p className="text-white/70 text-sm text-center">
              Tecnologia que transforma a forma como você trabalha
            </p>
          </div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="w-full lg:w-[45%] flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md">
          {/* Mobile Header */}
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

          {/* Desktop Header */}
          <div className="hidden lg:block text-center mb-10">
            <div className="w-28 h-28 rounded-3xl flex items-center justify-center mx-auto mb-6 bg-gradient-to-br from-[#7B54BE] to-[#553499] shadow-2xl transform hover:scale-105 transition-transform duration-300">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#FDAD15] to-[#E89D05] flex items-center justify-center shadow-inner">
                <Image
                  src="/images/logo.png"
                  alt="OnJob Logo"
                  width={56}
                  height={56}
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

          {/* Error Alert */}
          {error && (
            <div
              className={`mb-6 p-4 ${
                redirectReason
                  ? "bg-amber-50 border-amber-200"
                  : "bg-red-50 border-red-200"
              } border-2 rounded-2xl flex items-start space-x-3 animate-shake shadow-sm`}
            >
              <AlertTriangle
                className={`w-5 h-5 ${
                  redirectReason ? "text-amber-500" : "text-red-500"
                } mt-0.5 flex-shrink-0`}
              />
              <p
                className={`${
                  redirectReason ? "text-amber-700" : "text-red-700"
                } text-sm font-medium`}
              >
                {error}
              </p>
            </div>
          )}

          {/* Login Form */}
          <div className="space-y-5">
            <div>
              <label
                htmlFor="login-input"
                className="block text-sm font-semibold mb-2 text-gray-700"
              >
                Usuário
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-[#7B54BE]" />
                </div>
                <input
                  id="login-input"
                  ref={loginInputRef}
                  type="text"
                  value={login}
                  onChange={(e) => setLogin(e.target.value.toLowerCase())}
                  onKeyPress={handleKeyPress}
                  className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-xl focus:border-[#7B54BE] focus:ring-4 focus:ring-[#7B54BE]/10 focus:outline-none transition-all duration-300 text-gray-700 placeholder-gray-400 bg-white"
                  placeholder="Digite seu usuário"
                  disabled={loadingAdmin || loadingTech}
                  required
                  autoComplete="username"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password-input"
                className="block text-sm font-semibold mb-2 text-gray-700"
              >
                Senha
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-[#7B54BE]" />
                </div>
                <input
                  id="password-input"
                  type={showPassword ? "text" : "password"}
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="w-full pl-12 pr-12 py-4 border-2 border-gray-200 rounded-xl focus:border-[#7B54BE] focus:ring-4 focus:ring-[#7B54BE]/10 focus:outline-none transition-all duration-300 text-gray-700 placeholder-gray-400 bg-white"
                  placeholder="Digite sua senha"
                  disabled={loadingAdmin || loadingTech}
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center"
                  aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                  disabled={loadingAdmin || loadingTech}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-[#7B54BE] transition-colors" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 hover:text-[#7B54BE] transition-colors" />
                  )}
                </button>
              </div>
            </div>

            {/* Buttons */}
            <div className="space-y-3 pt-4">
              {!isMobile && (
                <button
                  onClick={handleAdminAccess}
                  disabled={
                    loadingAdmin ||
                    loadingTech ||
                    !login.trim() ||
                    !senha.trim()
                  }
                  className="w-full bg-gradient-to-r from-[#FDAD15] to-[#FFC845] text-white font-semibold py-4 px-6 rounded-xl transition-all duration-300 flex items-center justify-center space-x-3 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-xl hover:shadow-[#FDAD15]/30 transform hover:-translate-y-0.5 active:scale-[0.98] focus:outline-none focus:ring-4 focus:ring-[#FDAD15]/30"
                  aria-label="Acessar Módulo Administrativo"
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

              <button
                onClick={handleTechAccess}
                disabled={
                  loadingAdmin || loadingTech || !login.trim() || !senha.trim()
                }
                className="w-full bg-gradient-to-r from-[#7B54BE] to-[#553499] text-white font-semibold py-4 px-6 rounded-xl transition-all duration-300 flex items-center justify-center space-x-3 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-xl hover:shadow-[#7B54BE]/30 transform hover:-translate-y-0.5 active:scale-[0.98] focus:outline-none focus:ring-4 focus:ring-[#7B54BE]/30"
                aria-label="Acessar Módulo Técnico"
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

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-gray-200 text-center">
            <div className="mb-4">
              <a
                href="/dashboard-panel"
                className="inline-flex items-center text-sm text-[#7B54BE] hover:text-[#553499] font-medium transition-colors focus:outline-none focus:underline"
              >
                <BarChart3 className="h-4 w-4 mr-2" />
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
            transform: translateX(-8px);
          }
          75% {
            transform: translateX(8px);
          }
        }
        .animate-shake {
          animation: shake 0.4s ease-in-out;
        }
      `}</style>
    </div>
  );
}
