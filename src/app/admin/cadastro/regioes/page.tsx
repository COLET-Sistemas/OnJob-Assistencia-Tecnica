'use client'
import { regioesAPI } from '@/api/api';
import { Loading } from '@/components/Loading';
import { ActionButton, TableList, TableStatusColumn } from '@/components/admin/common';
import { useTitle } from '@/context/TitleContext';
import { useDataFetch } from '@/hooks';
import type { Regiao } from '@/types/admin/cadastro/regioes';
import { Edit2, MapPin } from 'lucide-react';
import { useEffect } from 'react';

const CadastroRegioes = () => {
    const { setTitle } = useTitle();

    // Configurar o título da página
    useEffect(() => {
        setTitle('Regiões');
    }, [setTitle]);

    // Usar o hook customizado para carregar os dados
    const { data: regioes, loading } = useDataFetch<Regiao[]>(
        () => regioesAPI.getAllWithInactive(),
        []
    );

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

    // Estado vazio customizado para regiões
    const emptyStateProps = {
        title: 'Nenhuma região cadastrada',
        description: 'Você ainda não possui regiões cadastradas no sistema.',
        icon: <div className="bg-[var(--primary)]/5 p-5 rounded-full inline-flex mb-5 shadow-inner">
            <MapPin size={36} className="text-[var(--primary)]" />
        </div>
    };

    // Definir as colunas da tabela
    const columns = [
        {
            header: 'Nome da Região',
            accessor: 'nome' as keyof Regiao,
            render: (regiao: Regiao) => (
                <div className="text-sm font-medium text-gray-900 flex items-center gap-2.5">
                    {regiao.nome}
                </div>
            )
        },
        {
            header: 'Descrição',
            accessor: 'descricao' as keyof Regiao,
            render: (regiao: Regiao) => (
                <span className="text-sm text-gray-600 line-clamp-1" title={regiao.descricao}>
                    {regiao.descricao || '-'}
                </span>
            )
        },
        {
            header: 'UF',
            accessor: 'uf' as keyof Regiao,
            render: (regiao: Regiao) => (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-[var(--secondary-yellow)]/10 text-[var(--dark-navy)] border border-[var(--secondary-yellow)]/20">
                    {regiao.uf}
                </span>
            )
        },
        {
            header: 'Atendida',
            accessor: 'atendida_empresa' as keyof Regiao,
            render: (regiao: Regiao) => (
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium ${regiao.atendida_empresa
                    ? 'bg-[var(--secondary-green)]/10 text-green-800 border border-green-200'
                    : 'bg-red-50 text-red-700 border border-red-100'
                    }`}>
                    {regiao.atendida_empresa ? 'Sim' : 'Não'}
                </span>
            )
        },
        {
            header: 'Situação',
            accessor: 'situacao' as keyof Regiao,
            render: (regiao: Regiao) => (
                <TableStatusColumn
                    status={regiao.situacao}
                    mapping={{
                        'A': {
                            label: 'Ativo',
                            className: 'bg-[var(--secondary-green)]/10 text-green-800 border border-green-200'
                        },
                        'I': {
                            label: 'Inativo',
                            className: 'bg-red-50 text-red-700 border border-red-100'
                        }
                    }}
                />
            )
        },
        {
            header: 'Data Cadastro',
            accessor: 'data_cadastro' as keyof Regiao,
            render: (regiao: Regiao) => (
                <span className="text-xs text-gray-500">
                    {regiao.data_cadastro ? regiao.data_cadastro.replace(/:\d{2}$/, '') : '-'}
                </span>
            )
        }
    ];

    // Renderizar as ações para cada item
    const renderActions = (regiao: Regiao) => (
        <ActionButton
            href={`/admin/cadastro/regioes/editar/${regiao.id}`}
            icon={<Edit2 size={14} />}
            label="Editar"
            variant="secondary"
        />
    );

    return (
        <TableList
            title="Lista de Regiões"
            items={regioes || []}
            keyField="id"
            columns={columns}
            renderActions={renderActions}
            newItemLink="/admin/cadastro/regioes/novo"
            newItemLabel="Nova Região"
            emptyStateProps={emptyStateProps}
        />
    );
};

export default CadastroRegioes;