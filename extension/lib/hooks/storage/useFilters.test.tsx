import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fakeBrowser } from 'wxt/testing';
import { storage } from 'wxt/utils/storage';
import {
  DEFAULT_FILTER_SETTINGS,
  type FilterSettings,
} from '@/lib/filters/types';
import { createQueryWrapper } from '@/test/test-utils';
import { useFilters, useSaveFilters } from './useFilters';

describe('useFilters', () => {
  beforeEach(() => {
    fakeBrowser.reset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should return default filters when storage is empty', async () => {
    const { result } = renderHook(() => useFilters(), {
      wrapper: createQueryWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(DEFAULT_FILTER_SETTINGS);
  });

  it('should load filters from storage', async () => {
    const storedFilters: FilterSettings = {
      positiveKeywords: ['apartment', '2br'],
      negativeKeywords: ['sold'],
      caseSensitive: false,
      searchFields: ['contentHtml'],
    };

    await fakeBrowser.storage.local.set({ filterSettings: storedFilters });

    const { result } = renderHook(() => useFilters(), {
      wrapper: createQueryWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(storedFilters);
  });

  it('should handle loading state', () => {
    vi.spyOn(storage, 'getItem').mockReturnValue(new Promise(() => {}));

    const { result } = renderHook(() => useFilters(), {
      wrapper: createQueryWrapper(),
    });

    expect(result.current.isPending).toBe(true);
    expect(result.current.data).toBeUndefined();
  });

  it('should handle errors gracefully', async () => {
    vi.spyOn(storage, 'getItem').mockRejectedValue(new Error('Storage error'));

    const { result } = renderHook(() => useFilters(), {
      wrapper: createQueryWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toBeTruthy();
  });
});

describe('useSaveFilters', () => {
  beforeEach(() => {
    fakeBrowser.reset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should save filters to storage', async () => {
    const newFilters: FilterSettings = {
      positiveKeywords: ['test'],
      negativeKeywords: [],
      caseSensitive: false,
      searchFields: ['contentHtml'],
    };

    const { result } = renderHook(
      () => ({
        filters: useFilters(),
        update: useSaveFilters(),
      }),
      { wrapper: createQueryWrapper() }
    );

    await waitFor(() => expect(result.current.filters.isSuccess).toBe(true));

    result.current.update.mutate(newFilters);

    await waitFor(() => expect(result.current.update.isSuccess).toBe(true));

    const stored = await fakeBrowser.storage.local.get('filterSettings');
    expect(stored.filterSettings).toEqual(newFilters);
  });

  it('should update query cache on successful mutation', async () => {
    const newFilters: FilterSettings = {
      positiveKeywords: ['updated'],
      negativeKeywords: ['test'],
      caseSensitive: true,
      searchFields: ['contentHtml', 'authorName'],
    };

    const { result } = renderHook(
      () => ({
        filters: useFilters(),
        update: useSaveFilters(),
      }),
      { wrapper: createQueryWrapper() }
    );

    await waitFor(() => expect(result.current.filters.isSuccess).toBe(true));

    result.current.update.mutate(newFilters);

    await waitFor(() =>
      expect(result.current.filters.data).toEqual(newFilters)
    );
  });

  it('should handle mutation errors', async () => {
    vi.spyOn(storage, 'setItem').mockRejectedValue(new Error('Save failed'));

    const { result } = renderHook(
      () => ({
        filters: useFilters(),
        update: useSaveFilters(),
      }),
      { wrapper: createQueryWrapper() }
    );

    await waitFor(() => expect(result.current.filters.isSuccess).toBe(true));

    result.current.update.mutate({
      positiveKeywords: ['test'],
      negativeKeywords: [],
      caseSensitive: false,
      searchFields: ['contentHtml'],
    });

    await waitFor(() => expect(result.current.update.isError).toBe(true));

    expect(result.current.update.error).toBeTruthy();
    expect(result.current.filters.data).toEqual(DEFAULT_FILTER_SETTINGS);
  });
});
