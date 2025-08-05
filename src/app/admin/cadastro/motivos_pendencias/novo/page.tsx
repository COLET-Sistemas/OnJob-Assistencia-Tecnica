'use client'

import { motivosPendenciaAPI } from '@/api/api';
import { useTitle } from '@/context/TitleContext';
import { Save } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

// Define interface for the form data
interface FormData {
    descricao: string;
}

const CadastrarMotivoPendencia = () => {
    const router = useRouter();
    const { setTitle } = useTitle();
    const [savingData, setSavingData] = useState(false);
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});

    // Set page title when component mounts
    useEffect(() => {
        setTitle('Cadastro de Motivo de Pendência');
    }, [setTitle]);

    const [formData, setFormData] = useState<FormData>({
        descricao: '',
    });

    // Manipular mudanças nos campos do formulário
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;

        setFormData(prev => ({ ...prev, [name]: value }));

        // Limpar erro do campo quando usuário digitar
        if (formErrors[name]) {
            setFormErrors(prev => {
                const updated = { ...prev };
                delete updated[name];
                return updated;
            });
        }
    };

    // Validar formulário
    const validarFormulario = () => {
        const errors: Record<string, string> = {};

        if (!formData.descricao) errors.descricao = 'Campo obrigatório';

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    // Enviar formulário
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validarFormulario()) {
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return;
        }

        setSavingData(true);

        try {
            // Enviar para a API apenas o campo de descrição
            await motivosPendenciaAPI.create({ descricao: formData.descricao });

            // Redirecionar para a lista de motivos de pendência
            router.push('/admin/cadastro/motivos_pendencias');
        } catch (error) {
            console.error('Erro ao cadastrar motivo de pendência:', error);
            alert('Erro ao cadastrar motivo de pendência. Verifique os dados e tente novamente.');
        } finally {
            setSavingData(false);
        }
    };

    return (
        <div className="px-2">
            {/* Formulário */}
            <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-lg p-6 transition-all duration-300 hover:shadow-xl border-t-4 border-[#7C54BD]">
                {/* Se houver erros, mostrar alerta */}
                {Object.keys(formErrors).length > 0 && (
                    <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-md shadow-sm">
                        <h4 className="font-medium mb-1 text-red-700">Por favor, corrija os seguintes erros:</h4>
                        <ul className="list-disc list-inside">
                            {Object.entries(formErrors).map(([field, message]) => (
                                <li key={field}>{message}</li>
                            ))}
                        </ul>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Informações principais */}
                    <div className="space-y-4 md:col-span-2">
                        <h2 className="text-lg font-semibold text-[#7C54BD] border-b-2 border-[#F6C647] pb-2 inline-block">Informações do Motivo de Pendência</h2>

                        <div className="grid grid-cols-1 gap-4">
                            {/* Descrição */}
                            <div>
                                <label htmlFor="descricao" className="block text-sm font-medium text-[#7C54BD] mb-1">
                                    Descrição<span className="text-red-500 ml-1">*</span>
                                </label>
                                <input
                                    type="text"
                                    id="descricao"
                                    name="descricao"
                                    placeholder="Descrição do motivo de pendência"
                                    value={formData.descricao}
                                    onChange={handleInputChange}
                                    className={`w-full p-2 border ${formErrors.descricao ? 'border-red-500' : 'border-gray-300'} rounded-md focus:ring-2 focus:ring-[#7C54BD] focus:border-transparent transition-all duration-200 shadow-sm placeholder:text-gray-400 text-black`}
                                />
                                {formErrors.descricao && (
                                    <p className="mt-1 text-sm text-red-500">{formErrors.descricao}</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Botões */}
                <div className="mt-8 flex justify-end space-x-3">
                    <Link
                        href="/admin/cadastro/motivos_pendencias"
                        className="px-5 py-2 bg-gray-100 text-[#7C54BD] rounded-md hover:bg-gray-200 transition-colors shadow-sm hover:shadow-md"
                    >
                        Cancelar
                    </Link>
                    <button
                        type="submit"
                        disabled={savingData}
                        className="px-5 py-2 bg-[#7C54BD] text-white rounded-md hover:bg-[#6743a1] transition-all flex items-center shadow-sm hover:shadow-md"
                    >
                        {savingData ? (
                            <>
                                <span className="mr-2">Salvando</span>
                                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                            </>
                        ) : (
                            <>
                                <Save size={18} className="mr-2" />
                                Salvar Motivo de Pendência
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default CadastrarMotivoPendencia;
