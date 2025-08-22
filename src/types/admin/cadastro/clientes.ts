import { Regiao } from "./regioes";

export type ClienteContato = {
  id_contato: number;
  nome_completo?: string;
  nome?: string;
  telefone: string;
  whatsapp?: string;
  email: string;
  situacao: string;
  recebe_aviso_os?: boolean;
};

export interface Cliente {
  id?: number;
  id_cliente?: number;
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
  latitude?: number;
  longitude?: number;
  situacao: string;
  regiao?: Regiao;
  qtd_contatos?: number;
  contatos?: ClienteContato[];
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
  latitude?: number;
  longitude?: number;
  situacao: string;
  regiao?: Regiao;
  qtd_contatos?: number;
  contatos?: ClienteContato[];
}
