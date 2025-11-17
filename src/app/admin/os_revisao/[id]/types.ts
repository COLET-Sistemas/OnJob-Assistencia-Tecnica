import type {
  OSDeslocamento,
  OSPecaUtilizada,
  OSPecaCorrigida,
} from "@/api/services/ordensServicoService";

export interface DeslocamentoOriginal extends OSDeslocamento {
  id_fat?: number;
}

export interface DeslocamentoRevisado
  extends Omit<
    OSDeslocamento,
    "km_ida" | "km_volta" | "tempo_ida_min" | "tempo_volta_min"
  > {
  id_fat?: number;
  id_corrigido?: number;
  origemIdDeslocamento?: number;
  km_ida?: number;
  km_volta?: number;
  tempo_ida_min?: number;
  tempo_volta_min?: number;
  isEditing?: boolean;
  isDeleted?: boolean;
  isNew?: boolean;
}

export interface PecaOriginal extends OSPecaUtilizada {
  id_fat?: number;
}

export interface PecaRevisada extends Omit<OSPecaUtilizada, "quantidade"> {
  id_fat?: number;
  id_corrigida?: number;
  origemIdPeca?: number | string;
  data_correcao?: string;
  isEditing?: boolean;
  isDeleted?: boolean;
  isNew?: boolean;
  quantidade?: number;
  descricaoOriginal?: string;
  codigoOriginal?: string | null;
}

export type PecaCorrigidaApi = OSPecaCorrigida;

export interface PecaCatalogo {
  id: number;
  codigo: string;
  descricao: string;
  unidade_medida: string;
}
