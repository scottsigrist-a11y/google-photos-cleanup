import React, { useMemo, useRef } from 'react';
import {
  CheckSquare,
  Film,
  ImageOff,
  LayoutGrid,
  List,
  Search,
  Sparkles,
  Square,
  Trash2,
  Zap,
} from 'lucide-react';
import { CLEANUP_CATEGORY_MAP } from '../data/cleanupCategories';
import { CleanupCategoryId, MediaItem } from '../types/media';
import { formatBytes } from '../utils/analyzer';

export type SortMode = 'largest' | 'most-issues' | 'newest' | 'oldest';
export type ViewMode = 'grid' | 'table';

interface MediaGridProps {
  items: MediaItem[];
  allItems: MediaItem[];
  selectedCategory: CleanupCategoryId | 'all' | 'flagged';
  onSelectCategory: (cat: CleanupCategoryId | 'all' | 'flagged') => void;
  selectedIds: Set<string>;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  sortMode: SortMode;
  onSortChange: (mode: SortMode) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  onToggleSelect: (id: string, shiftKey?: boolean, visibleOrderedIds?: string[]) => void;
  onSelectAllVisible: () => void;
  onClearSelection: () => void;
  onOpenInspector: (item: MediaItem) => void;
  onStageSelectedForRemoval: () => void;
  onSendSelectedToConverter: () => void;
  onRunAiAnalysis: () => void;
  isAnalyzingAi: boolean;
}

