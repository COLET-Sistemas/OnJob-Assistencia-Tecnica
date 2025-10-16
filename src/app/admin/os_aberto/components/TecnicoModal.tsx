import React, { useState, useEffect } from "react";
import { X, UserPlus, UserCog, RotateCcw } from "lucide-react";
import api from "../../../../api/api";

interface Tecnico {
  id: number;
  nome: string;
  tipo: "interno" | "terceiro";
  ativo: boolean;
}

// Interface para o retorno da API de usuários por região
interface UsuarioRegiao {
  id_usuario: number;
  nome_usuario: string;
  tipo: "interno" | "terceiro";
  regioes: Array<{
    id_regiao: number;
    nome_regiao: string;
  }>;
}

interface ApiResponse {
  total_registros: number;
  total_paginas: number;
  dados: UsuarioRegiao[];
}

interface TecnicoModalProps {
  isOpen: boolean;
  osId: number;
  idRegiao: number;
  nomeRegiao?: string; // Nova prop para o nome da região
  mode: "add" | "edit";
  currentTecnicoId?: number;
  currentTecnicoNome?: string;
  onClose: () => void;
  onConfirm: (
    osId: number,
    tecnicoId: number,
    tecnicoNome: string
  ) => Promise<void>;
}

const TecnicoModal: React.FC<TecnicoModalProps> = ({
  isOpen,
  osId,
  idRegiao,
  nomeRegiao, // Nova prop
  mode,
  currentTecnicoId,
  currentTecnicoNome,
  onClose,
  onConfirm,
}) => {
  const [selectedTecnico, setSelectedTecnico] = useState<Tecnico | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingTecnicos, setIsLoadingTecnicos] = useState(true);
  const [tecnicos, setTecnicos] = useState<Tecnico[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showAllTecnicos, setShowAllTecnicos] = useState(false);

  const fetchTecnicos = React.useCallback(
    async (fetchAll = false) => {
      if (!idRegiao && !fetchAll) {
        console.warn("ID da região não fornecido");
        setError("ID da região não encontrado");
        return;
      }

      setIsLoadingTecnicos(true);
      setError(null);

      try {
        console.log(
          `Buscando técnicos ${fetchAll ? "todos" : `para região: ${idRegiao}`}`
        );

        // Parâmetros da requisição baseados no filtro
        const params: Record<string, string | number | boolean> | undefined =
          fetchAll ? undefined : { id_regiao: idRegiao };

        const data: ApiResponse = await api.get<ApiResponse>(
          "/usuarios_regioes",
          params ? { params } : undefined
        );

        console.log("Dados recebidos da API:", data);

        let tecnicosFormatados: Tecnico[];

        if (fetchAll) {
          // Se fetchAll for true, mostra todos os técnicos
          tecnicosFormatados = data.dados.map((usuario) => ({
            id: usuario.id_usuario,
            nome: usuario.nome_usuario,
            tipo: usuario.tipo,
            ativo: true,
          }));
        } else {
          // Filtrar apenas usuários que atendem a região específica
          tecnicosFormatados = data.dados
            .filter((usuario) => {
              return usuario.regioes.some(
                (regiao) => regiao.id_regiao === idRegiao
              );
            })
            .map((usuario) => ({
              id: usuario.id_usuario,
              nome: usuario.nome_usuario,
              tipo: usuario.tipo,
              ativo: true,
            }));
        }

        console.log("Técnicos formatados:", tecnicosFormatados);

        if (tecnicosFormatados.length === 0) {
          setError(
            fetchAll
              ? "Nenhum técnico encontrado"
              : "Nenhum técnico encontrado para esta região"
          );
          setTecnicos([]);
          return;
        }

        // Reordena a lista para mostrar o técnico atual no topo
        const orderedTecnicos = [...tecnicosFormatados];
        if (currentTecnicoId) {
          const currentTecnicoIndex = orderedTecnicos.findIndex(
            (tecnico) => tecnico.id === currentTecnicoId
          );

          if (currentTecnicoIndex !== -1) {
            const currentTecnico = orderedTecnicos.splice(
              currentTecnicoIndex,
              1
            )[0];
            orderedTecnicos.unshift(currentTecnico);
          }

          // Define o técnico atual como selecionado
          const currentTecnico = orderedTecnicos.find(
            (tecnico) => tecnico.id === currentTecnicoId
          );
          setSelectedTecnico(currentTecnico || null);
        } else {
          // Se não tiver técnico atual na OS, seleciona o primeiro da lista
          setSelectedTecnico(orderedTecnicos[0] || null);
        }

        setTecnicos(orderedTecnicos);
      } catch (error) {
        console.error("Erro ao buscar técnicos:", error);
        setError(
          error instanceof Error
            ? `Erro ao carregar técnicos: ${error.message}`
            : "Erro ao carregar técnicos"
        );
        setTecnicos([]);
      } finally {
        setIsLoadingTecnicos(false);
      }
    },
    [idRegiao, currentTecnicoId]
  );

  // Combinando os efeitos em um único efeito mais limpo
  useEffect(() => {
    if (!isOpen) {
      setSelectedTecnico(null);
      setError(null);
      setShowAllTecnicos(false);
      return;
    }

    if (idRegiao) {
      console.log(`Modal aberto para região: ${idRegiao}`);
      fetchTecnicos(false);
    }
  }, [isOpen, idRegiao, fetchTecnicos]);

  const handleResetFilter = () => {
    setShowAllTecnicos(true);
    fetchTecnicos(true);
  };

  const handleRestoreFilter = () => {
    setShowAllTecnicos(false);
    fetchTecnicos(false);
  };

  const handleConfirm = async () => {
    if (!selectedTecnico) return;

    setIsLoading(true);
    try {
      await api.patch(`/ordens_servico/liberacao?id=${osId}`, {
        id_tecnico: selectedTecnico.id,
      });

      await onConfirm(osId, selectedTecnico.id, selectedTecnico.nome);
      onClose();
    } catch (error) {
      console.error("Erro ao definir técnico:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      onClose();
    }
  };

  const getBadgeClasses = (tipo: "interno" | "terceiro") => {
    return tipo === "interno"
      ? "bg-amber-50 text-amber-600 border border-amber-100"
      : "bg-blue-50 text-blue-600 border border-blue-100";
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 animate-in fade-in-0 zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {mode === "add"
                ? `Selecionar Técnico - OS #${osId}`
                : `Alterar Técnico - OS #${osId}`}
            </h3>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={isLoading}
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          {isLoadingTecnicos ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <div className="w-12 h-12 mx-auto mb-3 text-red-400">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <p className="text-red-600 mb-1">{error}</p>
              <p className="text-sm text-gray-500 mb-3">
                {nomeRegiao
                  ? `Região: ${nomeRegiao} (ID: ${idRegiao})`
                  : `Região ID: ${idRegiao}`}
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-start gap-3 mb-1">
                <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  {mode === "add" ? (
                    <UserPlus size={20} className="text-blue-600" />
                  ) : (
                    <UserCog size={20} className="text-blue-600" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-600 mb-3">
                    Selecione o técnico que será responsável pela OS.
                  </p>

                  {mode === "edit" && currentTecnicoNome && (
                    <div className="mb-3">
                      <div className="flex justify-between">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Técnico atual:{" "}
                          <span className="font-medium text-blue-600">
                            {currentTecnicoNome}
                          </span>
                        </label>
                      </div>
                    </div>
                  )}

                  {tecnicos.length > 0 && (
                    <div className="mb-3">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Técnicos disponíveis:
                      </label>
                      <div className="max-h-32 overflow-y-auto border border-gray-200 rounded-md">
                        {tecnicos.map((tecnico) => {
                          const isCurrent = tecnico.id === currentTecnicoId;
                          const isSelected = selectedTecnico?.id === tecnico.id;

                          return (
                            <div
                              key={tecnico.id}
                              className={`px-3 py-2 border-b border-gray-100 last:border-b-0 flex items-center justify-between cursor-pointer hover:bg-gray-50 ${
                                isSelected ? "bg-blue-50" : ""
                              } ${isCurrent ? "bg-green-50" : ""}`}
                              onClick={() => setSelectedTecnico(tecnico)}
                            >
                              <div className="flex items-center gap-2">
                                <span
                                  className={`text-sm text-gray-600 ${
                                    isSelected || isCurrent ? "font-medium" : ""
                                  }`}
                                >
                                  {tecnico.nome}
                                </span>
                                {isCurrent && (
                                  <span className="text-green-600 text-xs">
                                    ✓ Atual
                                  </span>
                                )}
                              </div>
                              <span
                                className={`px-2 py-1 text-xs font-medium rounded-full ${getBadgeClasses(
                                  tecnico.tipo
                                )}`}
                              >
                                {tecnico.tipo === "interno"
                                  ? "Interno"
                                  : "Terceiro"}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Botões de filtro */}
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">
                      {nomeRegiao && !showAllTecnicos && (
                        <p className="text-sm text-gray-500 mt-1">
                          Região: {nomeRegiao}
                        </p>
                      )}
                    </span>
                    <div className="flex gap-2">
                      {!showAllTecnicos ? (
                        <button
                          onClick={handleResetFilter}
                          disabled={isLoading || isLoadingTecnicos}
                          className="flex items-center gap-1 px-3 py-1 text-xs font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <RotateCcw size={12} />
                          Ver todos os técnicos
                        </button>
                      ) : (
                        <button
                          onClick={handleRestoreFilter}
                          disabled={isLoading || isLoadingTecnicos}
                          className="flex items-center gap-1 px-3 py-1 text-xs font-medium text-gray-600 bg-gray-50 border border-gray-200 rounded-md hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <RotateCcw size={12} />
                          Filtrar por região
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50 rounded-b-lg">
          <button
            onClick={handleClose}
            disabled={isLoading || isLoadingTecnicos}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancelar
          </button>

          <button
            onClick={handleConfirm}
            disabled={
              !selectedTecnico || isLoading || isLoadingTecnicos || !!error
            }
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isLoading && (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            )}
            {isLoading
              ? "Processando..."
              : mode === "add"
              ? "Selecionar Técnico"
              : "Alterar Técnico"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TecnicoModal;
