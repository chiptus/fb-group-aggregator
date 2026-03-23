import { usePostsView } from '../context/PostsViewContext';
import { FilterChips } from './FilterChips';
import { FilterControls } from './FilterControls';
import { FilterStatsBanner } from './FilterStatsBanner';

export function PostsFilterBar() {
  const {
    showFilterPanel,
    hasActiveFilters,
    filters,
    removeKeyword,
    totalPostCount,
    filteredPosts,
  } = usePostsView();

  return (
    <>
      {showFilterPanel && (
        <div className="mb-4">
          <FilterControls />
        </div>
      )}

      {hasActiveFilters && (
        <div className="mb-4">
          <FilterChips filters={filters} onRemoveKeyword={removeKeyword} />
        </div>
      )}

      <div className="mb-4">
        <FilterStatsBanner
          totalPosts={totalPostCount}
          filteredPosts={filteredPosts.length}
          positiveKeywordCount={filters.positiveKeywords.length}
          negativeKeywordCount={filters.negativeKeywords.length}
        />
      </div>
    </>
  );
}
