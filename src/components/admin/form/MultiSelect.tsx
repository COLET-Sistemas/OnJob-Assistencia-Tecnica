import React from "react";
import Select, { StylesConfig } from "react-select";
import { AlertCircle } from "lucide-react";

export interface OptionType {
  value: string | number;
  label: string;
}

export const getMultiSelectStyles = (): StylesConfig<OptionType, true> => {
  return {
    control: (
      provided: Record<string, unknown>,
      state: { isFocused: boolean }
    ) => ({
      ...provided,
      borderColor: state.isFocused ? "var(--primary)" : "#e2e8f0",
      boxShadow: state.isFocused ? "0 0 0 1px var(--primary)" : "none",
      "&:hover": {
        borderColor: state.isFocused ? "var(--primary)" : "#cbd5e0",
      },
      borderRadius: "0.5rem", // rounded-lg
      minHeight: "48px", // py-3 equivalent
      padding: "0",
    }),
    placeholder: (provided: Record<string, unknown>) => ({
      ...provided,
      color: "#64748b", // text-slate-500 (matching SelectField's placeholder color)
    }),
    valueContainer: (provided: Record<string, unknown>) => ({
      ...provided,
      padding: "0 16px", // px-4
    }),
    input: (provided: Record<string, unknown>) => ({
      ...provided,
      color: "#0f172a", // text-slate-900
    }),
    multiValue: (provided: Record<string, unknown>) => ({
      ...provided,
      backgroundColor: "rgba(124, 84, 189, 0.1)",
      borderRadius: "0.25rem", // rounded
    }),
    multiValueLabel: (provided: Record<string, unknown>) => ({
      ...provided,
      color: "var(--primary)",
      fontWeight: 500,
    }),
    multiValueRemove: (provided: Record<string, unknown>) => ({
      ...provided,
      color: "var(--primary)",
      "&:hover": {
        backgroundColor: "var(--primary)",
        color: "white",
      },
    }),
    option: (
      provided: Record<string, unknown>,
      state: { isSelected: boolean; isFocused: boolean }
    ) => ({
      ...provided,
      backgroundColor: state.isSelected
        ? "var(--primary)"
        : state.isFocused
        ? "rgba(124, 84, 189, 0.1)"
        : "transparent",
      color: state.isSelected ? "white" : "#0f172a", // text-slate-900
      cursor: "pointer",
    }),
    menu: (provided: Record<string, unknown>) => ({
      ...provided,
      borderRadius: "0.5rem", // rounded-lg
      boxShadow:
        "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
      zIndex: 99999, // Increased to ensure it's on top of everything
    }),
    menuPortal: (provided: Record<string, unknown>) => ({
      ...provided,
      zIndex: 99999, // Also ensuring the portal has high z-index
    }),
  };
};

interface MultiSelectProps {
  label: string;
  name: string;
  value: OptionType[];
  options: OptionType[];
  error?: string;
  required?: boolean;
  onChange: (selectedOptions: OptionType[]) => void;
  className?: string;
  placeholder?: string;
  isDisabled?: boolean;
}

const MultiSelect: React.FC<MultiSelectProps> = ({
  label,
  name,
  value,
  options,
  error,
  required = false,
  onChange,
  className = "",
  placeholder = "Selecione...",
  isDisabled = false,
}) => {
  const selectId = `select-${name}`;
  const errorId = `error-${name}`;

  const handleChange = (selectedOptions: readonly OptionType[]) => {
    onChange(selectedOptions as OptionType[]);
  };

  return (
    <div className="space-y-1">
      <label
        htmlFor={selectId}
        className="block text-md font-medium text-slate-700 transition-colors"
      >
        {label}
        {required && (
          <span className="text-red-500 ml-1" aria-label="obrigatório">
            *
          </span>
        )}
      </label>

      <div className="relative">
        <Select
          id={selectId}
          isMulti
          value={value}
          onChange={handleChange}
          options={options}
          placeholder={placeholder}
          isDisabled={isDisabled}
          styles={getMultiSelectStyles()}
          className={`react-select-container ${
            error ? "is-invalid" : ""
          } ${className}`}
          classNamePrefix="react-select"
          noOptionsMessage={() => "Nenhuma opção disponível"}
          menuPortalTarget={
            typeof document !== "undefined" ? document.body : undefined
          }
          menuPosition="fixed"
        />
      </div>

      {error && (
        <div
          id={errorId}
          role="alert"
          className="flex items-center gap-1 text-sm text-red-600 animate-in fade-in slide-in-from-top-1 duration-200"
        >
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};

export default MultiSelect;
