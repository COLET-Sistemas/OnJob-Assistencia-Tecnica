"use client";

import { API_CONFIG, createHeaders } from "../api";

export interface FATFotoItem {
  id_fat_foto: number;
  id_fat?: number | null;
  nome_arquivo: string;
  tipo: string;
  descricao?: string | null;
  data_cadastro: string;
}

class FATFotosService {
  private readonly endpoint = "/fats_fotos";

  private buildUrl(path: string): string {
    const base = API_CONFIG.baseURL || "";
    return `${base}${path}`;
  }

  async listar(id_os: number): Promise<FATFotoItem[]> {
    const headers = {
      ...createHeaders(),
      Accept: "application/json",
    };

    const response = await fetch(
      this.buildUrl(`${this.endpoint}?id_os=${id_os}`),
      {
        method: "GET",
        headers,
      }
    );

    if (!response.ok) {
      throw new Error("Nao foi possivel carregar as fotos da FAT.");
    }

    const data = await response.json();
    return Array.isArray(data) ? data : [];
  }

  async upload(
    id_fat: number,
    file: File,
    descricao?: string | null
  ): Promise<void> {
    const headers = {
      ...createHeaders(),
      "Content-Type": "application/octet-stream",
    };

    const descricaoQuery =
      descricao && descricao.trim().length > 0
        ? `&descricao=${encodeURIComponent(descricao.trim())}`
        : "";

    const response = await fetch(
      this.buildUrl(`${this.endpoint}?id_fat=${id_fat}${descricaoQuery}`),
      {
        method: "POST",
        headers,
        body: file,
      }
    );

    if (!response.ok) {
      throw new Error("Falha ao enviar a foto.");
    }
  }

  async visualizar(id_fat_foto: number): Promise<Blob> {
    const headers = {
      ...createHeaders(),
      Accept: "application/octet-stream",
    };

    const response = await fetch(
      this.buildUrl(
        `${this.endpoint}/visualizar?id_fat_foto=${id_fat_foto}`
      ),
      {
        method: "GET",
        headers,
      }
    );

    if (!response.ok) {
      throw new Error("Nao foi possivel carregar a imagem.");
    }

    return response.blob();
  }

  async atualizarDescricao(
    id_fat_foto: number,
    descricao: string
  ): Promise<string | undefined> {
    const headers = {
      ...createHeaders(),
      Accept: "application/json",
      "Content-Type": "application/json",
    };

    const response = await fetch(
      this.buildUrl(`/fat_fotos?id=${id_fat_foto}`),
      {
        method: "PUT",
        headers,
        body: JSON.stringify({
          descricao,
        }),
      }
    );

    const payload = await this.parseJsonResponse(response);

    if (!response.ok) {
      const message =
        (payload && this.extractMessage(payload)) ||
        "Nao foi possivel atualizar a descricao da foto.";
      throw new Error(message);
    }

    return payload ? this.extractMessage(payload) : undefined;
  }

  private extractMessage(payload: unknown): string | undefined {
    if (payload && typeof payload === "object" && !Array.isArray(payload)) {
      const data = payload as Record<string, unknown>;
      if (typeof data.mensagem === "string") {
        return data.mensagem;
      }
      if (typeof data.message === "string") {
        return data.message;
      }
    }
    return undefined;
  }

  private async parseJsonResponse(response: Response): Promise<unknown> {
    try {
      const text = await response.text();
      if (!text) {
        return undefined;
      }
      return JSON.parse(text);
    } catch {
      return undefined;
    }
  }

  async excluir(id_fat_foto: number): Promise<string | undefined> {
    const headers = {
      ...createHeaders(),
      Accept: "application/json",
    };

    const response = await fetch(
      this.buildUrl(`/fat_fotos?id=${id_fat_foto}`),
      {
        method: "DELETE",
        headers,
      }
    );

    const payload = await this.parseJsonResponse(response);

    if (!response.ok) {
      const message =
        (payload && this.extractMessage(payload)) ||
        "Nao foi possivel excluir a foto.";
      throw new Error(message);
    }

    return payload ? this.extractMessage(payload) : undefined;
  }
}

export const fatFotosService = new FATFotosService();
