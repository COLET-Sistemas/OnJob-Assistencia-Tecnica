'use client'

import { clientesAPI } from '@/api/api';
import { Loading } from '@/components/loading';
import { useTitle } from '@/context/TitleContext';
import { FormData } from '@/types/admin/cadastro/clientes';
import { formatDocumento } from '@/utils/formatters';
import { MapPin, Save } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

// Define interface for region based on the API response
interface Regiao {
    id: number;
    nome: string;
    descricao: string;
    uf: string;
    atendida_empresa: boolean;
    situacao: string;
    data_cadastro: string;
    id_usuario_cadastro: number;
}

const CadastrarCliente = () => {
    const router = useRouter();
    const { setTitle } = useTitle();
    const [loading, setLoading] = useState(false);
    const [savingData, setSavingData] = useState(false);
    const [regioes, setRegioes] = useState<Regiao[]>([]);
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});

    // Set page title when component mounts
    useEffect(() => {
        setTitle('Cadastro de Cliente');
    }, [setTitle]);

    const [formData, setFormData] = useState<FormData>({
        nome_fantasia: '',
        razao_social: '',
        cnpj: '',
        endereco: '',
        numero: '',
        bairro: '',
        cep: '',
        cidade: '',
        uf: 'SP',
        latitude: '',
        longitude: '',
        situacao: 'A',
        id_regiao: 0
    });

    // Carregar as regiões disponíveis
    useEffect(() => {
        const carregarRegioes = async () => {
            setLoading(true);
            try {
                // Usando o endpoint correto /regioes
                const response = await fetch('/regioes');
                const dados = await response.json();
                setRegioes(dados);
            } catch (error) {
                console.error('Erro ao carregar regiões:', error);
            } finally {
                setLoading(false);
            }
        };

        carregarRegioes();
    }, []);

    // Interfaces para as APIs de CEP
    interface BrasilAPICEP {
        cep: string;
        state: string;
        city: string;
        neighborhood: string;
        street: string;
        service: string;
        location?: {
            type: string;
            coordinates: {
                longitude: string;
                latitude: string;
            };
        };
    }

    interface ViaCEPResponse {
        cep: string;
        logradouro: string;
        complemento: string;
        bairro: string;
        localidade: string;
        uf: string;
        ibge: string;
        gia: string;
        ddd: string;
        siafi: string;
        erro?: boolean;
    }

    // Função para buscar CEP e preencher dados do endereço usando BrasilAPI
    const buscarCEP = async (cep: string) => {
        if (!cep || cep.length !== 9) return;

        // Remove caracteres não numéricos
        const cepNumerico = cep.replace(/\D/g, '');

        if (cepNumerico.length !== 8) return;

        // Define qual API usar (alternativa: BrasilAPI)
        const useBrasilAPI = true;

        try {
            if (useBrasilAPI) {
                // Usando BrasilAPI - oferece mais dados
                const response = await fetch(`https://brasilapi.com.br/api/cep/v2/${cepNumerico}`);
                const data: BrasilAPICEP = await response.json();

                if (response.ok) {
                    setFormData(prev => ({
                        ...prev,
                        endereco: data.street || '',
                        bairro: data.neighborhood || '',
                        cidade: data.city || '',
                        uf: data.state || 'SP'
                    }));

                    // Se tiver coordenadas, preenche latitude e longitude
                    if (data.location?.coordinates) {
                        setFormData(prev => ({
                            ...prev,
                            latitude: data.location?.coordinates.latitude || '',
                            longitude: data.location?.coordinates.longitude || ''
                        }));
                    }

                    // Foca no campo de número após encontrar o CEP
                    setTimeout(() => {
                        document.getElementById('numero')?.focus();
                    }, 100);
                }
            } else {
                // Usando ViaCEP como fallback
                const response = await fetch(`https://viacep.com.br/ws/${cepNumerico}/json/`);
                const data: ViaCEPResponse = await response.json();

                if (!data.erro) {
                    setFormData(prev => ({
                        ...prev,
                        endereco: data.logradouro || '',
                        bairro: data.bairro || '',
                        cidade: data.localidade || '',
                        uf: data.uf || 'SP'
                    }));

                    // Foca no campo de número após encontrar o CEP
                    setTimeout(() => {
                        document.getElementById('numero')?.focus();
                    }, 100);
                }
            }
        } catch (error) {
            console.error('Erro ao buscar CEP:', error);
            alert('Não foi possível buscar o endereço pelo CEP. Por favor, digite manualmente.');
        }
    };

    // Formatar o campo de CEP automaticamente
    const formatarCEP = (cep: string) => {
        // Remove caracteres não numéricos
        cep = cep.replace(/\D/g, '');

        // Adiciona a formatação
        if (cep.length > 5) {
            cep = `${cep.slice(0, 5)}-${cep.slice(5, 8)}`;
        }

        return cep;
    };

    // Formatar CNPJ automaticamente
    const formatarCNPJ = (value: string) => {
        return formatDocumento(value);
    };

    // Manipular mudanças nos campos do formulário
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;

        // Lógica específica para alguns campos
        if (name === 'cep') {
            const formattedCEP = formatarCEP(value);
            setFormData(prev => ({ ...prev, [name]: formattedCEP }));

            // Buscar CEP automaticamente quando completar
            if (formattedCEP.length === 9) {
                buscarCEP(formattedCEP);
            }
        }
        else if (name === 'cnpj') {
            setFormData(prev => ({ ...prev, [name]: formatarCNPJ(value) }));
        }
        else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }

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

        if (!formData.nome_fantasia) errors.nome_fantasia = 'Campo obrigatório';
        if (!formData.razao_social) errors.razao_social = 'Campo obrigatório';
        if (!formData.cnpj || formData.cnpj.length < 18) errors.cnpj = 'CNPJ inválido';
        if (!formData.endereco) errors.endereco = 'Campo obrigatório';
        if (!formData.numero) errors.numero = 'Campo obrigatório';
        if (!formData.bairro) errors.bairro = 'Campo obrigatório';
        if (!formData.cep || formData.cep.length < 9) errors.cep = 'CEP inválido';
        if (!formData.cidade) errors.cidade = 'Campo obrigatório';
        if (!formData.uf) errors.uf = 'Campo obrigatório';
        if (!formData.id_regiao || formData.id_regiao === 0) errors.id_regiao = 'Campo obrigatório';

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
            // Formatar dados para envio
            const clienteData = {
                ...formData,
                latitude: formData.latitude ? parseFloat(formData.latitude) : null,
                longitude: formData.longitude ? parseFloat(formData.longitude) : null
            };

            // Enviar para a API
            await clientesAPI.create(clienteData);

            // Redirecionar para a lista de clientes
            router.push('/admin/cadastro/clientes');
        } catch (error) {
            console.error('Erro ao cadastrar cliente:', error);
            alert('Erro ao cadastrar cliente. Verifique os dados e tente novamente.');
        } finally {
            setSavingData(false);
        }
    };

    if (loading) {
        return (
            <Loading
                fullScreen={true}
                preventScroll={false}
                text="Carregando cadastro cliente..."
                size="large"
            />
        );
    }

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
                        <h2 className="text-lg font-semibold text-[#7C54BD] border-b-2 border-[#F6C647] pb-2 inline-block">Informações Principais</h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Nome Fantasia */}
                            <div>
                                <label htmlFor="nome_fantasia" className="block text-sm font-medium text-[#7C54BD] mb-1">
                                    Nome Fantasia<span className="text-red-500 ml-1">*</span>
                                </label>
                                <input
                                    type="text"
                                    id="nome_fantasia"
                                    name="nome_fantasia"
                                    placeholder="Nome fantasia da empresa"
                                    value={formData.nome_fantasia}
                                    onChange={handleInputChange}
                                    className={`w-full p-2 border ${formErrors.nome_fantasia ? 'border-red-500' : 'border-gray-300'} rounded-md focus:ring-2 focus:ring-[#7C54BD] focus:border-transparent transition-all duration-200 shadow-sm placeholder:text-gray-400 text-black`}
                                />
                                {formErrors.nome_fantasia && (
                                    <p className="mt-1 text-sm text-red-500">{formErrors.nome_fantasia}</p>
                                )}
                            </div>

                            {/* Razão Social */}
                            <div>
                                <label htmlFor="razao_social" className="block text-sm font-medium text-[#7C54BD] mb-1">
                                    Razão Social<span className="text-red-500 ml-1">*</span>
                                </label>
                                <input
                                    type="text"
                                    id="razao_social"
                                    name="razao_social"
                                    placeholder="Razão social completa"
                                    value={formData.razao_social}
                                    onChange={handleInputChange}
                                    className={`w-full p-2 border ${formErrors.razao_social ? 'border-red-500' : 'border-gray-300'} rounded-md focus:ring-2 focus:ring-[#7C54BD] focus:border-transparent transition-all duration-200 shadow-sm placeholder:text-gray-400 text-black`}
                                />
                                {formErrors.razao_social && (
                                    <p className="mt-1 text-sm text-red-500">{formErrors.razao_social}</p>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* CNPJ */}
                            <div>
                                <label htmlFor="cnpj" className="block text-sm font-medium text-[#7C54BD] mb-1">
                                    CNPJ ou CPF<span className="text-red-500 ml-1">*</span>
                                </label>
                                <input
                                    type="text"
                                    id="cnpj"
                                    name="cnpj"
                                    value={formData.cnpj}
                                    onChange={handleInputChange}
                                    maxLength={18}
                                    placeholder="00.000.000/0000-00"
                                    className={`w-full p-2 border ${formErrors.cnpj ? 'border-red-500' : 'border-gray-300'} rounded-md focus:ring-2 focus:ring-[#7C54BD] focus:border-transparent transition-all duration-200 shadow-sm placeholder:text-gray-400 text-black`}
                                />
                                <p className="mt-1 text-xs text-[#7C54BD] opacity-70">Digite apenas números, a formatação é automática</p>
                                {formErrors.cnpj && (
                                    <p className="mt-1 text-sm text-red-500">{formErrors.cnpj}</p>
                                )}
                            </div>

                            {/* Região */}
                            <div>
                                <label htmlFor="id_regiao" className="block text-sm font-medium text-[#7C54BD] mb-1">
                                    Região<span className="text-red-500 ml-1">*</span>
                                </label>
                                <div className="relative">
                                    <select
                                        id="id_regiao"
                                        name="id_regiao"
                                        value={formData.id_regiao}
                                        onChange={handleInputChange}
                                        className={`w-full p-2 border ${formErrors.id_regiao ? 'border-red-500' : 'border-gray-300'} rounded-md focus:ring-2 focus:ring-[#7C54BD] focus:border-transparent transition-all duration-200 shadow-sm appearance-none text-black`}
                                    >
                                        <option value={0} className="text-gray-500">Selecione uma região</option>
                                        {regioes.map(regiao => (
                                            <option key={regiao.id} value={regiao.id}>
                                                {regiao.nome}
                                            </option>
                                        ))}
                                    </select>
                                    <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                                        <MapPin size={18} className="text-[#7C54BD]" />
                                    </div>
                                </div>
                                {formErrors.id_regiao && (
                                    <p className="mt-1 text-sm text-red-500">{formErrors.id_regiao}</p>
                                )}
                            </div>

                            {/* Situação */}
                            <div>
                                <label htmlFor="situacao" className="block text-sm font-medium text-[#7C54BD] mb-1">
                                    Situação<span className="text-red-500 ml-1">*</span>
                                </label>
                                <div className="relative">
                                    <select
                                        id="situacao"
                                        name="situacao"
                                        value={formData.situacao}
                                        onChange={handleInputChange}
                                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#7C54BD] focus:border-transparent transition-all duration-200 shadow-sm appearance-none text-black"
                                    >
                                        <option value="A">Ativo</option>
                                        <option value="I">Inativo</option>
                                    </select>
                                    <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                                        <div className={`w-3 h-3 rounded-full ${formData.situacao === 'A' ? 'bg-[#75FABD]' : 'bg-[#F6C647]'} mr-1`}></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Endereço */}
                    <div className="space-y-4 md:col-span-2">
                        <h2 className="text-lg font-semibold text-[#7C54BD] border-b-2 border-[#F6C647] pb-2 inline-block">Endereço</h2>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* CEP */}
                            <div>
                                <label htmlFor="cep" className="block text-sm font-medium text-[#7C54BD] mb-1">
                                    CEP<span className="text-red-500 ml-1">*</span>
                                </label>
                                <div className="flex">
                                    <input
                                        type="text"
                                        id="cep"
                                        name="cep"
                                        value={formData.cep}
                                        onChange={handleInputChange}
                                        maxLength={9}
                                        placeholder="00000-000"
                                        className={`w-full p-2 border ${formErrors.cep ? 'border-red-500' : 'border-gray-300'} rounded-l-md focus:ring-2 focus:ring-[#7C54BD] focus:border-transparent transition-all duration-200 shadow-sm placeholder:text-gray-400 text-black`}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => buscarCEP(formData.cep)}
                                        className="bg-[#7C54BD] text-white px-4 rounded-r-md hover:bg-[#6743a1] transition-colors flex items-center justify-center group"
                                        title="Buscar endereço automaticamente pelo CEP"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                        </svg>
                                    </button>
                                </div>
                                <p className="mt-1 text-xs text-gray-500">Digite o CEP e clique na lupa para buscar o endereço</p>
                                {formErrors.cep && (
                                    <p className="mt-1 text-sm text-red-500">{formErrors.cep}</p>
                                )}
                            </div>

                            {/* Endereço */}
                            <div className="md:col-span-2">
                                <label htmlFor="endereco" className="block text-sm font-medium text-[#7C54BD] mb-1">
                                    Endereço<span className="text-red-500 ml-1">*</span>
                                </label>
                                <input
                                    type="text"
                                    id="endereco"
                                    name="endereco"
                                    value={formData.endereco}
                                    onChange={handleInputChange}
                                    placeholder="Logradouro"
                                    className={`w-full p-2 border ${formErrors.endereco ? 'border-red-500' : 'border-gray-300'} rounded-md focus:ring-2 focus:ring-[#7C54BD] focus:border-transparent transition-all duration-200 shadow-sm placeholder:text-gray-400 text-black`}
                                />
                                {formErrors.endereco && (
                                    <p className="mt-1 text-sm text-red-500">{formErrors.endereco}</p>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                            {/* Número */}
                            <div className="md:col-span-1">
                                <label htmlFor="numero" className="block text-sm font-medium text-[#7C54BD] mb-1">
                                    Número<span className="text-red-500 ml-1">*</span>
                                </label>
                                <input
                                    type="text"
                                    id="numero"
                                    name="numero"
                                    value={formData.numero}
                                    onChange={handleInputChange}
                                    placeholder="Nº"
                                    className={`w-full p-2 border ${formErrors.numero ? 'border-red-500' : 'border-gray-300'} rounded-md focus:ring-2 focus:ring-[#7C54BD] focus:border-transparent transition-all duration-200 shadow-sm placeholder:text-gray-400 text-black`}
                                />
                                {formErrors.numero && (
                                    <p className="mt-1 text-sm text-red-500">{formErrors.numero}</p>
                                )}
                            </div>

                            {/* Bairro */}
                            <div className="md:col-span-2">
                                <label htmlFor="bairro" className="block text-sm font-medium text-[#7C54BD] mb-1">
                                    Bairro<span className="text-red-500 ml-1">*</span>
                                </label>
                                <input
                                    type="text"
                                    id="bairro"
                                    name="bairro"
                                    value={formData.bairro}
                                    onChange={handleInputChange}
                                    placeholder="Bairro"
                                    className={`w-full p-2 border ${formErrors.bairro ? 'border-red-500' : 'border-gray-300'} rounded-md focus:ring-2 focus:ring-[#7C54BD] focus:border-transparent transition-all duration-200 shadow-sm placeholder:text-gray-400 text-black`}
                                />
                                {formErrors.bairro && (
                                    <p className="mt-1 text-sm text-red-500">{formErrors.bairro}</p>
                                )}
                            </div>

                            {/* Cidade */}
                            <div className="md:col-span-2">
                                <label htmlFor="cidade" className="block text-sm font-medium text-[#7C54BD] mb-1">
                                    Cidade<span className="text-red-500 ml-1">*</span>
                                </label>
                                <input
                                    type="text"
                                    id="cidade"
                                    name="cidade"
                                    value={formData.cidade}
                                    onChange={handleInputChange}
                                    placeholder="Cidade"
                                    className={`w-full p-2 border ${formErrors.cidade ? 'border-red-500' : 'border-gray-300'} rounded-md focus:ring-2 focus:ring-[#7C54BD] focus:border-transparent transition-all duration-200 shadow-sm placeholder:text-gray-400 text-black`}
                                />
                                {formErrors.cidade && (
                                    <p className="mt-1 text-sm text-red-500">{formErrors.cidade}</p>
                                )}
                            </div>

                            {/* UF */}
                            <div className="md:col-span-1">
                                <label htmlFor="uf" className="block text-sm font-medium text-[#7C54BD] mb-1">
                                    UF<span className="text-red-500 ml-1">*</span>
                                </label>
                                <select
                                    id="uf"
                                    name="uf"
                                    value={formData.uf}
                                    onChange={handleInputChange}
                                    className={`w-full p-2 border ${formErrors.uf ? 'border-red-500' : 'border-gray-300'} rounded-md focus:ring-2 focus:ring-[#7C54BD] focus:border-transparent transition-all duration-200 shadow-sm appearance-none text-black`}
                                >
                                    <option value="AC">AC</option>
                                    <option value="AL">AL</option>
                                    <option value="AP">AP</option>
                                    <option value="AM">AM</option>
                                    <option value="BA">BA</option>
                                    <option value="CE">CE</option>
                                    <option value="DF">DF</option>
                                    <option value="ES">ES</option>
                                    <option value="GO">GO</option>
                                    <option value="MA">MA</option>
                                    <option value="MT">MT</option>
                                    <option value="MS">MS</option>
                                    <option value="MG">MG</option>
                                    <option value="PA">PA</option>
                                    <option value="PB">PB</option>
                                    <option value="PR">PR</option>
                                    <option value="PE">PE</option>
                                    <option value="PI">PI</option>
                                    <option value="RJ">RJ</option>
                                    <option value="RN">RN</option>
                                    <option value="RS">RS</option>
                                    <option value="RO">RO</option>
                                    <option value="RR">RR</option>
                                    <option value="SC">SC</option>
                                    <option value="SP">SP</option>
                                    <option value="SE">SE</option>
                                    <option value="TO">TO</option>
                                </select>
                                {formErrors.uf && (
                                    <p className="mt-1 text-sm text-red-500">{formErrors.uf}</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Localização */}
                    <div className="space-y-4 md:col-span-2">
                        <h2 className="text-lg font-semibold text-[#7C54BD] border-b-2 border-[#F6C647] pb-2 inline-block">Localização Geográfica</h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Latitude */}
                            <div>
                                <label htmlFor="latitude" className="block text-sm font-medium text-[#7C54BD] mb-1">
                                    Latitude
                                </label>
                                <input
                                    type="text"
                                    id="latitude"
                                    name="latitude"
                                    value={formData.latitude}
                                    onChange={handleInputChange}
                                    placeholder="-23.669854"
                                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#7C54BD] focus:border-transparent transition-all duration-200 shadow-sm placeholder:text-gray-400 text-black"
                                />
                                <p className="text-xs text-[#7C54BD] opacity-70 mt-1">
                                    Use o formato decimal (ex: -23.669854)
                                </p>
                            </div>

                            {/* Longitude */}
                            <div>
                                <label htmlFor="longitude" className="block text-sm font-medium text-[#7C54BD] mb-1">
                                    Longitude
                                </label>
                                <input
                                    type="text"
                                    id="longitude"
                                    name="longitude"
                                    value={formData.longitude}
                                    onChange={handleInputChange}
                                    placeholder="-45.41698"
                                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#7C54BD] focus:border-transparent transition-all duration-200 shadow-sm placeholder:text-gray-400 text-black"
                                />
                                <p className="text-xs text-[#7C54BD] opacity-70 mt-1">
                                    Use o formato decimal (ex: -45.41698)
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Botões */}
                <div className="mt-8 flex justify-end space-x-3">
                    <Link
                        href="/admin/cadastro/clientes"
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
                                Salvar Cliente
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default CadastrarCliente;
