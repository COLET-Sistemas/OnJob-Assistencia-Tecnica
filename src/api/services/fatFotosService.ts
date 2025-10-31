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
      throw new Error("Não foi possível carregar as fotos da FAT.");
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
      throw new Error("Não foi possível carregar a imagem.");
    }

    return response.blob();
  }
}

export const fatFotosService = new FATFotosService();

