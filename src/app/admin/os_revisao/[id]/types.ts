import type { OSDeslocamento, OSPecaUtilizada } from "@/api/services/ordensServicoService";

export interface DeslocamentoRevisado extends OSDeslocamento {
  id_fat?: number;
  isEditing?: boolean;
  isDeleted?: boolean;
  isNew?: boolean;
}

export interface PecaRevisada extends OSPecaUtilizada {
  id_fat?: number;
  isEditing?: boolean;
  isDeleted?: boolean;
  isNew?: boolean;
}