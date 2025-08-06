'use client'

import { usuariosAPI } from '@/api/api';
import { Loading } from '@/components/Loading';
import { ActionButton, TableList, TableStatusColumn } from '@/components/admin/common';
import { useTitle } from '@/context/TitleContext';
import { useDataFetch } from '@/hooks';
import { Usuario } from '@/types/admin/cadastro/usuarios';
import { Edit2, Mail, ShieldCheck } from 'lucide-react';
import { useEffect } from 'react';

const CadastroUsuario = () => {
    const { setTitle } = useTitle();

    // Configurar o título da página
    useEffect(() => {
        setTitle('Usuários');
    }, [setTitle]);

    // Usar o hook customizado para carregar os dados
    const { data: usuarios, loading } = useDataFetch<Usuario[]>(
        () => usuariosAPI.getAll(),
        []
    );

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

    // Definir as colunas da tabela
    const columns = [
        {
            header: 'Login',
            accessor: 'login' as keyof Usuario,
            render: (usuario: Usuario) => (
                <div className="text-sm font-semibold text-gray-900">{usuario.login}</div>
            )
        },
        {
            header: 'Nome',
            accessor: 'nome' as keyof Usuario,
            render: (usuario: Usuario) => (
                <div className="text-sm font-medium text-gray-700">{usuario.nome}</div>
            )
        },
        {
            header: 'Email',
            accessor: 'email' as keyof Usuario,
            render: (usuario: Usuario) => (
                <div className="text-sm text-[var(--neutral-graphite)] flex items-center gap-1.5">
                    <Mail size={16} className="text-[var(--primary)]" />
                    {usuario.email}
                </div>
            )
        },
        {
            header: 'Perfis',
            accessor: 'perfil_interno' as keyof Usuario,
            render: (usuario: Usuario) => (
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
            )
        },
        {
            header: 'Status',
            accessor: 'situacao' as keyof Usuario,
            render: (usuario: Usuario) => (
                <TableStatusColumn status={usuario.situacao} />
            )
        }
    ];

    // Renderizar as ações para cada item
    const renderActions = (usuario: Usuario) => (
        <ActionButton
            href={`/admin/cadastro/usuarios/editar/${usuario.id}`}
            icon={<Edit2 size={14} />}
            label="Editar"
            variant="secondary"
        />
    );

    return (
        <TableList
            title="Lista de Usuários"
            items={usuarios || []}
            keyField="id"
            columns={columns}
            renderActions={renderActions}
            newItemLink="/admin/cadastro/usuarios/novo"
            newItemLabel="Novo Usuário"
        />
    );
};

export default CadastroUsuario;
