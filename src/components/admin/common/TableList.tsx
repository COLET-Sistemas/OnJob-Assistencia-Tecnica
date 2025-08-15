"use client";

import React, { ReactNode } from "react";
import { DataTable, FilterPanel, ListContainer } from "./index";

interface Column<T> {
  header: string;
  accessor: keyof T | ((item: T) => React.ReactNode);
  render?: (item: T) => React.ReactNode;
}

interface FilterOption {
  id: string;
  label: string;
  type: "text" | "select" | "checkbox";
  placeholder?: string;
  options?: Array<{ value: string; label: string }>;
}

interface TableListProps<T> {
  title: string;
  items: T[];
  keyField: keyof T;
  columns: Column<T>[];
  loading?: boolean;
  showFilter?: boolean;
  filterOptions?: FilterOption[];
  filterValues?: Record<string, string>;
  onFilterChange?: (key: string, value: string) => void;
  onClearFilters?: () => void;
  onApplyFilters?: () => void;
  onFilterToggle?: () => void;
  renderActions?: (item: T) => ReactNode;
  emptyStateProps?: {
    title: string;
    description: string;
  };
  customHeader?: ReactNode;
}

function TableList<T extends object>({
  title,
  items,
  keyField,
  columns,
  showFilter = false,
  filterOptions = [],
  filterValues = {},
  onFilterChange = () => {},
  onClearFilters = () => {},
  onApplyFilters = () => {},
  onFilterToggle = () => {},
  renderActions,
  emptyStateProps,
  customHeader,
}: TableListProps<T>): React.ReactElement {
  // Add renderActions to columns if provided
  const finalColumns = renderActions
    ? [
        ...columns,
        {
          header: "Ações",
          accessor: (item: T) => renderActions(item),
        },
      ]
    : columns;

  return (
    <ListContainer>
      {customHeader}

      {showFilter && filterOptions.length > 0 && (
        <FilterPanel
          title="Filtros"
          pageName={title}
          filterOptions={filterOptions}
          filterValues={filterValues}
          onFilterChange={onFilterChange}
          onClearFilters={onClearFilters}
          onClose={onFilterToggle}
          onApplyFilters={onApplyFilters}
        />
      )}

      <DataTable
        columns={finalColumns}
        data={items}
        keyField={keyField}
        emptyStateProps={
          emptyStateProps || {
            title: "Nenhum item encontrado",
            description: "Tente ajustar seus filtros ou cadastre um novo item.",
          }
        }
      />
    </ListContainer>
  );
}

export default TableList;
