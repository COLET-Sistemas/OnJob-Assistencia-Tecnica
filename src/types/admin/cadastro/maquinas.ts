export interface Maquina {
    id: number;
    numero_serie: string;
    descricao: string;
    modelo: string;
    data_1a_venda: string;
    nota_fiscal_venda: string;
    data_final_garantia: string;
    situacao: string;
    cliente_atual: {
        id_cliente: number;
        nome_fantasia: string;
    };
}

export interface FormData {
    numero_serie: string;
    descricao: string;
    modelo: string;
    data_1a_venda: string;
    nota_fiscal_venda: string;
    data_final_garantia: string;
    situacao: string;
    id_cliente: number;
}
