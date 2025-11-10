export interface ParametroSistema {
  id: number;
  chave: string;
  descricao: string;
  valor: string;
  valor_padrao?: string;
  tipo?: string;
  alteravel?: "S" | "N";
  atualizado_em?: string;
}
