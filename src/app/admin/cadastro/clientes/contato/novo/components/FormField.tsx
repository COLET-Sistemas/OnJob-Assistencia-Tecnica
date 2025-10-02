import React from "react";

interface FormFieldProps {
  id: string;
  label: string;
  error?: string;
  className?: string;
  children: React.ReactNode;
}

const FormField: React.FC<FormFieldProps> = ({
  id,
  label,
  error,
  className = "",
  children,
}) => {
  return (
    <div className={className}>
      <label
        htmlFor={id}
        className="block text-md font-medium text-slate-700 mb-1"
      >
        {label}
      </label>
      {children}
      {error && <div className="text-red-500 text-sm mt-1">{error}</div>}
    </div>
  );
};

export default FormField;
