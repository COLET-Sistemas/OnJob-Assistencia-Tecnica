"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getCookie, deleteCookie } from "cookies-next";

export default function LocalStorageCleaner() {
  const router = useRouter();

  useEffect(() => {
    const shouldClearStorage = getCookie("clearLocalStorage");

    if (shouldClearStorage) {
      console.log(
        "Limpando localStorage devido a sessão expirada ou token inválido"
      );

      try {
        localStorage.clear();
        deleteCookie("clearLocalStorage");
      } catch (error) {
        console.error("Erro ao limpar o localStorage:", error);
      }
    }
  }, [router]);


  return null;
}
