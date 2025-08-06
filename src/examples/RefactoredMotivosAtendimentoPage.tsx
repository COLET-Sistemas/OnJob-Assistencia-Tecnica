'use client'

import { motivosAtendimentoAPI } from '@/api/api';
import { Loading } from '@/components/Loading';
import { ActionButton, TableList, TableStatusColumn } from '@/components/admin/common';
import { useTitle } from '@/context/TitleContext';
import { useDataFetch } from '@/hooks';
import type { MotivoAtendimento } from '@/types/admin/cadastro/motivos_atendimento';
import { Edit2 } from 'lucide-react';
import { useEffect } from 'react';

const CadastroMotivosAtendimento = () => {
    const { setTitle } = useTitle();

    // Configurar o título da página
    useEffect(() => {
        setTitle('Motivos de Atendimento');
    }, [setTitle]);

    // Usar nosso hook customizado para carregar os dados
    const { data: motivosAtendimento, loading } = useDataFetch<MotivoAtendimento[]>(
        () => motivosAtendimentoAPI.getAll(),
        []
    );

    if (loading) {
        return (
            <Loading
                fullScreen={true}
                preventScroll={false}
                text="Carregando motivos de atendimento..."
                size="large"
            />
        );
    }

    // Definir as colunas da tabela
    const columns = [
        {
            header: 'Descrição',
            accessor: 'descricao' as keyof MotivoAtendimento,
            render: (motivo: MotivoAtendimento) => (
                <div className="text-sm font-semibold text-gray-900">{motivo.descricao}</div>
            )
        },
        {
            header: 'Status',
            accessor: 'situacao' as keyof MotivoAtendimento,
            render: (motivo: MotivoAtendimento) => (
                <TableStatusColumn status={motivo.situacao} />
            )
        }
    ];

    // Renderizar as ações para cada item
    const renderActions = (motivo: MotivoAtendimento) => (
        <ActionButton
            href={`/admin/cadastro/motivos_atendimentos/editar/${motivo.id}`}
            icon={<Edit2 size={14} />}
            label="Editar"
            variant="secondary"
        />
    );

    return (
        <TableList
            title="Lista Motivos de Atendimento"
            items={motivosAtendimento || []}
            keyField="id"
            columns={columns}
            renderActions={renderActions}
            newItemLink="/admin/cadastro/motivos_atendimentos/novo"
            newItemLabel="Novo Motivo"
        />
    );
};

export default CadastroMotivosAtendimento;
