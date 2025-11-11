"use client";

import {
  AlertTriangle,
  Check,
  ChevronRight,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Settings,
  Shield,
  User,
  X,
  Zap,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useCallback, memo } from "react";
import Image from "next/image";
import packageInfo from "../../package.json";
import { LoginService, LoginResponse, Empresa } from "@/api/services/login";
import { authService } from "@/api/services/authService";

// Tipos
interface LoginInputProps {
  id: string;
  label: string;
  type: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onKeyPress: (e: React.KeyboardEvent) => void;
  placeholder: string;
  disabled: boolean;
  icon: React.ComponentType<{ className?: string }>;
  showToggle?: boolean;
  onToggle?: () => void;
  showPassword?: boolean;
  inputRef?: React.RefObject<HTMLInputElement | null>;
}

interface FeatureCardProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  gradient: string;
}

interface LoginButtonProps {
  onClick: () => void;
  disabled: boolean;
  loading: boolean;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
  variant?: "primary" | "secondary";
}

type ModuleType = "admin" | "tecnico";

// Componente de input otimizado com memo
const LoginInput = memo<LoginInputProps>(
  ({
    id,
    label,
    type,
    value,
    onChange,
    onKeyPress,
    placeholder,
    disabled,
    icon: Icon,
    showToggle,
    onToggle,
    showPassword,
    inputRef,
  }) => (
    <div>
      <label
        htmlFor={id}
        className="block text-sm font-semibold mb-2 text-gray-700"
      >
        {label}
      </label>
      <div className="relative group">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Icon className="h-5 w-5 text-[#7B54BE]" />
        </div>
        <input
          id={id}
          ref={inputRef}
          type={type}
          value={value}
          onChange={onChange}
          onKeyPress={onKeyPress}
          className="w-full pl-12 pr-12 py-4 border-2 border-gray-200 rounded-xl focus:border-[#7B54BE] focus:ring-4 focus:ring-[#7B54BE]/10 focus:outline-none transition-all duration-300 text-gray-700 placeholder-gray-400 bg-white hover:border-gray-300"
          placeholder={placeholder}
          disabled={disabled}
          required
          autoComplete={type === "password" ? "current-password" : "username"}
        />
        {showToggle && onToggle && (
          <button
            type="button"
            onClick={onToggle}
            tabIndex={-1}
            className="absolute inset-y-0 right-0 pr-4 flex items-center group"
            aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
            disabled={disabled}
          >
            {showPassword ? (
              <EyeOff className="h-5 w-5 text-gray-400 group-hover:text-[#7B54BE] transition-colors" />
            ) : (
              <Eye className="h-5 w-5 text-gray-400 group-hover:text-[#7B54BE] transition-colors" />
            )}
          </button>
        )}
      </div>
    </div>
  )
);

LoginInput.displayName = "LoginInput";

// Componente de feature card otimizado
const FeatureCard = memo<FeatureCardProps>(
  ({ icon: Icon, title, description, gradient }) => (
    <div className="flex items-start space-x-4 bg-white/5 backdrop-blur-sm rounded-2xl p-5 border border-white/10 transition-colors duration-300 cursor-default">
      <div
        className={`w-14 h-14 rounded-xl flex items-center justify-center ${gradient} shadow-lg flex-shrink-0`}
      >
        <Icon className="w-7 h-7 text-white" />
      </div>
      <div>
        <h3 className="font-semibold text-lg text-white mb-1">{title}</h3>
        <p className="text-white/80 text-sm leading-relaxed">{description}</p>
      </div>
    </div>
  )
);

FeatureCard.displayName = "FeatureCard";

const LoginButton = memo<LoginButtonProps>(
  ({
    onClick,
    disabled,
    loading,
    icon: Icon,
    children,
    variant = "primary",
  }) => {
    const baseClasses =
      "w-full font-semibold py-4 px-6 rounded-xl transition-all duration-200 flex items-center justify-center space-x-3 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-4";

    const variantClasses =
      variant === "primary"
        ? "bg-gradient-to-r from-[#FDAD15] to-[#FFC845] text-white hover:shadow-lg focus:ring-[#FDAD15]/30"
        : "bg-gradient-to-r from-[#7B54BE] to-[#553499] text-white hover:shadow-lg focus:ring-[#7B54BE]/30";

    return (
      <button
        onClick={onClick}
        disabled={disabled}
        className={`${baseClasses} ${variantClasses}`}
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Validando...</span>
          </>
        ) : (
          <>
            <Icon className="w-5 h-5" />
            <span>{children}</span>
          </>
        )}
      </button>
    );
  }
);

