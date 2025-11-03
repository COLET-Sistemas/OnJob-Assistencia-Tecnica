import React from "react";
import { Plus, Save, X, Edit, Trash2, Package, Check } from "lucide-react";
import type { OSPecaUtilizada } from "@/api/services/ordensServicoService";
import type { PecaOriginal, PecaRevisada } from "../types";

const buildOrigemKeyFromOriginal = (peca: PecaOriginal): string => {
  if (peca.id != null) {
    return `id:${peca.id}`;
  }

  if (peca.id_peca != null) {
    return `catalog:${peca.id_peca}`;
  }

  const descricao = (peca.descricao ?? peca.nome ?? "")
    .toLowerCase()
    .trim();
  const quantidade = peca.quantidade ?? 0;
  const fat = peca.id_fat ?? "na";

  return `fat:${fat}:${descricao}:${quantidade}`;
};

interface PecasTabProps {
  originais: PecaOriginal[];
  revisadas: PecaRevisada[];
  onAccept: (peca: PecaOriginal) => void;
  onAcceptAll: () => void;
  onAdd: () => void;
  onChange: (
    index: number,
    field: keyof OSPecaUtilizada,
    value: number | string
  ) => void;
  onEdit: (index: number) => void;
  onSave: (index: number) => void;
  onCancel: (index: number) => void;
  onDelete: (index: number) => void;
  onRestore: (index: number) => void;
}

