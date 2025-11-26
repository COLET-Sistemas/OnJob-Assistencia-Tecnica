"use client";

import { useEffect } from "react";
import { useNotificacoes } from "@/hooks";

/**
 * Componente global que garante a atualização das notificações
 * Executa efeitos sem renderizar nada visualmente.
 */
const NotificacoesUpdater = () => {
  const { fetchNotificacoesCount } = useNotificacoes({
    skipInitialListLoad: true,
  });

  const isAuthenticated = () => {
    if (typeof window === "undefined") return false;
    return document.cookie.includes("session_active=true");
  };

  useEffect(() => {
    if (!isAuthenticated()) return;

    fetchNotificacoesCount();

    const regularInterval = setInterval(() => {
      if (isAuthenticated()) {
        fetchNotificacoesCount();
      }
    }, 60000);
    return () => clearInterval(regularInterval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
};

export default NotificacoesUpdater;
