"use client";

import { CheckCircle, Filter, Search, X } from "lucide-react";
import React, { KeyboardEvent, useEffect, useState, useCallback } from "react";

interface FilterOption {
  id: string;
  label: string;
  type: "text" | "select" | "checkbox";
  placeholder?: string;
  options?: Array<{ value: string; label: string }>;
}

interface FilterPanelProps {
  title: string;
  pageName?: string; 
  filterOptions: FilterOption[];
  filterValues: Record<string, string>;
  onFilterChange: (key: string, value: string) => void;
  onClearFilters: () => void;
  onClose: () => void;
  onApplyFilters?: () => void;
  isOpen?: boolean; 
}

const FilterPanel: React.FC<FilterPanelProps> = ({
  title,
  pageName,
  filterOptions,
  filterValues,
  onFilterChange,
  onClearFilters,
  onClose,
  onApplyFilters,
  isOpen = true,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  // Check if any filter is active
  const hasActiveFilters = Object.values(filterValues).some(
    (value) => value !== ""
  );

  // Controla a animação de entrada
  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
    }
  }, [isOpen]);

  // Função para fechar com animação
  const handleClose = useCallback(() => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
      setIsClosing(false);
      setIsVisible(false);
    }, 300);
  }, [onClose]);

  // Função para aplicar filtros com animação de fechamento
  const handleApplyFilters = useCallback(() => {
    if (onApplyFilters) {
      onApplyFilters();
    }
    handleClose();
  }, [onApplyFilters, handleClose]);

  // Função para limpar filtros com animação de fechamento
  const handleClearFilters = useCallback(() => {
    onClearFilters();
    handleClose();
  }, [onClearFilters, handleClose]);

  // Handle Enter key press to apply filters
  const handleKeyDown = (
    e: KeyboardEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    if (e.key === "Enter" && onApplyFilters) {
    
      if (
        e.currentTarget.tagName === "INPUT" &&
        e.currentTarget.type === "text"
      ) {
        const value = e.currentTarget.value;
        if (value && value.length < 3) {
         
          return;
        }
      }
      handleApplyFilters();
    }
  };

  // Handle Escape key to close
  useEffect(() => {
    const handleEscape = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") {
        handleClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [handleClose]);

  if (!isVisible) return null;

  return (
    <>
      {/* Overlay de fundo escuro com animação */}
      <div
        className={`fixed inset-0 bg-black/10 backdrop-blur-[1px] z-40 transition-all duration-300 ${
          isClosing ? "opacity-0" : "opacity-100"
        }`}
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Painel de filtros com animação aprimorada */}
      <div
        className={`fixed inset-y-0 right-0 z-50 w-80 lg:w-96 bg-white shadow-2xl h-screen overflow-hidden border-l border-gray-200/80 transition-all duration-300 ease-out ${
          isClosing
            ? "transform translate-x-full opacity-0"
            : "transform translate-x-0 opacity-100"
        }`}
        style={{
          animation: isClosing ? undefined : "slideInRight 0.3s ease-out",
        }}
      >
        {/* Header com animação sutil */}
        <div
          className={`bg-gradient-to-r from-[var(--primary)]/5 to-[var(--secondary-green)]/5 px-6 py-4 border-b border-gray-100 sticky top-0 z-10 transition-all duration-300 ${
            isClosing
              ? "opacity-0 transform -translate-y-2"
              : "opacity-100 transform translate-y-0"
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-[var(--primary)]/10 rounded-lg flex items-center justify-center transition-transform duration-200 hover:scale-110">
                <Filter size={16} className="text-[var(--primary)]" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-[var(--neutral-graphite)]">
                  {pageName ? `${pageName} - ${title}` : title}
                </h3>
                <p className="text-xs text-gray-500">
                  Refine sua busca pelos critérios abaixo
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded-full transition-all duration-200 cursor-pointer hover:scale-110"
            >
              <X size={18} className="text-gray-500" />
            </button>
          </div>
        </div>

        <div
          className={`p-6 overflow-y-auto h-[calc(100vh-200px)] transition-all duration-300 ${
            isClosing
              ? "opacity-0 transform translate-x-4"
              : "opacity-100 transform translate-x-0"
          }`}
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();

              // Check if any text input has less than 3 characters
              const textInputs = Array.from(
                e.currentTarget.querySelectorAll('input[type="text"]')
              );
              const invalidInput = textInputs.find((input) => {
                const value = (input as HTMLInputElement).value.trim();
                return value !== "" && value.length < 3;
              });

              // If there's an invalid input, don't submit
              if (invalidInput) {
                return;
              }

              handleApplyFilters();
            }}
            className="space-y-6"
          >
            {/* Hidden submit button to allow form submission with Enter key */}
            <button type="submit" className="sr-only" aria-hidden="true">
              Aplicar Filtros
            </button>
            {filterOptions.map((option, index) => (
              <div
                key={option.id}
                className="space-y-3 animate-fadeInUp"
                style={{
                  animationDelay: `${index * 50}ms`,
                  animationFillMode: "both",
                }}
              >
                <label className="block text-sm font-semibold text-[var(--neutral-graphite)] mb-3">
                  {option.label}
                </label>
                <div className="relative group">
                  {option.type === "text" && (
                    <div className="space-y-2">
                      <div className="relative">
                        <input
                          type="text"
                          value={filterValues[option.id] || ""}
                          onChange={(e) => {
                            const value = e.target.value;
                            onFilterChange(option.id, value);
                          }}
                          onKeyDown={handleKeyDown}
                          placeholder={
                            option.placeholder ||
                            "Digite o nome ou razão social"
                          }
                          className={`w-full px-4 py-3 pl-11 bg-white border-2 ${
                            filterValues[option.id] &&
                            filterValues[option.id].length > 0 &&
                            filterValues[option.id].length < 3
                              ? "border-red-400 focus:border-red-500 focus:ring-red-200"
                              : "border-gray-200 focus:border-[var(--primary)] focus:ring-[var(--primary)]/20"
                          } rounded-xl text-sm text-[var(--neutral-graphite)] placeholder-[var(--neutral-graphite)]/60 transition-all duration-200 focus:bg-white focus:ring-2 focus:outline-none group-hover:border-gray-300 focus:scale-[1.01]`}
                          autoComplete="off"
                          title={
                            filterValues[option.id] &&
                            filterValues[option.id].length < 3
                              ? "Digite pelo menos 3 caracteres"
                              : ""
                          }
                        />
                        <Search
                          size={16}
                          className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 transition-all duration-200 group-focus-within:text-[var(--primary)] group-focus-within:scale-110"
                        />
                      </div>
                      {filterValues[option.id] &&
                        filterValues[option.id].length > 0 &&
                        filterValues[option.id].length < 3 && (
                          <p className="text-xs text-red-500 mt-1 ml-1 animate-fadeIn">
                            Digite pelo menos 3 caracteres
                          </p>
                        )}
                    </div>
                  )}
                  {option.type === "select" && (
                    <>
                      <select
                        value={filterValues[option.id] || ""}
                        onChange={(e) =>
                          onFilterChange(option.id, e.target.value)
                        }
                        onKeyDown={handleKeyDown}
                        className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl text-sm text-gray-800 appearance-none cursor-pointer transition-all duration-200 focus:bg-white focus:border-[var(--primary)] focus:ring-4 focus:ring-[var(--primary)]/10 focus:outline-none group-hover:border-gray-300 focus:scale-[1.01]"
                      >
                        {option.options?.map((opt) => (
                          <option
                            key={opt.value}
                            value={opt.value}
                            className={
                              opt.value === ""
                                ? "text-gray-500"
                                : "text-gray-800"
                            }
                          >
                            {opt.label}
                          </option>
                        ))}
                      </select>
                      <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none">
                        <svg
                          className="w-4 h-4 text-gray-400 transition-all duration-200 group-focus-within:text-[var(--primary)] group-focus-within:rotate-180"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                      </div>
                    </>
                  )}
                  {option.type === "checkbox" && (
                    <div
                      className={`flex items-center p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer hover:scale-[1.01] ${
                        filterValues[option.id] === "true"
                          ? "bg-[var(--primary)]/5 border-[var(--primary)] shadow-sm"
                          : "bg-white border-gray-200 hover:border-gray-300 hover:shadow-sm"
                      }`}
                      onClick={() =>
                        onFilterChange(
                          option.id,
                          filterValues[option.id] === "true" ? "" : "true"
                        )
                      }
                    >
                      <div className="flex items-center justify-between w-full">
                        <div className="flex flex-col">
                          <span
                            className={`text-sm font-medium transition-colors duration-200 ${
                              filterValues[option.id] === "true"
                                ? "text-[var(--primary)]"
                                : "text-gray-800"
                            }`}
                          >
                            {option.placeholder || "Incluir inativos"}
                          </span>
                        </div>
                        <div className="flex items-center">
                          <div
                            className={`relative w-12 h-6 flex items-center transition-all duration-300 ease-in-out ${
                              filterValues[option.id] === "true"
                                ? "bg-[var(--primary)]"
                                : "bg-gray-200"
                            } rounded-full shadow-inner`}
                          >
                            <input
                              type="checkbox"
                              className="sr-only"
                              checked={filterValues[option.id] === "true"}
                              onChange={(e) =>
                                onFilterChange(
                                  option.id,
                                  e.target.checked ? "true" : ""
                                )
                              }
                            />
                            <span
                              className={`absolute left-1 bg-white w-4 h-4 rounded-full transition-all duration-300 transform ${
                                filterValues[option.id] === "true"
                                  ? "translate-x-6 scale-110"
                                  : "scale-100"
                              } shadow-md flex items-center justify-center`}
                            >
                              {filterValues[option.id] === "true" && (
                                <span className="w-2 h-2 bg-[var(--primary)] rounded-full animate-scaleIn"></span>
                              )}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </form>

          {/* Espaçador para separar o conteúdo dos botões de ação */}
          <div className="mt-6"></div>
        </div>

        {/* Seção de Ações - Fixa na parte inferior com animação */}
        <div
          className={`border-t border-gray-200 bg-gray-50/80 p-4 sticky bottom-0 w-full flex flex-col gap-3 transition-all duration-300 ${
            isClosing
              ? "opacity-0 transform translate-y-4"
              : "opacity-100 transform translate-y-0"
          }`}
        >
          {/* Check if any text filter has invalid length (more than 0 but less than 3 chars) */}
          {(() => {
            const hasInvalidTextFilter = Object.entries(filterValues).some(
              ([key, value]) => {
                const option = filterOptions.find((opt) => opt.id === key);
                return (
                  option?.type === "text" &&
                  value &&
                  value.length > 0 &&
                  value.length < 3
                );
              }
            );

            return (
              <button
                onClick={() => {
                  if (hasInvalidTextFilter) return;
                  handleApplyFilters();
                }}
                disabled={hasInvalidTextFilter}
                className={`w-full py-3 text-sm font-medium text-white cursor-pointer transition-all duration-200 ${
                  hasInvalidTextFilter
                    ? "bg-gray-400 cursor-not-allowed scale-95"
                    : "bg-[var(--primary)] hover:bg-[var(--primary)]/90 shadow-sm hover:shadow-md hover:scale-[1.02] active:scale-95"
                } rounded-xl flex items-center justify-center gap-3 border border-[var(--primary)]/20`}
                title={
                  hasInvalidTextFilter
                    ? "Campos de texto precisam ter pelo menos 3 caracteres"
                    : ""
                }
              >
                <CheckCircle
                  size={18}
                  className="transition-transform duration-200"
                />
                <span>Aplicar Filtros</span>
              </button>
            );
          })()}

          {hasActiveFilters && (
            <button
              onClick={handleClearFilters}
              className="w-full py-3 text-sm font-medium text-[var(--neutral-graphite)] hover:text-[var(--primary)] bg-white hover:bg-gray-50 rounded-xl flex items-center justify-center gap-3 transition-all duration-200 border-2 border-gray-200 cursor-pointer hover:scale-[1.02] active:scale-95 hover:shadow-sm animate-fadeInUp"
            >
              <X size={18} className="transition-transform duration-200" />
              <span>Limpar Filtros</span>
            </button>
          )}
        </div>
      </div>

      {/* Estilos CSS personalizados para animações */}
      <style jsx>{`
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes scaleIn {
          from {
            transform: scale(0);
          }
          to {
            transform: scale(1);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }

        .animate-fadeInUp {
          animation: fadeInUp 0.3s ease-out;
        }

        .animate-scaleIn {
          animation: scaleIn 0.2s ease-out;
        }
      `}</style>
    </>
  );
};

export default FilterPanel;
