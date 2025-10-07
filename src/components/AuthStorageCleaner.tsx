"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useFeedback } from "@/context/FeedbackContext";

/**
 * Componente que verifica se há um cookie clearLocalStorage e
 * limpa o localStorage quando necessário
 */
export default function AuthStorageCleaner() {
  const router = useRouter();
  const { showToast } = useFeedback();

  useEffect(() => {
    // Função para verificar e processar o cookie de limpeza
    const checkAndClearStorage = () => {
      // No lado do cliente, verificamos se o cookie está presente
      const cookies = document.cookie.split(";");
      const clearStorageCookie = cookies.find((cookie) =>
        cookie.trim().startsWith("clearLocalStorage=")
      );

      if (clearStorageCookie) {
        console.log("Detectado cookie de limpeza de storage");

        try {
          // Limpa o localStorage
          localStorage.clear();
          console.log("localStorage limpo com sucesso");

          // Remove o cookie após o processamento
          document.cookie = "clearLocalStorage=; max-age=0; path=/;";

          // Se estamos em uma página diferente da inicial, redirecionamos para o login
          if (window.location.pathname !== "/") {
            router.push("/");
          }
        } catch (error) {
          console.error("Erro ao limpar localStorage:", error);
        }
      }

      // Verifica se existe um parâmetro authError na URL
      const urlParams = new URLSearchParams(window.location.search);
      const authError = urlParams.get("authError");

      if (authError) {
        // Exibe a mensagem de erro usando o sistema de toast
        showToast(authError, "error");

        // Limpa os parâmetros da URL sem recarregar a página
        window.history.replaceState(
          {},
          document.title,
          window.location.pathname
        );
      }
    };

    // Executa a verificação quando o componente é montado
    checkAndClearStorage();
  }, [router, showToast]);

  // Este componente não renderiza nada visualmente
  return null;
}