const PecasTab: React.FC<PecasTabProps> = ({
  originais,
  revisadas,
  onAccept,
  onAcceptAll,
  onAdd,
  onChange,
  onEdit,
  onSave,
  onCancel,
  onDelete,
  onRestore,
}) => {
  const revisadasKeys = React.useMemo(() => {
    const keys = new Set<string>();

    revisadas.forEach((peca) => {
      if (peca.origemIdPeca != null) {
        keys.add(String(peca.origemIdPeca));
      } else if (peca.id != null) {
        keys.add(`id:${peca.id}`);
      }
    });

    return keys;
  }, [revisadas]);

  const allOriginaisAccepted =
    originais.length > 0 &&
    originais.every((peca) => revisadasKeys.has(buildOrigemKeyFromOriginal(peca)));

  const canAcceptAll = originais.length > 0 && !allOriginaisAccepted;

  return (
    <div className="p-6 space-y-8">
      <section>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Peças informadas pelo Técnico
          </h3>

          {originais.length > 0 && (
            <button
              className={`inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md border transition ${
                canAcceptAll
                  ? "border-[var(--primary)] text-[var(--primary)] hover:bg-[var(--primary)] hover:text-white"
                  : "border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed"
              }`}
              onClick={() => {
                if (canAcceptAll) {
                  onAcceptAll();
                }
              }}
              disabled={!canAcceptAll}
            >
              <Check className="h-4 w-4" />
              Aceitar todos
            </button>
          )}
        </div>

        {originais.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    FAT
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Código
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Descrição
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Qtd / Unidade_medida
                  </th>
                  <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {originais.map((peca, index) => {
                  const origemKey = buildOrigemKeyFromOriginal(peca);
                  const isAccepted = revisadasKeys.has(origemKey);

                  return (
                    <tr key={peca.id ?? peca.id_peca ?? index}>
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                        #{peca.id_fat ?? "-"}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                        {peca.codigo || "-"}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                        {peca.descricao ?? peca.nome ?? "-"}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                        <span className="font-medium text-gray-700">
                          {peca.quantidade}
                        </span>
                        <span className="ml-2 text-xs text-gray-500 uppercase">
                          {peca.unidade_medida || "-"}
                        </span>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          className={`inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-md border transition ${
                            isAccepted
                              ? "border-green-200 bg-green-50 text-green-700 cursor-default"
                              : "border-[var(--primary)] text-[var(--primary)] hover:bg-[var(--primary)] hover:text-white"
                          }`}
                          onClick={() => {
                            if (!isAccepted) {
                              onAccept(peca);
                            }
                          }}
                          disabled={isAccepted}
                        >
                          <Check className="h-4 w-4" />
                          {isAccepted ? "Aceito" : "Aceitar"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-6 bg-gray-50 rounded-md">
            <Package className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-500">
              Nenhuma peça informada pelo técnico.
            </p>
          </div>
        )}
      </section>

      <section>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Peças revisadas
          </h3>

          <button
            className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-[var(--primary)] hover:bg-[var(--primary)]/90"
            onClick={onAdd}
          >
            <Plus className="h-4 w-4 mr-1" />
            Adicionar
          </button>
        </div>

        {revisadas.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    FAT
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Código
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Descrição
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Qtd / Unidade_medida
                  </th>
                  <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {revisadas.map((peca, index) => {
                  const codigoAtual = (peca.codigo ?? "").trim();
                  const possuiCodigo = codigoAtual.length > 0;

                  return (
                    <tr
                      key={peca.id ?? peca.origemIdPeca ?? index}
                      className={peca.isDeleted ? "bg-red-50" : undefined}
                    >
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                        #{peca.id_fat ?? "-"}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                        {peca.isEditing ? (
                          <input
                            type="text"
                            className={`w-28 border rounded-md px-2 py-1 ${
                              possuiCodigo
                                ? "border-gray-300"
                                : "border-red-400 focus:border-red-500"
                            }`}
                            value={peca.codigo ?? ""}
                            onChange={(e) =>
                              onChange(index, "codigo", e.target.value)
                            }
                            placeholder="Código"
                          />
                        ) : possuiCodigo ? (
                          peca.codigo
                        ) : (
                          <span className="text-xs font-medium text-red-500">
                            Obrigatório
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                        {peca.isEditing ? (
                          <input
                            type="text"
                            className="w-full border border-gray-300 rounded-md px-2 py-1"
                            value={peca.descricao ?? ""}
                            onChange={(e) =>
                              onChange(index, "descricao", e.target.value)
                            }
                            placeholder="Descrição"
                          />
                        ) : (
                          peca.descricao ?? "-"
                        )}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                        {peca.isEditing ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              className="w-20 border border-gray-300 rounded-md px-2 py-1"
                              value={peca.quantidade ?? 0}
                              onChange={(e) =>
                                onChange(
                                  index,
                                  "quantidade",
                                  Number(e.target.value)
                                )
                              }
                              min={1}
                            />
                            <input
                              type="text"
                              className="w-20 border border-gray-300 rounded-md px-2 py-1 uppercase"
                              value={peca.unidade_medida ?? ""}
                              onChange={(e) =>
                                onChange(index, "unidade_medida", e.target.value)
                              }
                              placeholder="Unid."
                            />
                          </div>
                        ) : (
                          <span className="text-sm text-gray-900">
                            <span className="font-medium text-gray-700">
                              {peca.quantidade}
                            </span>
                            <span className="ml-2 text-xs text-gray-500 uppercase">
                              {peca.unidade_medida && peca.unidade_medida.trim().length > 0
                                ? peca.unidade_medida
                                : "s/ unidade_medida"}
                            </span>
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-right text-sm font-medium">
                        {peca.isDeleted ? (
                          <button
                            className="text-green-600 hover:text-green-900"
                            onClick={() => onRestore(index)}
                          >
                            Restaurar
                          </button>
                        ) : peca.isEditing ? (
                          <div className="flex gap-2 justify-end">
                            <button
                              className={`text-green-600 hover:text-green-900 ${
                                possuiCodigo
                                  ? ""
                                  : "opacity-40 cursor-not-allowed hover:text-green-600"
                              }`}
                              onClick={() => {
                                if (possuiCodigo) {
                                  onSave(index);
                                }
                              }}
                              disabled={!possuiCodigo}
                              title={
                                possuiCodigo
                                  ? undefined
                                  : "Informe o código antes de salvar"
                              }
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
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-6 bg-gray-50 rounded-md">
            <Package className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-500">Nenhuma peça revisada.</p>
            <button
              className="mt-2 text-[var(--primary)] hover:underline text-sm"
              onClick={onAdd}
            >
              Adicionar peça
            </button>
          </div>
        )}
      </section>
    </div>
  );
};

export default PecasTab;
