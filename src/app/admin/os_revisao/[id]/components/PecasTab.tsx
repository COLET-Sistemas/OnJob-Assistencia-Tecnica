import React from "react";
import { Plus, Save, X, Edit, Trash2, Package } from "lucide-react";
import type { OSPecaUtilizada } from "@/api/services/ordensServicoService";
import type { PecaRevisada } from "../types";

interface PecasTabProps {
  pecas: PecaRevisada[];
  onAdd: () => void;
  onChange: (index: number, field: keyof OSPecaUtilizada, value: number | string) => void;
  onEdit: (index: number) => void;
  onSave: (index: number) => void;
  onCancel: (index: number) => void;
  onDelete: (index: number) => void;
  onRestore: (index: number) => void;
}

const PecasTab: React.FC<PecasTabProps> = ({
  pecas,
  onAdd,
  onChange,
  onEdit,
  onSave,
  onCancel,
  onDelete,
  onRestore,
}) => {
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Pecas</h3>

        <button
          className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-[var(--primary)] hover:bg-[var(--primary)]/90"
          onClick={onAdd}
        >
          <Plus className="h-4 w-4 mr-1" />
          Adicionar
        </button>
      </div>

      {pecas.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  FAT
                </th>
                <th
                  scope="col"
                  className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Codigo
                </th>
                <th
                  scope="col"
                  className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Descricao
                </th>
                <th
                  scope="col"
                  className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Qtd
                </th>
                <th
                  scope="col"
                  className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Acoes
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {pecas.map((peca, index) => (
                <tr key={peca.id || index} className={`${peca.isDeleted ? "bg-red-50" : ""}`}>
                  <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                    #{peca.id_fat || "-"}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                    {peca.isEditing ? (
                      <input
                        type="text"
                        className="w-24 border border-gray-300 rounded-md px-2 py-1"
                        value={peca.codigo || ""}
                        onChange={(e) => onChange(index, "codigo", e.target.value)}
                        placeholder="Codigo"
                      />
                    ) : (
                      peca.codigo || "-"
                    )}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                    {peca.isEditing ? (
                      <input
                        type="text"
                        className="w-full border border-gray-300 rounded-md px-2 py-1"
                        value={peca.descricao || ""}
                        onChange={(e) => onChange(index, "descricao", e.target.value)}
                        placeholder="Descricao"
                      />
                    ) : (
                      peca.descricao || "-"
                    )}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                    {peca.isEditing ? (
                      <input
                        type="number"
                        className="w-16 border border-gray-300 rounded-md px-2 py-1"
                        value={peca.quantidade || 0}
                        onChange={(e) => onChange(index, "quantidade", Number(e.target.value))}
                        min="1"
                      />
                    ) : (
                      peca.quantidade
                    )}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-right text-sm font-medium">
                    {peca.isDeleted ? (
                      <button className="text-green-600 hover:text-green-900" onClick={() => onRestore(index)}>
                        Restaurar
                      </button>
                    ) : peca.isEditing ? (
                      <div className="flex gap-2 justify-end">
                        <button className="text-green-600 hover:text-green-900" onClick={() => onSave(index)}>
                          <Save className="h-4 w-4" />
                        </button>
                        <button className="text-red-600 hover:text-red-900" onClick={() => onCancel(index)}>
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-2 justify-end">
                        <button className="text-blue-600 hover:text-blue-900" onClick={() => onEdit(index)}>
                          <Edit className="h-4 w-4" />
                        </button>
                        <button className="text-red-600 hover:text-red-900" onClick={() => onDelete(index)}>
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-6 bg-gray-50 rounded-md">
          <Package className="h-8 w-8 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-500">Nenhuma peca registrada.</p>
          <button
            className="mt-2 text-[var(--primary)] hover:underline text-sm"
            onClick={onAdd}
          >
            Adicionar peca
          </button>
        </div>
      )}
    </div>
  );
};

export default PecasTab;