LoginButton.displayName = "LoginButton";

const DecorativePattern = memo(() => (
  <div className="absolute inset-0 opacity-10 overflow-hidden">
    <div className="absolute top-40 right-20 w-32 h-32 rounded-full bg-[#75f9bd] opacity-30 blur-3xl"></div>
    <div className="absolute bottom-32 left-1/4 w-24 h-24 rotate-45 border-4 border-[#7B54BE]"></div>
    <div className="absolute bottom-20 right-1/3 w-28 h-28 rounded-full border-2 border-white opacity-30"></div>
    <div className="absolute top-1/2 left-1/2 w-16 h-16 rounded-full bg-[#abc7e0] opacity-20"></div>
    <div className="absolute top-1/3 right-1/4 w-20 h-20 rotate-12 border-2 border-[#75f9bd] opacity-30"></div>
  </div>
));

DecorativePattern.displayName = "DecorativePattern";

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
  const [isEmpresaModalOpen, setIsEmpresaModalOpen] = useState(false);
  const [empresasDisponiveis, setEmpresasDisponiveis] = useState<Empresa[]>([]);
  const [loadingEmpresas, setLoadingEmpresas] = useState(false);
  const [impersonateLoading, setImpersonateLoading] = useState(false);
  const [empresaError, setEmpresaError] = useState("");
  const [selectedEmpresaId, setSelectedEmpresaId] = useState<number | null>(
    null
  );
  const [superAdminContext, setSuperAdminContext] = useState<{
    data: LoginResponse;
    module: "admin" | "tecnico";
  } | null>(null);

  const loginInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const checkDevice = useCallback(() => {
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
  }, []);

  useEffect(() => {
    setIsMounted(true);

    if (typeof window !== "undefined") {
      const reason = sessionStorage.getItem("loginRedirectReason");
      if (reason) {
        setRedirectReason(reason);
        setError(reason);
        sessionStorage.removeItem("loginRedirectReason");
      }
      const urlParams = new URLSearchParams(window.location.search);
      const authError = urlParams.get("authError");
      if (authError) {
        setError(authError);

        window.history.replaceState({}, "", window.location.pathname);
      }
    }
  }, []);

  useEffect(() => {
    let timer: NodeJS.Timeout;

    if (error) {
      timer = setTimeout(() => {
        setError("");
      }, 15000);
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [error]);

  useEffect(() => {
    let timer: NodeJS.Timeout;

    if (error) {
      timer = setTimeout(() => {
        setError("");
      }, 15000);
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [error]);

  useEffect(() => {
    const timer = setTimeout(checkDevice, 100);
    window.addEventListener("resize", checkDevice);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", checkDevice);
    };
  }, [checkDevice]);

  useEffect(() => {
    if (loginInputRef.current) {
      loginInputRef.current.focus();
    }
  }, []);

  const resetSuperAdminFlow = useCallback(() => {
    setIsEmpresaModalOpen(false);
    setSuperAdminContext(null);
    setEmpresasDisponiveis([]);
    setSelectedEmpresaId(null);
    setEmpresaError("");
  }, []);

  const persistAuthData = useCallback(
    (authData: LoginResponse, module: ModuleType) => {
      try {
        LoginService.saveUserData(authData);
      } catch (storageError) {
        console.error("Erro ao salvar dados no LoginService:", storageError);
      }

      try {
        authService.saveAuthData(
          {
            token: authData.token,
            user: {
              id: authData.id_usuario,
              nome: authData.nome_usuario,
              login,
              email: authData.email,
              perfil_interno: authData.perfil.interno,
              perfil_gestor_assistencia: authData.perfil.gestor,
              perfil_tecnico_proprio: authData.perfil.tecnico_proprio,
              perfil_tecnico_terceirizado: authData.perfil.tecnico_terceirizado,
              administrador: authData.perfil.admin,
              permite_cadastros:
                typeof authData.perfil.permite_cadastros === "boolean"
                  ? authData.perfil.permite_cadastros
                  : true,
              super_admin: authData.super_admin || false,
            },
          },
          module
        );
      } catch (authStoreError) {
        console.error("Erro ao salvar dados no authService:", authStoreError);
      }
    },
    [login]
  );

  const navigateAfterLogin = useCallback(
    (authData: LoginResponse, module: ModuleType) => {
      if (authData.senha_provisoria) {
        if (module === "admin") {
          setTimeout(() => {
            router.push("/alterar-senha");
          }, 300);
        } else {
          router.push("/alterar-senha");
        }
        return;
      }

      if (module === "admin") {
        setTimeout(() => {
          router.push("/admin/dashboard");
        }, 300);
      } else {
        router.push("/tecnico/dashboard");
      }
    },
    [router]
  );

  const loadEmpresas = useCallback(async (token: string) => {
    setLoadingEmpresas(true);
    setEmpresaError("");
    setEmpresasDisponiveis([]);
    try {
      const empresas = await LoginService.fetchEmpresas(token);
      setEmpresasDisponiveis(empresas);
      if (!empresas.length) {
        setEmpresaError("Nenhuma empresa disponível para seleção.");
      }
    } catch (empresasError) {
      console.error("Erro ao carregar empresas:", empresasError);
      const message =
        empresasError instanceof Error
          ? empresasError.message
          : "Erro ao carregar empresas.";
      setEmpresaError(message);
    } finally {
      setLoadingEmpresas(false);
    }
  }, []);

  const startSuperAdminFlow = useCallback(
    async (authData: LoginResponse, module: ModuleType) => {
      setEmpresaError("");
      setError("");
      setSelectedEmpresaId(null);
      setEmpresasDisponiveis([]);
      setSuperAdminContext({ data: authData, module });
      setIsEmpresaModalOpen(true);
      await loadEmpresas(authData.token);
    },
    [loadEmpresas]
  );

  const handleEmpresaSelection = useCallback((id: number) => {
    setSelectedEmpresaId(id);
    setEmpresaError("");
  }, []);

  const handleEmpresaModalClose = useCallback(() => {
    resetSuperAdminFlow();
  }, [resetSuperAdminFlow]);

  const handleConfirmEmpresaSelection = useCallback(async () => {
    if (!superAdminContext) {
      const message = "Não foi possível continuar. Efetue o login novamente.";
      setEmpresaError(message);
      setError(message);
      return;
    }

    if (!selectedEmpresaId) {
      setEmpresaError("Selecione uma empresa para continuar.");
      return;
    }

    setImpersonateLoading(true);
    setEmpresaError("");

    try {
      const impersonatedData = await LoginService.impersonateEmpresa(
        superAdminContext.data.token,
        selectedEmpresaId
      );

      const targetModule = superAdminContext.module;

      if (
        targetModule === "admin" &&
        !LoginService.hasAdminAccess(impersonatedData.perfil)
      ) {
        const message =
          "Usuário não tem permissão para acessar o Módulo Administrativo.";
        setEmpresaError(message);
        setError(message);
        return;
      }

      if (targetModule === "tecnico") {
        if (!LoginService.hasTechAccess(impersonatedData.perfil)) {
          const message =
            "UsuÇ­rio nÇœo possui perfil tÇ¸cnico. Acesso negado ao Mï¿½ï¿½dulo TÇ¸cnico.";
          setEmpresaError(message);
          setError(message);
          return;
        }

        const { tecnico_proprio, tecnico_terceirizado } =
          impersonatedData.perfil;

        if (!tecnico_proprio && !tecnico_terceirizado) {
          const message =
            "UsuÇ­rio nÇœo Ç¸ tÇ¸cnico prï¿½ï¿½prio nem terceirizado. Acesso negado.";
          setEmpresaError(message);
          setError(message);
          return;
        }
      }

      persistAuthData(impersonatedData, targetModule);
      resetSuperAdminFlow();
      navigateAfterLogin(impersonatedData, targetModule);
    } catch (impersonateError) {
      console.error("Erro ao impersonar empresa:", impersonateError);
      const message =
        impersonateError instanceof Error
          ? impersonateError.message
          : "Erro ao impersonar empresa.";
      setEmpresaError(message);
      setError(message);
    } finally {
      setImpersonateLoading(false);
    }
  }, [
    superAdminContext,
    selectedEmpresaId,
    persistAuthData,
    navigateAfterLogin,
    resetSuperAdminFlow,
  ]);

  const handleAdminAccess = useCallback(async () => {
    if (!login.trim() || !senha.trim()) {
      setError("Por favor, preencha todos os campos.");
      return;
    }

    setLoadingAdmin(true);
    setError("");

    try {
      const authData = await LoginService.authenticate(login, senha);

      if (authData.super_admin) {
        await startSuperAdminFlow(authData, "admin");
        return;
      }

      if (!LoginService.hasAdminAccess(authData.perfil)) {
        console.warn("Acesso administrativo negado");
        setError(
          "Usuário não tem permissão para acessar o Módulo Administrativo."
        );
        return;
      }

      persistAuthData(authData, "admin");
      navigateAfterLogin(authData, "admin");
    } catch (error) {
      console.error("Erro no handleAdminAccess:", error);
      if (error instanceof Error) {
        setError(error.message);
        console.error("Detalhes do erro:", {
          name: error.name,
          message: error.message,
          stack: error.stack,
        });
      } else {
        setError("Erro interno. Tente novamente.");
        console.error("Erro nuo identificado:", error);
      }
    } finally {
      setLoadingAdmin(false);
    }
  }, [login, senha, startSuperAdminFlow, persistAuthData, navigateAfterLogin]);

  const handleTechAccess = useCallback(async () => {
    if (!login.trim() || !senha.trim()) {
      setError("Por favor, preencha todos os campos.");
      return;
    }

    setLoadingTech(true);
    setError("");

    try {
      const authData = await LoginService.authenticate(login, senha);

      if (authData.super_admin) {
        await startSuperAdminFlow(authData, "tecnico");
        return;
      }

      if (!LoginService.hasTechAccess(authData.perfil)) {
        const errorMsg =
          "Usuário não possui perfil técnico. Acesso negado ao Módulo Técnico.";
        console.warn("Acesso t?cnico negado:", errorMsg);
        setError(errorMsg);
        if (isMobile) {
          console.error("Erro de acesso tecnico:", errorMsg);
        }
        return;
      }

      const { tecnico_proprio, tecnico_terceirizado } = authData.perfil;

      if (!tecnico_proprio && !tecnico_terceirizado) {
        const errorMsg =
          "Usuário não é técnico próprio nem terceirizado. Acesso negado.";
        console.warn("Perfil técnico inválido:", errorMsg);
        setError(errorMsg);
        if (isMobile) {
          console.error("Erro de acesso tecnico:", errorMsg);
        }
        return;
      }

      persistAuthData(authData, "tecnico");
      navigateAfterLogin(authData, "tecnico");
    } catch (error) {
      console.error("Erro no handleTechAccess:", error);
      if (error instanceof Error) {
        setError(error.message);
        console.error("Detalhes do erro:", {
          name: error.name,
          message: error.message,
          stack: error.stack,
        });
      } else {
        setError("Erro interno. Tente novamente.");
        console.error("Erro nuo identificado:", error);
      }
    } finally {
      setLoadingTech(false);
    }
  }, [
    login,
    senha,
    isMobile,
    startSuperAdminFlow,
    persistAuthData,
    navigateAfterLogin,
  ]);

  const handleKeyPress = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && login.trim() && senha.trim()) {
        e.preventDefault();

        if (loadingAdmin || loadingTech) return;

        if (isMobile) {
          handleTechAccess();
        } else {
          handleAdminAccess();
        }
      }
    },
    [
      login,
      senha,
      loadingAdmin,
      loadingTech,
      isMobile,
      handleAdminAccess,
      handleTechAccess,
    ]
  );

  const handleLoginChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setLogin(e.target.value.toLowerCase());
    },
    []
  );

  const handleSenhaChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSenha(e.target.value);
    },
    []
  );

  const togglePasswordVisibility = useCallback(() => {
    setShowPassword((prev) => !prev);
  }, []);

  if (!isMounted) return null;

  const isFormValid = login.trim() && senha.trim();
  const isLoading = loadingAdmin || loadingTech;

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-[#FFF8E1] via-white to-[#F3E5F5]">
      {/* Left Panel - Desktop Only */}
      <div className="hidden lg:flex lg:w-[55%] bg-gradient-to-br from-[#abc7e0] via-[#9bbdd9] to-[#89b3d4] relative overflow-hidden">
        <DecorativePattern />

        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent"></div>

        <div className="relative z-10 flex flex-col justify-center px-16 py-12 text-white">
          {/* Logo Section */}
          <div className="mb-12">
            <div className="mb-6">
              <Image
                src="/images/logoEscrito.png"
                alt="OnJob Sistema de Assistência Técnica"
                width={320}
                height={100}
                priority
                className="h-36 w-auto object-contain drop-shadow-2xl"
              />
            </div>
          </div>

          {/* Main Heading */}
          <div className="mb-12">
            <h2 className="text-5xl font-bold mb-6 leading-tight">
              Sistema de
              <span className="block bg-[#7B54BE] bg-clip-text text-transparent">
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
            <FeatureCard
              icon={Settings}
              title="Módulo Administrativo"
              description="Gestão completa de usuários, criação de ordens de serviço, relatórios avançados e configurações"
              gradient="bg-gradient-to-br from-[#FDAD15] to-[#E89D05]"
            />

            <FeatureCard
              icon={Shield}
              title="Módulo Técnico"
              description="Interface otimizada para técnicos com recursos mobile e operações de campo"
              gradient="bg-gradient-to-br from-[#7B54BE] to-[#553499]"
            />

            <FeatureCard
              icon={Zap}
              title="Performance Otimizada"
              description="Sistema rápido e responsivo com tecnologia de última geração"
              gradient="bg-gradient-to-br from-[#75f9bd] to-[#4de8a5]"
            />
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
                width={350}
                height={100}
                priority
                className="h-24 w-auto object-contain"
              />
            </div>
            <h2 className="text-xl font-semibold mb-2 text-gray-800">
              Sistema de Gestão Profissional
            </h2>
            <p className="text-gray-600">Faça login para continuar</p>
          </div>

          {/* Desktop Header */}
          <div className="hidden lg:block text-center mb-10">
            <div className="w-30 h-30 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <Image
                src="/images/logo.png"
                alt="OnJob Logo"
                width={56}
                height={56}
                className="h-26 w-26 object-contain"
              />
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
              } border-2 rounded-2xl flex items-start space-x-3 animate-shake shadow-sm ${
                isMobile ? "shadow-md border-l-4 border-l-red-500" : ""
              }`}
            >
              <AlertTriangle
                className={`w-5 h-5 ${
                  redirectReason ? "text-amber-500" : "text-red-500"
                } mt-0.5 flex-shrink-0`}
              />
              <div className="flex-1">
                <p
                  className={`${
                    redirectReason ? "text-amber-700" : "text-red-700"
                  } text-sm font-medium`}
                >
                  {error}
                </p>
              </div>
            </div>
          )}

          {/* Login Form */}
          <div className="space-y-5">
            <LoginInput
              id="login-input"
              label="Usuário"
              type="text"
              value={login}
              onChange={handleLoginChange}
              onKeyPress={handleKeyPress}
              placeholder="Digite seu usuário"
              disabled={isLoading}
              icon={User}
              inputRef={loginInputRef}
            />

            <LoginInput
              id="password-input"
              label="Senha"
              type={showPassword ? "text" : "password"}
              value={senha}
              onChange={handleSenhaChange}
              onKeyPress={handleKeyPress}
              placeholder="Digite sua senha"
              disabled={isLoading}
              icon={Lock}
              showToggle
              onToggle={togglePasswordVisibility}
              showPassword={showPassword}
            />

            {/* Buttons */}
            <div className="space-y-3 pt-4">
              {!isMobile && (
                <LoginButton
                  onClick={handleAdminAccess}
                  disabled={!isFormValid || isLoading}
                  loading={loadingAdmin}
                  icon={Settings}
                  variant="primary"
                >
                  Acessar Módulo Administrativo
                </LoginButton>
              )}

              <LoginButton
                onClick={handleTechAccess}
                disabled={!isFormValid || isLoading}
                loading={loadingTech}
                icon={Shield}
                variant="secondary"
              >
                Acessar Módulo Técnico
              </LoginButton>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-gray-200 text-center">
            <p className="text-gray-500 text-xs">
              © 2025 OnJob Sistemas. Todos os direitos reservados - Versão{" "}
              {packageInfo.version}
            </p>
          </div>
        </div>
      </div>

      {isEmpresaModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
            <button
              type="button"
              onClick={handleEmpresaModalClose}
              disabled={impersonateLoading}
              className="absolute right-4 top-4 rounded-full p-1.5 text-gray-400 transition-colors hover:text-gray-600 disabled:opacity-40"
              aria-label="Fechar seleï¿½ï¿½Çœo de empresa"
            >
              <X className="h-5 w-5" />
            </button>

            <h2 className="text-2xl font-semibold text-gray-900">
              Selecione a empresa
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              {superAdminContext?.module === "admin"
                ? "Escolha a empresa para continuar no módulo administrativo."
                : "Escolha a empresa para continuar no módulo técnico."}
            </p>

            {empresaError && (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                {empresaError}
              </div>
            )}

            <div className="mt-5">
              {loadingEmpresas ? (
                <div className="flex items-center justify-center py-12 text-[#7B54BE]">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : (
                <div className="max-h-64 space-y-3 overflow-y-auto pr-1">
                  {empresasDisponiveis.length > 0
                    ? empresasDisponiveis.map((empresa) => {
                        const isSelected =
                          selectedEmpresaId === empresa.id_empresa;
                        const razaoSocial = empresa.razao_social?.trim();
                        const nomeBd = empresa.nome_bd?.trim();
                        const displayName =
                          razaoSocial ||
                          nomeBd ||
                          `Empresa ${empresa.id_empresa}`;
                        const secondaryInfo = empresa.cnpj?.trim()
                          ? `CNPJ: ${empresa.cnpj}`
                          : nomeBd && nomeBd !== displayName
                          ? nomeBd
                          : "";

                        return (
                          <button
                            key={empresa.id_empresa}
                            type="button"
                            onClick={() =>
                              handleEmpresaSelection(empresa.id_empresa)
                            }
                            disabled={impersonateLoading}
                            className={`w-full rounded-xl border-2 p-4 text-left transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                              isSelected
                                ? "border-[#7B54BE] bg-[#f5f0ff] focus:ring-[#7B54BE]"
                                : "border-gray-200 hover:border-[#7B54BE]/60 hover:bg-[#f5f0ff]/50 focus:ring-[#7B54BE]/40"
                            }`}
                          >
                            <div className="flex items-center justify-between gap-3">
                              <div>
                                <p className="font-semibold text-gray-800">
                                  {displayName}
                                </p>
                                {secondaryInfo && (
                                  <p className="mt-1 text-sm text-gray-500">
                                    {secondaryInfo}
                                  </p>
                                )}
                              </div>
                              {isSelected ? (
                                <Check className="h-5 w-5 text-[#7B54BE]" />
                              ) : (
                                <ChevronRight className="h-5 w-5 text-gray-300" />
                              )}
                            </div>
                          </button>
                        );
                      })
                    : !empresaError && (
                        <p className="py-6 text-center text-sm text-gray-500">
                          Nenhuma empresa disponível para seleção.
                        </p>
                      )}
                </div>
              )}
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <button
                  type="button"
                  onClick={handleEmpresaModalClose}
                  disabled={impersonateLoading}
                  className="w-full rounded-xl border border-gray-200 px-5 py-3 text-sm font-semibold text-gray-700 transition-colors hover:border-gray-300 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmEmpresaSelection}
                  disabled={impersonateLoading || !selectedEmpresaId}
                  className="w-full rounded-xl bg-gradient-to-r from-[#7B54BE] to-[#553499] px-5 py-3 text-sm font-semibold text-white shadow-lg transition-transform hover:-translate-y-[1px] hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                >
                  {impersonateLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Processando...
                    </span>
                  ) : (
                    "Continuar"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
