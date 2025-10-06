"use client";

import React from "react";
import EmptyState from "./EmptyState";

interface Column<T> {
  header: string;
  accessor: keyof T | ((item: T) => React.ReactNode);
  render?: (item: T) => React.ReactNode;
  className?: string;
}

interface EnhancedDataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyField: keyof T;
  emptyStateProps?: {
    title: string;
    description: string;
  };
  expandedRowId?: number | string | null;
  onRowExpand?: (id: number | string) => void;
  onRowClick?: (item: T) => void;
  renderExpandedRow?: (item: T) => React.ReactNode;
}

function EnhancedDataTable<T extends object>({
  columns,
  data,
  keyField,
  emptyStateProps = {
    title: "Nenhum item encontrado",
    description: "Tente ajustar seus filtros ou cadastre um novo item.",
  },
  expandedRowId,
  onRowExpand,
  onRowClick,
  renderExpandedRow,
}: EnhancedDataTableProps<T>): React.ReactElement {
  return (
    <div className="overflow-x-auto overflow-y-auto max-h-[67vh] scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
      <table className="w-full table-auto border-separate border-spacing-0">
        <thead className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-200 sticky top-0 z-10">
          <tr>
            {columns.map((column, index) => (
              <th
                key={index}
                className={`px-6 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider ${
                  column.className || ""
                }`}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-100">
          {data.length > 0 ? (
            data.map((item) => {
              const id = String(item[keyField]);
              const isExpanded =
                expandedRowId !== undefined &&
                expandedRowId !== null &&
                String(expandedRowId) === id;

              return (
                <React.Fragment key={id}>
                  <tr
                    className="hover:bg-[var(--primary)]/5 transition-all duration-200 hover:shadow-sm cursor-pointer"
                    onClick={() => {
                      if (onRowClick) {
                        onRowClick(item);
                      } else if (onRowExpand) {
                        onRowExpand(id as string | number);
                      }
                    }}
                  >
                    {columns.map((column, colIndex) => (
                      <td
                        key={colIndex}
                        className={`px-6 py-3 text-sm text-gray-800 ${
                          column.className || ""
                        }`}
                      >
                        {column.render
                          ? column.render(item)
                          : typeof column.accessor === "function"
                          ? column.accessor(item)
                          : String(item[column.accessor] || "")}
                      </td>
                    ))}
                  </tr>
                  {isExpanded && renderExpandedRow && (
                    <tr>
                      <td colSpan={columns.length} className="p-0">
                        {renderExpandedRow(item)}
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })
          ) : (
            <tr>
              <td colSpan={columns.length} className="px-6 py-4">
                <EmptyState
                  title={emptyStateProps.title}
                  description={emptyStateProps.description}
                />
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export default EnhancedDataTable;
