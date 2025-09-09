import React from "react";
import { Search, Check } from "lucide-react";

interface SituacoesState {
  pendente: boolean;
  aAtender: boolean;
  emDeslocamento: boolean;
  emAtendimento: boolean;
  atendimentoInterrompido: boolean;
}

interface TecnicoFiltrosState {
  interno: boolean;
  terceiro: boolean;
  indefinido: boolean;
}

interface FilterPanelProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  situacoes: SituacoesState;
  setSituacoes: React.Dispatch<React.SetStateAction<SituacoesState>>;
  tecnicoFiltros: TecnicoFiltrosState;
  setTecnicoFiltros: React.Dispatch<React.SetStateAction<TecnicoFiltrosState>>;
}

const FilterPanel: React.FC<FilterPanelProps> = ({
  searchTerm,
  setSearchTerm,
  situacoes,
  setSituacoes,
  tecnicoFiltros,
  setTecnicoFiltros,
}) => {
  // Função para alternar filtros de situação
  const toggleSituacao = (key: keyof SituacoesState) => {
    setSituacoes((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Função para alternar filtros de técnico
  const toggleTecnicoFiltro = (key: keyof TecnicoFiltrosState) => {
    setTecnicoFiltros((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-4 animate-fadeIn">
      <div className="p-4">
        <div className="flex flex-wrap gap-4 items-center">
          {/* Campo de busca com animação de foco */}
          <div className="relative w-full sm:w-auto">
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 transition-colors"
              aria-hidden="true"
            />
            <input
              type="text"
              placeholder="Digite o número, cliente ou máquina..."
              className="w-full sm:w-[400px] pl-9 pr-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-900 
                        placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 
                        transition-all shadow-sm text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              aria-label="Pesquisar ordens de serviço"
            />
          </div>

          {/* Filtros de Situação */}
          <div className="flex items-center flex-wrap gap-2">
            <span className="text-md font-medium text-gray-700">Situação:</span>
            <div className="flex flex-wrap gap-1">
              <FilterButton
                active={situacoes.pendente}
                onClick={() => toggleSituacao("pendente")}
                colorScheme="emerald"
                label="Pendente"
              />
              <FilterButton
                active={situacoes.aAtender}
                onClick={() => toggleSituacao("aAtender")}
                colorScheme="purple"
                label="A atender"
              />
              <FilterButton
                active={situacoes.emDeslocamento}
                onClick={() => toggleSituacao("emDeslocamento")}
                colorScheme="amber"
                label="Em deslocamento"
              />
              <FilterButton
                active={situacoes.emAtendimento}
                onClick={() => toggleSituacao("emAtendimento")}
                colorScheme="blue"
                label="Em atendimento"
              />
              <FilterButton
                active={situacoes.atendimentoInterrompido}
                onClick={() => toggleSituacao("atendimentoInterrompido")}
                colorScheme="red"
                label="Interrompido"
              />
            </div>
          </div>

          {/* Linha divisória vertical */}
          <div
            className="h-6 border-l border-gray-200 mx-1 hidden lg:block"
            aria-hidden="true"
          ></div>

          {/* Filtro de Técnico */}
          <div className="flex items-center flex-wrap gap-2">
            <span className="text-md font-medium text-gray-700">Técnicos:</span>
            <div className="flex flex-wrap gap-1">
              <FilterButton
                active={tecnicoFiltros.interno}
                onClick={() => toggleTecnicoFiltro("interno")}
                colorScheme="blue"
                label="Internos"
              />
              <FilterButton
                active={tecnicoFiltros.terceiro}
                onClick={() => toggleTecnicoFiltro("terceiro")}
                colorScheme="amber"
                label="Terceirizados"
              />
              <FilterButton
                active={tecnicoFiltros.indefinido}
                onClick={() => toggleTecnicoFiltro("indefinido")}
                colorScheme="red"
                label="Indefinidos"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Componente de botão de filtro reutilizável
interface FilterButtonProps {
  active: boolean;
  onClick: () => void;
  colorScheme: "emerald" | "purple" | "amber" | "blue" | "red";
  label: string;
}

const FilterButton: React.FC<FilterButtonProps> = React.memo(
  ({ active, onClick, colorScheme, label }) => {
    const colors = {
      emerald: "bg-emerald-100 text-emerald-800 border-emerald-200",
      purple: "bg-purple-100 text-purple-800 border-purple-200",
      amber: "bg-amber-100 text-amber-800 border-amber-200",
      blue: "bg-blue-100 text-blue-800 border-blue-200",
      red: "bg-red-100 text-red-800 border-red-200",
    };

    return (
      <button
        type="button"
        className={`px-2 py-1 rounded-md text-xs font-medium flex items-center gap-1 transition-all 
                 transform hover:scale-102 active:scale-95 cursor-pointer ${
                   active
                     ? `${colors[colorScheme]} shadow-sm`
                     : "bg-white text-gray-500 border border-gray-200 hover:bg-gray-50"
                 }`}
        onClick={onClick}
        aria-pressed={active}
      >
        <span
          className={`transition-opacity duration-200 ${
            active ? "opacity-100" : "opacity-0"
          }`}
        >
          {active && <Check className="w-3 h-3" />}
        </span>
        <span>{label}</span>
      </button>
    );
  }
);

FilterButton.displayName = "FilterButton";

export default React.memo(FilterPanel);
