import api from "../../api/api";

export interface Notificacao {
  id: number;
  titulo: string;
  mensagem: string;
  link?: string;
  data: string;
  lido: boolean;
}

export interface NotificacoesResponse {
  dados: Notificacao[];
  total_registros: number;
  total_notificacoes: number;
  nao_lidas: number;
  pagina_atual: number;
  total_paginas: number;
  [key: string]: unknown;
}

export interface NotificacoesCountResponse {
  nao_lidas: number;
  total_notificacoes: number;
}

export interface NotificacaoUpdateResponse extends NotificacoesCountResponse {
  mensagem?: string;
  message?: string;
  sucesso?: boolean;
}

const normalizeText = (value?: string) => {
  if (typeof value !== "string") {
    return undefined;
  }
  const text = value.trim();
  return text.length > 0 ? text : undefined;
};

const extractMessages = (
  response?: Partial<NotificacaoUpdateResponse>
): Pick<NotificacaoUpdateResponse, "mensagem" | "message"> => {
  if (!response) {
    return {};
  }
  const mensagemDaApi = normalizeText(response.mensagem);
  const messageDaApi = normalizeText(response.message);
  const fallback = mensagemDaApi ?? messageDaApi;

  return {
    mensagem: mensagemDaApi ?? fallback,
    message: messageDaApi ?? fallback,
  };
};

export const notificacoesService = {
  /**
   * Obtem a quantidade de notificacoes nao lidas
   * A API retorna apenas { total_notificacoes: number }
   */
  getNotificacoesCount: async (): Promise<NotificacoesCountResponse> => {
    try {
      const response = await api.get<{ total_notificacoes?: number }>(
        `/notificacoes?qtde=S`
      );

      // Se a resposta estiver vazia
      if (!response || Object.keys(response).length === 0) {
        return { nao_lidas: 0, total_notificacoes: 0 };
      }

      // A API retorna apenas total_notificacoes
      const totalNotificacoes = typeof response.total_notificacoes === "number" 
        ? response.total_notificacoes 
        : 0;

      // Como a API não retorna nao_lidas, consideramos que total_notificacoes 
      // já representa as notificações não lidas
      return {
        nao_lidas: totalNotificacoes,
        total_notificacoes: totalNotificacoes,
      };
    } catch (error) {
      console.error("Erro ao buscar contagem de notificacoes:", error);
      return { nao_lidas: 0, total_notificacoes: 0 };
    }
  },

  /**
   * Obtem lista de notificacoes paginada
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
      console.error("Erro ao buscar notificacoes:", error);
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
   * Marca uma notificacao especifica como lida
   */
  marcarComoLida: async (id: number): Promise<NotificacaoUpdateResponse> => {
    try {
      const patchResponse = await api.patch<Partial<NotificacaoUpdateResponse>>(
        `/notificacoes?id=${id}`,
        {}
      );

      let counts: NotificacoesCountResponse;
      const mensagens = extractMessages(patchResponse);

      if (
        typeof patchResponse?.nao_lidas === "number" &&
        typeof patchResponse?.total_notificacoes === "number"
      ) {
        counts = {
          nao_lidas: patchResponse.nao_lidas,
          total_notificacoes: patchResponse.total_notificacoes,
        };
      } else {
        counts = await notificacoesService.getNotificacoesCount();
      }

      return {
        ...counts,
        ...mensagens,
        sucesso: patchResponse?.sucesso,
      };
    } catch (error) {
      console.error(`Erro ao marcar notificacao ${id} como lida:`, error);
      throw error;
    }
  },

  /**
   * Marca todas as notificacoes como lidas
   */
  marcarTodasComoLidas: async (): Promise<NotificacaoUpdateResponse> => {
    try {
      const patchResponse = await api.patch<Partial<NotificacaoUpdateResponse>>(
        "/notificacoes?id=-1",
        {}
      );

      let counts: NotificacoesCountResponse;
      const mensagens = extractMessages(patchResponse);

      if (
        typeof patchResponse?.nao_lidas === "number" &&
        typeof patchResponse?.total_notificacoes === "number"
      ) {
        counts = {
          nao_lidas: patchResponse.nao_lidas,
          total_notificacoes: patchResponse.total_notificacoes,
        };
      } else {
        counts = await notificacoesService.getNotificacoesCount();
      }

      return {
        ...counts,
        ...mensagens,
        sucesso: patchResponse?.sucesso,
      };
    } catch (error) {
      console.error("Erro ao marcar todas notificacoes como lidas:", error);
      throw error;
    }
  },
};