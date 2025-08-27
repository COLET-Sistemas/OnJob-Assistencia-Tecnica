import React from "react";
import { AlertCircle } from "lucide-react";

interface SelectFieldProps {
  label: string;
  name: string;
  value: string | number;
  options: Array<{ value: string | number; label: string }>;
  error?: string;
  required?: boolean;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  className?: string;
}

const SelectField: React.FC<SelectFieldProps> = ({
  label,
  name,
  value,
  options,
  error,
  required = false,
  onChange,
  className = "",
}) => {
  const selectId = `select-${name}`;
  const errorId = `error-${name}`;

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
        <select
          id={selectId}
          name={name}
          value={value}
          onChange={onChange}
          className={`
            w-full px-4 py-3 rounded-lg border transition-all duration-200
            focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500
            text-slate-900
            ${
              error
                ? "border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-500/20"
                : "border-slate-300 bg-white hover:border-slate-400"
            }
            ${className}
          `}
          aria-describedby={error ? errorId : undefined}
          aria-invalid={!!error}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
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

export default SelectField;
