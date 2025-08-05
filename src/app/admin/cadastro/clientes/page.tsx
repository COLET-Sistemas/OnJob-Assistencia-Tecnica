
'use client'

import { clientesAPI } from '@/api/api';
import {
    DataTable,
    FilterPanel,
    ListContainer,
    ListHeader,
    StatusBadge
} from '@/components/admin/common';
import { Loading } from '@/components/Loading';
import { useTitle } from '@/context/TitleContext';
import type { Cliente as ClienteBase } from '@/types/admin/cadastro/clientes';
import { formatDocumento } from '@/utils/formatters';
import { Edit2, MapPin, User } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

interface FiltroParams {
    nome?: string;
    situacao?: string;
    incluir_inativos?: string;
    qtde_registros?: number;
    nro_pagina?: number;
    [key: string]: string | number | undefined;
}

interface Filtros {
    texto: string;
    status: string;
    [key: string]: string;
}

interface PaginacaoInfo {
    paginaAtual: number;
    totalPaginas: number;
    totalRegistros: number;
    registrosPorPagina: number;
}

interface Cliente extends Omit<ClienteBase, 'endereco'> {
    id_cliente?: number;
    endereco: string;
    qtd_contatos?: number;
    contatos?: Array<{
        id_contato: number;
        nome_completo?: string;
        nome?: string;
        telefone: string;
        whatsapp?: string;
        email: string;
        situacao: string;
        recebe_aviso_os?: boolean;
    }>;
}

