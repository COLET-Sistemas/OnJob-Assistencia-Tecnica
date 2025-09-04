"use client";

import React from "react";
import EmptyState from "./EmptyState";

interface Column<T> {
  header: string;
  accessor: keyof T | ((item: T) => React.ReactNode);
  render?: (item: T) => React.ReactNode;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyField: keyof T;
  emptyStateProps?: {
    title: string;
    description: string;
  };
  expandedRowId?: number | string | null;
  onRowExpand?: (id: number | string) => void;
  renderExpandedRow?: (item: T) => React.ReactNode;
}

function DataTable<T extends object>({
  columns,
  data,
  keyField,
  emptyStateProps = {
    title: "Nenhum item encontrado",
    description: "Tente ajustar seus filtros ou cadastre um novo item.",
  },
  expandedRowId,
  // onRowExpand is received but no longer used directly by the DataTable component.
  // It's still needed as an interface since component users call it directly.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onRowExpand,
  renderExpandedRow,
}: DataTableProps<T>): React.ReactElement {
  // Row expansion is now handled only by specific controls (like the contacts button)
  // and not by clicking anywhere in the row
  return (
    <div className="overflow-x-auto overflow-y-auto max-h-[70vh] scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
      <table className="w-full table-auto border-separate border-spacing-0">
        <thead className="bg-[var(--neutral-light-gray)] border-b border-gray-100 sticky top-0 z-10">
          <tr>
            {columns.map((column, index) => (
              <th
                key={index}
                className="px-6 py-4 text-left text-xs font-semibold text-[var(--dark-navy)] uppercase tracking-wider"
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
                  <tr className="hover:bg-[var(--primary)]/5 transition-colors duration-150">
                    {columns.map((column, colIndex) => (
                      <td
                        key={colIndex}
                        className="px-6 py-4 whitespace-nowrap text-black"
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
                      <td
                        colSpan={columns.length}
                        className="px-6 pb-5 pt-2 bg-[var(--primary)]/5"
                      >
                        {renderExpandedRow(item)}
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })
          ) : (
            <EmptyState
              title={emptyStateProps.title}
              description={emptyStateProps.description}
            />
          )}
        </tbody>
      </table>
    </div>
  );
}

export default DataTable;
