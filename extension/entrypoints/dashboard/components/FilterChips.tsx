import type { FilterSettings, KeywordType } from '@/lib/filters/types';
import { KeywordChip } from './KeywordChip';

export interface FilterChipsProps {
  filters: FilterSettings;
  onRemoveKeyword: (keyword: string, type: KeywordType) => void;
}

export function FilterChips({ filters, onRemoveKeyword }: FilterChipsProps) {
  const searchFieldsText = filters.searchFields
    .map((field) => {
      if (field === 'contentHtml') return 'content';
      if (field === 'authorName') return 'author';
      return field;
    })
    .join(' and ');

  return (
    <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
      {filters.positiveKeywords.length > 0 && (
        <div>
          <div className="text-sm font-medium text-green-700 mb-2">
            Positive Keywords
          </div>
          <div className="flex flex-wrap gap-2">
            {filters.positiveKeywords.map((keyword) => (
              <KeywordChip
                key={keyword}
                keyword={keyword}
                type="positive"
                onRemove={onRemoveKeyword}
              />
            ))}
          </div>
        </div>
      )}

      {filters.negativeKeywords.length > 0 && (
        <div>
          <div className="text-sm font-medium text-red-700 mb-2">
            Negative Keywords
          </div>
          <div className="flex flex-wrap gap-2">
            {filters.negativeKeywords.map((keyword) => (
              <KeywordChip
                key={keyword}
                keyword={keyword}
                type="negative"
                onRemove={onRemoveKeyword}
              />
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-4 text-xs text-gray-600 pt-2 border-t">
        {filters.caseSensitive && (
          <span className="font-medium">Case-sensitive</span>
        )}
        <span>Searching in: {searchFieldsText}</span>
      </div>
    </div>
  );
}
