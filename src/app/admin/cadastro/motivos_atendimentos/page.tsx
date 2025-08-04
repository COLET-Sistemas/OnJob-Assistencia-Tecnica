'use client'
import { motivosAtendimentoAPI } from '@/api/api';
import { Loading } from '@/components/loading';
import type { MotivoAtendimento } from '@/types/admin/cadastro/motivos_atendimento';
import { Edit2, Plus } from 'lucide-react';
import { useEffect, useState } from 'react';

const CadastroMotivosAtendimento = () => {
    const [motivosAtendimento, setMotivosAtendimento] = useState<MotivoAtendimento[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        carregarMotivosAtendimento();
    }, []);

    const carregarMotivosAtendimento = async () => {
        setLoading(true);
        try {
            const dados: MotivoAtendimento[] = await motivosAtendimentoAPI.getAll();
            setMotivosAtendimento(dados);
        } catch (error) {
            console.error('Erro ao carregar motivos de atendimento:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <Loading
                fullScreen={true}
                preventScroll={false}
                text="Carregando motivos de atendimento..."
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
                            Motivos de Atendimento
                            <span className="ml-2 bg-[var(--primary)]/10 text-[var(--primary)] text-sm px-3 py-0.5 rounded-full font-medium">{motivosAtendimento.length}</span>
                        </h2>
                        <a
                            href="/admin/cadastro/motivos_atendimentos/novo"
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
                                {motivosAtendimento.map((motivo: MotivoAtendimento) => (
                                    <tr key={motivo.id} className="hover:bg-[var(--primary)]/5 transition-colors duration-150">
                                        <td className="px-6 py-4.5 whitespace-nowrap">
                                            <div className="text-sm font-semibold text-gray-900">{motivo.descricao}</div>
                                        </td>
                                        <td className="px-6 py-4.5 whitespace-nowrap">
                                            <span className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-medium ${motivo.situacao === 'A'
                                                ? 'bg-[var(--secondary-green)]/20 text-[var(--dark-navy)] border border-[var(--secondary-green)]/30'
                                                : 'bg-red-50 text-red-700 border border-red-100'
                                                }`}>{motivo.situacao === 'A' ? 'Ativo' : 'Inativo'}</span>
                                        </td>
                                        <td className="px-6 py-4.5 whitespace-nowrap text-sm font-medium">
                                            <a
                                                href={`/admin/cadastro/motivos_atendimentos/editar/${motivo.id}`}
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

export default CadastroMotivosAtendimento;