const CadastroCliente = () => {
    const { setTitle } = useTitle();
    const [clientes, setClientes] = useState<Cliente[]>([]);
    const [clientesFiltrados, setClientesFiltrados] = useState<Cliente[]>([]);
    const [expandedClienteId, setExpandedClienteId] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [loadingData, setLoadingData] = useState(false);
    const [showFilters, setShowFilters] = useState(false);
    const [filtros, setFiltros] = useState<Filtros>({
        texto: '',
        status: ''
    });
    const [paginacao, setPaginacao] = useState<PaginacaoInfo>({
        paginaAtual: 1,
        totalPaginas: 1,
        totalRegistros: 0,
        registrosPorPagina: 20
    });

    const dadosCarregados = useRef(false);

    useEffect(() => {
        setTitle('Clientes');
    }, [setTitle]);

    const toggleExpand = useCallback((id: number | string) => {
        setExpandedClienteId(prevId => {
            const result = prevId === id ? null : Number(id);
            return result;
        });
    }, []);

    const paginacaoRef = useRef(paginacao);

    useEffect(() => {
        paginacaoRef.current = paginacao;
    }, [paginacao]);

    const carregarClientes = useCallback(async (filtrosParam: Partial<Filtros> = {}, pagina: number = 1, registrosPorPagina?: number) => {
        if (!dadosCarregados.current) {
            setLoading(true);
        } else {
            setLoadingData(true);
        }

        const registrosPorPaginaAtual = registrosPorPagina !== undefined ? registrosPorPagina : paginacaoRef.current.registrosPorPagina;

        try {
            const params: FiltroParams = {
                qtde_registros: registrosPorPaginaAtual,
                nro_pagina: pagina
            };

            // Adicionar parâmetros de filtro à requisição
            if (filtrosParam.texto) {
                // Adiciona o texto diretamente como nome
                params.nome = filtrosParam.texto;
            }

            // Se o checkbox de "Incluir clientes inativos" estiver marcado, adiciona o parâmetro
            if (filtrosParam.status === 'true') {
                params.incluir_inativos = 'S';
            }
            // Quando não estiver marcado, não enviamos nenhum parâmetro adicional

            const response = await clientesAPI.getAll(params);
            if (typeof response === 'object' && 'dados' in response && 'total_paginas' in response && 'total_registros' in response) {
                const { dados, total_paginas, total_registros } = response;
                setClientes(dados);
                setClientesFiltrados(dados);
                setPaginacao({
                    paginaAtual: pagina,
                    totalPaginas: total_paginas,
                    totalRegistros: total_registros,
                    registrosPorPagina: registrosPorPaginaAtual
                });
            } else if (typeof response === 'object' && 'data' in response && 'pagination' in response) {
                const { data, pagination } = response;
                setClientes(data);
                setClientesFiltrados(data);

                setPaginacao({
                    paginaAtual: pagination.currentPage || pagina,
                    totalPaginas: pagination.totalPages || 1,
                    totalRegistros: pagination.totalRecords || data.length,
                    registrosPorPagina: registrosPorPaginaAtual
                });
            } else {
                setClientes(response);
                setClientesFiltrados(response);

                setPaginacao(prev => ({
                    ...prev,
                    paginaAtual: pagina,
                    registrosPorPagina: registrosPorPaginaAtual,
                    totalPaginas: response.length < registrosPorPaginaAtual ? pagina : pagina + 1
                }));
            }
        } catch (error) {
            console.error('Erro ao carregar clientes:', error);
        } finally {
            setLoading(false);
            setLoadingData(false);
        }
    }, []);

    const aplicarTodosFiltros = useCallback(() => {
        carregarClientes(filtros, 1);
        dadosCarregados.current = true;
    }, [filtros, carregarClientes]);

    const textoRef = useRef(filtros.texto);

    // Efeito simplificado que só carrega os clientes inicialmente
    useEffect(() => {
        if (!dadosCarregados.current) {
            carregarClientes({}, 1);
            dadosCarregados.current = true;
            textoRef.current = filtros.texto;
        }
    }, [carregarClientes, filtros.texto]);

    const handleFiltroChange = useCallback((campo: string, valor: string) => {
        setFiltros(prev => ({
            ...prev,
            [campo]: valor
        }));
    }, []);

    const limparFiltros = useCallback(() => {
        setFiltros({
            texto: '',
            status: '' // Estado vazio significa "não incluir inativos"
        });
        // Carrega com parâmetros vazios (apenas ativos por padrão)
        carregarClientes({}, 1);
        dadosCarregados.current = true;
    }, [carregarClientes]);
    const mudarPagina = useCallback((novaPagina: number) => {
        if (novaPagina < 1 || novaPagina > paginacao.totalPaginas) return;
        carregarClientes(filtros, novaPagina);
    }, [filtros, paginacao.totalPaginas, carregarClientes]);

    if (loading) {
        return (
            <Loading
                fullScreen={true}
                preventScroll={false}
                text="Carregando clientes..."
                size="large"
            />
        );
    }

    const filterOptions = [
        {
            id: 'texto',
            label: 'Busca por Texto',
            type: 'text' as const,
            placeholder: 'Digite o nome ou razão social...'
        },
        {
            id: 'status',
            label: 'Incluir Inativos',
            type: 'checkbox' as const
        }
    ];

    const columns = [
        {
            header: 'Cliente',
            accessor: (cliente: Cliente) => (
                <div>
                    <div className="text-md font-semibold text-gray-900">{cliente.nome_fantasia}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{cliente.razao_social}</div>
                </div>
            )
        },
        {
            header: 'CNPJ / CPF',
            accessor: (cliente: Cliente) => (
                <span className="text-md text-gray-500">{formatDocumento(cliente.cnpj)}</span>
            )
        },
        {
            header: 'Localização',
            accessor: (cliente: Cliente) => (
                <>
                    <div className="text-sm text-[var(--neutral-graphite)] flex items-center gap-1.5">
                        <MapPin size={16} className="text-[var(--primary)]" />
                        {cliente.cidade}, {cliente.uf}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">
                        {cliente.endereco}, {cliente.numero}
                    </div>
                </>
            )
        },
        {
            header: 'Região',
            accessor: (cliente: Cliente) => (
                cliente.regiao?.nome_regiao && (
                    <span className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-medium bg-[var(--secondary-yellow)]/20 text-[var(--dark-navy)] border border-[var(--secondary-yellow)]/30">
                        {cliente.regiao.nome_regiao}
                    </span>
                )
            )
        },
        {
            header: 'Status',
            accessor: (cliente: Cliente) => (
                <StatusBadge
                    status={cliente.situacao}
                    mapping={{
                        'A': {
                            label: 'Ativo',
                            className: 'bg-[var(--secondary-green)]/20 text-[var(--dark-navy)] border border-[var(--secondary-green)]/30'
                        },
                        'I': {
                            label: 'Inativo',
                            className: 'bg-red-50 text-red-700 border border-red-100'
                        }
                    }}
                />
            )
        },
        {
            header: 'Contatos',
            accessor: (cliente: Cliente) => {
                const contatosCount = cliente.qtd_contatos || (cliente.contatos ? cliente.contatos.length : 0);
                const hasContatos = contatosCount > 0;

                return (
                    <button
                        className={`px-2 py-1.5 border border-gray-100 rounded-lg text-xs font-medium flex items-center gap-2 transition-colors ${hasContatos
                            ? "bg-[var(--neutral-light-gray)] text-[var(--neutral-graphite)] hover:bg-[var(--neutral-light-gray)]/80"
                            : "bg-gray-50 text-gray-400 cursor-not-allowed"
                            }`}
                        onClick={(e) => {
                            e.stopPropagation();
                            if (hasContatos) {
                                toggleExpand(cliente.id_cliente || cliente.id);
                            }
                        }}
                        type="button"
                        disabled={!hasContatos}
                    >
                        <User size={16} className={hasContatos ? "text-[var(--neutral-graphite)]" : "text-gray-400"} />
                        <span className={hasContatos ? "text-[var(--primary)]" : "text-gray-400"}>
                            ({contatosCount})
                        </span>
                        {hasContatos && (
                            <span className="text-[var(--primary)]">
                                {expandedClienteId === (cliente.id_cliente || cliente.id) ? "▲" : "▼"}
                            </span>
                        )}
                    </button>
                );
            }
        },
        {
            header: 'Ações',
            accessor: (cliente: Cliente) => (
                <div className="flex items-center gap-2">
                    <a
                        href={`/admin/cadastro/clientes/editar/${cliente.id_cliente || cliente.id}`}
                        className="inline-flex items-center p-1.5 text-[var(--primary)] rounded transition-colors hover:bg-[var(--primary)]/10"
                        title="Editar cliente"
                    >
                        <Edit2 size={16} />
                    </a>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            if (confirm(`Deseja realmente excluir o cliente "${cliente.nome_fantasia || cliente.razao_social}"?`)) {
                                alert('Funcionalidade de exclusão será implementada em breve.');
                            }
                        }}
                        className="inline-flex items-center p-1.5 text-red-500 rounded transition-colors hover:bg-red-50"
                        title="Excluir cliente"
                        type="button"
                    >
                        <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M3 6h18"></path>
                            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                        </svg>
                    </button>
                </div>
            )
        }
    ];

    const activeFiltersCount = Object.values(filtros).filter(Boolean).length;

    return (
        <ListContainer>
            <ListHeader
                title="Lista de Clientes"
                itemCount={clientesFiltrados.length}
                onFilterToggle={() => setShowFilters(!showFilters)}
                showFilters={showFilters}
                newButtonLink="/admin/cadastro/clientes/novo"
                newButtonLabel="Novo Cliente"
                activeFiltersCount={activeFiltersCount}
            />

            {showFilters && (
                <FilterPanel
                    title="Filtros Avançados"
                    pageName="Clientes"
                    filterOptions={filterOptions}
                    filterValues={filtros}
                    onFilterChange={handleFiltroChange}
                    onClearFilters={limparFiltros}
                    onApplyFilters={aplicarTodosFiltros}
                    onClose={() => setShowFilters(false)}
                    itemCount={clientesFiltrados.length}
                />
            )}

            <div className="relative">
                {loadingData && (
                    <div className="absolute inset-0 bg-white/70 z-10 rounded-lg">
                        <Loading
                            fullScreen={false}
                            preventScroll={false}
                            text="Atualizando lista..."
                            size="medium"
                            className="h-full"
                        />
                    </div>
                )}

                <DataTable
                    columns={columns}
                    data={clientesFiltrados}
                    keyField="id_cliente"
                    expandedRowId={expandedClienteId}
                    onRowExpand={toggleExpand}
                    emptyStateProps={{
                        title: "Nenhum cliente encontrado",
                        description: "Tente ajustar seus filtros ou cadastre um novo cliente."
                    }}
                    renderExpandedRow={(cliente: Cliente) => {
                        if (!cliente.contatos) return null;

                        return (
                            <div className="border-t border-[var(--primary)]/10 pt-4 px-2">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {cliente.contatos.map((contato) => (
                                        <div key={contato.id_contato} className="border border-gray-100 rounded-xl p-3 bg-white shadow-sm hover:shadow-md transition-all transform hover:-translate-y-1">
                                            <div className="flex justify-between items-center pb-1.5 border-b border-gray-100">
                                                <div className="font-semibold text-gray-900 truncate">{contato.nome_completo || contato.nome}</div>
                                                <div className="flex items-center gap-2">
                                                    <div className="flex items-center gap-1">
                                                        <div className={`w-2.5 h-2.5 rounded-full ${contato.situacao === 'A' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                                        <span className={`text-xs font-medium ${contato.situacao === 'A' ? 'text-green-700' : 'text-red-700'}`}>
                                                            {contato.situacao === 'A' ? 'Ativo' : 'Inativo'}
                                                        </span>
                                                    </div>
                                                    {contato.recebe_aviso_os ? (
                                                        <div className="flex items-center gap-1">
                                                            <div className="w-2.5 h-2.5 rounded-full bg-yellow-400"></div>
                                                            <span className="text-xs font-medium text-yellow-700">Aviso OS</span>
                                                        </div>
                                                    ) : null}
                                                </div>
                                            </div>
                                            <div className="pt-3">
                                                <div className="flex flex-wrap gap-2">
                                                    {contato.telefone && (
                                                        <div className="text-sm bg-gray-50 px-3 py-1.5 rounded-md flex items-center gap-2 border border-gray-100 hover:bg-gray-100 transition-colors">
                                                            <svg className="w-4 h-4 text-[var(--primary)] flex-shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                                                            </svg>
                                                            <span className="truncate max-w-[140px] text-gray-700">{contato.telefone}</span>
                                                        </div>
                                                    )}

                                                    {contato.whatsapp && (
                                                        <a
                                                            href={`https://wa.me/${contato.whatsapp.replace(/\D/g, '')}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-sm bg-[var(--secondary-green)]/5 px-3 py-1.5 rounded-md flex items-center gap-2 border border-[var(--secondary-green)]/20 hover:bg-[var(--secondary-green)]/10 transition-colors"
                                                        >
                                                            <svg className="w-4 h-4 text-[var(--secondary-green)] flex-shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                                <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
                                                            </svg>
                                                            <span className="truncate max-w-[140px] text-gray-700">{contato.whatsapp}</span>
                                                        </a>
                                                    )}

                                                    {contato.email && (
                                                        <a
                                                            href={`mailto:${contato.email}`}
                                                            className="text-sm bg-blue-50 px-3 py-1.5 rounded-md flex items-center gap-2 border border-blue-100 hover:bg-blue-100 hover:text-blue-600 transition-colors"
                                                        >
                                                            <svg className="w-4 h-4 text-blue-500 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                                                                <polyline points="22,6 12,13 2,6"></polyline>
                                                            </svg>
                                                            <span className="truncate max-w-[180px] text-gray-700">{contato.email}</span>
                                                        </a>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    }}
                />
            </div>

            {paginacao.totalPaginas > 1 && (
                <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6 mt-4 rounded-lg shadow-sm">
                    <div className="flex flex-1 justify-between sm:hidden">
                        <button
                            onClick={() => mudarPagina(paginacao.paginaAtual - 1)}
                            disabled={paginacao.paginaAtual === 1}
                            className={`relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium ${paginacao.paginaAtual === 1
                                ? 'text-gray-300 cursor-not-allowed'
                                : 'text-gray-700 hover:bg-gray-50'
                                }`}
                        >
                            Anterior
                        </button>
                        <button
                            onClick={() => mudarPagina(paginacao.paginaAtual + 1)}
                            disabled={paginacao.paginaAtual === paginacao.totalPaginas}
                            className={`relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium ${paginacao.paginaAtual === paginacao.totalPaginas
                                ? 'text-gray-300 cursor-not-allowed'
                                : 'text-gray-700 hover:bg-gray-50'
                                }`}
                        >
                            Próxima
                        </button>
                    </div>
                    <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                        <div className="flex items-center">
                            <p className="text-sm text-gray-700 mr-6">
                                Mostrando{' '}
                                <span className="font-medium">
                                    {Math.min((paginacao.paginaAtual - 1) * paginacao.registrosPorPagina + 1, paginacao.totalRegistros)}
                                </span>{' '}
                                a{' '}
                                <span className="font-medium">
                                    {Math.min(paginacao.paginaAtual * paginacao.registrosPorPagina, paginacao.totalRegistros)}
                                </span>{' '}
                                de{' '}
                                <span className="font-medium">{paginacao.totalRegistros}</span>{' '}
                                resultados
                            </p>
                            <div className="flex items-center">
                                <span className="text-sm text-gray-700 mr-2">Exibir:</span>
                                <select
                                    className="rounded-md border border-gray-300 py-1.5 px-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)]"
                                    value={paginacao.registrosPorPagina}
                                    onChange={(e) => {
                                        const novoValor = parseInt(e.target.value);

                                        // Atualiza o estado diretamente
                                        setPaginacao(prev => ({
                                            ...prev,
                                            registrosPorPagina: novoValor
                                        }));

                                        // Faz a chamada API com o novo valor diretamente
                                        carregarClientes(filtros, 1, novoValor);
                                    }}
                                >
                                    <option value={10}>10</option>
                                    <option value={20}>20</option>
                                    <option value={25}>25</option>
                                    <option value={50}>50</option>
                                    <option value={100}>100</option>
                                </select>
                            </div>
                        </div>
                        <div>
                            <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Paginação">
                                <button
                                    onClick={() => mudarPagina(paginacao.paginaAtual - 1)}
                                    disabled={paginacao.paginaAtual === 1}
                                    className={`relative inline-flex items-center rounded-l-md px-2 py-2 ${paginacao.paginaAtual === 1
                                        ? 'text-gray-300 cursor-not-allowed'
                                        : 'text-gray-500 hover:bg-gray-50'
                                        } focus:z-20 focus:outline-offset-0`}
                                >
                                    <span className="sr-only">Anterior</span>
                                    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                        <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" />
                                    </svg>
                                </button>

                                {/* Renderiza os números das páginas */}
                                {Array.from({ length: Math.min(5, paginacao.totalPaginas) }, (_, i) => {
                                    // Lógica para mostrar as páginas próximas da atual
                                    let pageNum;
                                    if (paginacao.totalPaginas <= 5) {
                                        pageNum = i + 1;
                                    } else if (paginacao.paginaAtual <= 3) {
                                        pageNum = i + 1;
                                    } else if (paginacao.paginaAtual >= paginacao.totalPaginas - 2) {
                                        pageNum = paginacao.totalPaginas - 4 + i;
                                    } else {
                                        pageNum = paginacao.paginaAtual - 2 + i;
                                    }

                                    return (
                                        <button
                                            key={pageNum}
                                            onClick={() => mudarPagina(pageNum)}
                                            aria-current={paginacao.paginaAtual === pageNum ? 'page' : undefined}
                                            className={`relative z-10 inline-flex items-center px-4 py-2 text-sm font-semibold ${paginacao.paginaAtual === pageNum
                                                ? 'bg-[var(--primary)] text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]'
                                                : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0'
                                                }`}
                                        >
                                            {pageNum}
                                        </button>
                                    );
                                })}

                                <button
                                    onClick={() => mudarPagina(paginacao.paginaAtual + 1)}
                                    disabled={paginacao.paginaAtual === paginacao.totalPaginas}
                                    className={`relative inline-flex items-center rounded-r-md px-2 py-2 ${paginacao.paginaAtual === paginacao.totalPaginas
                                        ? 'text-gray-300 cursor-not-allowed'
                                        : 'text-gray-500 hover:bg-gray-50'
                                        } focus:z-20 focus:outline-offset-0`}
                                >
                                    <span className="sr-only">Próxima</span>
                                    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                        <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                                    </svg>
                                </button>
                            </nav>
                        </div>
                    </div>
                </div>
            )}
        </ListContainer>
    );
};

export default CadastroCliente;