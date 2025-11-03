import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { maquinasService } from "@/api/services/maquinasService";
import useDebouncedCallback from "@/hooks/useDebouncedCallback";
import InputField from "./InputField";

interface ModelAutocompleteInputProps {
  value: string;
  onChange: (value: string) => void;
  name?: string;
  label?: string;
  placeholder?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  autoFocus?: boolean;
  onBlur?: (event: React.FocusEvent<HTMLInputElement>) => void;
  onFocus?: (event: React.FocusEvent<HTMLInputElement>) => void;
  className?: string;
}

const MIN_CHARS = 3;
const DROPDOWN_HIDE_DELAY = 150;

const ModelAutocompleteInput = ({
  value,
  onChange,
  name = "modelo",
  label = "Modelo",
  placeholder = "Modelo da máquina",
  error,
  required = false,
  disabled = false,
  readOnly = false,
  autoFocus = false,
  onBlur,
  onFocus,
  className,
}: ModelAutocompleteInputProps) => {
  const [options, setOptions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const blurTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const latestValueRef = useRef(value);

  useEffect(() => {
    latestValueRef.current = value;
  }, [value]);

  useEffect(
    () => () => {
      if (blurTimeoutRef.current) {
        clearTimeout(blurTimeoutRef.current);
      }
    },
    []
  );

  const cancelBlurTimeout = useCallback(() => {
    if (blurTimeoutRef.current) {
      clearTimeout(blurTimeoutRef.current);
      blurTimeoutRef.current = null;
    }
  }, []);

  const fetchModelos = useDebouncedCallback(async (termo: string) => {
    const searchTerm = termo.trim();

    if (searchTerm.length < MIN_CHARS) {
      setOptions([]);
      setIsLoading(false);
      return;
    }

    try {
      const modelos = await maquinasService.getModelos(searchTerm);

      if (latestValueRef.current.trim() !== searchTerm) {
        return;
      }

      setOptions(modelos);
    } catch (err) {
      console.error("Erro ao buscar modelos:", err);

      if (latestValueRef.current.trim() === searchTerm) {
        setOptions([]);
      }
    } finally {
      if (latestValueRef.current.trim() === searchTerm) {
        setIsLoading(false);
      }
    }
  }, 500);

  const handleOptionSelect = useCallback(
    (modeloSelecionado: string) => {
      cancelBlurTimeout();
      onChange(modeloSelecionado);
      setShowDropdown(false);
      setOptions([]);
      setIsLoading(false);
    },
    [cancelBlurTimeout, onChange]
  );

  const handleInternalBlur = useCallback(
    (event: React.FocusEvent<HTMLInputElement>) => {
      blurTimeoutRef.current = setTimeout(() => {
        setShowDropdown(false);
      }, DROPDOWN_HIDE_DELAY);

      onBlur?.(event);
    },
    [onBlur]
  );

  const handleInternalFocus = useCallback(
    (event: React.FocusEvent<HTMLInputElement>) => {
      cancelBlurTimeout();
      const currentValue = latestValueRef.current.trim();

      if (currentValue.length >= MIN_CHARS) {
        setShowDropdown(true);

        if (!isLoading && options.length === 0) {
          setIsLoading(true);
          fetchModelos(currentValue);
        }
      }

      onFocus?.(event);
    },
    [cancelBlurTimeout, fetchModelos, isLoading, onFocus, options.length]
  );

  const handleInternalChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const nextValue = event.target.value;
      onChange(nextValue);

      const sanitized = nextValue.trim();

      if (sanitized.length >= MIN_CHARS) {
        setShowDropdown(true);
        setIsLoading(true);
        fetchModelos(nextValue);
      } else {
        setShowDropdown(false);
        setOptions([]);
        setIsLoading(false);
      }
    },
    [fetchModelos, onChange]
  );

  const dropdownContent = useMemo(() => {
    if (!showDropdown || value.trim().length < MIN_CHARS) {
      return null;
    }

    if (isLoading) {
      return (
        <div className="px-4 py-2 text-sm text-slate-500">
          Buscando modelos...
        </div>
      );
    }

    if (options.length === 0) {
      return (
        <div className="px-4 py-2 text-sm text-slate-500">
          Nenhum modelo encontrado
        </div>
      );
    }

    return options.map((option) => (
      <button
        key={option}
        type="button"
        className="block w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-violet-50 focus:bg-violet-100 focus:outline-none"
        onMouseDown={(event) => {
          event.preventDefault();
          handleOptionSelect(option);
        }}
      >
        {option}
      </button>
    ));
  }, [handleOptionSelect, isLoading, options, showDropdown, value]);

  const dropdown =
    dropdownContent === null ? null : (
      <div className="absolute left-0 right-0 z-20 mt-1 max-h-48 overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-lg">
        {dropdownContent}
      </div>
    );

  return (
    <InputField
      label={label}
      name={name}
      value={value}
      error={error}
      placeholder={placeholder}
      required={required}
      onChange={handleInternalChange}
      onBlur={handleInternalBlur}
      onFocus={handleInternalFocus}
      autoComplete="off"
      disabled={disabled}
      readOnly={readOnly}
      autoFocus={autoFocus}
      renderDropdown={dropdown}
      className={className}
    />
  );
};

export default ModelAutocompleteInput;
