import { useEffect, useRef, useState } from 'react';

export function useDebounce<T>(
  value: T,
  onChange: (v: T) => void,
  delay: number
): readonly [T, (v: T) => void] {
  const [rawValue, setRawValue] = useState(value);
  const propValueRef = useRef(value);

  useEffect(() => {
    propValueRef.current = value;
    setRawValue(value);
  }, [value]);

  useEffect(() => {
    if (rawValue === propValueRef.current) return;
    const id = setTimeout(() => onChange(rawValue), delay);
    return () => clearTimeout(id);
  }, [rawValue, delay, onChange]);

  return [rawValue, setRawValue] as const;
}
