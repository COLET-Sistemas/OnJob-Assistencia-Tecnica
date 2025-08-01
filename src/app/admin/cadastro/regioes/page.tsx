'use client'
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
            <div className="min-h-screen bg-gray-100 flex items-center justify-center">
                <div className="text-center bg-white p-8 rounded-xl shadow-md border border-gray-100 w-80">
                    <div className="animate-spin rounded-full h-14 w-14 border-4 border-gray-200 border-t-blue-600 mx-auto"></div>
                    <p className="mt-5 text-gray-700 font-medium">Carregando regiões...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 p-4">
            <div className="max-w-7xl mx-auto">
                <div className="bg-white rounded-xl shadow-md p-6 mb-6 border border-gray-100">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-800">Cadastro de Regiões</h1>
                            <p className="text-gray-600 mt-1">Gerencie as regiões de atendimento no sistema</p>
                        </div>
                        <button
                            onClick={() => abrirModal()}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg flex items-center gap-2 transition-colors font-medium shadow-sm"
                        >
                            <Plus size={18} />
                            Nova Região
                        </button>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100">
                    <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center">
                        <h2 className="text-lg font-semibold text-gray-800">
                            Lista de Regiões <span className="text-blue-600 font-medium">({regioes.length})</span>
                        </h2>
                        <div className="flex items-center gap-2">
                            <div className="relative text-gray-400 focus-within:text-gray-600">
                                <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                </span>
                                <input
                                    type="search"
                                    placeholder="Buscar região..."
                                    className="py-2 pl-10 pr-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-100">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Nome da Região</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-100">
                                {regioes.length > 0 ? (
                                    regioes.map((regiao: Regiao) => (
                                        <tr key={regiao.id_regiao} className="hover:bg-blue-50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-800 flex items-center gap-2">
                                                    <MapPin size={16} className="text-blue-600" />
                                                    {regiao.nome_regiao}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${regiao.situacao === 'A'
                                                    ? 'bg-green-100 text-green-800 border border-green-200'
                                                    : 'bg-red-100 text-red-800 border border-red-200'
                                                    }`}>
                                                    {regiao.situacao === 'A' ? 'Ativo' : 'Inativo'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                <div className="flex items-center gap-3">
                                                    <button
                                                        onClick={() => abrirModal(regiao)}
                                                        className="text-blue-600 hover:text-blue-900 flex items-center gap-1.5 hover:bg-blue-50 px-3 py-1 rounded-lg transition-colors"
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
                                        <td colSpan={3} className="px-6 py-8 text-center text-gray-500">
                                            <div className="flex flex-col items-center justify-center">
                                                <div className="bg-blue-50 p-3 rounded-full inline-flex mb-3">
                                                    <MapPin size={24} className="text-blue-500" />
                                                </div>
                                                <p className="text-base">Nenhuma região cadastrada</p>
                                                <button
                                                    onClick={() => abrirModal()}
                                                    className="mt-3 text-blue-600 hover:text-blue-800 font-medium"
                                                >
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
                        <div className="px-6 py-3 border-t border-gray-100 text-sm text-gray-500 flex justify-between items-center">
                            <div>
                                Exibindo <span className="font-medium text-gray-700">{regioes.length}</span> {regioes.length === 1 ? 'região' : 'regiões'} no total
                            </div>
                            <div className="flex items-center gap-2">
                                <button className="px-3 py-1 border border-gray-200 rounded-md hover:bg-gray-50 disabled:opacity-50" disabled>
                                    Anterior
                                </button>
                                <span className="text-gray-700 font-medium">1</span>
                                <button className="px-3 py-1 border border-gray-200 rounded-md hover:bg-gray-50 disabled:opacity-50" disabled>
                                    Próxima
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
                    <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-xl border border-gray-100">
                        <div className="flex justify-between items-center p-6 border-b border-gray-100">
                            <h3 className="text-lg font-semibold text-gray-800">
                                {regiaoEditando ? 'Editar Região' : 'Nova Região'}
                            </h3>
                            <button
                                onClick={fecharModal}
                                className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-1.5 rounded-full transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-5">
                            <div className="space-y-5">
                                <div>
                                    <label htmlFor="nome_regiao" className="block text-sm font-medium text-gray-700 mb-1.5">
                                        Nome da Região
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <MapPin size={16} className="text-gray-500" />
                                        </div>
                                        <input
                                            type="text"
                                            id="nome_regiao"
                                            name="nome_regiao"
                                            value={formData.nome_regiao}
                                            onChange={handleInputChange}
                                            className="w-full rounded-lg border border-gray-300 pl-10 pr-3 py-2.5 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm"
                                            placeholder="Ex: Zona Norte"
                                            autoComplete="off"
                                            required
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label htmlFor="situacao" className="block text-sm font-medium text-gray-700 mb-1.5">
                                        Status
                                    </label>
                                    <select
                                        id="situacao"
                                        name="situacao"
                                        value={formData.situacao}
                                        onChange={handleInputChange}
                                        className="w-full rounded-lg border border-gray-300 px-3 py-2.5 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm"
                                    >
                                        <option value="A">Ativo</option>
                                        <option value="I">Inativo</option>
                                    </select>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-5">
                                <button
                                    type="button"
                                    onClick={fecharModal}
                                    className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2.5 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 transition-colors"
                                >
                                    {regiaoEditando ? 'Salvar Alterações' : 'Cadastrar Região'}
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
