'use client'
import { usuariosRegioesAPI } from '@/api/api';
import { Loading } from '@/components/loading';
import { UsuarioRegiao } from '@/types/admin/cadastro/usuarios';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar, Edit2, MapPin, Plus } from 'lucide-react';
import { useEffect, useState } from 'react';

function CadastroUsuarios() {
    const [usuariosRegioes, setUsuariosRegioes] = useState<UsuarioRegiao[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        carregarUsuariosRegioes();
    }, []);

    const carregarUsuariosRegioes = async () => {
        setLoading(true);
        setError(null);

        try {
            const dados: UsuarioRegiao[] = await usuariosRegioesAPI.getAll();
            setUsuariosRegioes(dados);
        } catch (err) {
            console.error('Erro ao carregar usuários:', err);
            setError('Falha ao carregar dados. Verifique sua conexão e tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    const formatarData = (dataString: string) => {
        try {
            const data = parseISO(dataString);
            return format(data, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
        } catch {
            // Returning original string if date parsing fails
            return dataString;
        }
    };

    // Agrupa usuários por ID para evitar repetição na listagem
    const usuariosAgrupados = usuariosRegioes.reduce((acc: { [key: number]: UsuarioRegiao & { regioes: { id_regiao: number, nome_regiao: string }[] } }, item) => {
        if (!acc[item.id_usuario]) {
            acc[item.id_usuario] = {
                ...item,
                regioes: [{ id_regiao: item.id_regiao, nome_regiao: item.nome_regiao }]
            };
        } else {
            acc[item.id_usuario].regioes.push({
                id_regiao: item.id_regiao,
                nome_regiao: item.nome_regiao
            });
        }
        return acc;
    }, {});

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
                            <span className="ml-2 bg-[var(--primary)]/10 text-[var(--primary)] text-sm px-3 py-0.5 rounded-full font-medium">
                                {Object.keys(usuariosAgrupados).length}
                            </span>
                        </h2>
                        <a
                            href="/admin/cadastro/usuarios/novo"
                            className="bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-white px-5 py-2.5 rounded-lg flex items-center gap-2 transition-all shadow-sm hover:shadow transform hover:-translate-y-0.5"
                        >
                            <Plus size={18} />
                            Novo Usuário
                        </a>
                    </div>

                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 m-4 rounded-lg">
                            <p className="flex items-center gap-2">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                </svg>
                                {error}
                            </p>
                        </div>
                    )}

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-[var(--neutral-light-gray)] border-b border-gray-100">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-[var(--dark-navy)] uppercase tracking-wider">Usuário</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-[var(--dark-navy)] uppercase tracking-wider">Regiões</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-[var(--dark-navy)] uppercase tracking-wider">Data de Cadastro</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-[var(--dark-navy)] uppercase tracking-wider">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-100">
                                {Object.values(usuariosAgrupados).map((usuario) => (
                                    <tr key={usuario.id_usuario} className="hover:bg-[var(--primary)]/5 transition-colors duration-150">
                                        <td className="px-6 py-4.5 whitespace-nowrap">
                                            <div className="text-sm font-semibold text-gray-900">{usuario.nome_usuario}</div>
                                        </td>
                                        <td className="px-6 py-4.5">
                                            <div className="flex flex-wrap gap-2">
                                                {usuario.regioes.map((regiao) => (
                                                    <span
                                                        key={`${usuario.id_usuario}-${regiao.id_regiao}`}
                                                        className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-medium bg-[var(--secondary-yellow)]/20 text-[var(--dark-navy)] border border-[var(--secondary-yellow)]/30"
                                                    >
                                                        <MapPin size={14} className="mr-1 text-[var(--secondary-yellow)]" />
                                                        {regiao.nome_regiao}
                                                    </span>
                                                ))}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4.5 whitespace-nowrap">
                                            <div className="text-sm text-[var(--neutral-graphite)] flex items-center gap-1.5">
                                                <Calendar size={16} className="text-[var(--primary)]" />
                                                {formatarData(usuario.data_cadastro)}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4.5 whitespace-nowrap text-sm font-medium">
                                            <a
                                                href={`/admin/cadastro/usuarios/editar/${usuario.id_usuario}`}
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
}

export default CadastroUsuarios;
