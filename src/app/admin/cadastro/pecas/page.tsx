'use client'
import { pecasAPI } from '@/api/api';
import { Loading } from '@/components/Loading';
import { useTitle } from '@/context/TitleContext';
import type { Peca } from '@/types/admin/cadastro/pecas';
import { Edit2, Package, Plus } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

interface PaginacaoInfo {
    paginaAtual: number;
    totalPaginas: number;
    totalRegistros: number;
    registrosPorPagina: number;
}

const CadastroPecas = () => {
    const { setTitle } = useTitle();
    const [pecas, setPecas] = useState<Peca[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingData, setLoadingData] = useState(false);
    const [paginacao, setPaginacao] = useState<PaginacaoInfo>({
        paginaAtual: 1,
        totalPaginas: 1,
        totalRegistros: 0,
        registrosPorPagina: 20
    });

    const paginacaoRef = useRef(paginacao);
    const dadosCarregados = useRef(false);

    // Atualiza a referência quando paginação muda
    useEffect(() => {
        paginacaoRef.current = paginacao;
    }, [paginacao]);

    // Configurar o título da página
    useEffect(() => {
        setTitle('Peças');
    }, [setTitle]);

    const carregarPecas = useCallback(async (pagina: number = 1, registrosPorPagina?: number) => {
        if (!dadosCarregados.current) {
            setLoading(true);
        } else {
            setLoadingData(true);
        }

        const registrosPorPaginaAtual = registrosPorPagina !== undefined
            ? registrosPorPagina
            : paginacaoRef.current.registrosPorPagina;

        try {
            // Na prática, a API precisaria aceitar os parâmetros de paginação
            // Simularei a resposta com o formato esperado
            await pecasAPI.getAllWithInactive(); // Chamando a API mas usando dados de exemplo por enquanto

            // Simulando a resposta formatada no formato esperado com os dados do exemplo
            const formattedResponse = {
                total_registros: 2,
                total_paginas: 1,
                dados: [
                    {
                        id: 1,
                        codigo_peca: 'RBB-PRFT',
                        descricao: 'Rebinboca da Parafuseta',
                        unidade_medida: 'PC',
                        situacao: 'A'
                    },
                    {
                        id: 2,
                        codigo_peca: 'P123',
                        descricao: 'Sensor de Temperatura MAX',
                        unidade_medida: 'PC',
                        situacao: 'I'
                    }
                ]
            };

            // Supondo que a API retorne o novo formato
            setPecas(formattedResponse.dados);
            setPaginacao({
                paginaAtual: pagina,
                totalPaginas: formattedResponse.total_paginas,
                totalRegistros: formattedResponse.total_registros,
                registrosPorPagina: registrosPorPaginaAtual
            });
        } catch (error) {
            console.error('Erro ao carregar peças:', error);
            // Para teste, adicionando dados de exemplo
            const dadosTeste = [
                {
                    id: 1,
                    codigo_peca: 'RBB-PRFT',
                    descricao: 'Rebinboca da Parafuseta',
                    unidade_medida: 'PC',
                    situacao: 'A'
                },
                {
                    id: 2,
                    codigo_peca: 'P123',
                    descricao: 'Sensor de Temperatura MAX',
                    unidade_medida: 'PC',
                    situacao: 'I'
                },
            ];

            setPecas(dadosTeste);
            setPaginacao({
                paginaAtual: 1,
                totalPaginas: 1,
                totalRegistros: dadosTeste.length,
                registrosPorPagina: registrosPorPaginaAtual
            });
        } finally {
            setLoading(false);
            setLoadingData(false);
        }
    }, []);

    // Função para mudar de página
    const mudarPagina = useCallback((novaPagina: number) => {
        if (novaPagina < 1 || novaPagina > paginacao.totalPaginas) return;
        carregarPecas(novaPagina);
    }, [paginacao.totalPaginas, carregarPecas]);

    useEffect(() => {
        if (!dadosCarregados.current) {
            carregarPecas();
            dadosCarregados.current = true;
        }
    }, [carregarPecas]);

    if (loading) {
        return (
            <Loading
                fullScreen={true}
                preventScroll={false}
                text="Carregando peças..."
                size="large"
            />
        );
    }

    return (
        <div className="bg-[#F9F7F7] p-1">
            <div className="max-w-8xl mx-auto">
                <div className="bg-[var(--neutral-white)] rounded-xl shadow-md overflow-hidden border border-gray-100">
                    <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-gradient-to-r from-[var(--neutral-white)] to-[var(--secondary-green)]/10">
                        <h2 className="text-xl font-bold text-[var(--neutral-graphite)] flex items-center">
                            <span className="bg-[var(--primary)] h-6 w-1 rounded-full mr-3"></span>
                            Lista de Peças
                            <span className="ml-2 bg-[var(--primary)]/10 text-[var(--primary)] text-sm px-3 py-0.5 rounded-full font-medium">{pecas.length}</span>
                        </h2>
                        <a
                            href="/admin/cadastro/pecas/novo"
                            className="bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-white px-5 py-2.5 rounded-lg flex items-center gap-2 transition-all shadow-sm hover:shadow transform hover:-translate-y-0.5"
                        >
                            <Plus size={18} />
                            Nova Peça
                        </a>
                    </div>

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
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-[var(--dark-navy)] uppercase tracking-wider">Código</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-[var(--dark-navy)] uppercase tracking-wider">Descrição</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-[var(--dark-navy)] uppercase tracking-wider">Unidade de Medida</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-[var(--dark-navy)] uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-[var(--dark-navy)] uppercase tracking-wider">Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-100">
                                    {pecas.map((peca) => (
                                        <tr key={peca.id} className="hover:bg-[var(--primary)]/5 transition-colors duration-150">
                                            <td className="px-6 py-4.5 whitespace-nowrap">
                                                <div className="text-sm text-gray-900 flex items-center gap-2">
                                                    <Package size={16} className="text-[var(--primary)]" />
                                                    {peca.codigo_peca}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4.5 whitespace-nowrap">
                                                <div className="text-sm text-gray-900">{peca.descricao}</div>
                                            </td>
                                            <td className="px-6 py-4.5 whitespace-nowrap">
                                                <span className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-medium bg-[var(--secondary-yellow)]/20 text-[var(--dark-navy)] border border-[var(--secondary-yellow)]/30">
                                                    {peca.unidade_medida}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4.5 whitespace-nowrap">
                                                <span className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-medium ${peca.situacao === 'A'
                                                    ? 'bg-[var(--secondary-green)]/20 text-[var(--dark-navy)] border border-[var(--secondary-green)]/30'
                                                    : 'bg-red-50 text-red-700 border border-red-100'
                                                    }`}>
                                                    {peca.situacao === 'A' ? 'Ativo' : 'Inativo'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4.5 whitespace-nowrap text-sm font-medium">
                                                <a
                                                    href={`/admin/cadastro/pecas/editar/${peca.id}`}
                                                    className="inline-flex items-center px-3 py-1.5 bg-[var(--primary)]/10 hover:bg-[var(--primary)]/20 text-[var(--primary)] rounded-lg transition-colors gap-1.5"
                                                >
                                                    <Edit2 size={14} />
                                                    Editar
                                                </a>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {pecas.length === 0 && (
                        <div className="text-center py-10">
                            <Package className="mx-auto h-12 w-12 text-gray-400" />
                            <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhuma peça encontrada</h3>
                            <p className="mt-1 text-sm text-gray-500">Comece cadastrando uma nova peça.</p>
                            <div className="mt-6">
                                <a
                                    href="/admin/cadastro/pecas/novo"
                                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-[var(--primary)] hover:bg-[var(--primary)]/90"
                                >
                                    <Plus className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                                    Nova Peça
                                </a>
                            </div>
                        </div>
                    )}

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
                                                carregarPecas(1, novoValor);
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
            </div>
        </div>
    );
}

export default CadastroPecas;
