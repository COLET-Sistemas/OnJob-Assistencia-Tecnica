import { Regiao as RegiaoBase } from './regioes';

export interface Cliente {
    id: number;
    nome_fantasia: string;
    razao_social: string;
    cnpj: string;
    endereco: string;
    numero: string;
    bairro: string;
    cep: string;
    cidade: string;
    uf: string;
    latitude: number;
    longitude: number;
    situacao: string;
    regiao: RegiaoBase;
}

export interface FormData {
    codigo_erp: string;
    nome_fantasia: string;
    razao_social: string;
    cnpj: string;
    endereco: string;
    numero: string;
    complemento: string;
    bairro: string;
    cep: string;
    cidade: string;
    uf: string;
    latitude: string;
    longitude: string;
    situacao: string;
    id_regiao: number;
}
