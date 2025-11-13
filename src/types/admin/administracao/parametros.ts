export interface ParametroSistema {
  id: number;
  chave: string;
  descricao: string;
  valor: string;
  valor_padrao?: string;
  tipo?: string;
  alteravel?: "S" | "N";
  admin_pode_alterar?: boolean;
  atualizado_em?: string;
}
