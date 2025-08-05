'use client'
import { usuariosAPI } from '@/api/api';
import { Loading } from '@/components/Loading';
import { useTitle } from '@/context/TitleContext';
import { Edit2, Mail, Plus, ShieldCheck } from 'lucide-react';
import { useEffect, useState } from 'react';

// Interface for the user data based on the API response example
interface Usuario {
    id: number;
    login: string;
    nome: string;
    email: string;
    perfil_interno: boolean;
    perfil_gestor_assistencia: boolean;
    perfil_tecnico_proprio: boolean;
    perfil_tecnico_terceirizado: boolean;
    administrador: boolean;
    id_empresa: number;
    situacao: string;
    data_situacao: string;
}

const CadastroUsuario = () => {
    const { setTitle } = useTitle();
    const [usuarios, setUsuarios] = useState<Usuario[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        carregarUsuarios();
    }, []);

    // Configurar o título da página
    useEffect(() => {
        setTitle('Usuários');
    }, [setTitle]);

    const carregarUsuarios = async () => {
        setLoading(true);
        try {
            const dados: Usuario[] = await usuariosAPI.getAll();
            setUsuarios(dados);
        } catch (error) {
            console.error('Erro ao carregar usuários:', error);
        } finally {
            setLoading(false);
        }
    };

    // As funções de formatação podem ser adicionadas conforme necessário

    if (loading) {
        return (
            <Loading
                fullScreen={true}
                preventScroll={false}
                text="Carregando usuários..."
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
                            Lista de Usuários
                            <span className="ml-2 bg-[var(--primary)]/10 text-[var(--primary)] text-sm px-3 py-0.5 rounded-full font-medium">{usuarios.length}</span>
                        </h2>
                        <a
                            href="/admin/cadastro/usuarios/novo"
                            className="bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-white px-5 py-2.5 rounded-lg flex items-center gap-2 transition-all shadow-sm hover:shadow transform hover:-translate-y-0.5"
                        >
                            <Plus size={18} />
                            Novo Usuário
                        </a>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-[var(--neutral-light-gray)] border-b border-gray-100">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-[var(--dark-navy)] uppercase tracking-wider">Login</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-[var(--dark-navy)] uppercase tracking-wider">Nome</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-[var(--dark-navy)] uppercase tracking-wider">Email</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-[var(--dark-navy)] uppercase tracking-wider">Perfis</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-[var(--dark-navy)] uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-[var(--dark-navy)] uppercase tracking-wider">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-100">
                                {usuarios.map((usuario: Usuario) => (
                                    <tr key={usuario.id} className="hover:bg-[var(--primary)]/5 transition-colors duration-150">
                                        <td className="px-6 py-4.5 whitespace-nowrap">
                                            <div className="text-sm font-semibold text-gray-900">{usuario.login}</div>
                                        </td>
                                        <td className="px-6 py-4.5 whitespace-nowrap text-sm font-medium text-gray-700">{usuario.nome}</td>
                                        <td className="px-6 py-4.5 whitespace-nowrap">
                                            <div className="text-sm text-[var(--neutral-graphite)] flex items-center gap-1.5">
                                                <Mail size={16} className="text-[var(--primary)]" />
                                                {usuario.email}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4.5 whitespace-nowrap">
                                            <div className="flex flex-wrap gap-1.5">
                                                {usuario.perfil_interno && (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-medium bg-blue-100 text-blue-800">
                                                        Interno
                                                    </span>
                                                )}
                                                {usuario.perfil_gestor_assistencia && (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-medium bg-purple-100 text-purple-800">
                                                        Gestor
                                                    </span>
                                                )}
                                                {usuario.perfil_tecnico_proprio && (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-medium bg-green-100 text-green-800">
                                                        Técnico próprio
                                                    </span>
                                                )}
                                                {usuario.perfil_tecnico_terceirizado && (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-medium bg-amber-100 text-amber-800">
                                                        Técnico terceirizado
                                                    </span>
                                                )}
                                                {usuario.administrador && (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-medium bg-red-100 text-red-800 gap-1">
                                                        <ShieldCheck size={12} />
                                                        Admin
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4.5 whitespace-nowrap">
                                            <span className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-medium ${usuario.situacao === 'A'
                                                ? 'bg-[var(--secondary-green)]/20 text-[var(--dark-navy)] border border-[var(--secondary-green)]/30'
                                                : 'bg-red-50 text-red-700 border border-red-100'
                                                }`}>
                                                {usuario.situacao === 'A' ? 'Ativo' : 'Inativo'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4.5 whitespace-nowrap text-sm font-medium">
                                            <a
                                                href={`/admin/cadastro/usuarios/editar/${usuario.id}`}
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

export default CadastroUsuario;
