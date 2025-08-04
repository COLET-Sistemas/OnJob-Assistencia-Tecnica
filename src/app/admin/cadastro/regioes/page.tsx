'use client'
import { regioesAPI } from '@/api/api';
import { Loading } from '@/components/loading';
import type { FormData, Regiao } from '@/types/admin/cadastro/regioes';
import { Edit2, MapPin, Plus } from 'lucide-react';
import { useEffect, useState } from 'react';

const CadastroRegioes = () => {
    const [regioes, setRegioes] = useState<Regiao[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [regiaoEditando, setRegiaoEditando] = useState<Regiao | null>(null);

    const [formData, setFormData] = useState<FormData>({
        nome: '',
        descricao: '',
        uf: 'SP',
        atendida_empresa: true,
        situacao: 'A'
    });

    useEffect(() => {
        carregarRegioes();
    }, []);

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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            if (regiaoEditando) {
                // Utilizando o método update da API de regiões
                await regioesAPI.update(regiaoEditando.id, formData);

                // Atualiza a lista de regiões após a atualização
                await carregarRegioes();
                alert('Região atualizada com sucesso!');
            } else {
                // Utilizando o método create da API de regiões
                await regioesAPI.create(formData);

                // Atualiza a lista de regiões após a criação
                await carregarRegioes();
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
                nome: regiao.nome || '',
                descricao: regiao.descricao || '',
                uf: regiao.uf || 'SP',
                atendida_empresa: regiao.atendida_empresa !== undefined ? regiao.atendida_empresa : true,
                situacao: regiao.situacao || 'A'
            });
        } else {
            setRegiaoEditando(null);
            setFormData({
                nome: '',
                descricao: '',
                uf: 'SP',
                atendida_empresa: true,
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

        if (name === 'atendida_empresa') {
            setFormData((prev: FormData) => ({
                ...prev,
                [name]: value === 'true'
            }));
        } else {
            setFormData((prev: FormData) => ({
                ...prev,
                [name]: value
            }));
        }
    };

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
        <div className="bg-[#F9F7F7] p-1">
            <div className="max-w-8xl mx-auto">
                <div className="bg-[var(--neutral-white)] rounded-xl shadow-md overflow-hidden border border-gray-100">
                    <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-gradient-to-r from-[var(--neutral-white)] to-[var(--secondary-green)]/10">
                        <h2 className="text-xl font-bold text-[var(--neutral-graphite)] flex items-center">
                            <span className="bg-[var(--primary)] h-6 w-1 rounded-full mr-3"></span>
                            Lista de Regiões
                            <span className="ml-2 bg-[var(--primary)]/10 text-[var(--primary)] text-sm px-3 py-0.5 rounded-full font-medium">{regioes.length}</span>
                        </h2>
                        <button
                            onClick={() => abrirModal()}
                            className="bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-white px-5 py-2.5 rounded-lg flex items-center gap-2 transition-all shadow-sm hover:shadow transform hover:-translate-y-0.5"
                        >
                            <Plus size={18} />
                            Nova Região
                        </button>
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
                                                <button
                                                    onClick={() => abrirModal(regiao)}
                                                    className="inline-flex items-center px-2.5 py-1.5 bg-[var(--primary)]/5 hover:bg-[var(--primary)]/15 text-[var(--primary)] rounded-md transition-colors gap-1.5 opacity-90 hover:opacity-100"
                                                >
                                                    <Edit2 size={14} />
                                                    <span className="font-medium text-xs">Editar</span>
                                                </button>
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



            {/* Modal para cadastro/edição de regiões */}
            {
                isModalOpen && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn">
                        <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 animate-scaleIn">
                            <div className="flex justify-between items-center mb-5">
                                <div className="flex items-center gap-2">
                                    <div className="bg-[var(--primary)]/10 p-1.5 rounded-md">
                                        <MapPin size={18} className="text-[var(--primary)]" />
                                    </div>
                                    <h3 className="text-lg font-bold text-[var(--dark-navy)]">
                                        {regiaoEditando ? 'Editar Região' : 'Nova Região'}
                                    </h3>
                                </div>
                                <button
                                    onClick={fecharModal}
                                    className="text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 p-1 transition-colors"
                                    aria-label="Fechar"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                    </svg>
                                </button>
                            </div>

                            <form onSubmit={handleSubmit}>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Nome da Região *</label>
                                        <input
                                            type="text"
                                            name="nome"
                                            value={formData.nome}
                                            onChange={handleInputChange}
                                            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent text-sm"
                                            placeholder="Digite o nome da região"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                                        <input
                                            type="text"
                                            name="descricao"
                                            value={formData.descricao}
                                            onChange={handleInputChange}
                                            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent text-sm"
                                            placeholder="Digite uma descrição para a região"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">UF *</label>
                                            <select
                                                name="uf"
                                                value={formData.uf}
                                                onChange={handleInputChange}
                                                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent text-sm"
                                                required
                                            >
                                                <option value="AC">Acre</option>
                                                <option value="AL">Alagoas</option>
                                                <option value="AP">Amapá</option>
                                                <option value="AM">Amazonas</option>
                                                <option value="BA">Bahia</option>
                                                <option value="CE">Ceará</option>
                                                <option value="DF">Distrito Federal</option>
                                                <option value="ES">Espírito Santo</option>
                                                <option value="GO">Goiás</option>
                                                <option value="MA">Maranhão</option>
                                                <option value="MT">Mato Grosso</option>
                                                <option value="MS">Mato Grosso do Sul</option>
                                                <option value="MG">Minas Gerais</option>
                                                <option value="PA">Pará</option>
                                                <option value="PB">Paraíba</option>
                                                <option value="PR">Paraná</option>
                                                <option value="PE">Pernambuco</option>
                                                <option value="PI">Piauí</option>
                                                <option value="RJ">Rio de Janeiro</option>
                                                <option value="RN">Rio Grande do Norte</option>
                                                <option value="RS">Rio Grande do Sul</option>
                                                <option value="RO">Rondônia</option>
                                                <option value="RR">Roraima</option>
                                                <option value="SC">Santa Catarina</option>
                                                <option value="SP">São Paulo</option>
                                                <option value="SE">Sergipe</option>
                                                <option value="TO">Tocantins</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Atendida pela Empresa? *</label>
                                            <select
                                                name="atendida_empresa"
                                                value={formData.atendida_empresa ? 'true' : 'false'}
                                                onChange={handleInputChange}
                                                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent text-sm"
                                                required
                                            >
                                                <option value="true">Sim</option>
                                                <option value="false">Não</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Situação *</label>
                                        <select
                                            name="situacao"
                                            value={formData.situacao}
                                            onChange={handleInputChange}
                                            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent text-sm"
                                            required
                                        >
                                            <option value="A">Ativo</option>
                                            <option value="I">Inativo</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="flex justify-end gap-2 mt-8">
                                    <button
                                        type="button"
                                        onClick={fecharModal}
                                        className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2.5 text-sm font-medium text-white bg-[var(--primary)] hover:bg-[var(--primary)]/90 rounded-lg transition-colors shadow-sm"
                                    >
                                        {regiaoEditando ? 'Salvar Alterações' : 'Criar Região'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }
        </div >
    );
};

export default CadastroRegioes;
