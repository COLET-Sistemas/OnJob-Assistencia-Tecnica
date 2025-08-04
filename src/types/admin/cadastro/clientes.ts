export interface Regiao {
    id_regiao: number;
    nome_regiao: string;
}

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
    regiao: Regiao;
}

export interface FormData {
    nome_fantasia: string;
    razao_social: string;
    cnpj: string;
    endereco: string;
    numero: string;
    bairro: string;
    cep: string;
    cidade: string;
    uf: string;
    latitude: string;
    longitude: string;
    situacao: string;
    id_regiao: number;
}
