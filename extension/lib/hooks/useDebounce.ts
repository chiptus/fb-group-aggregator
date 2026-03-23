import { useEffect, useState } from 'react';

export function useDebounce<T>(
  value: T,
  onChange: (v: T) => void,
  delay: number
): readonly [T, (v: T) => void] {
  const [rawValue, setRawValue] = useState(value);

  useEffect(() => {
    setRawValue(value);
  }, [value]);

  useEffect(() => {
    if (rawValue === value) return;
    const id = setTimeout(() => onChange(rawValue), delay);
    return () => clearTimeout(id);
  }, [rawValue, value, delay, onChange]);

  return [rawValue, setRawValue] as const;
}
