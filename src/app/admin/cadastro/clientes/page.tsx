
'use client'
import { clientesAPI } from '@/api/api';
import {
    DataTable,
    FilterPanel,
    ListContainer,
    ListHeader,
    StatusBadge
} from '@/components/admin/common';
import { Loading } from '@/components/loading';
import type { Cliente as ClienteBase } from '@/types/admin/cadastro/clientes';
import { Edit2, MapPin, User } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

// Extend the base Cliente interface to include additional properties used in this component
interface Cliente extends ClienteBase {
    id_cliente?: number;
    nome_fantasia?: string;
    endereco?: string;
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
    const [clientes, setClientes] = useState<Cliente[]>([]);
    const [clientesFiltrados, setClientesFiltrados] = useState<Cliente[]>([]);
    const [expandedClienteId, setExpandedClienteId] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [showFilters, setShowFilters] = useState(false);
    const [filtros, setFiltros] = useState({
        texto: '',
        status: ''
    });

    // Memoize handlers for better performance
    const toggleExpand = useCallback((id: number | string) => {
        setExpandedClienteId(prevId => {
            const result = prevId === id ? null : Number(id);
            return result;
        });
    }, []);

    // Memoize filter function for performance
    const aplicarFiltros = useCallback(() => {
        // Use a single pass to filter data for better performance
        const filteredClientes = clientes.filter(cliente => {
            // Apply text filter if exists
            if (filtros.texto) {
                const textoLowerCase = filtros.texto.toLowerCase();
                const matchesText = (
                    (cliente.nome_fantasia?.toLowerCase() || '').includes(textoLowerCase) ||
                    (cliente.nome?.toLowerCase() || '').includes(textoLowerCase) ||
                    (cliente.razao_social?.toLowerCase() || '').includes(textoLowerCase) ||
                    (cliente.cnpj || '').includes(filtros.texto)
                );

                if (!matchesText) return false;
            }

            // Apply status filter if exists
            if (filtros.status && cliente.situacao !== filtros.status) {
                return false;
            }

            // If we got here, all filters passed
            return true;
        });

        setClientesFiltrados(filteredClientes);
    }, [clientes, filtros]);

    const carregarClientes = useCallback(async () => {
        setLoading(true);
        try {
            const dados: Cliente[] = await clientesAPI.getAll();
            setClientes(dados);
            setClientesFiltrados(dados);
        } catch (error) {
            console.error('Erro ao carregar clientes:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        const handler = setTimeout(() => {
            aplicarFiltros();
        }, 300); 

        return () => {
            clearTimeout(handler);
        };
    }, [aplicarFiltros]);

    useEffect(() => {
        carregarClientes();
    }, [carregarClientes]);

    const handleFiltroChange = useCallback((campo: string, valor: string) => {
        setFiltros(prev => ({
            ...prev,
            [campo]: valor
        }));
    }, []);

    const limparFiltros = useCallback(() => {
        setFiltros({
            texto: '',
            status: ''
        });
    }, []);

    const formatCNPJ = useCallback((cnpj: string) => {
        if (!cnpj) return '';
        return cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
    }, []);

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

    // Define the filter options for the filter panel
    const filterOptions = [
        {
            id: 'texto',
            label: 'Busca Textual',
            type: 'text' as const,
            placeholder: 'Digite o nome, razão social ou CNPJ...'
        },
        {
            id: 'status',
            label: 'Status do Cliente',
            type: 'select' as const,
            options: [
                { value: '', label: 'Todos os status' },
                { value: 'A', label: 'Ativo' },
                { value: 'I', label: 'Inativo' }
            ]
        }
    ];

    // Define table columns
    const columns = [
        {
            header: 'Cliente',
            accessor: (cliente: Cliente) => (
                <div>
                    <div className="text-sm font-semibold text-gray-900">{cliente.nome_fantasia || cliente.nome}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{cliente.razao_social}</div>
                </div>
            )
        },
        {
            header: 'CNPJ',
            accessor: (cliente: Cliente) => (
                <span className="text-md text-gray-500">{formatCNPJ(cliente.cnpj)}</span>
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
                        {cliente.endereco || cliente.logradouro}, {cliente.numero}
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
            accessor: (cliente: Cliente) => (
                <button
                    className="px-2 py-1.5 bg-[var(--neutral-light-gray)] border border-gray-100 rounded-lg text-xs font-medium text-[var(--neutral-graphite)] hover:bg-[var(--neutral-light-gray)]/80 flex items-center gap-2 transition-colors"
                    onClick={(e) => {
                        e.stopPropagation(); 
                        toggleExpand(cliente.id_cliente || cliente.id);
                    }}
                    type="button"
                >
                    <User size={16} className="text-[var(--neutral-graphite)]" />
                    <span className="text-[var(--primary)]">
                        ({cliente.qtd_contatos || (cliente.contatos ? cliente.contatos.length : 0)})
                    </span>
                    <span className="text-[var(--primary)]">
                        {expandedClienteId === (cliente.id_cliente || cliente.id) ? "▲" : "▼"}
                    </span>
                </button>
            )
        },
        {
            header: 'Ações',
            accessor: (cliente: Cliente) => (
                <a
                    href={`/admin/cadastro/clientes/editar/${cliente.id_cliente || cliente.id}`}
                    className="inline-flex items-center px-3 py-1.5 bg-[var(--primary)]/10 hover:bg-[var(--primary)]/20 text-[var(--primary)] rounded-lg transition-colors gap-1.5"
                >
                    <Edit2 size={14} />
                    Editar
                </a>
            )
        }
    ];

    // Calculate active filters count
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
                    filterOptions={filterOptions}
                    filterValues={filtros}
                    onFilterChange={handleFiltroChange}
                    onClearFilters={limparFiltros}
                    onClose={() => setShowFilters(false)}
                    itemCount={clientesFiltrados.length}
                    totalCount={clientes.length}
                />
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
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 py-2">
                                            <div className="text-sm text-gray-700 flex items-center gap-2">
                                                <svg className="w-4 h-4 text-[var(--primary)] flex-shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                                                </svg>
                                                <span className="truncate">{contato.telefone}</span>
                                            </div>

                                            {contato.whatsapp && (
                                                <a
                                                    href={`https://wa.me/${contato.whatsapp.replace(/\D/g, '')}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-sm text-[var(--neutral-graphite)] flex items-center gap-2 hover:text-[var(--secondary-green)] transition-colors"
                                                >
                                                    <svg className="w-4 h-4 text-[var(--secondary-green)] flex-shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
                                                    </svg>
                                                    <span className="truncate">{contato.whatsapp}</span>
                                                </a>
                                            )}

                                            <a
                                                href={`mailto:${contato.email}`}
                                                className="text-sm text-gray-700 flex items-center gap-2 hover:text-blue-600 transition-colors col-span-full"
                                            >
                                                <svg className="w-4 h-4 text-gray-500 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                                                    <polyline points="22,6 12,13 2,6"></polyline>
                                                </svg>
                                                <span className="truncate">{contato.email}</span>
                                            </a>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                }}
            />
        </ListContainer>
    );
};

export default CadastroCliente;