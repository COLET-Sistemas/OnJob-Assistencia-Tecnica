// Exemplo de como utilizar os serviços de API

// Importação dos serviços
import { services } from '../api';

// Exemplo de login
async function fazerLogin(login: string, senha: string) {
    try {
        const response = await services.authService.login({ login, senha });
        // Salvar dados de autenticação
        services.authService.saveAuthData(response);
        return response;
    } catch (error) {
        console.error('Erro ao fazer login:', error);
        throw error;
    }
}

// Exemplo de listagem de clientes
async function listarClientes() {
    try {
        const clientes = await services.clientesService.getAll();
        return clientes;
    } catch (error) {
        console.error('Erro ao listar clientes:', error);
        throw error;
    }
}

// Exemplo de criação de uma ordem de serviço
async function criarOrdemServico(dadosOS: {
    id_cliente: number;
    id_maquina: number;
    id_motivo_atendimento: number;
    comentarios: string;
    id_regiao: number;
}) {
    try {
        const novaOS = await services.ordensServicoService.create(dadosOS);
        return novaOS;
    } catch (error) {
        console.error('Erro ao criar ordem de serviço:', error);
        throw error;
    }
}

// Exemplo de obtenção de dados do dashboard
async function carregarDashboardGestor() {
    try {
        const dashboardData = await services.dashboardService.getGestorData();
        return dashboardData;
    } catch (error) {
        console.error('Erro ao carregar dados do dashboard:', error);
        throw error;
    }
}

// Exportação das funções de exemplo
export {
    carregarDashboardGestor, criarOrdemServico, fazerLogin,
    listarClientes
};

