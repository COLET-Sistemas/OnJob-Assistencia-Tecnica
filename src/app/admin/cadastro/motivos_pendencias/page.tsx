'use client'
import { motivosPendenciaAPI } from '@/api/api';
import { Loading } from '@/components/Loading';
import { ActionButton, TableList, TableStatusColumn } from '@/components/admin/common';
import { useTitle } from '@/context/TitleContext';
import { useDataFetch } from '@/hooks';
import type { MotivoPendencia } from '@/types/admin/cadastro/motivos_pendencia';
import { Edit2 } from 'lucide-react';
import { useEffect } from 'react';

const CadastroMotivosPendencia = () => {
    const { setTitle } = useTitle();

    // Configurar o título da página
    useEffect(() => {
        setTitle('Motivos de Pendência');
    }, [setTitle]);

    // Função personalizada para processar a resposta da API
    const fetchMotivos = async () => {
        let dados: MotivoPendencia[] = await motivosPendenciaAPI.getAllWithInactive();

        // Verificar se os dados são um array. Se não for, criar um array a partir dos dados
        if (!Array.isArray(dados)) {
            console.warn('Resposta da API não é um array, convertendo...', dados);
            if (typeof dados === 'object' && dados !== null) {
                dados = Object.values(dados);
            } else {
                dados = [];
            }
        }

        return dados;
    };

    // Usar o hook customizado para carregar os dados
    const { data: motivos, loading } = useDataFetch<MotivoPendencia[]>(
        fetchMotivos,
        []
    );

    if (loading) {
        return (
            <Loading
                fullScreen={true}
                preventScroll={false}
                text="Carregando motivos de pendência..."
                size="large"
            />
        );
    }

    // Definir as colunas da tabela
    const columns = [
        {
            header: 'Descrição',
            accessor: 'descricao' as keyof MotivoPendencia,
            render: (motivo: MotivoPendencia) => (
                <div className="text-sm font-medium text-gray-900">
                    {typeof motivo.descricao === 'string' ? motivo.descricao : JSON.stringify(motivo.descricao)}
                </div>
            )
        },
        {
            header: 'Status',
            accessor: 'situacao' as keyof MotivoPendencia,
            render: (motivo: MotivoPendencia) => (
                <TableStatusColumn status={motivo.situacao} />
            )
        }
    ];

    // Renderizar as ações para cada item
    const renderActions = (motivo: MotivoPendencia) => (
        <ActionButton
            href={`/admin/cadastro/motivos_pendencias/editar/${motivo.id}`}
            icon={<Edit2 size={14} />}
            label="Editar"
            variant="secondary"
        />
    );

    return (
        <TableList
            title="Lista Motivos de Pendência"
            items={motivos || []}
            keyField="id"
            columns={columns}
            renderActions={renderActions}
            newItemLink="/admin/cadastro/motivos_pendencias/novo"
            newItemLabel="Novo Motivo"
        />
    );
};

export default CadastroMotivosPendencia;
