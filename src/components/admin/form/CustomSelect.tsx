import React, { useRef } from "react";
import Select, { StylesConfig, Props as SelectProps } from "react-select";

export interface OptionType {
  value: string | number;
  label: string;
}

export const getCustomSelectStyles = <
  T extends OptionType = OptionType
>(): StylesConfig<T, boolean> => {
  return {
    control: (
      provided: Record<string, unknown>,
      state: { isFocused: boolean; isDisabled: boolean }
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
      backgroundColor: state.isDisabled ? "#f8fafc" : "#ffffff",
      opacity: state.isDisabled
        ? 1
        : typeof provided.opacity === "number"
        ? provided.opacity
        : 1,
      cursor: state.isDisabled ? "not-allowed" : "default",
    }),
    placeholder: (provided: Record<string, unknown>) => ({
      ...provided,
      color: "#94a3b8", 
    }),
    valueContainer: (provided: Record<string, unknown>) => ({
      ...provided,
      padding: "0 16px", 
    }),
    input: (provided: Record<string, unknown>) => ({
      ...provided,
      color: "#0f172a", 
    }),
    singleValue: (
      provided: Record<string, unknown>,
      state: { isDisabled: boolean }
    ) => ({
      ...provided,
      color: "#0f172a",
      opacity: state.isDisabled
        ? 1
        : typeof provided.opacity === "number"
        ? provided.opacity
        : 1,
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
      color: state.isSelected ? "white" : "#0f172a",
      cursor: "pointer",
    }),
    menu: (provided: Record<string, unknown>) => ({
      ...provided,
      borderRadius: "0.5rem",
      boxShadow:
        "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
      zIndex: 99999,
    }),
    menuPortal: (provided: Record<string, unknown>) => ({
      ...provided,
      zIndex: 99999,
    }),
  };
};

interface CustomSelectProps {
  id: string;
  label: string;
  required?: boolean;
  placeholder: string;
  inputValue?: string;
  onInputChange?: (newValue: string) => void;
  onChange: (selectedOption: OptionType | null) => void;
  options: OptionType[];
  value: OptionType | null;
  isLoading?: boolean;
  error?: string;
  minCharsToSearch?: number;
  noOptionsMessageFn?: (obj: { inputValue: string }) => string;
  components?: SelectProps<OptionType, false>["components"];
  isDisabled?: boolean;
  isSearchable?: boolean;
  isClearable?: boolean;
  className?: string;
  filterOption?: SelectProps<OptionType, false>["filterOption"];
}

const CustomSelect: React.FC<CustomSelectProps> = ({
  id,
  label,
  required = false,
  placeholder,
  inputValue,
  onInputChange,
  onChange,
  options,
  value,
  isLoading = false,
  error,
  minCharsToSearch = 3,
  noOptionsMessageFn,
  components,
  isDisabled = false,
  isSearchable = true,
  isClearable = true,
  className = "",
  filterOption,
}) => {
  // Using a properly typed ref for react-select that handles the methods we need
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const selectRef = useRef<any>(null);

  const defaultNoOptionsMessage = ({ inputValue }: { inputValue: string }) =>
    inputValue.length < minCharsToSearch
      ? `Digite pelo menos ${minCharsToSearch} caracteres para buscar...`
      : "Nenhum resultado encontrado";

  return (
    <div>
      <label
        htmlFor={id}
        className="block text-md font-medium text-slate-700 mb-1"
      >
        {label}
        {required && (
          <span className="text-red-500 ml-1" aria-label="obrigatório">
            *
          </span>
        )}
      </label>
      <Select
        id={id}
        placeholder={placeholder}
        {...(typeof inputValue === "string"
          ? {
              inputValue,
              onInputChange: onInputChange ?? (() => {}),
            }
          : {})}
        onChange={(newValue) => {
          // Safely cast the newValue to our expected type
          if (newValue && "value" in newValue && "label" in newValue) {
            onChange(newValue as OptionType);
          } else {
            onChange(null);
          }
        }}
        options={options}
        value={value}
        isLoading={isLoading}
        isSearchable={isSearchable}
        isClearable={isClearable}
        noOptionsMessage={noOptionsMessageFn || defaultNoOptionsMessage}
        styles={getCustomSelectStyles()}
        className={`react-select-container ${
          error ? "is-invalid" : ""
        } ${className}`}
        classNamePrefix="react-select"
        menuPortalTarget={
          typeof document !== "undefined" ? document.body : undefined
        }
        menuPosition="fixed"
        components={components}
        filterOption={filterOption}
        ref={selectRef}
        isDisabled={isDisabled}
        instanceId={id}
      />
      {error && <div className="text-red-500 text-sm mt-1">{error}</div>}
    </div>
  );
};

export default CustomSelect;
