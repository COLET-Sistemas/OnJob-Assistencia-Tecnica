'use client'
import { maquinasAPI } from '@/api/api';
import { Loading } from '@/components/Loading';
import {
    FilterPanel,
    ListContainer,
    ListHeader
} from '@/components/admin/common';
import { useTitle } from '@/context/TitleContext';
import type { Maquina, MaquinaResponse } from '@/types/admin/cadastro/maquinas';
import { Edit2, Plus } from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';

interface Filtros {
    texto: string;
    status: string;
    [key: string]: string;
}

interface FiltroParams {
    descricao?: string;
    situacao?: string;
    incluir_inativos?: string;
    limite?: number;
    pagina?: number;
    [key: string]: string | number | undefined;
}

export default function CadastroMaquinas() {
    const { setTitle } = useTitle();
    const [maquinas, setMaquinas] = useState<Maquina[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingData, setLoadingData] = useState(false);
    const [showFilters, setShowFilters] = useState(false);
    const [filtros, setFiltros] = useState<Filtros>({
        texto: '',
        status: ''
    });

    // Estado para controle de paginação
    const [paginacao, setPaginacao] = useState({
        paginaAtual: 1,
        registrosPorPagina: 20,
        totalPaginas: 1,
        totalRegistros: 0
    });

    const dadosCarregados = useRef(false);
    const paginacaoRef = useRef(paginacao);

    // Form data state removed since we no longer have a modal form

    // Configurar o título da página
    useEffect(() => {
        setTitle('Máquinas');
    }, [setTitle]);

    useEffect(() => {
        paginacaoRef.current = paginacao;
    }, [paginacao]);

    const carregarMaquinas = useCallback(async (filtrosParam: Partial<Filtros> = {}, pagina = paginacao.paginaAtual, limite = paginacao.registrosPorPagina) => {
        if (!dadosCarregados.current) {
            setLoading(true);
        } else {
            setLoadingData(true);
        }

        const registrosPorPaginaAtual = limite !== undefined ? limite : paginacaoRef.current.registrosPorPagina;

        try {
            // Prepare params for API request
            const params: FiltroParams = {
                pagina: pagina,
                limite: registrosPorPaginaAtual
            };

            // Add filters if provided
            if (filtrosParam.texto) {
                // Buscar tanto por número de série quanto por descrição
                params.numero_serie = filtrosParam.texto;
                params.descricao = filtrosParam.texto;
            }

            if (filtrosParam.status === 'true') {
                params.incluir_inativos = 'S';
            }

            // Model filter removed

            // Currently the API doesn't support filters, we'll just use pagina and limite
            const response = await maquinasAPI.getAllWithInactive(pagina, registrosPorPaginaAtual) as MaquinaResponse | Maquina[];

            // Verifique se a resposta tem o formato novo com dados dentro de 'dados'
            let maquinasCarregadas: Maquina[] = [];

            if ('dados' in response && Array.isArray(response.dados)) {
                maquinasCarregadas = response.dados;
                setMaquinas(maquinasCarregadas);

                // Atualizar informações de paginação
                setPaginacao({
                    paginaAtual: response.pagina_atual || pagina,
                    registrosPorPagina: response.registros_por_pagina || registrosPorPaginaAtual,
                    totalPaginas: response.total_paginas || 1,
                    totalRegistros: response.total_registros || response.dados.length
                });
            } else {
                // Fallback para o formato antigo
                maquinasCarregadas = response as Maquina[];
                setMaquinas(maquinasCarregadas);
            }

            // Model extraction removed
        } catch (error) {
            console.error('Erro ao carregar máquinas:', error);
        } finally {
            setLoading(false);
            setLoadingData(false);
        }
    }, [paginacao.paginaAtual, paginacao.registrosPorPagina]);

    // Handler para aplicar todos os filtros
    const aplicarTodosFiltros = useCallback(() => {
        carregarMaquinas(filtros, 1);
        dadosCarregados.current = true;
    }, [filtros, carregarMaquinas]);

    // Handler para mudar a página
    const mudarPagina = useCallback((novaPagina: number) => {
        if (novaPagina < 1 || novaPagina > paginacao.totalPaginas) return;
        carregarMaquinas(filtros, novaPagina);
    }, [filtros, paginacao.totalPaginas, carregarMaquinas]);

    // Handler para alterar filtros
    const handleFiltroChange = useCallback((campo: string, valor: string) => {
        setFiltros(prev => ({
            ...prev,
            [campo]: valor
        }));
    }, []);

    // Handler para limpar filtros
    const limparFiltros = useCallback(() => {
        setFiltros({
            texto: '',
            status: ''
        });

        carregarMaquinas({}, 1);
        dadosCarregados.current = true;
    }, [carregarMaquinas]);

    // Carregamento inicial de dados
    useEffect(() => {
        if (!dadosCarregados.current) {
            carregarMaquinas({}, 1);
            dadosCarregados.current = true;
        }
    }, [carregarMaquinas]);

    // Form submission handler removed since we no longer have a modal form

    // Modal functions removed

    // Input change handler removed since we no longer have a modal form

    if (loading) {
        return (
            <Loading
                fullScreen={true}
                preventScroll={false}
                text="Carregando máquinas..."
                size="large"
            />
        );
    }

    const filterOptions = [
        {
            id: 'texto',
            label: 'Buscar por Texto',
            type: 'text' as const,
            placeholder: 'Digite o número de série ou descrição...'
        },
        {
            id: 'status',
            label: 'Incluir máquinas inativas',
            type: 'checkbox' as const
        }
    ];

    // Count active filters
    const activeFiltersCount = Object.values(filtros).filter(Boolean).length;

    return (
        <ListContainer>
            <ListHeader
                title="Lista de Máquinas"
                itemCount={maquinas.length}
                onFilterToggle={() => setShowFilters(!showFilters)}
                showFilters={showFilters}
                newButtonLink="/admin/cadastro/maquinas/novo"
                newButtonLabel="Nova Máquina"
                activeFiltersCount={activeFiltersCount}
            />

            {showFilters && (
                <FilterPanel
                    title="Filtros Avançados"
                    pageName="Máquinas"
                    filterOptions={filterOptions}
                    filterValues={filtros}
                    onFilterChange={handleFiltroChange}
                    onClearFilters={limparFiltros}
                    onApplyFilters={aplicarTodosFiltros}
                    onClose={() => setShowFilters(false)}
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

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-[var(--neutral-light-gray)] border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-3.5 text-left text-xs font-semibold text-[var(--dark-navy)] uppercase tracking-wider">Máquina</th>
                                <th className="px-6 py-3.5 text-left text-xs font-semibold text-[var(--dark-navy)] uppercase tracking-wider">Modelo</th>
                                <th className="px-6 py-3.5 text-left text-xs font-semibold text-[var(--dark-navy)] uppercase tracking-wider">Cliente Atual</th>
                                <th className="px-6 py-3.5 text-left text-xs font-semibold text-[var(--dark-navy)] uppercase tracking-wider">Data 1ª Venda</th>
                                <th className="px-6 py-3.5 text-left text-xs font-semibold text-[var(--dark-navy)] uppercase tracking-wider">Nota Fiscal</th>
                                <th className="px-6 py-3.5 text-left text-xs font-semibold text-[var(--dark-navy)] uppercase tracking-wider">Data Final Garantia</th>
                                <th className="px-6 py-3.5 text-left text-xs font-semibold text-[var(--dark-navy)] uppercase tracking-wider">Situação</th>
                                <th className="px-6 py-3.5 text-left text-xs font-semibold text-[var(--dark-navy)] uppercase tracking-wider">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-100">
                            {maquinas.length > 0 ? (
                                maquinas.map((maquina: Maquina) => (
                                    <tr key={maquina.id} className="hover:bg-[var(--primary)]/5 transition-colors duration-150 group">
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <div className="text-sm font-medium text-gray-900">
                                                    {maquina.numero_serie}
                                                </div>
                                                <div className="text-xs text-gray-600 mt-1 max-w-[200px] line-clamp-1" title={maquina.descricao}>
                                                    {maquina.descricao || '-'}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-[var(--secondary-yellow)]/10 text-[var(--dark-navy)] border border-[var(--secondary-yellow)]/20">
                                                {maquina.modelo}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="text-sm text-gray-600">
                                                {maquina.cliente_atual?.nome_fantasia || '-'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="text-sm text-gray-600">
                                                {maquina.data_1a_venda && !isNaN(new Date(maquina.data_1a_venda).getTime())
                                                    ? new Date(maquina.data_1a_venda).toLocaleDateString('pt-BR')
                                                    : '-'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="text-sm text-gray-600 font-medium">
                                                {maquina.nota_fiscal_venda || '-'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="text-sm text-gray-600">
                                                {maquina.data_final_garantia && !isNaN(new Date(maquina.data_final_garantia).getTime())
                                                    ? new Date(maquina.data_final_garantia).toLocaleDateString('pt-BR')
                                                    : '-'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium ${maquina.situacao === 'A'
                                                ? 'bg-[var(--secondary-green)]/10 text-green-800 border border-green-200'
                                                : 'bg-red-50 text-red-700 border border-red-100'
                                                }`}>
                                                {maquina.situacao === 'A' ? 'Ativo' : 'Inativo'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right">
                                            <Link
                                                href={`/admin/cadastro/maquinas/editar/${maquina.id}`}
                                                className="inline-flex items-center px-2.5 py-1.5 bg-[var(--primary)]/5 hover:bg-[var(--primary)]/15 text-[var(--primary)] rounded-md transition-colors gap-1.5 opacity-90 hover:opacity-100"
                                            >
                                                <Edit2 size={14} />
                                                <span className="font-medium text-xs">Editar</span>
                                            </Link>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={8} className="px-6 py-16 text-center text-gray-500">
                                        <div className="flex flex-col items-center justify-center">
                                            <div className="bg-[var(--primary)]/5 p-5 rounded-full inline-flex mb-5 shadow-inner text-center">
                                                <span className="text-[var(--primary)] text-2xl font-bold">M</span>
                                            </div>
                                            <p className="text-lg text-gray-700 font-medium">Nenhuma máquina cadastrada</p>
                                            <p className="text-sm text-gray-500 mt-2 mb-5 max-w-md">
                                                Você ainda não possui máquinas cadastradas no sistema. Clique no botão abaixo para adicionar sua primeira máquina.
                                            </p>
                                            <Link
                                                href="/admin/cadastro/maquinas/novo"
                                                className="mt-2 bg-[var(--primary)]/10 text-[var(--primary)] hover:bg-[var(--primary)]/20 px-5 py-2.5 rounded-lg font-medium flex items-center gap-2 transition-all duration-200 hover:scale-105 border border-[var(--primary)]/20"
                                            >
                                                <Plus size={18} />
                                                Adicionar Primeira Máquina
                                            </Link>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Paginação */}
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

                                            setPaginacao(prev => ({
                                                ...prev,
                                                registrosPorPagina: novoValor
                                            }));

                                            carregarMaquinas(filtros, 1, novoValor);
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
                                                className={`relative z-10 inline-flex items-center px-4 py-2 text-sm font-semibold cursor-pointer ${paginacao.paginaAtual === pageNum
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
            </div>
        </ListContainer>
    );
}
