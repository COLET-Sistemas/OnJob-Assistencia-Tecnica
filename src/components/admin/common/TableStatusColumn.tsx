'use client'

import React from 'react';
import { StatusBadge } from './index';

interface StatusConfig {
    [key: string]: {
        label: string;
        className: string;
    }
}

const defaultStatusMapping: StatusConfig = {
    'A': {
        label: 'Ativo',
        className: 'bg-[var(--secondary-green)]/20 text-[var(--dark-navy)] border border-[var(--secondary-green)]/30'
    },
    'a': {
        label: 'Ativo',
        className: 'bg-[var(--secondary-green)]/20 text-[var(--dark-navy)] border border-[var(--secondary-green)]/30'
    },
    'I': {
        label: 'Inativo',
        className: 'bg-red-50 text-red-700 border border-red-100'
    },
    'i': {
        label: 'Inativo',
        className: 'bg-red-50 text-red-700 border border-red-100'
    }
};

interface TableStatusColumnProps {
    status: string;
    mapping?: StatusConfig;
}

const TableStatusColumn: React.FC<TableStatusColumnProps> = ({
    status,
    mapping = defaultStatusMapping
}) => {
    return (
        <StatusBadge status={status} mapping={mapping} />
    );
};

export default TableStatusColumn;
