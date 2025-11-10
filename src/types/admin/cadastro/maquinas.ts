export interface Maquina {
  id: number;
  numero_serie: string;
  descricao: string;
  modelo: string;
  data_1a_venda: string;
  nota_fiscal_venda: string;
  data_final_garantia: string;
  situacao: string;
  garantia: boolean;
  observacoes?: string;
  cliente_atual?: {
    id_cliente: number;
    nome_fantasia: string;
  } | null;
}

export interface FormData {
  numero_serie: string;
  descricao: string;
  modelo: string;
  data_1a_venda: string;
  nota_fiscal_venda: string;
  data_final_garantia: string;
  situacao: string;
  id_cliente_atual: number;
  observacoes?: string;
}

// Nova interface para o formato da resposta da API
export interface MaquinaResponse {
  total_registros: number;
  total_paginas: number;
  dados: Maquina[];
  pagina_atual?: number;
  registros_por_pagina?: number;
}
