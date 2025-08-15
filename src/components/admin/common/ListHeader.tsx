"use client";

import { Filter, Plus } from "lucide-react";
import React from "react";

interface ListHeaderProps {
  title: string;
  itemCount: number;
  onFilterToggle: () => void;
  showFilters: boolean;
  newButtonLink: string;
  newButtonLabel: string;
  activeFiltersCount?: number;
  onNewButtonClick?: () => void;
}

const ListHeader: React.FC<ListHeaderProps> = ({
  title,
  itemCount,
  onFilterToggle,
  showFilters,
  newButtonLink,
  newButtonLabel,
  activeFiltersCount = 0,
  onNewButtonClick,
}) => {
  return (
    <div className="p-5 rounded-xl shadow-sm border border-slate-200 bg-gradient-to-r from-[var(--neutral-white)] to-[var(--secondary-green)]/20 mb-5">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-[var(--neutral-graphite)] flex items-center">
          <span className="bg-[var(--primary)] h-6 w-1 rounded-full mr-3"></span>
          {title}
          <span className="ml-2 bg-[var(--primary)]/10 text-[var(--primary)] text-sm px-3 py-0.5 rounded-full font-medium">
            {itemCount}
          </span>
        </h2>
        <div className="flex items-center gap-3">
          <div className="relative">
            <button
              onClick={onFilterToggle}
              className={`relative px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all duration-300 shadow-sm border cursor-pointer ${
                showFilters
                  ? "bg-[var(--primary)] text-white border-[var(--primary)] shadow-lg shadow-[var(--primary)]/25"
                  : "bg-white hover:bg-gray-50 text-[var(--neutral-graphite)] border-gray-200 hover:border-gray-300 hover:shadow-md"
              }`}
            >
              <Filter size={18} />
              <span className="font-medium">Filtros</span>
              {activeFiltersCount > 0 && (
                <div className="absolute -top-1 -right-1 flex items-center justify-center">
                  <span className="w-5 h-5 bg-[#F6C647] text-white text-xs font-bold rounded-full flex items-center justify-center shadow-lg">
                    {activeFiltersCount}
                  </span>
                </div>
              )}
            </button>
          </div>
          {onNewButtonClick ? (
            <button
              onClick={onNewButtonClick}
              className="bg-[var(--primary)] text-white px-5 py-2.5 rounded-xl flex items-center gap-2 transition-all duration-300 shadow-sm hover:shadow-lg border border-[var(--primary)] hover:bg-[var(--primary)]/90 hover:border-[var(--primary)]/90"
            >
              <Plus size={18} />
              {newButtonLabel}
            </button>
          ) : (
            <a
              href={newButtonLink}
              className="bg-[var(--primary)] text-white px-5 py-2.5 rounded-xl flex items-center gap-2 transition-all duration-300 shadow-sm hover:shadow-lg border border-[var(--primary)] hover:bg-[var(--primary)]/90 hover:border-[var(--primary)]/90"
            >
              <Plus size={18} />
              {newButtonLabel}
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

export default ListHeader;