export const MediaGrid: React.FC<MediaGridProps> = ({
  items,
  allItems,
  selectedCategory,
  onSelectCategory,
  selectedIds,
  searchQuery,
  onSearchChange,
  sortMode,
  onSortChange,
  viewMode,
  onViewModeChange,
  onToggleSelect,
  onSelectAllVisible,
  onClearSelection,
  onOpenInspector,
  onStageSelectedForRemoval,
  onSendSelectedToConverter,
  onRunAiAnalysis,
  isAnalyzingAi,
}) => {
  const activeCatDef =
    selectedCategory !== 'all' && selectedCategory !== 'flagged'
      ? CLEANUP_CATEGORY_MAP[selectedCategory]
      : null;

  const visibleOrderedIds = useMemo(() => items.map((i) => i.id), [items]);
  const lastClickedRef = useRef<string | null>(null);

  const selectedOverview = useMemo(() => {
    const selectedList = allItems.filter((i) => selectedIds.has(i.id));
    const totalBytes = selectedList.reduce((acc, i) => acc + i.sizeBytes, 0);
    const areaCounts = new Map<CleanupCategoryId, number>();
    let uncategorizedCount = 0;

    for (const item of selectedList) {
      if (item.categories.length === 0) {
        uncategorizedCount += 1;
      } else {
        for (const catId of item.categories) {
          areaCounts.set(catId, (areaCounts.get(catId) ?? 0) + 1);
        }
      }
    }

    const areas = Array.from(areaCounts.entries())
      .map(([id, count]) => ({
        id,
        label: CLEANUP_CATEGORY_MAP[id]?.shortLabel ?? id,
        number: CLEANUP_CATEGORY_MAP[id]?.number ?? '',
        count,
      }))
      .sort((a, b) => b.count - a.count);

    return {
      count: selectedList.length,
      totalBytes,
      areas,
      uncategorizedCount,
    };
  }, [allItems, selectedIds]);

  const handleCardSelect = (id: string, shiftKey: boolean) => {
    onToggleSelect(id, shiftKey, visibleOrderedIds);
    lastClickedRef.current = id;
  };

  return (
    <div className="flex-1 min-w-0 space-y-3">
      {/* Compact Header & Filter Toolbar */}
      <div className="bg-white border border-neutral-200 rounded-xl p-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="font-display text-lg font-semibold text-neutral-900">
              {activeCatDef
                ? `${activeCatDef.number}. ${activeCatDef.title}`
                : selectedCategory === 'flagged'
                  ? 'Flagged Cleanup Candidates'
                  : 'Media Library Overview'}
            </h1>
            <p className="mt-0.5 text-xs text-neutral-600 max-w-3xl">
              {activeCatDef
                ? `${activeCatDef.description} Tip: ${activeCatDef.deletionTip}`
                : 'Click checkboxes (or Shift+click for a range) to batch-convert or stage multiple items across areas.'}
            </p>
          </div>

          <button
            type="button"
            onClick={onRunAiAnalysis}
            disabled={isAnalyzingAi || items.length === 0}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-800 bg-neutral-100 hover:bg-neutral-200 disabled:opacity-50 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer self-start md:self-auto"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#2563EB]" />
            {isAnalyzingAi ? 'Analyzing visuals...' : 'AI Deep Scan'}
          </button>
        </div>

        {/* Filter Controls */}
        <div className="mt-3 pt-3 border-t border-neutral-100 flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[240px]">
            <div className="relative flex-1 max-w-xs">
              <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <label htmlFor="media-search-input" className="sr-only">
                Search media filename or reason
              </label>
              <input
                id="media-search-input"
                type="search"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Filter filename or reason..."
                className="w-full pl-8 pr-2.5 py-1.5 text-xs bg-neutral-50 border border-neutral-200 rounded-lg text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-[#2563EB]"
              />
            </div>

            <label htmlFor="sort-select" className="sr-only">
              Sort items
            </label>
            <select
              id="sort-select"
              value={sortMode}
              onChange={(e) => onSortChange(e.target.value as SortMode)}
              className="px-2.5 py-1.5 text-xs bg-neutral-50 border border-neutral-200 rounded-lg text-neutral-700 focus:outline-none focus:border-[#2563EB] cursor-pointer"
            >
              <option value="largest">Largest files first</option>
              <option value="most-issues">Most flags first</option>
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
            </select>

            <div className="flex items-center p-0.5 bg-neutral-100 rounded-lg">
              <button
                type="button"
                aria-label="Compact grid view"
                onClick={() => onViewModeChange('grid')}
                className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                  viewMode === 'grid' ? 'bg-white text-neutral-900 shadow-xs' : 'text-neutral-500'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                aria-label="Table view"
                onClick={() => onViewModeChange('table')}
                className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                  viewMode === 'table' ? 'bg-white text-neutral-900 shadow-xs' : 'text-neutral-500'
                }`}
              >
                <List className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={selectedIds.size > 0 ? onClearSelection : onSelectAllVisible}
            className="px-2.5 py-1.5 text-xs font-medium text-neutral-700 hover:text-neutral-900 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            {selectedIds.size > 0
              ? `Clear All (${selectedIds.size})`
              : `Select Visible (${items.length})`}
          </button>
        </div>
      </div>

      {/* Multi-Selection & Area Breakdown Tray */}
      {selectedOverview.count > 0 && (
        <div
          role="region"
          aria-label="Active multi-selection summary"
          className="bg-[#EFF6FF] border border-[#BFDBFE] rounded-xl px-4 py-3 flex flex-col lg:flex-row lg:items-center justify-between gap-3"
        >
          <div className="min-w-0 space-y-1">
            <div className="text-xs font-semibold text-[#1E3A8A] tabular-nums">
              {selectedOverview.count} selected ({formatBytes(selectedOverview.totalBytes)})
              {selectedOverview.areas.length > 0 &&
                ` across ${selectedOverview.areas.length} area${
                  selectedOverview.areas.length === 1 ? '' : 's'
                }`}
            </div>

            {selectedOverview.areas.length > 0 && (
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[#1E40AF]">
                {selectedOverview.areas.slice(0, 6).map((area, idx) => (
                  <React.Fragment key={area.id}>
                    {idx > 0 && (
                      <span aria-hidden="true" className="text-[#93C5FD]">
                        ·
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => onSelectCategory(area.id)}
                      className="hover:underline font-medium tabular-nums cursor-pointer whitespace-nowrap"
                    >
                      {area.number}. {area.label} ({area.count})
                    </button>
                  </React.Fragment>
                ))}
                {selectedOverview.areas.length > 6 && (
                  <span className="text-[#1D4ED8]">
                    +{selectedOverview.areas.length - 6} more
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={onClearSelection}
              className="px-2.5 py-1.5 text-xs font-medium text-[#1E40AF] hover:bg-[#DBEAFE] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={onSendSelectedToConverter}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-[#2563EB] hover:bg-[#1D4ED8] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5" />
              Convert ({formatBytes(selectedOverview.totalBytes)})
            </button>
            <button
              type="button"
              onClick={onStageSelectedForRemoval}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-[#DC2626] hover:bg-[#B91C1C] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Stage for Removal
            </button>
          </div>
        </div>
      )}

      {/* Empty State */}
      {items.length === 0 ? (
        <div className="bg-white border border-neutral-200 rounded-xl p-10 text-center">
          <p className="font-display text-base font-semibold text-neutral-900">
            No matching media items in this group
          </p>
          <p className="mt-1 text-sm text-neutral-500">
            Try switching categories, clearing your search filter, or importing more photos and videos.
          </p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {items.map((item) => {
            const isSelected = selectedIds.has(item.id);
            const primaryCat = item.categories[0]
              ? CLEANUP_CATEGORY_MAP[item.categories[0]]
              : null;
            const extraCount = Math.max(0, item.categories.length - 1);

            return (
              <article
                key={item.id}
                className={`bg-white border rounded-xl overflow-hidden transition-colors ${
                  isSelected
                    ? 'border-[#2563EB] ring-2 ring-[#2563EB]/30 bg-[#F8FAFF]'
                    : 'border-neutral-200 hover:border-neutral-300'
                }`}
              >
                <div className="relative aspect-[16/10] bg-neutral-100 overflow-hidden">
                  {item.previewUrl ? (
                    <img
                      src={item.previewUrl}
                      alt={item.name}
                      referrerPolicy="no-referrer"
                      onClick={() => onOpenInspector(item)}
                      className="w-full h-full object-cover cursor-pointer"
                    />
                  ) : (
                    <button
                      type="button"
                      onClick={() => onOpenInspector(item)}
                      className="w-full h-full flex flex-col items-center justify-center text-neutral-400 cursor-pointer"
                    >
                      <ImageOff className="w-6 h-6 mb-1" />
                      <span className="text-[11px]">Unreadable frame</span>
                    </button>
                  )}

                  <button
                    type="button"
                    aria-label={isSelected ? `Deselect ${item.name}` : `Select ${item.name}`}
                    onClick={(e) => handleCardSelect(item.id, e.shiftKey)}
                    className={`absolute top-2 left-2 p-1 rounded-md border shadow-xs cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-[#2563EB] border-[#2563EB] text-white'
                        : 'bg-white/95 border-neutral-200 text-neutral-600 hover:bg-white'
                    }`}
                  >
                    {isSelected ? (
                      <CheckSquare className="w-3.5 h-3.5" />
                    ) : (
                      <Square className="w-3.5 h-3.5" />
                    )}
                  </button>

                  <div className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded bg-neutral-900/80 text-white text-[11px] font-mono tabular-nums flex items-center gap-1">
                    {item.mediaType === 'video' && <Film className="w-2.5 h-2.5" />}
                    <span>{formatBytes(item.sizeBytes)}</span>
                  </div>
                </div>

                <div className="p-2.5">
                  <button
                    type="button"
                    onClick={() => onOpenInspector(item)}
                    className="text-left text-xs font-medium text-neutral-900 hover:text-[#2563EB] truncate block w-full cursor-pointer"
                    title={item.name}
                  >
                    {item.name}
                  </button>

                  <div className="mt-1 flex items-center gap-1 text-[11px] text-neutral-500 font-mono tabular-nums">
                    <span>{item.width > 0 ? `${item.width}×${item.height}` : 'Broken'}</span>
                    <span aria-hidden="true">·</span>
                    <span className="truncate">
                      {item.mimeType.replace('image/', '').replace('video/', '').toUpperCase()}
                    </span>
                    {item.stagedForRemoval && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="text-[#DC2626] font-sans font-medium">Staged</span>
                      </>
                    )}
                  </div>

                  <p className="mt-1 text-[11px] text-neutral-600 truncate">
                    {primaryCat
                      ? `${primaryCat.number}. ${primaryCat.shortLabel}${
                          extraCount > 0 ? ` (+${extraCount})` : ''
                        }`
                      : 'Clean · Compressible'}
                  </p>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="bg-white border border-neutral-200 rounded-xl overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-neutral-200 text-xs font-medium text-neutral-500">
                <th className="py-2.5 pl-3.5 pr-2 w-9">
                  <span className="sr-only">Select</span>
                </th>
                <th className="py-2.5 px-2.5">File</th>
                <th className="py-2.5 px-2.5">Areas / Cleanup Signals</th>
                <th className="py-2.5 px-2.5 text-right">Dimensions</th>
                <th className="py-2.5 px-3.5 text-right">Size</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 text-xs">
              {items.map((item) => {
                const isSelected = selectedIds.has(item.id);
                return (
                  <tr
                    key={item.id}
                    className={`hover:bg-neutral-50 transition-colors ${
                      isSelected ? 'bg-[#EFF6FF]/70' : ''
                    }`}
                  >
                    <td className="py-2 pl-3.5 pr-2">
                      <button
                        type="button"
                        aria-label={isSelected ? `Deselect ${item.name}` : `Select ${item.name}`}
                        onClick={(e) => handleCardSelect(item.id, e.shiftKey)}
                        className="p-0.5 text-neutral-600 cursor-pointer"
                      >
                        {isSelected ? (
                          <CheckSquare className="w-4 h-4 text-[#2563EB]" />
                        ) : (
                          <Square className="w-4 h-4 text-neutral-400" />
                        )}
                      </button>
                    </td>
                    <td className="py-2 px-2.5 max-w-[240px]">
                      <button
                        type="button"
                        onClick={() => onOpenInspector(item)}
                        className="font-medium text-neutral-900 hover:text-[#2563EB] truncate block w-full text-left cursor-pointer"
                      >
                        {item.name}
                      </button>
                    </td>
                    <td className="py-2 px-2.5 text-neutral-600">
                      {item.categories.length > 0
                        ? item.categories
                            .map(
                              (id) =>
                                `${CLEANUP_CATEGORY_MAP[id]?.number}. ${CLEANUP_CATEGORY_MAP[id]?.shortLabel}`
                            )
                            .join(' · ')
                        : 'Clean'}
                    </td>
                    <td className="py-2 px-2.5 text-right font-mono text-neutral-500 tabular-nums">
                      {item.width > 0 ? `${item.width}×${item.height}` : 'Broken'}
                    </td>
                    <td className="py-2 px-3.5 text-right font-mono font-medium text-neutral-900 tabular-nums">
                      {formatBytes(item.sizeBytes)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
