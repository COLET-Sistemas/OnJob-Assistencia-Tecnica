"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getCookie, deleteCookie } from "cookies-next";

/**
 * Componente que verifica a presença do cookie clearLocalStorage
 * e limpa o localStorage quando ele estiver presente
 */
export default function LocalStorageCleaner() {
  const router = useRouter();

  useEffect(() => {
    // Verifica se o cookie de sinalização está presente
    const shouldClearStorage = getCookie("clearLocalStorage");

    if (shouldClearStorage) {
      console.log(
        "Limpando localStorage devido a sessão expirada ou token inválido"
      );

      try {
        // Limpa o localStorage
        localStorage.clear();

        // Remove o cookie após o processamento
        deleteCookie("clearLocalStorage");

        console.log("localStorage limpo com sucesso");
      } catch (error) {
        console.error("Erro ao limpar o localStorage:", error);
      }
    }
  }, [router]);

  // Este componente não renderiza nada visualmente
  return null;
}
