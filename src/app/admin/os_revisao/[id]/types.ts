import type {
  OSDeslocamento,
  OSPecaUtilizada,
  OSPecaCorrigida,
} from "@/api/services/ordensServicoService";

export interface DeslocamentoOriginal extends OSDeslocamento {
  id_fat?: number;
}

export interface DeslocamentoRevisado extends OSDeslocamento {
  id_fat?: number;
  id_corrigido?: number;
  origemIdDeslocamento?: number;
  isEditing?: boolean;
  isDeleted?: boolean;
  isNew?: boolean;
}

export interface PecaOriginal extends OSPecaUtilizada {
  id_fat?: number;
}

export interface PecaRevisada extends OSPecaUtilizada {
  id_fat?: number;
  id_corrigida?: number;
  origemIdPeca?: number | string;
  data_correcao?: string;
  isEditing?: boolean;
  isDeleted?: boolean;
  isNew?: boolean;
}

export type PecaCorrigidaApi = OSPecaCorrigida;
