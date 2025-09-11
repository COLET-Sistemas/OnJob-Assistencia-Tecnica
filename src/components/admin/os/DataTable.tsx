import React from "react";
import { motion } from "framer-motion";

interface DataTableProps {
  columns: { header: string; accessor: string }[];
  data: Record<string, unknown>[];
  emptyMessage?: string;
}

const DataTable: React.FC<DataTableProps> = ({
  columns,
  data,
  emptyMessage = "Nenhum dado disponível",
}) => {
  if (!data || data.length === 0) {
    return <div className="text-center py-8 text-gray-500">{emptyMessage}</div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {columns.map((column, index) => (
              <th
                key={index}
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data.map((row, rowIndex) => (
            <motion.tr
              key={rowIndex}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: rowIndex * 0.05 }}
              className="hover:bg-gray-50"
            >
              {columns.map((column, colIndex) => {
                const value = row[column.accessor];
                return (
                  <td
                    key={colIndex}
                    className="px-6 py-4 text-sm text-gray-900"
                  >
                    {value !== undefined && value !== null
                      ? String(value)
                      : "-"}
                  </td>
                );
              })}
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DataTable;
