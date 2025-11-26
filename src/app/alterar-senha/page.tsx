"use client";

import { AlertTriangle, Check, Eye, EyeOff, Lock, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Image from "next/image";
import { criptografarSenha } from "@/utils/cryptoPassword";
import api from "@/api/api";
import { authService } from "@/api/services/authService";

export default function AlterarSenhaPage() {
  const [senhaAtual, setSenhaAtual] = useState("");
  const [senhaNova, setSenhaNova] = useState("");
  const [confirmacaoSenha, setConfirmacaoSenha] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [nomeUsuario, setNomeUsuario] = useState("");

  const router = useRouter();

  useEffect(() => {
    const verifySession = async () => {
      setIsMounted(true);

      const nome = localStorage.getItem("nome_usuario");
      if (nome) {
        setNomeUsuario(nome);
      }

      try {
        const response = await fetch("/api/auth/session", {
          credentials: "include",
        });

        if (!response.ok) {
          router.push("/");
          return;
        }

        const session = await response.json();
        if (!session?.authenticated) {
          router.push("/");
        }
      } catch (sessionError) {
        console.error("Erro ao validar sessão:", sessionError);
        router.push("/");
      }
    };

    verifySession();
  }, [router]);

  const validatePassword = (
    password: string
  ): { valid: boolean; message?: string } => {
    if (password.length < 8) {
      return {
        valid: false,
        message: "A senha deve conter pelo menos 8 caracteres.",
      };
    }

    const specialChars = /[@#$%?!*&]/;
    if (!specialChars.test(password)) {
      return {
        valid: false,
        message:
          "A senha deve conter pelo menos um caractere especial: @, #, $, %, ?, !, *, &",
      };
    }

    return { valid: true };
  };

  const handleAlterarSenha = async () => {
    setError("");

    if (!senhaAtual) {
      setError("Por favor, informe sua senha atual.");
      return;
    }

    const validacaoSenha = validatePassword(senhaNova);
    if (!validacaoSenha.valid) {
      setError(validacaoSenha.message || "Senha inválida");
      return;
    }

    if (senhaNova !== confirmacaoSenha) {
      setError("A nova senha e a confirmação não coincidem.");
      return;
    }

    setLoading(true);

    try {
      const userId = localStorage.getItem("id_usuario");

      if (!userId) {
        throw new Error("ID do usuário não encontrado.");
      }

      await api.patch("/usuarios", {
        id_usuario: Number(userId),
        senha_atual: criptografarSenha(senhaAtual),
        nova_senha: criptografarSenha(senhaNova),
      });

      setSuccess(true);

      setTimeout(async () => {
        localStorage.removeItem("id_usuario");
        localStorage.removeItem("nome_usuario");
        localStorage.removeItem("perfil");
        await authService.logout();
        router.push("/");
      }, 2000);
    } catch (err) {
      console.error("Erro ao alterar senha:", err);
      if (err instanceof Error) {
        setError(err.message);
      } else if (
        typeof err === "object" &&
        err !== null &&
        "response" in err &&
        err.response &&
        typeof err.response === "object" &&
        "data" in err.response &&
        err.response.data &&
        typeof err.response.data === "object" &&
        "message" in err.response.data
      ) {
        setError(err.response.data.message as string);
      } else {
        setError(
          "Ocorreu um erro ao alterar a senha. Por favor, tente novamente."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isMounted) return null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
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
          <h2 className="text-2xl font-bold mb-2 text-gray-800">
            Alterar Senha
          </h2>
          <p className="text-gray-600">
            {nomeUsuario ? `Olá, ${nomeUsuario}! ` : ""}É necessário alterar sua
            senha provisória para continuar.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start space-x-3 animate-shake">
            <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-start space-x-3">
            <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
            <p className="text-green-700 text-sm">
              Senha alterada com sucesso! Redirecionando para a tela de login...
            </p>
          </div>
        )}

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-semibold mb-3 text-gray-800">
              Senha Atual
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-[#7C54BD]" />
              </div>
              <input
                type={showCurrentPassword ? "text" : "password"}
                value={senhaAtual}
                onChange={(e) => setSenhaAtual(e.target.value)}
                className="w-full pl-12 pr-12 py-4 border-2 border-gray-200 rounded-xl focus:border-[#7C54BD] transition-all duration-300 text-gray-700 placeholder-gray-500 bg-white focus:bg-white focus:shadow-xl focus:shadow-[#7C54BD]/10"
                placeholder="Digite sua senha atual"
                required
                disabled={loading || success}
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute inset-y-0 right-0 pr-4 flex items-center"
                disabled={loading || success}
                tabIndex={-1}
              >
                {showCurrentPassword ? (
                  <EyeOff className="h-5 w-5 text-gray-400 hover:text-[#7C54BD] transition-colors" />
                ) : (
                  <Eye className="h-5 w-5 text-gray-400 hover:text-[#7C54BD] transition-colors" />
                )}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-3 text-gray-800">
              Nova Senha
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-[#7C54BD]" />
              </div>
              <input
                type={showNewPassword ? "text" : "password"}
                value={senhaNova}
                onChange={(e) => setSenhaNova(e.target.value)}
                className="w-full pl-12 pr-12 py-4 border-2 border-gray-200 rounded-xl focus:border-[#7C54BD] transition-all duration-300 text-gray-700 placeholder-gray-500 bg-white focus:bg-white focus:shadow-xl focus:shadow-[#7C54BD]/10"
                placeholder="Digite sua nova senha"
                required
                disabled={loading || success}
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute inset-y-0 right-0 pr-4 flex items-center"
                disabled={loading || success}
                tabIndex={-1}
              >
                {showNewPassword ? (
                  <EyeOff className="h-5 w-5 text-gray-400 hover:text-[#7C54BD] transition-colors" />
                ) : (
                  <Eye className="h-5 w-5 text-gray-400 hover:text-[#7C54BD] transition-colors" />
                )}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-3 text-gray-800">
              Confirmar Nova Senha
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-[#7C54BD]" />
              </div>
              <input
                type={showConfirmPassword ? "text" : "password"}
                value={confirmacaoSenha}
                onChange={(e) => setConfirmacaoSenha(e.target.value)}
                className="w-full pl-12 pr-12 py-4 border-2 border-gray-200 rounded-xl focus:border-[#7C54BD] transition-all duration-300 text-gray-700 placeholder-gray-500 bg-white focus:bg-white focus:shadow-xl focus:shadow-[#7C54BD]/10"
                placeholder="Confirme sua nova senha"
                required
                disabled={loading || success}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-0 pr-4 flex items-center"
                disabled={loading || success}
                tabIndex={-1}
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-5 w-5 text-gray-400 hover:text-[#7C54BD] transition-colors" />
                ) : (
                  <Eye className="h-5 w-5 text-gray-400 hover:text-[#7C54BD] transition-colors" />
                )}
              </button>
            </div>
          </div>

          <button
            onClick={handleAlterarSenha}
            disabled={loading || success}
            className="w-full bg-gradient-to-r from-[#7C54BD] to-[#553499] text-white font-semibold py-4 rounded-xl hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center space-x-3">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Alterando senha...</span>
              </span>
            ) : (
              "Alterar Senha"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
