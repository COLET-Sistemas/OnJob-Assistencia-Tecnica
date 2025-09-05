import { useState, useCallback } from "react";

export function useFormField<T>(initialValue: T) {
  const [value, setValue] = useState<T>(initialValue);
  const onChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setValue(e.target.value as unknown as T);
    },
    []
  );
  return { value, onChange, setValue };
}

export function useSelectField<T>(initialValue: T | null) {
  const [value, setValue] = useState<T | null>(initialValue);
  const onChange = useCallback((option: T | null) => {
    setValue(option);
  }, []);
  return { value, onChange, setValue };
}
