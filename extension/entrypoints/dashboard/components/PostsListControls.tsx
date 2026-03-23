import { CheckCheck, Eye, Filter, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePostsView } from '../context/PostsViewContext';
import { TogglePill } from './TogglePill';

export function PostsListControls() {
  const {
    unseenCount,
    starredCount,
    showOnlyUnseen,
    setShowOnlyUnseen,
    showOnlyStarred,
    setShowOnlyStarred,
    showFilterPanel,
    setShowFilterPanel,
    activeFilterCount,
    markAllSeen,
  } = usePostsView();

  return (
    <div className="flex items-center justify-between mb-3" aria-live="polite">
      <div className="flex items-center gap-1.5 flex-wrap">
        <TogglePill
          active={showOnlyUnseen}
          onClick={() => setShowOnlyUnseen(!showOnlyUnseen)}
          icon={<Eye size={12} />}
          label="Unseen"
          count={unseenCount}
        />
        <TogglePill
          active={showOnlyStarred}
          onClick={() => setShowOnlyStarred(!showOnlyStarred)}
          icon={<Star size={12} />}
          label="Starred"
          count={starredCount}
        />
        <TogglePill
          active={showFilterPanel}
          onClick={() => setShowFilterPanel(!showFilterPanel)}
          icon={<Filter size={12} />}
          label="Filters"
          count={activeFilterCount}
        />
      </div>
      {unseenCount > 0 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={markAllSeen}
          className="text-xs text-gray-500 hover:text-gray-900 gap-1.5"
        >
          <CheckCheck size={14} />
          Mark all seen
        </Button>
      )}
    </div>
  );
}
