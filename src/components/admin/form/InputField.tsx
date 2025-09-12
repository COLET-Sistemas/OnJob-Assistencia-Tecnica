import React from "react";
import { AlertCircle } from "lucide-react";

interface InputFieldProps {
  label: string;
  name: string;
  value: string;
  error?: string;
  placeholder?: string;
  required?: boolean;
  readOnly?: boolean;
  disabled?: boolean;
  autoFocus?: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  inputRef?: React.RefObject<HTMLInputElement>;
  type?: string;
  className?: string;
}

const InputField: React.FC<InputFieldProps> = ({
  label,
  name,
  value,
  error,
  placeholder,
  required = false,
  readOnly = false,
  disabled = false,
  autoFocus = false,
  onChange,
  inputRef,
  type = "text",
  className = "",
}) => {
  const inputId = `input-${name}`;
  const errorId = `error-${name}`;

  return (
    <div className="space-y-1">
      <label
        htmlFor={inputId}
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
        <input
          type={type}
          id={inputId}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          readOnly={readOnly}
          disabled={disabled}
          autoFocus={autoFocus}
          className={`
            w-full px-4 py-3 rounded-lg border transition-all duration-200
            focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500
            placeholder:text-slate-400 text-slate-900
            ${
              error
                ? "border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-500/20"
                : "border-slate-300 bg-white hover:border-slate-400"
            }
            ${readOnly ? "bg-slate-50 text-slate-600" : ""}
            ${disabled ? "bg-slate-100 text-slate-500 cursor-not-allowed" : ""}
            ${className}
          `}
          aria-describedby={error ? errorId : undefined}
          aria-invalid={!!error}
          ref={inputRef}
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

export default InputField;
