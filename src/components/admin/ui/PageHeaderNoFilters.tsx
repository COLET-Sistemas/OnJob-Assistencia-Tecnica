"use client";
import { Plus } from "lucide-react";
import Link from "next/link";
import React from "react";

interface CustomListConfig {
  type: "list";
  itemCount: number;
  newButton: {
    label: string;
    link?: string;
    onClick?: () => void;
  };
}

interface PageHeaderNoFiltersProps {
  title: string;
  config: CustomListConfig;
}

const PageHeaderNoFilters: React.FC<PageHeaderNoFiltersProps> = ({
  title,
  config,
}) => {
  return (
    <header className="mb-5">
      <div className="p-5 rounded-xl shadow-sm border border-slate-200 bg-gradient-to-r from-[var(--neutral-white)] to-[var(--secondary-green)]/20 min-h-[88px]">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold text-[var(--neutral-graphite)] flex items-center">
            <span className="bg-[var(--primary)] h-6 w-1 rounded-full mr-3"></span>
            {title}
            <span className="ml-2 bg-[var(--primary)]/10 text-[var(--primary)] text-sm px-3 py-0.5 rounded-full font-medium">
              {config.itemCount}
            </span>
          </h2>

          <div className="flex items-center gap-3">
            {config.newButton.onClick ? (
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
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default PageHeaderNoFilters;
