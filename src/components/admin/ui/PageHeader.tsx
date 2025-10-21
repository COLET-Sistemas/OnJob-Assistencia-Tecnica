"use client";

import { Filter, Plus, ArrowLeft } from "lucide-react";
import Link from "next/link";
import React from "react";

interface ListConfig {
  type: "list";
  itemCount: number;
  onFilterToggle?: () => void;
  showFilters?: boolean;
  activeFiltersCount?: number;
  newButton?: {
    label: string;
    link?: string;
    onClick?: () => void;
  };
  actions?: React.ReactNode;
}

interface FormConfig {
  type: "form";
  backLink: string;
  backLabel?: string;
}

interface PageHeaderProps {
  title: string;
  config: ListConfig | FormConfig;
}

const PageHeader: React.FC<PageHeaderProps> = ({ title, config }) => {
  // Renderizar header para listas
  if (config.type === "list") {
    const filterToggleActive = Boolean(config.showFilters);

    const renderDefaultActions = () => {
      const actionElements: React.ReactNode[] = [];

      if (config.onFilterToggle) {
        actionElements.push(
          <div className="relative" key="filter">
            <button
              onClick={config.onFilterToggle}
              className={`relative px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all duration-300 shadow-sm border cursor-pointer ${
                filterToggleActive
                  ? "bg-[var(--primary)] text-white border-[var(--primary)] shadow-lg shadow-[var(--primary)]/25"
                  : "bg-white hover:bg-gray-50 text-[var(--neutral-graphite)] border-gray-200 hover:border-gray-300 hover:shadow-md"
              }`}
            >
              <Filter size={18} />
              <span className="font-medium">Filtros</span>
              {(config.activeFiltersCount ?? 0) > 0 && (
                <div className="absolute -top-1 -right-1 flex items-center justify-center">
                  <span className="w-5 h-5 bg-[#FDAD15] text-white text-xs font-bold rounded-full flex items-center justify-center shadow-lg">
                    {config.activeFiltersCount}
                  </span>
                </div>
              )}
            </button>
          </div>
        );
      }

      if (config.newButton?.label) {
        const newButton = config.newButton.onClick ? (
          <button
            onClick={config.newButton.onClick}
            className="bg-[var(--primary)] text-white px-5 py-2.5 rounded-xl flex items-center gap-2 transition-all duration-300 shadow-sm hover:shadow-lg border border-[var(--primary)] hover:bg-[var(--primary)]/90 hover:border-[var(--primary)]/90"
          >
            <Plus size={18} />
            {config.newButton.label}
          </button>
        ) : (
          <Link
            href={config.newButton.link || "#"}
            className="bg-[var(--primary)] text-white px-5 py-2.5 rounded-xl flex items-center gap-2 transition-all duration-300 shadow-sm hover:shadow-lg border border-[var(--primary)] hover:bg-[var(--primary)]/90 hover:border-[var(--primary)]/90"
          >
            <Plus size={18} />
            {config.newButton.label}
          </Link>
        );

        actionElements.push(
          <React.Fragment key="new-button">{newButton}</React.Fragment>
        );
      }

      if (actionElements.length === 0) {
        return null;
      }

      return actionElements;
    };

    const actionsContent = config.actions ?? renderDefaultActions();

    return (
      <header className="mb-5">
        <div className="p-5 rounded-xl shadow-sm border border-slate-200 bg-gradient-to-r from-[var(--neutral-white)] to-[var(--secondary-green)]/20 min-h-[88px]">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-[var(--neutral-graphite)] flex items-center gap-3">
              {config.onFilterToggle && (
                <button
                  type="button"
                  onClick={config.onFilterToggle}
                  aria-label={
                    filterToggleActive
                      ? "Ocultar filtros de pesquisa"
                      : "Exibir filtros de pesquisa"
                  }
                  aria-pressed={filterToggleActive}
                  className={`flex items-center justify-center w-9 h-9 rounded-full border transition-all duration-200 ${
                    filterToggleActive
                      ? "bg-[var(--primary)] text-white border-[var(--primary)] shadow-md shadow-[var(--primary)]/30"
                      : "bg-white text-[var(--neutral-graphite)] border-gray-200 hover:bg-gray-50 hover:border-gray-300"
                  }`}
                >
                  <ArrowLeft size={16} />
                </button>
              )}
              <span className="bg-[var(--primary)] h-6 w-1 rounded-full"></span>
              <span className="flex items-center">
                {title}
                <span className="ml-2 bg-[var(--primary)]/10 text-[var(--primary)] text-sm px-3 py-0.5 rounded-full font-medium">
                  {config.itemCount}
                </span>
              </span>
            </h2>

            <div className="flex items-center gap-3">{actionsContent}</div>
          </div>
        </div>
      </header>
    );
  }

  // Renderizar header para formulários (cadastro/edição)
  return (
    <header className="mb-5">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 bg-gradient-to-r from-[var(--neutral-white)] to-[var(--primary)]/20 p-5 min-h-[88px] flex items-center">
        <div className="flex items-center gap-4 w-full">
          <Link
            href={config.backLink}
            className="p-2 text-slate-600 hover:text-[var(--primary)] hover:bg-violet-50 rounded-lg transition-colors"
            aria-label={config.backLabel || "Voltar"}
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="flex-1 flex items-center">
            <h2 className="text-xl font-bold text-[var(--neutral-graphite)] flex items-center">
              <span className="bg-[var(--primary)] h-6 w-1 rounded-full mr-3"></span>
              {title}
            </h2>
          </div>
        </div>
      </div>
    </header>
  );
};

export default PageHeader;
