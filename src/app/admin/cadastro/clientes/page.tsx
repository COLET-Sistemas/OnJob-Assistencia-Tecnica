
'use client'

import api, { clientesAPI } from '@/api/api';
import {
    ActionButton,
    DataTable,
    FilterPanel,
    ListContainer,
    ListHeader,
    LocationPicker,
    StatusBadge
} from '@/components/admin/common';
import { Loading } from '@/components/Loading';
import { useTitle } from '@/context/TitleContext';
import { useDataFetch } from '@/hooks';
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

interface Cliente {
    id?: number;
    id_cliente?: number;
    nome_fantasia: string;
    razao_social: string;
    cnpj: string;
    endereco: string;
    numero: string;
    bairro: string;
    cep: string;
    cidade: string;
    uf: string;
    latitude?: number;
    longitude?: number;
    situacao: string;
    regiao?: { id: number; nome?: string; nome_regiao?: string; };
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
    const [expandedClienteId, setExpandedClienteId] = useState<number | null>(null);
    const [showFilters, setShowFilters] = useState(false);
    const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);
    const [showLocationModal, setShowLocationModal] = useState(false);
    const [filtros, setFiltros] = useState<Filtros>({
        texto: '',
        status: ''
    });
    const filtrosRef = useRef<Filtros>(filtros);

    const [filtroAplicado, setFiltroAplicado] = useState<number>(1);
    const [paginacao, setPaginacao] = useState<PaginacaoInfo>({
        paginaAtual: 1,
        totalPaginas: 1,
        totalRegistros: 0,
        registrosPorPagina: 20
    });

    // Configure the page title
    useEffect(() => {
        setTitle('Clientes');
    }, [setTitle]);


    const fetchClientes = useCallback(async () => {
        const currentFiltros = filtrosRef.current;
        const currentPaginacao = { ...paginacao };

        const params: FiltroParams = {
            qtde_registros: currentPaginacao.registrosPorPagina,
            nro_pagina: currentPaginacao.paginaAtual
        };

        if (currentFiltros.texto) {
            params.nome = currentFiltros.texto;
        }

        if (currentFiltros.status === 'true') {
            params.incluir_inativos = 'S';
        }

        try {
            const response = await clientesAPI.getAll(params);

            // Process the response based on its format
            if (typeof response === 'object' && 'dados' in response && 'total_paginas' in response && 'total_registros' in response) {
                const { dados, total_paginas, total_registros } = response;

                // Update pagination info
                setPaginacao(prev => ({
                    ...prev,
                    totalPaginas: total_paginas,
                    totalRegistros: total_registros
                }));

                return dados;
            } else if (typeof response === 'object' && 'data' in response && 'pagination' in response) {
                const { data, pagination } = response;

                setPaginacao(prev => ({
                    ...prev,
                    totalPaginas: pagination.totalPages || prev.totalPaginas,
                    totalRegistros: pagination.totalRecords || data.length
                }));

                return data;
            }

            return response;
        } catch (error) {
            console.error('Error fetching clients:', error);
            return [];
        }
    }, [paginacao]);

    // Use our custom hook to load data only when filters are applied or pagination changes
    const { data: clientesFiltrados, loading } = useDataFetch<Cliente[]>(
        fetchClientes,
        [filtroAplicado]
    );

    useEffect(() => {
        filtrosRef.current = filtros;
    }, [filtros]);


    const toggleExpand = useCallback((id: number | string) => {
        setExpandedClienteId(prevId => {
            const result = prevId === id ? null : Number(id);
            return result;
        });
    }, []);

    // Filter handlers
    const handleFiltroChange = useCallback((campo: string, valor: string) => {
        setFiltros(prev => ({
            ...prev,
            [campo]: valor
        }));
    }, []);

    const aplicarTodosFiltros = useCallback(() => {
        setPaginacao(prev => {
            const novaPaginacao = {
                ...prev,
                paginaAtual: 1
            };

            setTimeout(() => {
                setFiltroAplicado(prev => prev + 1);
            }, 100);

            return novaPaginacao;
        });
    }, []);

    const limparFiltros = useCallback(() => {
        // Primeiro atualizar os filtros
        setFiltros({
            texto: '',
            status: ''
        });

        // Em seguida atualizar a paginação e acionar a atualização
        setTimeout(() => {
            setPaginacao(prev => {
                const novaPaginacao = {
                    ...prev,
                    paginaAtual: 1
                };

                // Só incrementar o filtroAplicado depois que todos os estados
                // tiverem sido atualizados
                setTimeout(() => {
                    setFiltroAplicado(prev => prev + 1);
                }, 50);

                return novaPaginacao;
            });
        }, 50);
    }, []);    // Function to handle opening the location modal
    const openLocationModal = useCallback((cliente: Cliente) => {
        setSelectedCliente(cliente);
        setShowLocationModal(true);
    }, []);

    // Function to handle saving coordinates
    const saveClienteLocation = useCallback(async (latitude: number, longitude: number) => {
        if (!selectedCliente) return;

        try {
            // Get the client ID consistently
            const clientId = selectedCliente.id_cliente !== undefined ? selectedCliente.id_cliente : selectedCliente.id;

            // Make the API call with explicitly converted number values
            await api.patch(`/clientes/geo?id=${clientId}`, {
                latitude: Number(latitude),
                longitude: Number(longitude)
            });

            // Atualizar o estado local em sequência
            setShowLocationModal(false);

            // Disparar a busca após fechar o modal
            setTimeout(() => {
                setFiltroAplicado(prev => prev + 1); // Refresh data
            }, 100);

            // Show success message
            alert('Localização atualizada com sucesso!');
        } catch (error) {
            console.error('Error updating location:', error);
            alert('Erro ao atualizar localização. Tente novamente.');
        }
    }, [selectedCliente]);

    const mudarPagina = useCallback((novaPagina: number) => {
        if (novaPagina < 1 || novaPagina > paginacao.totalPaginas) return;

        // Atualizar a paginação e disparar uma única chamada API depois
        setPaginacao(prev => {
            const novaPaginacao = {
                ...prev,
                paginaAtual: novaPagina
            };

            // Garantir que a paginação foi atualizada antes de disparar a busca
            setTimeout(() => {
                setFiltroAplicado(prev => prev + 1);
            }, 100);

            return novaPaginacao;
        });
    }, [paginacao.totalPaginas]);

    // Loading state is now handled within the DataTable component's wrapper

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

    // Define columns for the table
    const columns = [
        {
            header: 'Cliente',
            accessor: 'nome_fantasia' as keyof Cliente,
            render: (cliente: Cliente) => (
                <div>
                    <div className="text-md font-semibold text-gray-900">{cliente.nome_fantasia}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{cliente.razao_social}</div>
                </div>
            )
        },
        {
            header: 'CNPJ / CPF',
            accessor: 'cnpj' as keyof Cliente,
            render: (cliente: Cliente) => (
                <span className="text-md text-gray-500">{formatDocumento(cliente.cnpj)}</span>
            )
        },
        {
            header: 'Localização',
            accessor: 'cidade' as keyof Cliente,
            render: (cliente: Cliente) => {
                const hasValidCoordinates =
                    cliente.latitude !== undefined &&
                    cliente.latitude !== null &&
                    cliente.latitude !== 0 &&
                    String(cliente.latitude) !== "0" &&
                    String(cliente.latitude) !== "";

                return (
                    <>
                        {hasValidCoordinates ? (
                            <a
                                href={`https://www.google.com/maps/place/${cliente.latitude},${cliente.longitude}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-[var(--primary)] flex items-center gap-1.5 hover:underline"
                            >
                                <MapPin size={16} className="text-[var(--primary)]" />
                                {cliente.cidade}, {cliente.uf}
                            </a>
                        ) : (
                            <div className="text-sm text-[var(--neutral-graphite)] flex items-center gap-1.5">
                                {cliente.cidade}, {cliente.uf}
                            </div>
                        )}
                        <div className="text-xs text-gray-500 mt-0.5">
                            {cliente.endereco}, {cliente.numero}
                        </div>
                    </>
                );
            }
        },
        {
            header: 'Região',
            accessor: 'regiao' as keyof Cliente,
            render: (cliente: Cliente) => {
                const regionName = cliente.regiao?.nome_regiao || cliente.regiao?.nome;
                return regionName ? (
                    <span className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-medium bg-[var(--secondary-yellow)]/20 text-[var(--dark-navy)] border border-[var(--secondary-yellow)]/30">
                        {regionName}
                    </span>
                ) : null;
            }
        },
        {
            header: 'Status',
            accessor: 'situacao' as keyof Cliente,
            render: (cliente: Cliente) => (
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
            accessor: 'contatos' as keyof Cliente,
            render: (cliente: Cliente) => {
                const contatosCount = cliente.qtd_contatos || (cliente.contatos ? cliente.contatos.length : 0);
                const hasContatos = contatosCount > 0;

                // Determine client ID consistently
                const clientId = cliente.id_cliente !== undefined ? cliente.id_cliente : cliente.id;

                return (
                    <button
                        className={`px-2 py-1.5 border border-gray-100 rounded-lg text-xs font-medium flex items-center gap-2 transition-colors ${hasContatos
                            ? "bg-[var(--neutral-light-gray)] text-[var(--neutral-graphite)] hover:bg-[var(--neutral-light-gray)]/80 cursor-pointer"
                            : "bg-gray-50 text-gray-400 cursor-not-allowed"
                            }`}
                        onClick={(e) => {
                            e.stopPropagation();
                            if (hasContatos) {
                                console.log('Clicking contact button for client ID:', clientId);
                                toggleExpand(clientId || 0);
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
                                {expandedClienteId === clientId ? "▲" : "▼"}
                            </span>
                        )}
                    </button>
                );
            }
        }
    ];

    // Componente personalizado para renderizar as ações para cada item
    const renderActions = (cliente: Cliente) => {
        // Determine client ID consistently
        const clientId = cliente.id_cliente !== undefined ? cliente.id_cliente : cliente.id;

        // Check if location needs to be defined
        // Handle all cases: undefined, null, 0, "0", or empty string
        const needsLocationDefinition =
            cliente.latitude === undefined ||
            cliente.latitude === null ||
            cliente.latitude === 0 ||
            String(cliente.latitude) === "0" ||
            String(cliente.latitude) === "";

        return (
            <div className="flex items-center gap-2">
                {needsLocationDefinition && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            openLocationModal(cliente);
                        }}
                        className="inline-flex items-center px-3 py-1.5 bg-[var(--secondary-green)]/20 hover:bg-[var(--secondary-green)]/40 text-[var(--dark-navy)] rounded-lg transition-colors gap-1.5 cursor-pointer"
                        title="Definir localização geográfica"
                    >
                        <MapPin size={16} />
                    </button>
                )}
                <ActionButton
                    href={`/admin/cadastro/clientes/editar/${clientId}`}
                    icon={<Edit2 size={16} />}
                    label=""
                    variant="secondary"
                />
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`Deseja realmente excluir o cliente "${cliente.nome_fantasia || cliente.razao_social}"?`)) {
                            alert('Funcionalidade de exclusão será implementada em breve.');
                        }
                    }}
                    className="inline-flex items-center p-1.5 text-red-500 rounded transition-colors hover:bg-red-50 cursor-pointer"
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
        );
    };

    // Function to render expanded contacts
    const renderExpandedRow = (cliente: Cliente) => {
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
    };

    // Count active filters for the UI
    const activeFiltersCount = Object.values(filtros).filter(Boolean).length;

    // Create a custom header component to support the filter toggle
    const customHeader = (
        <ListHeader
            title="Lista de Clientes"
            itemCount={clientesFiltrados?.length || 0}
            onFilterToggle={() => setShowFilters(!showFilters)}
            showFilters={showFilters}
            newButtonLink="/admin/cadastro/clientes/novo"
            newButtonLabel="Novo Cliente"
            activeFiltersCount={activeFiltersCount}
        />
    );

    return (
        <ListContainer>
            {customHeader}

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
                />
            )}

            <div className="relative min-h-[300px]">
                {loading && (
                    <div className="absolute inset-0 bg-white/70 z-10 flex items-center justify-center">
                        <Loading text="Carregando clientes..." size="medium" />
                    </div>
                )}
                <DataTable
                    columns={[
                        ...columns,
                        {
                            header: 'Ações',
                            accessor: (cliente: Cliente) => renderActions(cliente)
                        }
                    ]}
                    data={clientesFiltrados || []}
                    keyField={clientesFiltrados?.[0]?.id_cliente !== undefined ? 'id_cliente' as keyof Cliente : 'id' as keyof Cliente}
                    expandedRowId={expandedClienteId}
                    onRowExpand={toggleExpand}
                    emptyStateProps={{
                        title: loading ? "" : "Nenhum cliente encontrado",
                        description: loading ? "" : "Tente ajustar seus filtros ou cadastre um novo cliente."
                    }}
                    renderExpandedRow={renderExpandedRow}
                />
            </div>

            {paginacao.totalPaginas > 1 && (
                <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6 mt-4 rounded-lg shadow-sm relative">
                    {loading && (
                        <div className="absolute inset-0 bg-white/70 z-10 flex items-center justify-center rounded-lg">
                            {/* Não precisa de texto aqui, já que o indicador principal está na tabela */}
                        </div>
                    )}
                    <div className="flex flex-1 justify-between sm:hidden">
                        <button
                            onClick={() => mudarPagina(paginacao.paginaAtual - 1)}
                            disabled={paginacao.paginaAtual === 1 || loading}
                            className={`relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium ${(paginacao.paginaAtual === 1 || loading)
                                ? 'text-gray-300 cursor-not-allowed'
                                : 'text-gray-700 hover:bg-gray-50'
                                }`}
                        >
                            Anterior
                        </button>
                        <button
                            onClick={() => mudarPagina(paginacao.paginaAtual + 1)}
                            disabled={paginacao.paginaAtual === paginacao.totalPaginas || loading}
                            className={`relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium ${(paginacao.paginaAtual === paginacao.totalPaginas || loading)
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

                                        setPaginacao(prev => {
                                            const novaPaginacao = {
                                                ...prev,
                                                registrosPorPagina: novoValor,
                                                paginaAtual: 1
                                            };

                                            // Garantir que a paginação foi atualizada
                                            // antes de disparar nova busca
                                            setTimeout(() => {
                                                setFiltroAplicado(prev => prev + 1);
                                            }, 100);

                                            return novaPaginacao;
                                        });
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
                                    disabled={paginacao.paginaAtual === 1 || loading}
                                    className={`relative inline-flex items-center rounded-l-md px-2 py-2 ${(paginacao.paginaAtual === 1 || loading)
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
                                            disabled={loading}
                                            aria-current={paginacao.paginaAtual === pageNum ? 'page' : undefined}
                                            className={`relative z-10 inline-flex items-center px-4 py-2 text-sm font-semibold ${loading ? 'cursor-not-allowed' : 'cursor-pointer'} ${paginacao.paginaAtual === pageNum
                                                ? 'bg-[var(--primary)] text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]'
                                                : loading
                                                    ? 'text-gray-400 ring-1 ring-inset ring-gray-300'
                                                    : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0'
                                                }`}
                                        >
                                            {pageNum}
                                        </button>
                                    );
                                })}

                                <button
                                    onClick={() => mudarPagina(paginacao.paginaAtual + 1)}
                                    disabled={paginacao.paginaAtual === paginacao.totalPaginas || loading}
                                    className={`relative inline-flex items-center rounded-r-md px-2 py-2 ${(paginacao.paginaAtual === paginacao.totalPaginas || loading)
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

            {/* Location Modal */}
            {selectedCliente && (
                <LocationPicker
                    isOpen={showLocationModal}
                    onClose={() => setShowLocationModal(false)}
                    initialLat={selectedCliente.latitude || null}
                    initialLng={selectedCliente.longitude || null}
                    address={`${selectedCliente.endereco}, ${selectedCliente.numero}, ${selectedCliente.cidade}, ${selectedCliente.uf}, ${selectedCliente.cep || ''}`}
                    onLocationSelected={saveClienteLocation}
                />
            )}
        </ListContainer>
    );
};

export default CadastroCliente;