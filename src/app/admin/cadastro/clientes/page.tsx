
'use client'
import { Loading } from '@/components/loading';
import type { Cliente as ClienteBase } from '@/types/admin/cadastro/clientes';
import { Edit2, MapPin, Plus, User } from 'lucide-react';
import { useEffect, useState } from 'react';

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
    const [expandedClienteId, setExpandedClienteId] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        carregarClientes();
    }, []);

    const carregarClientes = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('Token não encontrado');
            }

            const response = await fetch('http://localhost:8080/clientes', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Token': `${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Erro ao buscar clientes');
            }

            const dados: Cliente[] = await response.json();
            setClientes(dados);
        } catch (error) {
            console.error('Erro ao carregar clientes:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatCNPJ = (cnpj: string) => {
        if (!cnpj) return '';
        return cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
    };

    if (loading) {
        return (
            <Loading
                fullScreen
                text="Carregando clientes..."
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
                            Lista de Clientes
                            <span className="ml-2 bg-[var(--primary)]/10 text-[var(--primary)] text-sm px-3 py-0.5 rounded-full font-medium">{clientes.length}</span>
                        </h2>
                        <a
                            href="/admin/cadastro/clientes/novo"
                            className="bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-white px-5 py-2.5 rounded-lg flex items-center gap-2 transition-all shadow-sm hover:shadow transform hover:-translate-y-0.5"
                        >
                            <Plus size={18} />
                            Novo Cliente
                        </a>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-[var(--neutral-light-gray)] border-b border-gray-100">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-[var(--dark-navy)] uppercase tracking-wider">Cliente</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-[var(--dark-navy)] uppercase tracking-wider">CNPJ</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-[var(--dark-navy)] uppercase tracking-wider">Localização</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-[var(--dark-navy)] uppercase tracking-wider">Região</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-[var(--dark-navy)] uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-[var(--dark-navy)] uppercase tracking-wider">Contatos</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-[var(--dark-navy)] uppercase tracking-wider">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-100">
                                {clientes.map((cliente: Cliente) => (
                                    <>
                                        <tr key={cliente.id_cliente || cliente.id} className="hover:bg-[var(--primary)]/5 transition-colors duration-150">

                                            <td className="px-6 py-4.5 whitespace-nowrap">
                                                <div>
                                                    <div className="text-sm font-semibold text-gray-900">{cliente.nome_fantasia || cliente.nome}</div>
                                                    <div className="text-xs text-gray-500 mt-0.5">{cliente.razao_social}</div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4.5 whitespace-nowrap text-sm font-medium text-gray-700">{formatCNPJ(cliente.cnpj)}</td>
                                            <td className="px-6 py-4.5 whitespace-nowrap">
                                                <div className="text-sm text-[var(--neutral-graphite)] flex items-center gap-1.5">
                                                    <MapPin size={16} className="text-[var(--primary)]" />
                                                    {cliente.cidade}, {cliente.uf}
                                                </div>
                                                <div className="text-xs text-gray-500 mt-0.5">{cliente.endereco || cliente.logradouro}, {cliente.numero}</div>
                                            </td>
                                            <td className="px-6 py-4.5 whitespace-nowrap">
                                                <span className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-medium bg-[var(--secondary-yellow)]/20 text-[var(--dark-navy)] border border-[var(--secondary-yellow)]/30">{cliente.regiao?.nome_regiao}</span>
                                            </td>
                                            <td className="px-6 py-4.5 whitespace-nowrap">
                                                <span className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-medium ${cliente.situacao === 'A'
                                                    ? 'bg-[var(--secondary-green)]/20 text-[var(--dark-navy)] border border-[var(--secondary-green)]/30'
                                                    : 'bg-red-50 text-red-700 border border-red-100'
                                                    }`}>{cliente.situacao === 'A' ? 'Ativo' : 'Inativo'}</span>
                                            </td>
                                            <td className="px-6 py-4.5 whitespace-nowrap">
                                                <button
                                                    className="px-2 py-1.5 bg-[var(--neutral-light-gray)] border border-gray-100 rounded-lg text-xs font-medium text-[var(--neutral-graphite)] hover:bg-[var(--neutral-light-gray)]/80 flex items-center gap-2 transition-colors"
                                                    onClick={() =>
                                                        setExpandedClienteId(
                                                            expandedClienteId === (cliente.id_cliente || cliente.id)
                                                                ? null
                                                                : (cliente.id_cliente || cliente.id)
                                                        )
                                                    }
                                                >
                                                    <User size={16} className="text-[var(--neutral-graphite)]" />
                                                    ({cliente.qtd_contatos || (cliente.contatos ? cliente.contatos.length : 0)})
                                                    <span className="text-[var(--primary)]">
                                                        {expandedClienteId === (cliente.id_cliente || cliente.id) ? "▲" : "▼"}
                                                    </span>
                                                </button>
                                            </td>
                                            <td className="px-6 py-4.5 whitespace-nowrap text-sm font-medium">
                                                <a
                                                    href={`/admin/cadastro/clientes/editar/${cliente.id_cliente || cliente.id}`}
                                                    className="inline-flex items-center px-3 py-1.5 bg-[var(--primary)]/10 hover:bg-[var(--primary)]/20 text-[var(--primary)] rounded-lg transition-colors gap-1.5"
                                                >
                                                    <Edit2 size={14} />
                                                    Editar
                                                </a>
                                            </td>
                                        </tr>
                                        {expandedClienteId === (cliente.id_cliente || cliente.id) && cliente.contatos && (
                                            <tr>
                                                <td colSpan={7} className="px-6 pb-5 pt-2 bg-[var(--primary)]/5">
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

                                                                    {/* OS notification indicator moved to the header */}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CadastroCliente;