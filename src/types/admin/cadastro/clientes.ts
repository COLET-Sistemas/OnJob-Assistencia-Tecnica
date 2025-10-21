import { Regiao } from "./regioes";

export type ClienteContato = {
  id?: number;
  id_contato?: number;
  nome_completo?: string;
  nome?: string;
  cargo?: string;
  telefone: string;
  whatsapp?: string;
  email: string;
  situacao: string;
  recebe_aviso_os?: boolean;
};

export interface ClienteMaquina {
  id?: number;
  id_maquina?: number;
  numero_serie: string;
  descricao: string;
  modelo: string;
  data_1a_venda?: string;
  nota_fiscal_venda?: string;
  data_final_garantia?: string;
  situacao?: string;
}

export interface Cliente {
  id?: number;
  id_cliente?: number;
  codigo_erp?: string;
  nome_fantasia: string;
  razao_social: string;
  cnpj: string;
  endereco: string;
  numero: string;
  bairro: string;
  cep: string;
  complemento?: string;
  cidade: string;
  uf: string;
  id_regiao?: number;
  latitude?: number;
  longitude?: number;
  situacao: string;
  regiao?: Regiao;
  qtd_contatos?: number;
  contatos?: ClienteContato[];
  qtd_maquinas?: number;
  maquinas?: ClienteMaquina[];
}

export interface FormData {
  id?: number;
  id_cliente?: number;
  codigo_erp?: string;
  nome_fantasia: string;
  razao_social: string;
  cnpj: string;
  endereco: string;
  complemento?: string;
  numero: string;
  bairro: string;
  cep: string;
  cidade: string;
  uf: string;
  id_regiao?: number;
  latitude?: number;
  longitude?: number;
  situacao: string;
  regiao?: Regiao;
  qtd_contatos?: number;
  contatos?: ClienteContato[];
  qtd_maquinas?: number;
  maquinas?: ClienteMaquina[];
}
export interface ClienteApiResponse {
  total_registros: number;
  total_paginas: number;
  dados: Cliente[];
}
