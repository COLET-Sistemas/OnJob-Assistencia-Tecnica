import React from "react";

interface DateTimeFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
  placeholder?: string;
  disabled?: boolean;
}

const DateTimeField: React.FC<DateTimeFieldProps> = ({
  id,
  label,
  value,
  onChange,
  required = false,
  placeholder = "",
  disabled = false,
}) => {
  return (
    <div>
      <label
        htmlFor={id}
        className="block text-md font-medium text-gray-700 mb-1"
      >
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type="datetime-local"
        id={id}
        value={value}
        onChange={onChange}
        required={required}
        placeholder={placeholder}
        disabled={disabled}
        className="w-full px-3 py-2.5 border border-gray-200 text-gray-600 rounded-md shadow-sm 
                  focus:outline-none focus:ring-[var(--primary)] focus:border-[var(--primary)]
                  placeholder:text-gray-500 disabled:bg-gray-100 disabled:text-gray-500"
      />
    </div>
  );
};

export default DateTimeField;
