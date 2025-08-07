'use client'

import { regioesAPI } from '@/api/api';
import { Loading } from '@/components/Loading';
import { useTitle } from '@/context/TitleContext';
import { FormData } from '@/types/admin/cadastro/regioes';
import { MapPin, Save } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface EditarRegiaoProps {
    params: {
        id: string;
    };
}

const EditarRegiao = ({ params }: EditarRegiaoProps) => {
    const router = useRouter();
    const { setTitle } = useTitle();
    const [loading, setLoading] = useState(true);
    const [savingData, setSavingData] = useState(false);
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});

    // Set page title when component mounts
    useEffect(() => {
        setTitle('Editar Região');
    }, [setTitle]);

    // Inicializar formulário com valores padrão
    const [formData, setFormData] = useState<FormData>({
        nome: '',
        descricao: '',
        uf: 'SP',
        atendida_empresa: true,
        situacao: 'A'
    });

    // Lista de UFs brasileiras
    const ufs = [
        'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
        'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
        'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
    ];

    // Carregar dados da região
    useEffect(() => {
        const carregarRegiao = async () => {
            setLoading(true);
            try {
                const id = parseInt(params.id);
                // Chamada GET para /regioes?id=ID, espera array de objetos
                const response = await regioesAPI.getById(id); // Supondo que já faz GET /regioes?id=ID
                const dadosRegiao = Array.isArray(response) ? response[0] : response;
                if (!dadosRegiao) throw new Error('Região não encontrada');

                setFormData({
                    nome: dadosRegiao.nome || '',
                    descricao: dadosRegiao.descricao || '',
                    uf: dadosRegiao.uf || 'SP',
                    atendida_empresa: dadosRegiao.atendida_pela_empresa !== undefined ? dadosRegiao.atendida_pela_empresa : true,
                    situacao: dadosRegiao.situacao || 'A'
                });
            } catch (error) {
                console.error('Erro ao carregar região:', error);
                alert('Erro ao carregar dados da região. Verifique se o ID é válido.');
                router.push('/admin/cadastro/regioes');
            } finally {
                setLoading(false);
            }
        };
        carregarRegiao();
    }, [params.id, router]);

    // Manipular mudanças nos campos do formulário
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;

        if (type === 'checkbox') {
            const checked = (e.target as HTMLInputElement).checked;
            setFormData(prev => ({ ...prev, [name]: checked }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }

        // Limpar erro do campo quando o usuário começa a digitar
        if (formErrors[name]) {
            setFormErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    // Validar formulário antes de enviar
    const validateForm = (): boolean => {
        const errors: Record<string, string> = {};

        if (!formData.nome.trim()) {
            errors.nome = 'Nome da região é obrigatório';
        }

        if (!formData.descricao.trim()) {
            errors.descricao = 'Descrição é obrigatória';
        }

        if (!formData.uf) {
            errors.uf = 'UF é obrigatória';
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    // Enviar formulário
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setSavingData(true);

        try {
            const id = parseInt(params.id);
            // Enviar PUT para /regioes?id=ID, mantendo o padrão do backend
            await regioesAPI.update(id, formData); 
            alert('Região atualizada com sucesso!');
            router.push('/admin/cadastro/regioes');
        } catch (error) {
            console.error('Erro ao atualizar região:', error);
            alert('Erro ao atualizar região. Por favor, tente novamente.');
        } finally {
            setSavingData(false);
        }
    };

    if (loading) {
        return (
            <Loading
                fullScreen={false}
                preventScroll={false}
                text="Carregando dados da região..."
                size="large"
            />
        );
    }

    return (
        <div className="bg-[#F9F7F7] p-1">
            <div className="max-w-6xl mx-auto">
                <div className="bg-[var(--neutral-white)] rounded-xl shadow-md overflow-hidden border border-gray-100">
                    {/* Cabeçalho do card */}
                    <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-gradient-to-r from-[var(--neutral-white)] to-[var(--secondary-green)]/10">
                        <h2 className="text-xl font-bold text-[var(--neutral-graphite)] flex items-center">
                            <span className="bg-[var(--primary)] h-6 w-1 rounded-full mr-3"></span>
                            Editar Região
                        </h2>
                        <Link
                            href="/admin/cadastro/regioes"
                            className="text-[var(--neutral-graphite)] hover:text-[var(--neutral-graphite)]/70 text-sm font-medium flex items-center gap-2"
                        >
                            Voltar para lista de regiões
                        </Link>
                    </div>

                    {/* Formulário */}
                    <form onSubmit={handleSubmit} className="p-8">
                        {/* Informações básicas da região */}
                        <div className="mb-6">
                            <h3 className="text-lg font-semibold text-[var(--neutral-graphite)] mb-4 flex items-center">
                                <MapPin size={20} className="mr-2 text-[var(--primary)]" />
                                Informações da Região
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Nome da região */}
                                <div>
                                    <label htmlFor="nome" className="block text-sm font-medium text-[var(--neutral-graphite)] mb-1">
                                        Nome da Região *
                                    </label>
                                    <input
                                        type="text"
                                        id="nome"
                                        name="nome"
                                        value={formData.nome}
                                        onChange={handleInputChange}
                                        className={`mt-1 block w-full px-3 py-2 border ${formErrors.nome ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-[var(--primary)] focus:border-[var(--primary)] sm:text-sm`}
                                        placeholder="Nome da região"
                                    />
                                    {formErrors.nome && (
                                        <p className="mt-1 text-xs text-red-600">{formErrors.nome}</p>
                                    )}
                                </div>

                                {/* UF */}
                                <div>
                                    <label htmlFor="uf" className="block text-sm font-medium text-[var(--neutral-graphite)] mb-1">
                                        UF *
                                    </label>
                                    <select
                                        id="uf"
                                        name="uf"
                                        value={formData.uf}
                                        onChange={handleInputChange}
                                        className={`mt-1 block w-full px-3 py-2 border ${formErrors.uf ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-[var(--primary)] focus:border-[var(--primary)] sm:text-sm`}
                                    >
                                        {ufs.map((uf) => (
                                            <option key={uf} value={uf}>
                                                {uf}
                                            </option>
                                        ))}
                                    </select>
                                    {formErrors.uf && (
                                        <p className="mt-1 text-xs text-red-600">{formErrors.uf}</p>
                                    )}
                                </div>

                                {/* Descrição - 2 columns */}
                                <div className="md:col-span-2">
                                    <label htmlFor="descricao" className="block text-sm font-medium text-[var(--neutral-graphite)] mb-1">
                                        Descrição *
                                    </label>
                                    <textarea
                                        id="descricao"
                                        name="descricao"
                                        rows={3}
                                        value={formData.descricao}
                                        onChange={handleInputChange}
                                        className={`mt-1 block w-full px-3 py-2 border ${formErrors.descricao ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-[var(--primary)] focus:border-[var(--primary)] sm:text-sm`}
                                        placeholder="Descrição detalhada da região"
                                    />
                                    {formErrors.descricao && (
                                        <p className="mt-1 text-xs text-red-600">{formErrors.descricao}</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Opções adicionais */}
                        <div className="mb-8">
                            <h3 className="text-lg font-semibold text-[var(--neutral-graphite)] mb-4">
                                Opções
                            </h3>
                            <div className="flex items-center gap-6 flex-wrap">
                                {/* Atendida pela empresa */}
                                <div className="flex items-center">
                                    <input
                                        id="atendida_empresa"
                                        name="atendida_empresa"
                                        type="checkbox"
                                        checked={formData.atendida_empresa}
                                        onChange={handleInputChange}
                                        className="h-4 w-4 text-[var(--primary)] focus:ring-[var(--primary)] border-gray-300 rounded"
                                    />
                                    <label htmlFor="atendida_empresa" className="ml-2 block text-sm text-gray-900">
                                        Região atendida pela empresa
                                    </label>
                                </div>

                                {/* Status */}
                                <div className="flex items-center">
                                    <label htmlFor="situacao" className="block text-sm font-medium text-[var(--neutral-graphite)] mr-2">
                                        Status:
                                    </label>
                                    <select
                                        id="situacao"
                                        name="situacao"
                                        value={formData.situacao}
                                        onChange={handleInputChange}
                                        className="block w-full px-3 py-1.5 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[var(--primary)] focus:border-[var(--primary)] sm:text-sm"
                                    >
                                        <option value="A">Ativo</option>
                                        <option value="I">Inativo</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Botões de ação */}
                        <div className="flex items-center justify-end gap-4 border-t border-gray-100 pt-6">
                            <Link
                                href="/admin/cadastro/regioes"
                                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-[var(--neutral-graphite)] bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--primary)]"
                            >
                                Cancelar
                            </Link>
                            <button
                                type="submit"
                                disabled={savingData}
                                className={`inline-flex justify-center items-center px-6 py-2.5 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[var(--primary)] hover:bg-[var(--primary)]/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--primary)] ${savingData ? 'opacity-70 cursor-not-allowed' : ''}`}
                            >
                                <Save size={18} className="mr-2" />
                                {savingData ? 'Salvando...' : 'Atualizar Região'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default EditarRegiao;
