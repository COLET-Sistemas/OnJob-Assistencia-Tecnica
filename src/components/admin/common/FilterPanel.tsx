'use client'

import { Filter, Search, X } from 'lucide-react';
import React from 'react';

interface FilterOption {
    id: string;
    label: string;
    type: 'text' | 'select';
    placeholder?: string;
    options?: Array<{ value: string; label: string }>;
}

interface FilterPanelProps {
    title: string;
    filterOptions: FilterOption[];
    filterValues: Record<string, string>;
    onFilterChange: (key: string, value: string) => void;
    onClearFilters: () => void;
    onClose: () => void;
    onApplyFilters?: () => void; // Nova propriedade para aplicar os filtros
    itemCount: number;
    totalCount: number;
}

const FilterPanel: React.FC<FilterPanelProps> = ({
    title,
    filterOptions,
    filterValues,
    onFilterChange,
    onClearFilters,
    onClose,
    onApplyFilters,
    itemCount,
    totalCount
}) => {
    // Check if any filter is active
    const hasActiveFilters = Object.values(filterValues).some(value => value !== '');

    return (
        <div className="mt-6 overflow-hidden rounded-xl border border-gray-200/80 bg-white shadow-lg backdrop-blur-sm animate-in slide-in-from-top-2 duration-300">
            <div className="bg-gradient-to-r from-[var(--primary)]/5 to-[var(--secondary-green)]/5 px-6 py-4 border-b border-gray-100">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-[var(--primary)]/10 rounded-lg flex items-center justify-center">
                            <Filter size={16} className="text-[var(--primary)]" />
                        </div>
                        <div>
                            <h3 className="text-sm font-semibold text-[var(--neutral-graphite)]">{title}</h3>
                            <p className="text-xs text-gray-500">Refine sua busca pelos critérios abaixo</p>
                        </div>
                    </div>
                    {hasActiveFilters && (
                        <div className="flex items-center gap-2 text-xs text-[var(--primary)] bg-[var(--primary)]/10 px-3 py-1.5 rounded-full">
                            <div className="w-2 h-2 bg-[var(--primary)] rounded-full animate-pulse"></div>
                            Filtros ativos
                        </div>
                    )}
                </div>
            </div>

            <div className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {filterOptions.map((option) => (
                        <div key={option.id} className="space-y-3">
                            <label className="block text-sm font-semibold text-[var(--neutral-graphite)] mb-3">
                                {option.label}
                            </label>
                            <div className="relative group">
                                {option.type === 'text' && (
                                    <>
                                        <input
                                            type="text"
                                            value={filterValues[option.id] || ''}
                                            onChange={(e) => onFilterChange(option.id, e.target.value)}
                                            placeholder={option.placeholder}
                                            className="w-full px-4 py-3 pl-11 bg-gray-50/50 border border-gray-200 rounded-xl text-sm text-[var(--neutral-graphite)] placeholder-[var(--neutral-graphite)]/60 transition-all duration-200 focus:bg-white focus:border-[var(--primary)] focus:ring-4 focus:ring-[var(--primary)]/10 focus:outline-none group-hover:border-gray-300"
                                            autoComplete="off"
                                        />
                                        <Search size={16} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 transition-colors group-focus-within:text-[var(--primary)]" />
                                    </>
                                )}
                                {option.type === 'select' && (
                                    <>
                                        <select
                                            value={filterValues[option.id] || ''}
                                            onChange={(e) => onFilterChange(option.id, e.target.value)}
                                            className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl text-sm text-gray-800 appearance-none cursor-pointer transition-all duration-200 focus:bg-white focus:border-[var(--primary)] focus:ring-4 focus:ring-[var(--primary)]/10 focus:outline-none group-hover:border-gray-300"
                                        >
                                            {option.options?.map((opt) => (
                                                <option key={opt.value} value={opt.value} className={opt.value === '' ? 'text-gray-500' : 'text-gray-800'}>
                                                    {opt.label}
                                                </option>
                                            ))}
                                        </select>
                                        <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none">
                                            <svg className="w-4 h-4 text-gray-400 transition-colors group-focus-within:text-[var(--primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                            </svg>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Seção de Resultados e Ações */}
                <div className="mt-6 pt-6 border-t border-gray-100">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="text-sm text-[var(--neutral-graphite)]">
                                <span className="font-medium">{itemCount}</span>
                                <span className="text-gray-500"> de {totalCount} itens encontrados</span>
                            </div>
                            {itemCount !== totalCount && (
                                <div className="h-4 w-px bg-gray-300"></div>
                            )}
                        </div>

                        <div className="flex items-center gap-3">
                            {hasActiveFilters && (
                                <button
                                    onClick={onClearFilters}
                                    className="px-4 py-2 text-sm font-medium text-[var(--neutral-graphite)] hover:text-[var(--primary)] bg-gray-50 hover:bg-gray-100 rounded-lg flex items-center gap-2 transition-all duration-200 border border-gray-200 hover:border-gray-300 cursor-pointer"
                                >
                                    <X size={16} />
                                    Limpar Filtros
                                </button>
                            )}
                            <button
                                onClick={() => {
                                    if (onApplyFilters) {
                                        onApplyFilters();
                                    }
                                    onClose();
                                }}
                                className="px-4 py-2 text-sm font-medium text-white bg-[var(--primary)] hover:bg-[var(--primary)]/90 rounded-lg flex items-center gap-2 transition-all duration-200 shadow-sm hover:shadow-md cursor-pointer"
                            >
                                Aplicar
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FilterPanel;
