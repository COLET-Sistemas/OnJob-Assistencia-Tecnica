import api from "../../api/api";

export interface Notificacao {
  id: number;
  titulo: string;
  mensagem: string;
  link?: string;
  data: string; // Alterado de data_criacao para data
  lido: boolean; // Alterado de lida para lido
}

export interface NotificacoesResponse {
  dados: Notificacao[]; // Alterado de notificacoes para dados
  total_registros: number; // Alterado de total para total_registros
  total_notificacoes: number; // Novo campo
  nao_lidas: number; // Mantido
  pagina_atual: number; // Mantido
  total_paginas: number; // Mantido
}

export interface NotificacoesCountResponse {
  nao_lidas: number;
  total_notificacoes: number;
}

export const notificacoesService = {
  /**
   * Obtém a quantidade de notificações não lidas
   */
  getNotificacoesCount: async (): Promise<NotificacoesCountResponse> => {
    try {
      // Adicionamos um timestamp para evitar cache do navegador e garantir polling de 1 minuto
      const response = await api.get<NotificacoesCountResponse>(
        `/notificacoes?qtde=S&_t=${Date.now()}`
      );

      // Caso a API retorne um objeto vazio {}, isso significa que não há notificações
      if (response && Object.keys(response).length === 0) {
        return { nao_lidas: 0, total_notificacoes: 0 };
      }

      // Verificar se a resposta tem a estrutura esperada
      if (typeof response?.nao_lidas !== "number") {
        // Não vamos logar como erro, apenas como informação
        return { nao_lidas: 0, total_notificacoes: 0 };
      }

      // Se não tiver total_notificacoes na resposta, usar o valor de nao_lidas
      if (typeof response.total_notificacoes !== "number") {
        response.total_notificacoes = response.nao_lidas;
      }

      return response;
    } catch (error) {
      console.error("Erro ao buscar contagem de notificações:", error);
      return { nao_lidas: 0, total_notificacoes: 0 };
    }
  },

  /**
   * Obtém lista de notificações paginada
   */
  getNotificacoes: async (
    pagina: number = 1,
    limite: number = 10,
    incluirLidas: boolean = false,
    dias: number = 30
  ): Promise<NotificacoesResponse> => {
    try {
      let url = `/notificacoes?pagina=${pagina}&limite=${limite}&dias=${dias}`;

      if (incluirLidas) {
        url += "&ja_lidas=S";
      }

      const response = await api.get<NotificacoesResponse>(url);

      // Caso a API retorne um objeto vazio {}, isso significa que não há notificações
      if (response && Object.keys(response).length === 0) {
        return {
          dados: [],
          total_registros: 0,
          total_notificacoes: 0,
          nao_lidas: 0,
          pagina_atual: pagina,
          total_paginas: 1,
        };
      }

      // Verificar se a resposta tem a estrutura esperada
      if (!Array.isArray(response?.dados)) {
        return {
          dados: [],
          total_registros: 0,
          total_notificacoes: 0,
          nao_lidas: 0,
          pagina_atual: pagina,
          total_paginas: 1,
        };
      }

      return response;
    } catch (error) {
      console.error("Erro ao buscar notificações:", error);
      return {
        dados: [],
        total_registros: 0,
        total_notificacoes: 0,
        nao_lidas: 0,
        pagina_atual: pagina,
        total_paginas: 1,
      };
    }
  },

  /**
   * Marca uma notificação específica como lida
   */
  marcarComoLida: async (id: number): Promise<NotificacoesCountResponse> => {
    try {
      await api.patch(`/notificacoes?id=${id}`, {});
      // Atualizar contador após marcar como lida
      return await notificacoesService.getNotificacoesCount();
    } catch (error) {
      console.error(`Erro ao marcar notificação ${id} como lida:`, error);
      throw error;
    }
  },

  /**
   * Marca todas as notificações como lidas
   */
  marcarTodasComoLidas: async (): Promise<NotificacoesCountResponse> => {
    try {
      await api.patch("/notificacoes?id=-1", {});
      // Atualizar contador após marcar todas como lidas
      return await notificacoesService.getNotificacoesCount();
    } catch (error) {
      console.error("Erro ao marcar todas notificações como lidas:", error);
      throw error;
    }
  },
};
