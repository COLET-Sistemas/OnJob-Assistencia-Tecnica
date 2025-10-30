"use client";

import { useEffect } from "react";
import { useNotificacoes } from "@/hooks";

/**
 * Componente global que garante a atualização das notificações
 * Este componente não renderiza nada visualmente, apenas executa efeitos
 * Centraliza o controle de polling para evitar múltiplas chamadas à API
 */
const NotificacoesUpdater = () => {
  const { fetchNotificacoesCount } = useNotificacoes({ skipInitialListLoad: true });

  // Verificar se o usuário está autenticado
  const isAuthenticated = () => {
    if (typeof window === "undefined") return false;
    return !!localStorage.getItem("token");
  };

  // Efeito para buscar notificações apenas quando o usuário estiver autenticado
  useEffect(() => {
    // Verifica se o usuário está autenticado antes de buscar notificações
    if (!isAuthenticated()) return;

    // Atualiza apenas uma vez ao montar o componente
    fetchNotificacoesCount();

    // Define um intervalo para atualizar a cada 60 segundos (1 minuto)
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
