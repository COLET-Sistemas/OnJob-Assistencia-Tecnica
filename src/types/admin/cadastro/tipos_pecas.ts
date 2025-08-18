
export interface TipoPeca {
  id_tipo_peca: number;
  descricao: string;
  situacao: "A" | "I"; 
}

export interface TiposPecasResponse {
  tipos_pecas: TipoPeca[];
}
