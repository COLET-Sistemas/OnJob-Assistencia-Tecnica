import {
  Cliente,
  ClienteContato,
  FormData as ClienteFormData,
  ClienteApiResponse,
} from "../../types/admin/cadastro/clientes";
import api from "../api";

class ClientesService {
  private baseUrl = "/clientes";

  async getAll(params?: Record<string, string | number | boolean>): Promise<{
    total_registros: number;
    total_paginas: number;
    dados: Cliente[];
  }> {
    return await api.get<{
      total_registros: number;
      total_paginas: number;
      dados: Cliente[];
    }>(this.baseUrl, { params });
  }

  async search(term: string): Promise<{
    total_registros: number;
    total_paginas: number;
    dados: Cliente[];
  }> {
    return await api.get<{
      total_registros: number;
      total_paginas: number;
      dados: Cliente[];
    }>(this.baseUrl, {
      params: {
        qtde_registros: 25,
        resumido: "S",
        nome: term,
      },
    });
  }

  async getById(id: number | string): Promise<ClienteApiResponse> {
    return await api.get<ClienteApiResponse>(this.baseUrl, { params: { id } });
  }

  async create(data: ClienteFormData): Promise<Cliente> {
    return await api.post<Cliente>(this.baseUrl, data);
  }

  async update(
    id: number | string,
    data: Partial<ClienteFormData>
  ): Promise<Cliente> {
    return await api.put<Cliente>(`${this.baseUrl}?id=${id}`, data);
  }

  async delete(id: number | string): Promise<void> {
    await api.delete<void>(`${this.baseUrl}/${id}`);
  }

  async getContacts(clienteId: number | string): Promise<{
    id_cliente: number;
    nome_fantasia: string;
    contatos: ClienteContato[];
  }> {
    return await api.get<{
      id_cliente: number;
      nome_fantasia: string;
      contatos: ClienteContato[];
    }>(`${this.baseUrl}_contatos`, {
      params: { id_cliente: clienteId },
    });
  }

  async createContact(
    clienteId: number | string,
    data: Omit<ClienteContato, "id">
  ): Promise<{ contato: ClienteContato; mensagem?: string; id?: number }> {
    try {
      const response = await api.post<{
        dados?: ClienteContato;
        mensagem?: string;
        sucesso?: boolean;
        id?: number;
      }>(`/clientes_contatos`, {
        ...data,
        id_cliente: clienteId,
        situacao: "A",
      });

      // Verificamos diferentes estruturas de resposta possíveis
      if (response && response.dados) {
        // Resposta no formato tradicional com dados
        return {
          contato: response.dados,
          mensagem: response.mensagem,
        };
      } else if (
        response &&
        (response.id || response.sucesso || response.mensagem)
      ) {
        // Resposta de sucesso alternativa (incluindo o caso de apenas ter mensagem)
        // Criamos um objeto contato com os dados disponíveis
        const createdContact: ClienteContato = {
          id: response.id || Date.now(), // Usamos timestamp como fallback para ID temporário
          telefone: data.telefone || "",
          email: data.email || "",
          situacao: data.situacao || "A",
          nome: data.nome,
          nome_completo: data.nome_completo,
          cargo: data.cargo,
          whatsapp: data.whatsapp,
          recebe_aviso_os: data.recebe_aviso_os,
        };

        return {
          contato: createdContact,
          id: response.id, // Passando o ID diretamente para facilitar o acesso
          mensagem: response.mensagem || "Contato cadastrado com sucesso.",
        };
      }

      // Se chegou até aqui mas tem uma resposta, tente extrair alguma mensagem
      if (response && typeof response === "object") {
        // Tenta extrair mensagem de qualquer campo disponível
        const mensagem =
          response.mensagem ||
          (response as Record<string, string>)["message"] ||
          "Contato cadastrado com sucesso.";

        // Cria um contato com ID temporário
        const tempContact: ClienteContato = {
          id: Date.now(), // ID temporário baseado no timestamp
          telefone: data.telefone || "",
          email: data.email || "",
          situacao: data.situacao || "A",
          nome: data.nome,
          nome_completo: data.nome_completo,
          cargo: data.cargo,
          whatsapp: data.whatsapp,
          recebe_aviso_os: data.recebe_aviso_os,
        };

        return {
          contato: tempContact,
          mensagem: mensagem,
        };
      }

      throw new Error("Falha ao criar contato");
    } catch (error) {
      // Se o erro contiver uma mensagem de sucesso, tratar como sucesso
      if (
        error instanceof Error &&
        (error.message.includes("sucesso") ||
          error.message.includes("cadastrado"))
      ) {
        // Criar um contato temporário com ID baseado em timestamp
        const tempContact: ClienteContato = {
          id: Date.now(),
          telefone: data.telefone || "",
          email: data.email || "",
          situacao: data.situacao || "A",
          nome: data.nome,
          nome_completo: data.nome_completo,
          cargo: data.cargo,
          whatsapp: data.whatsapp,
          recebe_aviso_os: data.recebe_aviso_os,
        };

        return {
          contato: tempContact,
          mensagem: error.message,
        };
      }

      // Se for realmente um erro, repassar
      throw error;
    }
  }

