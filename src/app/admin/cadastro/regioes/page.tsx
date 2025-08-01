'use client'
import { Loading } from '@/components/loading';
import type { FormData, Regiao } from '@/types/admin/cadastro/regioes';
import { Edit2, MapPin, Plus, X } from 'lucide-react';
import { useEffect, useState } from 'react';

const CadastroRegioes = () => {
    const [regioes, setRegioes] = useState<Regiao[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [regiaoEditando, setRegiaoEditando] = useState<Regiao | null>(null);

    const [formData, setFormData] = useState<FormData>({
        nome_regiao: '',
        situacao: 'A'
    });

    useEffect(() => {
        carregarRegioes();
    }, []);

    const carregarRegioes = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('Token não encontrado');
            }

            const response = await fetch('http://localhost:8080/regioes?incluir_inativos=S', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Token': `${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Erro ao buscar regiões');
            }

            const dados: Regiao[] = await response.json();
            setRegioes(dados);
        } catch (error) {
            console.error('Erro ao carregar regiões:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const token = localStorage.getItem('token');

        if (!token) {
            alert('Sessão expirada! Por favor, faça login novamente.');
            return;
        }

        try {
            if (regiaoEditando) {
                // Em uma implementação completa, aqui seria feito o PUT para a API
                // const response = await fetch(`http://10.0.0.154:8080/regioes/${regiaoEditando.id_regiao}`, {
                //     method: 'PUT',
                //     headers: {
                //         'Content-Type': 'application/json',
                //         'X-Token': token
                //     },
                //     body: JSON.stringify(formData)
                // });

                // if (!response.ok) throw new Error('Falha ao atualizar região');

                // Atualizando localmente (simulação)
                const regioesAtualizadas = regioes.map(regiao =>
                    regiao.id_regiao === regiaoEditando.id_regiao
                        ? {
                            ...regiao,
                            nome_regiao: formData.nome_regiao,
                            situacao: formData.situacao
                        }
                        : regiao
                );
                setRegioes(regioesAtualizadas);
                alert('Região atualizada com sucesso!');
            } else {
                // Em uma implementação completa, aqui seria feito o POST para a API
                // const response = await fetch('http://10.0.0.154:8080/regioes', {
                //     method: 'POST',
                //     headers: {
                //         'Content-Type': 'application/json',
                //         'X-Token': token
                //     },
                //     body: JSON.stringify(formData)
                // });

                // if (!response.ok) throw new Error('Falha ao criar região');
                // const dadosNovos = await response.json();

                // Criando localmente (simulação)
                const novaRegiao: Regiao = {
                    id_regiao: regioes.length + 1,
                    nome_regiao: formData.nome_regiao,
                    situacao: formData.situacao
                };
                setRegioes([...regioes, novaRegiao]);
                alert('Região cadastrada com sucesso!');
            }

            fecharModal();
        } catch (error) {
            console.error('Erro ao salvar região:', error);
            alert('Erro ao salvar região. Por favor, tente novamente.');
        }
    };

    const abrirModal = (regiao: Regiao | null = null) => {
        if (regiao) {
            setRegiaoEditando(regiao);
            setFormData({
                nome_regiao: regiao.nome_regiao,
                situacao: regiao.situacao
            });
        } else {
            setRegiaoEditando(null);
            setFormData({
                nome_regiao: '',
                situacao: 'A'
            });
        }
        setIsModalOpen(true);
    };

    const fecharModal = () => {
        setIsModalOpen(false);
        setRegiaoEditando(null);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData((prev: FormData) => ({
            ...prev,
            [name]: value
        }));
    };

    if (loading) {
        return (
            <Loading
                fullScreen
                text="Carregando regiões..."
                size="large"
            />
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 p-4 pt-6">
            <div className="max-w-7xl mx-auto">
                <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border border-gray-100 transition-all hover:shadow-xl">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                                <span className="bg-blue-100 p-2 rounded-lg inline-flex">
                                    <MapPin size={24} className="text-blue-600" />
                                </span>
                                Cadastro de Regiões
                            </h1>
                            <p className="text-gray-600 mt-2">Gerencie as regiões de atendimento no sistema</p>
                        </div>
                        <button
                            onClick={() => abrirModal()}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg flex items-center gap-2 transition-all duration-200 font-medium shadow-md hover:scale-105 w-full sm:w-auto justify-center sm:justify-start"
                        >
                            <Plus size={18} />
                            Nova Região
                        </button>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100 backdrop-blur-lg transition-all hover:shadow-xl">
                    <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-2">
                        <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                            <span className="bg-blue-50 p-1.5 rounded-md inline-flex">
                                <MapPin size={18} className="text-blue-600" />
                            </span>
                            Lista de Regiões
                            <span className="ml-2 bg-blue-100 text-blue-800 px-2.5 py-0.5 rounded-full text-sm font-medium">
                                {regioes.length}
                            </span>
                        </h2>
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                            <div className="relative text-gray-400 focus-within:text-gray-600 w-full sm:w-auto">
                                <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                </span>
                                <input
                                    type="search"
                                    placeholder="Buscar região..."
                                    className="w-full py-2.5 pl-10 pr-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm shadow-sm transition-all"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-blue-700 uppercase tracking-wider">Nome da Região</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-blue-700 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-blue-700 uppercase tracking-wider">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-100">
                                {regioes.length > 0 ? (
                                    regioes.map((regiao: Regiao) => (
                                        <tr key={regiao.id_regiao} className="hover:bg-blue-50 transition-all duration-150 group">
                                            <td className="px-6 py-5 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-800 flex items-center gap-2.5">
                                                    <div className="bg-blue-50 p-1.5 rounded-md inline-flex group-hover:bg-blue-100 transition-colors">
                                                        <MapPin size={16} className="text-blue-600" />
                                                    </div>
                                                    {regiao.nome_regiao}
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 whitespace-nowrap">
                                                <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium transition-all ${regiao.situacao === 'A'
                                                    ? 'bg-green-100 text-green-800 border border-green-200 group-hover:bg-green-200'
                                                    : 'bg-red-100 text-red-800 border border-red-200 group-hover:bg-red-200'
                                                    }`}>
                                                    {regiao.situacao === 'A' ? 'Ativo' : 'Inativo'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-5 whitespace-nowrap text-sm font-medium">
                                                <div className="flex items-center gap-3">
                                                    <button
                                                        onClick={() => abrirModal(regiao)}
                                                        className="text-blue-600 hover:text-blue-900 flex items-center gap-2 hover:bg-blue-50 px-4 py-1.5 rounded-lg transition-all duration-200 border border-transparent hover:border-blue-200 shadow-sm hover:shadow"
                                                    >
                                                        <Edit2 size={15} />
                                                        Editar
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={3} className="px-6 py-12 text-center text-gray-500">
                                            <div className="flex flex-col items-center justify-center">
                                                <div className="bg-blue-50 p-4 rounded-full inline-flex mb-4 shadow-inner">
                                                    <MapPin size={32} className="text-blue-600" />
                                                </div>
                                                <p className="text-base text-gray-600 font-medium">Nenhuma região cadastrada</p>
                                                <p className="text-sm text-gray-500 mt-1 mb-4">Clique no botão abaixo para adicionar sua primeira região</p>
                                                <button
                                                    onClick={() => abrirModal()}
                                                    className="mt-2 bg-blue-50 text-blue-700 hover:bg-blue-100 px-5 py-2 rounded-lg font-medium flex items-center gap-2 transition-all duration-200 hover:scale-105 border border-blue-200"
                                                >
                                                    <Plus size={18} />
                                                    Adicionar região
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    {regioes.length > 0 && (
                        <div className="px-6 py-4 border-t border-gray-100 bg-gradient-to-r from-gray-50 to-white text-sm text-gray-500 flex flex-col sm:flex-row justify-between items-center gap-3">
                            <div className="flex items-center gap-2">
                                <div className="bg-blue-50 p-1.5 rounded-md inline-flex">
                                    <MapPin size={16} className="text-blue-600" />
                                </div>
                                Exibindo <span className="font-medium text-blue-700">{regioes.length}</span> {regioes.length === 1 ? 'região' : 'regiões'} no total
                            </div>
                            <div className="flex items-center gap-3">
                                <button className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 font-medium flex items-center gap-2 shadow-sm transition-all duration-150 disabled:shadow-none" disabled>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="m15 18-6-6 6-6" />
                                    </svg>
                                    Anterior
                                </button>
                                <span className="bg-blue-600 text-white px-3 py-1 rounded-md font-medium">1</span>
                                <button className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 font-medium flex items-center gap-2 shadow-sm transition-all duration-150 disabled:shadow-none" disabled>
                                    Próxima
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="m9 18 6-6-6-6" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-gray-900 bg-opacity-60 flex items-center justify-center p-4 z-50 backdrop-blur-sm animate-fadeIn">
                    <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-100 animate-scaleIn">
                        <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                                <div className="bg-blue-50 p-1.5 rounded-lg inline-flex">
                                    <MapPin size={18} className="text-blue-600" />
                                </div>
                                {regiaoEditando ? 'Editar Região' : 'Nova Região'}
                            </h3>
                            <button
                                onClick={fecharModal}
                                className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-full transition-all duration-200 hover:rotate-90"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-5">
                            <div className="space-y-6">
                                <div>
                                    <label htmlFor="nome_regiao" className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                                        <span className="text-blue-600">•</span> Nome da Região
                                    </label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <MapPin size={16} className="text-gray-500 group-hover:text-blue-600 transition-colors" />
                                        </div>
                                        <input
                                            type="text"
                                            id="nome_regiao"
                                            name="nome_regiao"
                                            value={formData.nome_regiao}
                                            onChange={handleInputChange}
                                            className="w-full rounded-lg border border-gray-300 pl-10 pr-3 py-3 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 text-sm transition-all duration-200 hover:border-blue-300"
                                            placeholder="Ex: Zona Norte"
                                            autoComplete="off"
                                            required
                                        />
                                    </div>
                                    <p className="mt-1.5 text-xs text-gray-500">Nome que identifica a região de atendimento</p>
                                </div>

                                <div>
                                    <label htmlFor="situacao" className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                                        <span className="text-blue-600">•</span> Status
                                    </label>
                                    <div className="relative">
                                        <select
                                            id="situacao"
                                            name="situacao"
                                            value={formData.situacao}
                                            onChange={handleInputChange}
                                            className="w-full rounded-lg border border-gray-300 px-4 py-3 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 text-sm appearance-none transition-all duration-200 hover:border-blue-300"
                                        >
                                            <option value="A">Ativo</option>
                                            <option value="I">Inativo</option>
                                        </select>
                                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="m6 9 6 6 6-6" />
                                            </svg>
                                        </div>
                                    </div>
                                    <p className="mt-1.5 text-xs text-gray-500">Define se a região está ativa para uso no sistema</p>
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row justify-end gap-3 pt-6">
                                <button
                                    type="button"
                                    onClick={fecharModal}
                                    className="order-2 sm:order-1 px-4 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 transition-all duration-200 w-full sm:w-auto mt-2 sm:mt-0"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="order-1 sm:order-2 px-6 py-3 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 transition-all duration-200 hover:scale-105 w-full sm:w-auto flex items-center justify-center gap-2"
                                >
                                    {regiaoEditando ? (
                                        <>
                                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" />
                                            </svg>
                                            Salvar Alterações
                                        </>
                                    ) : (
                                        <>
                                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M12 5v14" />
                                                <path d="M5 12h14" />
                                            </svg>
                                            Cadastrar Região
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CadastroRegioes;
