'use client'
import { Loading } from '@/components/loading';
import type { MotivoPendencia } from '@/types/admin/cadastro/motivos_pendencia';
import { Edit2, Plus } from 'lucide-react';
import { useEffect, useState } from 'react';

const CadastroMotivosPendencia = () => {
    const [motivos, setMotivos] = useState<MotivoPendencia[]>([]);
    const [loading, setLoading] = useState(true);

    // Primeiro carrega da API
    useEffect(() => {
        carregarMotivos();
    }, []);



    const carregarMotivos = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('Token não encontrado');
            }

            const response = await fetch('http://localhost:8080/motivos_pendencia_os?incluir_inativos=S', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Token': `${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Erro ao buscar motivos de pendência');
            }

            let dados: MotivoPendencia[] = await response.json();

            // Verificar se os dados são um array. Se não for, criar um array a partir dos dados
            if (!Array.isArray(dados)) {
                console.warn('Resposta da API não é um array, convertendo...', dados);
                if (typeof dados === 'object' && dados !== null) {
                    dados = Object.values(dados);
                } else {
                    dados = [];
                }
            }

            setMotivos(dados);
        } catch (error) {
            console.error('Erro ao carregar motivos de pendência:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <Loading
                fullScreen={true}
                preventScroll={false}
                text="Carregando motivos de pendência..."
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
                            Motivos de Pendência
                            <span className="ml-2 bg-[var(--primary)]/10 text-[var(--primary)] text-sm px-3 py-0.5 rounded-full font-medium">{motivos.length}</span>
                        </h2>
                        <a
                            href="/admin/cadastro/motivos_pendencia/novo"
                            className="bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-white px-5 py-2.5 rounded-lg flex items-center gap-2 transition-all shadow-sm hover:shadow transform hover:-translate-y-0.5"
                        >
                            <Plus size={18} />
                            Novo Motivo
                        </a>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-[var(--neutral-light-gray)] border-b border-gray-100">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-[var(--dark-navy)] uppercase tracking-wider">Descrição</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-[var(--dark-navy)] uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-[var(--dark-navy)] uppercase tracking-wider">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-100">
                                {motivos.map((motivo) => (
                                    <tr key={motivo.id} className="hover:bg-[var(--primary)]/5 transition-colors duration-150">
                                        <td className="px-6 py-4.5 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">
                                                {typeof motivo.descricao === 'string' ? motivo.descricao : JSON.stringify(motivo.descricao)}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4.5 whitespace-nowrap">
                                            <span className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-medium ${motivo.situacao === 'A' || motivo.situacao === 'a'
                                                ? 'bg-[var(--secondary-green)]/20 text-[var(--dark-navy)] border border-[var(--secondary-green)]/30'
                                                : 'bg-red-50 text-red-700 border border-red-100'
                                                }`}>
                                                {motivo.situacao === 'A' || motivo.situacao === 'a' ? 'Ativo' : 'Inativo'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4.5 whitespace-nowrap text-sm font-medium">
                                            <a
                                                href={`/admin/cadastro/motivos_pendencia/editar/${motivo.id}`}
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
            </div>
        </div>
    );
};

export default CadastroMotivosPendencia;
