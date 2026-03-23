import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useDebounce } from './useDebounce';

describe('useDebounce', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns initial value immediately', () => {
    const onChange = vi.fn();
    const { result } = renderHook(() => useDebounce('hello', onChange, 300));
    expect(result.current[0]).toBe('hello');
  });

  it('updates raw value immediately', () => {
    const onChange = vi.fn();
    const { result } = renderHook(() => useDebounce<string>('', onChange, 300));

    act(() => {
      result.current[1]('new value');
    });

    expect(result.current[0]).toBe('new value');
  });

  it('calls onChange after delay', () => {
    const onChange = vi.fn();
    const { result } = renderHook(() => useDebounce<string>('', onChange, 300));

    act(() => {
      result.current[1]('typed');
    });

    expect(onChange).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(onChange).toHaveBeenCalledWith('typed');
  });

  it('resets debounce timer on rapid updates, calling onChange once', () => {
    const onChange = vi.fn();
    const { result } = renderHook(() => useDebounce<string>('', onChange, 300));

    act(() => {
      result.current[1]('first');
    });
    act(() => {
      vi.advanceTimersByTime(200);
    });
    act(() => {
      result.current[1]('second');
    });
    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith('second');
  });

  it('syncs rawValue when external value prop changes', () => {
    const onChange = vi.fn();
    let externalValue = 'initial';
    const { result, rerender } = renderHook(() =>
      useDebounce(externalValue, onChange, 300)
    );

    externalValue = 'reset';
    rerender();

    expect(result.current[0]).toBe('reset');
  });

  it('does not call onChange when external value prop resets', () => {
    const onChange = vi.fn();
    let externalValue = 'initial';
    const { result, rerender } = renderHook(() =>
      useDebounce(externalValue, onChange, 300)
    );

    act(() => {
      result.current[1]('typed');
    });

    externalValue = 'reset';
    rerender();

    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(onChange).not.toHaveBeenCalled();
  });
});