  async updateContact(
    id: number | string,
    data: Partial<ClienteContato>
  ): Promise<{ mensagem?: string }> {
    if (!id) {
      console.error("ID do contato não fornecido para updateContact");
      throw new Error("ID do contato não fornecido");
    }

    try {
      // Garantir que o ID seja passado apenas como parâmetro de query
      // Incluir apenas o id no corpo da requisição, sem id_contato
      const dataWithId = {
        ...data,
        id: id, // Adicionando id no corpo
      };

      console.log("Atualizando contato com ID:", id, "e dados:", dataWithId);

      const response = await api.put<{
        dados?: ClienteContato;
        mensagem?: string;
        sucesso?: boolean;
      }>(`/clientes_contatos?id=${id}`, dataWithId);

      console.log("Resposta da atualização:", response);

      return {
        mensagem: response?.mensagem || "Contato atualizado com sucesso",
      };
    } catch (error) {
      console.error("Erro na atualização do contato:", error);

      // Se o erro contiver uma mensagem de sucesso, tratar como sucesso
      if (
        error instanceof Error &&
        (error.message.includes("sucesso") ||
          error.message.includes("atualizado"))
      ) {
        return {
          mensagem: error.message,
        };
      }

      // Se for realmente um erro, repassar
      throw error;
    }
  }

  async deleteContact(id: number | string): Promise<{ mensagem?: string }> {
    if (!id) {
      console.error("ID do contato não fornecido para deleteContact");
      throw new Error("ID do contato não fornecido");
    }

    console.log("ClientesService.deleteContact chamado com ID:", id);
    try {
      // Garantir que o ID seja um valor válido
      const contactId = Number(id);
      if (isNaN(contactId)) {
        console.error("ID do contato inválido:", id);
        throw new Error("ID do contato inválido");
      }

      // Vamos usar a forma de parâmetros query para garantir que esteja formatando corretamente
      console.log("Enviando requisição DELETE com ID:", contactId);
      const response = await api.delete<{
        mensagem?: string;
        sucesso?: boolean;
      }>("/clientes_contatos", { params: { id: contactId } });

      console.log("Resposta da API de exclusão:", response);

      return {
        mensagem: response?.mensagem || "Contato inativado com sucesso",
      };
    } catch (error) {
      console.error("Erro na requisição de deleteContact:", error);

      // Se o erro contiver uma mensagem de sucesso, tratar como sucesso
      if (
        error instanceof Error &&
        (error.message.includes("sucesso") ||
          error.message.includes("inativado") ||
          error.message.includes("excluído"))
      ) {
        console.log("Erro tratado como sucesso:", error.message);
        return {
          mensagem: error.message,
        };
      }

      // Se for realmente um erro, repassar
      console.error("Erro não tratado em deleteContact:", error);
      throw error;
    }
  }

  async getContactById(id: number | string): Promise<ClienteContato | null> {
    if (!id) {
      console.error("ID do contato não fornecido para getContactById");
      return null;
    }

    try {
      // Usando params para evitar problemas de query string
      const response = await api.get<{
        dados?: ClienteContato;
      }>("/clientes_contatos", {
        params: {
          id: id, // Usando id como parâmetro para a API
        },
      });

      if (response && response.dados) {
        return response.dados;
      }

      return null;
    } catch (error) {
      console.error("Erro ao buscar contato:", error);
      return null;
    }
  }
}

export const clientesService = new ClientesService();
