'use client'
import { Loading } from '@/components/Loading';
import { ActionButton, ListHeader, TableList, TableStatusColumn } from '@/components/admin/common';
import { useTitle } from '@/context/TitleContext';
import { useDataFetch } from '@/hooks';
import type { MotivoAtendimento } from '@/types/admin/cadastro/motivos_atendimento';
import { Edit2 } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

const CadastroMotivosAtendimento = () => {
    const { setTitle } = useTitle();

    // Configurar o título da página
    useEffect(() => {
        setTitle('Motivos de Atendimento');
    }, [setTitle]);



    // Filtros e estado do painel
    const [showFilters, setShowFilters] = useState(false);
    // Filtros editáveis no painel
    const [filtrosPainel, setFiltrosPainel] = useState<{ descricao: string; incluir_inativos: string }>(
        { descricao: '', incluir_inativos: '' }
    );
    // Filtros aplicados (usados na busca)
    const [filtrosAplicados, setFiltrosAplicados] = useState<{ descricao: string; incluir_inativos: string }>(
        { descricao: '', incluir_inativos: '' }
    );

    // Funções de manipulação dos filtros
    const handleFiltroChange = useCallback((campo: string, valor: string) => {
        setFiltrosPainel(prev => ({ ...prev, [campo]: valor }));
    }, []);

    const limparFiltros = useCallback(() => {
        setFiltrosPainel({ descricao: '', incluir_inativos: '' });
    }, []);

    // Aplicar filtros do painel
    const aplicarFiltros = useCallback(() => {
        setFiltrosAplicados({ ...filtrosPainel });
        setShowFilters(false);
    }, [filtrosPainel]);

    // Hook para buscar dados com filtros aplicados
    const fetchMotivos = useCallback(async () => {
        const params: Record<string, string> = {};
        if (filtrosAplicados.descricao) params.descricao = filtrosAplicados.descricao;
        if (filtrosAplicados.incluir_inativos === 'true') params.incluir_inativos = 'S';
        return await import('@/api/api').then(mod => mod.default.get('/motivos_atendimento', { params }));
    }, [filtrosAplicados]);

    const { data: motivosAtendimento, loading } = useDataFetch<MotivoAtendimento[]>(
        fetchMotivos,
        [fetchMotivos]
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

    // Opções de filtro para o painel
    const filterOptions = [
        {
            id: 'descricao',
            label: 'Descrição',
            type: 'text' as const,
            placeholder: 'Buscar por descrição...'
        },
        {
            id: 'incluir_inativos',
            label: 'Incluir Inativos',
            type: 'checkbox' as const
        }
    ];

    const activeFiltersCount = Object.values(filtrosAplicados).filter(Boolean).length;

    return (
        <TableList
            title="Lista Motivos de Atendimento"
            items={motivosAtendimento || []}
            keyField="id"
            columns={columns}
            renderActions={renderActions}
            newItemLink="/admin/cadastro/motivos_atendimentos/novo"
            newItemLabel="Novo Motivo"
            showFilter={showFilters}
            filterOptions={filterOptions}
            filterValues={filtrosPainel}
            onFilterChange={handleFiltroChange}
            onClearFilters={limparFiltros}
            onApplyFilters={aplicarFiltros}
            onFilterToggle={() => setShowFilters(!showFilters)}
            customHeader={
                <ListHeader
                    title="Lista Motivos de Atendimento"
                    itemCount={motivosAtendimento?.length || 0}
                    onFilterToggle={() => setShowFilters(!showFilters)}
                    showFilters={showFilters}
                    newButtonLink="/admin/cadastro/motivos_atendimentos/novo"
                    newButtonLabel="Novo Motivo"
                    activeFiltersCount={activeFiltersCount}
                />
            }
        />
    );
};

export default CadastroMotivosAtendimento;