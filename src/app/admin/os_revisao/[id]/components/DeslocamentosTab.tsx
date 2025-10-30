import React from "react";
import { Plus, Save, X, Edit, Trash2, MapPin } from "lucide-react";
import type { OSDeslocamento } from "@/api/services/ordensServicoService";
import type { DeslocamentoRevisado } from "../types";

interface DeslocamentosTabProps {
  deslocamentos: DeslocamentoRevisado[];
  onAdd: () => void;
  onChange: (
    index: number,
    field: keyof OSDeslocamento,
    value: number | string
  ) => void;
  onEdit: (index: number) => void;
  onSave: (index: number) => void;
  onCancel: (index: number) => void;
  onDelete: (index: number) => void;
  onRestore: (index: number) => void;
}

const DeslocamentosTab: React.FC<DeslocamentosTabProps> = ({
  deslocamentos,
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
        <h3 className="text-lg font-semibold text-gray-900">
          Deslocamentos Informados pelo Técnico
        </h3>

        <button
          className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-[var(--primary)] hover:bg-[var(--primary)]/90"
          onClick={onAdd}
        >
          <Plus className="h-4 w-4 mr-1" />
          Adicionar
        </button>
      </div>

      {deslocamentos.length > 0 ? (
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
                  KM Ida
                </th>
                <th
                  scope="col"
                  className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  KM Volta
                </th>
                <th
                  scope="col"
                  className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Tempo Ida
                </th>
                <th
                  scope="col"
                  className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Tempo Volta
                </th>
                <th
                  scope="col"
                  className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Observações
                </th>
                <th
                  scope="col"
                  className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {deslocamentos.map((deslocamento, index) => (
                <tr
                  key={deslocamento.id_deslocamento}
                  className={`${deslocamento.isDeleted ? "bg-red-50" : ""}`}
                >
                  <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                    #{deslocamento.id_fat || "-"}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                    {deslocamento.isEditing ? (
                      <input
                        type="number"
                        className="w-20 border border-gray-300 rounded-md px-2 py-1"
                        value={deslocamento.km_ida || 0}
                        onChange={(e) =>
                          onChange(index, "km_ida", Number(e.target.value))
                        }
                      />
                    ) : (
                      deslocamento.km_ida
                    )}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                    {deslocamento.isEditing ? (
                      <input
                        type="number"
                        className="w-20 border border-gray-300 rounded-md px-2 py-1"
                        value={deslocamento.km_volta || 0}
                        onChange={(e) =>
                          onChange(index, "km_volta", Number(e.target.value))
                        }
                      />
                    ) : (
                      deslocamento.km_volta
                    )}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                    {deslocamento.isEditing ? (
                      <input
                        type="number"
                        className="w-20 border border-gray-300 rounded-md px-2 py-1"
                        value={deslocamento.tempo_ida_min || 0}
                        onChange={(e) =>
                          onChange(
                            index,
                            "tempo_ida_min",
                            Number(e.target.value)
                          )
                        }
                      />
                    ) : (
                      deslocamento.tempo_ida_min
                    )}{" "}
                    min
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                    {deslocamento.isEditing ? (
                      <input
                        type="number"
                        className="w-20 border border-gray-300 rounded-md px-2 py-1"
                        value={deslocamento.tempo_volta_min || 0}
                        onChange={(e) =>
                          onChange(
                            index,
                            "tempo_volta_min",
                            Number(e.target.value)
                          )
                        }
                      />
                    ) : (
                      deslocamento.tempo_volta_min
                    )}{" "}
                    min
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                    {deslocamento.isEditing ? (
                      <input
                        type="text"
                        className="w-full border border-gray-300 rounded-md px-2 py-1"
                        value={deslocamento.observacoes || ""}
                        onChange={(e) =>
                          onChange(index, "observacoes", e.target.value)
                        }
                      />
                    ) : (
                      deslocamento.observacoes || "-"
                    )}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-right text-sm font-medium">
                    {deslocamento.isDeleted ? (
                      <button
                        className="text-green-600 hover:text-green-900"
                        onClick={() => onRestore(index)}
                      >
                        Restaurar
                      </button>
                    ) : deslocamento.isEditing ? (
                      <div className="flex gap-2 justify-end">
                        <button
                          className="text-green-600 hover:text-green-900"
                          onClick={() => onSave(index)}
                        >
                          <Save className="h-4 w-4" />
                        </button>
                        <button
                          className="text-red-600 hover:text-red-900"
                          onClick={() => onCancel(index)}
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-2 justify-end">
                        <button
                          className="text-blue-600 hover:text-blue-900"
                          onClick={() => onEdit(index)}
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          className="text-red-600 hover:text-red-900"
                          onClick={() => onDelete(index)}
                        >
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
          <MapPin className="h-8 w-8 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-500">Nenhum deslocamento registrado.</p>
          <button
            className="mt-2 text-[var(--primary)] hover:underline text-sm"
            onClick={onAdd}
          >
            Adicionar deslocamento
          </button>
        </div>
      )}
    </div>
  );
};

export default DeslocamentosTab;
