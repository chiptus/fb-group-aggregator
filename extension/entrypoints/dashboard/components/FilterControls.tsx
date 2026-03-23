import type { FilterSettings, KeywordType } from '@/lib/filters/types';
import { DEFAULT_FILTER_SETTINGS } from '@/lib/filters/types';
import { useFilters, useSaveFilters } from '@/lib/hooks/filters/useFilters';
import { FilterSettingsSection } from './FilterSettingsSection';
import { KeywordInputSection } from './KeywordInputSection';

export function FilterControls() {
  const filtersQuery = useFilters();
  const saveFiltersMutation = useSaveFilters();

  const filters = filtersQuery.data ?? DEFAULT_FILTER_SETTINGS;
  const isLoading = filtersQuery.isLoading;
  const isSaving = saveFiltersMutation.isPending;

  function handleAddKeyword({
    value,
    type,
  }: {
    value: string;
    type: KeywordType;
  }) {
    const trimmed = value.trim();
    if (!trimmed) return;

    const isDuplicate =
      type === 'positive'
        ? filters.positiveKeywords.includes(trimmed)
        : filters.negativeKeywords.includes(trimmed);

    if (isDuplicate) return;

    const updatedFilters: FilterSettings = {
      ...filters,
      positiveKeywords:
        type === 'positive'
          ? [...filters.positiveKeywords, trimmed]
          : filters.positiveKeywords,
      negativeKeywords:
        type === 'negative'
          ? [...filters.negativeKeywords, trimmed]
          : filters.negativeKeywords,
    };

    saveFiltersMutation.mutate(updatedFilters);
  }

  function handleCaseSensitiveChange(checked: boolean) {
    saveFiltersMutation.mutate({ ...filters, caseSensitive: checked });
  }

  function handleSearchFieldChange(
    field: 'contentHtml' | 'authorName',
    checked: boolean
  ) {
    const updatedFields = checked
      ? [...filters.searchFields, field]
      : filters.searchFields.filter((f) => f !== field);

    if (updatedFields.length === 0) return;

    saveFiltersMutation.mutate({
      ...filters,
      searchFields: updatedFields,
    });
  }

  if (isLoading) {
    return (
      <div className="p-4 border rounded-lg bg-white">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <div className="w-4 h-4 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
          <span>Loading filters...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4 border rounded-lg bg-white">
      {isSaving && (
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <div className="w-3 h-3 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
          <span>Saving...</span>
        </div>
      )}
      <KeywordInputSection onAdd={handleAddKeyword} disabled={isSaving} />
      <FilterSettingsSection
        filters={filters}
        onCaseSensitiveChange={handleCaseSensitiveChange}
        onSearchFieldChange={handleSearchFieldChange}
        disabled={isSaving}
      />
    </div>
  );
}
