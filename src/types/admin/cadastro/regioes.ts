export interface Regiao {
    id: number;
    nome: string;
    descricao: string;
    uf: string;
    atendida_empresa: boolean;
    situacao: string;
    data_cadastro: string;
    id_usuario_cadastro: number;
    // Mantendo campos antigos para compatibilidade
    id_regiao?: number;
    nome_regiao?: string;
    atendida_pela_empresa?: boolean;
}

export interface FormData {
    nome: string;
    descricao: string;
    uf: string;
    atendida_empresa: boolean;
    situacao: string;
}
