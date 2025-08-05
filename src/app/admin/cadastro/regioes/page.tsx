'use client'
import { regioesAPI } from '@/api/api';
import { Loading } from '@/components/Loading';
import { useTitle } from '@/context/TitleContext';
import type { Regiao } from '@/types/admin/cadastro/regioes';
import { Edit2, MapPin, Plus } from 'lucide-react';
import { useEffect, useState } from 'react';

const CadastroRegioes = () => {
    const { setTitle } = useTitle();
    const [regioes, setRegioes] = useState<Regiao[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        carregarRegioes();
    }, []);

    // Configurar o título da página
    useEffect(() => {
        setTitle('Regiões');
    }, [setTitle]);

    const carregarRegioes = async () => {
        setLoading(true);
        try {
            const dados: Regiao[] = await regioesAPI.getAllWithInactive();
            setRegioes(dados);
        } catch (error) {
            console.error('Erro ao carregar regiões:', error);
        } finally {
            setLoading(false);
        }
    };

    // If you need to add any additional functions for the regions list, add them here

    if (loading) {
        return (
            <Loading
                fullScreen={true}
                preventScroll={false}
                text="Carregando regiões..."
                size="large"
            />
        );
    }

    return (
        <div className="bg-[#F9F7F7] p-1 ">
            <div className="max-w-8xl mx-auto ">
                <div className="bg-[var(--neutral-white)] rounded-xl shadow-md overflow-hidden border border-gray-100">
                    <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-gradient-to-r from-[var(--neutral-white)] to-[var(--secondary-green)]/10">
                        <h2 className="text-xl font-bold text-[var(--neutral-graphite)] flex items-center">
                            <span className="bg-[var(--primary)] h-6 w-1 rounded-full mr-3"></span>
                            Lista de Regiões
                            <span className="ml-2 bg-[var(--primary)]/10 text-[var(--primary)] text-sm px-3 py-0.5 rounded-full font-medium">{regioes.length}</span>
                        </h2>
                        <a
                            href="/admin/cadastro/regioes/novo"
                            className="bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-white px-5 py-2.5 rounded-lg flex items-center gap-2 transition-all shadow-sm hover:shadow transform hover:-translate-y-0.5"
                        >
                            <Plus size={18} />
                            Nova Região
                        </a>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-[var(--neutral-light-gray)] border-b border-gray-100">
                                <tr>
                                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-[var(--dark-navy)] uppercase tracking-wider">Nome da Região</th>
                                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-[var(--dark-navy)] uppercase tracking-wider">Descrição</th>
                                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-[var(--dark-navy)] uppercase tracking-wider">UF</th>
                                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-[var(--dark-navy)] uppercase tracking-wider">Atendida</th>
                                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-[var(--dark-navy)] uppercase tracking-wider">Situação</th>
                                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-[var(--dark-navy)] uppercase tracking-wider">Data Cadastro</th>
                                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-[var(--dark-navy)] uppercase tracking-wider">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-100">
                                {regioes.length > 0 ? (
                                    regioes.map((regiao: Regiao) => (
                                        <tr key={regiao.id} className="hover:bg-[var(--primary)]/5 transition-colors duration-150 group">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900 flex items-center gap-2.5">
                                                    {regiao.nome}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap max-w-[200px]">
                                                <span className="text-sm text-gray-600 line-clamp-1" title={regiao.descricao}>
                                                    {regiao.descricao || '-'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-[var(--secondary-yellow)]/10 text-[var(--dark-navy)] border border-[var(--secondary-yellow)]/20">
                                                    {regiao.uf}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium ${regiao.atendida_empresa
                                                    ? 'bg-[var(--secondary-green)]/10 text-green-800 border border-green-200'
                                                    : 'bg-red-50 text-red-700 border border-red-100'
                                                    }`}>
                                                    {regiao.atendida_empresa ? 'Sim' : 'Não'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium ${regiao.situacao === 'A'
                                                    ? 'bg-[var(--secondary-green)]/10 text-green-800 border border-green-200'
                                                    : 'bg-red-50 text-red-700 border border-red-100'
                                                    }`}>
                                                    {regiao.situacao === 'A' ? 'Ativo' : 'Inativo'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="text-xs text-gray-500">
                                                    {regiao.data_cadastro ? regiao.data_cadastro.replace(/:\d{2}$/, '') : '-'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right">
                                                <a
                                                    href={`/admin/cadastro/regioes/editar/${regiao.id}`}
                                                    className="inline-flex items-center px-2.5 py-1.5 bg-[var(--primary)]/5 hover:bg-[var(--primary)]/15 text-[var(--primary)] rounded-md transition-colors gap-1.5 opacity-90 hover:opacity-100"
                                                >
                                                    <Edit2 size={14} />
                                                    <span className="font-medium text-xs">Editar</span>
                                                </a>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-16 text-center text-gray-500">
                                            <div className="flex flex-col items-center justify-center">
                                                <div className="bg-[var(--primary)]/5 p-5 rounded-full inline-flex mb-5 shadow-inner">
                                                    <MapPin size={36} className="text-[var(--primary)]" />
                                                </div>
                                                <p className="text-lg text-gray-700 font-medium">Nenhuma região cadastrada</p>
                                                <p className="text-sm text-gray-500 mt-2 mb-5 max-w-md">
                                                    Você ainda não possui regiões cadastradas no sistema.
                                                </p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div >
    );
};

export default CadastroRegioes;
