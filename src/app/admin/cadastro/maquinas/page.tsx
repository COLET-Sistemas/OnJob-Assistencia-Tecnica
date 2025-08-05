'use client'
import { maquinasAPI } from '@/api/api';
import { Loading } from '@/components/Loading';
import { useTitle } from '@/context/TitleContext';
import type { FormData, Maquina } from '@/types/admin/cadastro/maquinas';
import { Edit2, Plus } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function CadastroMaquinas() {
    const { setTitle } = useTitle();
    const [maquinas, setMaquinas] = useState<Maquina[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [maquinaEditando, setMaquinaEditando] = useState<Maquina | null>(null);

    const [formData, setFormData] = useState<FormData>({
        numero_serie: '',
        descricao: '',
        modelo: '',
        data_1a_venda: '',
        nota_fiscal_venda: '',
        data_final_garantia: '',
        situacao: 'A',
        id_cliente: 0
    });

    useEffect(() => {
        carregarMaquinas();
    }, []);

    // Configurar o título da página
    useEffect(() => {
        setTitle('Máquinas');
    }, [setTitle]);

    const carregarMaquinas = async () => {
        setLoading(true);
        try {
            const dados: Maquina[] = await maquinasAPI.getAllWithInactive();
            setMaquinas(dados);
        } catch (error) {
            console.error('Erro ao carregar máquinas:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            if (maquinaEditando) {
                // Utilizando o método update da API de máquinas
                await maquinasAPI.update(maquinaEditando.id, formData);

                // Atualiza a lista de máquinas após a atualização
                await carregarMaquinas();
                alert('Máquina atualizada com sucesso!');
            } else {
                // Utilizando o método create da API de máquinas
                await maquinasAPI.create(formData);

                // Atualiza a lista de máquinas após a criação
                await carregarMaquinas();
                alert('Máquina cadastrada com sucesso!');
            }

            fecharModal();
        } catch (error) {
            console.error('Erro ao salvar máquina:', error);
            alert('Erro ao salvar máquina. Por favor, tente novamente.');
        }
    };

    const abrirModal = (maquina: Maquina | null = null) => {
        if (maquina) {
            setMaquinaEditando(maquina);
            setFormData({
                numero_serie: maquina.numero_serie || '',
                descricao: maquina.descricao || '',
                modelo: maquina.modelo || '',
                data_1a_venda: maquina.data_1a_venda || '',
                nota_fiscal_venda: maquina.nota_fiscal_venda || '',
                data_final_garantia: maquina.data_final_garantia || '',
                situacao: maquina.situacao || 'A',
                id_cliente: maquina.cliente_atual?.id_cliente || 0
            });
        } else {
            setMaquinaEditando(null);
            setFormData({
                numero_serie: '',
                descricao: '',
                modelo: '',
                data_1a_venda: '',
                nota_fiscal_venda: '',
                data_final_garantia: '',
                situacao: 'A',
                id_cliente: 0
            });
        }
        setIsModalOpen(true);
    };

    const fecharModal = () => {
        setIsModalOpen(false);
        setMaquinaEditando(null);
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
                fullScreen={true}
                preventScroll={false}
                text="Carregando máquinas..."
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
                            Lista de Máquinas
                            <span className="ml-2 bg-[var(--primary)]/10 text-[var(--primary)] text-sm px-3 py-0.5 rounded-full font-medium">{maquinas.length}</span>
                        </h2>
                        <button
                            onClick={() => abrirModal()}
                            className="bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-white px-5 py-2.5 rounded-lg flex items-center gap-2 transition-all shadow-sm hover:shadow transform hover:-translate-y-0.5"
                        >
                            <Plus size={18} />
                            Nova Máquina
                        </button>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-[var(--neutral-light-gray)] border-b border-gray-100">
                                <tr>
                                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-[var(--dark-navy)] uppercase tracking-wider">Máquina</th>
                                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-[var(--dark-navy)] uppercase tracking-wider">Modelo</th>
                                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-[var(--dark-navy)] uppercase tracking-wider">Cliente Atual</th>
                                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-[var(--dark-navy)] uppercase tracking-wider">Data 1ª Venda</th>
                                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-[var(--dark-navy)] uppercase tracking-wider">Nota Fiscal</th>
                                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-[var(--dark-navy)] uppercase tracking-wider">Data Final Garantia</th>
                                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-[var(--dark-navy)] uppercase tracking-wider">Situação</th>
                                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-[var(--dark-navy)] uppercase tracking-wider">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-100">
                                {maquinas.length > 0 ? (
                                    maquinas.map((maquina: Maquina) => (
                                        <tr key={maquina.id} className="hover:bg-[var(--primary)]/5 transition-colors duration-150 group">
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {maquina.numero_serie}
                                                    </div>
                                                    <div className="text-xs text-gray-600 mt-1 max-w-[200px] line-clamp-1" title={maquina.descricao}>
                                                        {maquina.descricao || '-'}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-[var(--secondary-yellow)]/10 text-[var(--dark-navy)] border border-[var(--secondary-yellow)]/20">
                                                    {maquina.modelo}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="text-sm text-gray-600">
                                                    {maquina.cliente_atual?.nome_fantasia || '-'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="text-sm text-gray-600">
                                                    {maquina.data_1a_venda && !isNaN(new Date(maquina.data_1a_venda).getTime())
                                                        ? new Date(maquina.data_1a_venda).toLocaleDateString('pt-BR')
                                                        : '-'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="text-sm text-gray-600 font-medium">
                                                    {maquina.nota_fiscal_venda || '-'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="text-sm text-gray-600">
                                                    {maquina.data_final_garantia && !isNaN(new Date(maquina.data_final_garantia).getTime())
                                                        ? new Date(maquina.data_final_garantia).toLocaleDateString('pt-BR')
                                                        : '-'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium ${maquina.situacao === 'A'
                                                    ? 'bg-[var(--secondary-green)]/10 text-green-800 border border-green-200'
                                                    : 'bg-red-50 text-red-700 border border-red-100'
                                                    }`}>
                                                    {maquina.situacao === 'A' ? 'Ativo' : 'Inativo'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right">
                                                <button
                                                    onClick={() => abrirModal(maquina)}
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
                                        <td colSpan={8} className="px-6 py-16 text-center text-gray-500">
                                            <div className="flex flex-col items-center justify-center">
                                                <div className="bg-[var(--primary)]/5 p-5 rounded-full inline-flex mb-5 shadow-inner text-center">
                                                    <span className="text-[var(--primary)] text-2xl font-bold">M</span>
                                                </div>
                                                <p className="text-lg text-gray-700 font-medium">Nenhuma máquina cadastrada</p>
                                                <p className="text-sm text-gray-500 mt-2 mb-5 max-w-md">
                                                    Você ainda não possui máquinas cadastradas no sistema. Clique no botão abaixo para adicionar sua primeira máquina.
                                                </p>
                                                <button
                                                    onClick={() => abrirModal()}
                                                    className="mt-2 bg-[var(--primary)]/10 text-[var(--primary)] hover:bg-[var(--primary)]/20 px-5 py-2.5 rounded-lg font-medium flex items-center gap-2 transition-all duration-200 hover:scale-105 border border-[var(--primary)]/20"
                                                >
                                                    <Plus size={18} />
                                                    Adicionar Primeira Máquina
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Modal para cadastro/edição de máquinas */}
            {
                isModalOpen && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn">
                        <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 animate-scaleIn">
                            <div className="flex justify-between items-center mb-5">
                                <div className="flex items-center gap-2">
                                    <div className="bg-[var(--primary)]/10 p-1.5 rounded-md w-7 h-7 flex items-center justify-center">
                                        <span className="text-[var(--primary)] text-sm font-bold">M</span>
                                    </div>
                                    <h3 className="text-lg font-bold text-[var(--dark-navy)]">
                                        {maquinaEditando ? 'Editar Máquina' : 'Nova Máquina'}
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
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Número de Série *</label>
                                            <input
                                                type="text"
                                                name="numero_serie"
                                                value={formData.numero_serie}
                                                onChange={handleInputChange}
                                                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent text-sm"
                                                placeholder="Digite o número de série"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Modelo *</label>
                                            <input
                                                type="text"
                                                name="modelo"
                                                value={formData.modelo}
                                                onChange={handleInputChange}
                                                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent text-sm"
                                                placeholder="Digite o modelo da máquina"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Descrição *</label>
                                        <input
                                            type="text"
                                            name="descricao"
                                            value={formData.descricao}
                                            onChange={handleInputChange}
                                            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent text-sm"
                                            placeholder="Descreva a máquina"
                                            required
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Data Primeira Venda *</label>
                                            <input
                                                type="date"
                                                name="data_1a_venda"
                                                value={formData.data_1a_venda}
                                                onChange={handleInputChange}
                                                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent text-sm"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Data Final Garantia *</label>
                                            <input
                                                type="date"
                                                name="data_final_garantia"
                                                value={formData.data_final_garantia}
                                                onChange={handleInputChange}
                                                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent text-sm"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Nota Fiscal</label>
                                            <input
                                                type="text"
                                                name="nota_fiscal_venda"
                                                value={formData.nota_fiscal_venda}
                                                onChange={handleInputChange}
                                                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent text-sm"
                                                placeholder="Número da NF"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Cliente *</label>
                                            <select
                                                name="id_cliente"
                                                value={formData.id_cliente}
                                                onChange={handleInputChange}
                                                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent text-sm"
                                                required
                                            >
                                                <option value="">Selecione um cliente</option>
                                                <option value="102">Madereira Josmar</option>
                                                <option value="103">Marcenaria Silva</option>
                                                <option value="104">Movelaria Santos</option>
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
                                            <option value="A">Ativa</option>
                                            <option value="I">Inativa</option>
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
                                        {maquinaEditando ? 'Salvar Alterações' : 'Criar Máquina'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }
        </div>
    );
}
