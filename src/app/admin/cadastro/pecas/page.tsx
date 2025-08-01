'use client'
import { Loading } from '@/components/loading';
import type { Peca } from '@/types/admin/cadastro/pecas';
import { Edit2, Package, Plus } from 'lucide-react';
import { useEffect, useState } from 'react';

const CadastroPecas = () => {
    const [pecas, setPecas] = useState<Peca[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        carregarPecas();
    }, []);

    const carregarPecas = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('Token não encontrado');
            }

            const response = await fetch('http://localhost:8080/pecas?incluir_inativos=S', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Token': `${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Erro ao buscar peças');
            }

            const dados: Peca[] = await response.json();
            setPecas(dados);
        } catch (error) {
            console.error('Erro ao carregar peças:', error);
            // Para teste, adicionando dados de exemplo
            setPecas([
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
            ]);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <Loading
                fullScreen
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
                                            <div className="text-sm font-semibold text-gray-900 flex items-center gap-2">
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
                </div>
            </div>
        </div>
    );
}

export default CadastroPecas;
