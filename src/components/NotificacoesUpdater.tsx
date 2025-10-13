"use client";

import { useEffect } from "react";
import { useNotificacoes } from "@/hooks";

/**
 * Componente global que garante a atualização das notificações
 * Este componente não renderiza nada visualmente, apenas executa efeitos
 * Centraliza o controle de polling para evitar múltiplas chamadas à API
 */
const NotificacoesUpdater = () => {
  const { fetchNotificacoesCount } = useNotificacoes();

  // Efeito para buscar notificações assim que a aplicação carrega
  useEffect(() => {
    // Atualiza apenas uma vez ao montar o componente
    fetchNotificacoesCount();

    // Define um intervalo para atualizar a cada 60 segundos (1 minuto)
    const regularInterval = setInterval(() => {
      fetchNotificacoesCount();
    }, 60000); // 1 minuto

    // Limpa o intervalo quando o componente for desmontado
    return () => clearInterval(regularInterval);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Este componente não renderiza nada visualmente
  return null;
};

export default NotificacoesUpdater;
