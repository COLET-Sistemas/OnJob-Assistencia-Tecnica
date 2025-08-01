
'use client'
import type { Cliente, FormData } from '@/types/admin/cadastro/clientes';
import { Edit2, MapPin, Plus, X } from 'lucide-react';
import { useEffect, useState } from 'react';

const CadastroCliente = () => {
    const [clientes, setClientes] = useState<Cliente[]>([]);
    const [expandedClienteId, setExpandedClienteId] = useState<number | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [clienteEditando, setClienteEditando] = useState<Cliente | null>(null);

    const [formData, setFormData] = useState<FormData>({
        nome: '',
        razao_social: '',
        cnpj: '',
        logradouro: '',
        numero: '',
        bairro: '',
        cep: '',
        cidade: '',
        uf: '',
        latitude: '',
        longitude: '',
        situacao: 'A',
        id_regiao: 1
    });

    // Simular dados de regiões
    const regioes = [
        { id: 1, nome: "Litoral Norte" },
        { id: 2, nome: "Litoral Sul" },
        { id: 3, nome: "Interior" },
        { id: 4, nome: "Capital" }
    ];

    useEffect(() => {
        carregarClientes();
    }, []);

    const carregarClientes = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('Token não encontrado');
            }

            const response = await fetch('http://10.0.0.154:8080/clientes', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Token': `${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Erro ao buscar clientes');
            }

            const dados: Cliente[] = await response.json();
            setClientes(dados);
        } catch (error) {
            console.error('Erro ao carregar clientes:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            if (clienteEditando) {
                // Atualizar cliente existente (simulação local)
                const clientesAtualizados = clientes.map(cliente =>
                    cliente.id === clienteEditando.id
                        ? {
                            ...cliente,
                            ...formData,
                            latitude: parseFloat(formData.latitude),
                            longitude: parseFloat(formData.longitude),
                            regiao: {
                                id_regiao: parseInt(formData.id_regiao.toString()),
                                nome_regiao: regioes.find(r => r.id === formData.id_regiao)?.nome || ""
                            }
                        }
                        : cliente
                );
                setClientes(clientesAtualizados);
            } else {
                // Criar novo cliente (simulação local)
                const novoCliente: Cliente = {
                    id: clientes.length + 1,
                    ...formData,
                    latitude: parseFloat(formData.latitude),
                    longitude: parseFloat(formData.longitude),
                    regiao: {
                        id_regiao: parseInt(formData.id_regiao.toString()),
                        nome_regiao: regioes.find(r => r.id === formData.id_regiao)?.nome || ""
                    }
                };
                setClientes([...clientes, novoCliente]);
            }

            fecharModal();
        } catch (error) {
            console.error('Erro ao salvar cliente:', error);
        }
    };

    const abrirModal = (cliente: Cliente | null = null) => {
        if (cliente) {
            setClienteEditando(cliente);
            setFormData({
                nome: cliente.nome,
                razao_social: cliente.razao_social,
                cnpj: cliente.cnpj,
                logradouro: cliente.logradouro,
                numero: cliente.numero,
                bairro: cliente.bairro,
                cep: cliente.cep,
                cidade: cliente.cidade,
                uf: cliente.uf,
                latitude: cliente.latitude.toString(),
                longitude: cliente.longitude.toString(),
                situacao: cliente.situacao,
                id_regiao: cliente.regiao.id_regiao
            });
        } else {
            setClienteEditando(null);
            setFormData({
                nome: '',
                razao_social: '',
                cnpj: '',
                logradouro: '',
                numero: '',
                bairro: '',
                cep: '',
                cidade: '',
                uf: '',
                latitude: '',
                longitude: '',
                situacao: 'A',
                id_regiao: 1
            });
        }
        setIsModalOpen(true);
    };

    const fecharModal = () => {
        setIsModalOpen(false);
        setClienteEditando(null);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData((prev: FormData) => ({
            ...prev,
            [name]: value
        }));
    };

    const formatCNPJ = (cnpj: string) => {
        if (!cnpj) return '';
        return cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Carregando clientes...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-2">
            <div className="max-w-8xl mx-auto">
                <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Cadastro de Clientes</h1>
                            <p className="text-gray-600 mt-1">Gerencie os clientes do sistema</p>
                        </div>
                        <button
                            onClick={() => abrirModal()}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                        >
                            <Plus size={20} />
                            Novo Cliente
                        </button>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h2 className="text-lg font-semibold text-gray-900">
                            Lista de Clientes ({clientes.length})
                        </h2>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CNPJ</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Localização</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Região</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contatos</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {clientes.map((cliente: any) => (
                                    <>
                                        <tr key={cliente.id_cliente || cliente.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div>
                                                    <div className="text-sm font-medium text-gray-900">{cliente.nome_fantasia || cliente.nome}</div>
                                                    <div className="text-sm text-gray-500">{cliente.razao_social}</div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatCNPJ(cliente.cnpj)}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900 flex items-center gap-1">
                                                    <MapPin size={14} />
                                                    {cliente.cidade}, {cliente.uf}
                                                </div>
                                                <div className="text-sm text-gray-500">{cliente.endereco || cliente.logradouro}, {cliente.numero}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">{cliente.regiao?.nome_regiao}</span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${cliente.situacao === 'A' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{cliente.situacao === 'A' ? 'Ativo' : 'Inativo'}</span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <button
                                                    className="px-3 py-1 bg-gray-100 rounded-full text-xs font-medium text-gray-700 hover:bg-gray-200 flex items-center gap-2"
                                                    onClick={() => setExpandedClienteId(expandedClienteId === (cliente.id_cliente || cliente.id) ? null : (cliente.id_cliente || cliente.id))}
                                                >
                                                    Contatos ({cliente.qtd_contatos || (cliente.contatos ? cliente.contatos.length : 0)})
                                                    <span>{expandedClienteId === (cliente.id_cliente || cliente.id) ? '▲' : '▼'}</span>
                                                </button>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                <button
                                                    onClick={() => abrirModal(cliente)}
                                                    className="text-blue-600 hover:text-blue-900 flex items-center gap-1"
                                                >
                                                    <Edit2 size={14} />
                                                    Editar
                                                </button>
                                            </td>
                                        </tr>
                                        {expandedClienteId === (cliente.id_cliente || cliente.id) && cliente.contatos && (
                                            <tr>
                                                <td colSpan={7} className="px-6 pb-4 pt-0 bg-gray-50">
                                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                        {cliente.contatos.map((contato: any) => (
                                                            <div key={contato.id_contato} className="border rounded-lg p-3 bg-white shadow-sm">
                                                                <div className="font-semibold text-gray-900">{contato.nome_completo || contato.nome}</div>
                                                                <div className="text-sm text-gray-700">Telefone: {contato.telefone}</div>
                                                                {contato.whatsapp && <div className="text-sm text-green-700">WhatsApp: {contato.whatsapp}</div>}
                                                                <div className="text-sm text-gray-700">Email: {contato.email}</div>
                                                                <div className="text-xs mt-1">
                                                                    {contato.situacao === 'A' ? <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded-full">Ativo</span> : <span className="bg-red-100 text-red-800 px-2 py-0.5 rounded-full">Inativo</span>}
                                                                    {contato.recebe_aviso_os && <span className="ml-2 bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">Recebe aviso OS</span>}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center p-6 border-b border-gray-200">
                            <h3 className="text-lg font-semibold text-gray-900">
                                {clienteEditando ? 'Editar Cliente' : 'Novo Cliente'}
                            </h3>
                            <button
                                onClick={fecharModal}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Campos do formulário */}
                                ...existing code...
                            </div>

                            <div className="flex justify-end gap-3 pt-4">
                                ...existing code...
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CadastroCliente;