import React from 'react';
import { CLEANUP_CATEGORIES } from '../data/cleanupCategories';
import { CategoryStat, CleanupCategoryId } from '../types/media';
import { formatBytes } from '../utils/analyzer';

interface CategorySidebarProps {
  selectedCategory: CleanupCategoryId | 'all' | 'flagged';
  onSelectCategory: (cat: CleanupCategoryId | 'all' | 'flagged') => void;
  categoryStats: Record<CleanupCategoryId, CategoryStat>;
  selectedCategoryCounts: Partial<Record<CleanupCategoryId, number>>;
  totalItems: number;
  flaggedItems: number;
  totalBytes: number;
  reclaimableBytes: number;
}

export const CategorySidebar: React.FC<CategorySidebarProps> = ({
  selectedCategory,
  onSelectCategory,
  categoryStats,
  selectedCategoryCounts,
  totalItems,
  flaggedItems,
  totalBytes,
  reclaimableBytes,
}) => {
  return (
    <aside
      aria-label="Cleanup categories"
      className="w-full lg:w-[264px] shrink-0 bg-white border border-neutral-200 rounded-xl p-3.5 h-fit"
    >
      <div className="pb-2.5 mb-2.5 border-b border-neutral-100">
        <h2 className="font-display text-sm font-semibold text-neutral-900">
          Automatic Grouping
        </h2>
        <p className="mt-0.5 text-xs text-neutral-500">
          15 deletion &amp; compression signals
        </p>
      </div>

      <div className="space-y-0.5">
        <button
          type="button"
          onClick={() => onSelectCategory('all')}
          className={`w-full flex items-center justify-between px-2.5 py-1.5 text-left rounded-lg text-xs font-medium transition-colors cursor-pointer ${
            selectedCategory === 'all'
              ? 'bg-[#EFF6FF] text-[#1D4ED8]'
              : 'text-neutral-700 hover:bg-neutral-50'
          }`}
        >
          <span className="truncate">All Media</span>
          <span className="font-mono tabular-nums text-neutral-500 shrink-0 ml-2">
            {totalItems} · {formatBytes(totalBytes)}
          </span>
        </button>

        <button
          type="button"
          onClick={() => onSelectCategory('flagged')}
          className={`w-full flex items-center justify-between px-2.5 py-1.5 text-left rounded-lg text-xs font-medium transition-colors cursor-pointer ${
            selectedCategory === 'flagged'
              ? 'bg-[#EFF6FF] text-[#1D4ED8]'
              : 'text-neutral-700 hover:bg-neutral-50'
          }`}
        >
          <span className="truncate">Flagged Media</span>
          <span className="font-mono tabular-nums text-[#16A34A] shrink-0 ml-2">
            {flaggedItems} · {formatBytes(reclaimableBytes)}
          </span>
        </button>
      </div>

      <div className="my-2.5 border-t border-neutral-100" />

      <div className="space-y-0.5">
        {CLEANUP_CATEGORIES.map((cat) => {
          const stat = categoryStats[cat.id];
          const selCount = selectedCategoryCounts[cat.id] ?? 0;
          const isSelected = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => onSelectCategory(cat.id)}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 text-left rounded-lg text-xs transition-colors cursor-pointer ${
                isSelected
                  ? 'bg-[#EFF6FF] text-[#1D4ED8] font-medium'
                  : 'text-neutral-700 hover:bg-neutral-50'
              }`}
            >
              <span className="truncate pr-2">
                <span className="font-mono text-neutral-400 mr-1.5">{cat.number}.</span>
                {cat.shortLabel}
              </span>
              <span className="font-mono tabular-nums shrink-0 flex items-center gap-1.5">
                {selCount > 0 && (
                  <span className="text-[#2563EB] font-semibold">{selCount} sel /</span>
                )}
                <span
                  className={
                    stat.count > 0
                      ? isSelected
                        ? 'text-[#1D4ED8]'
                        : 'text-neutral-600'
                      : 'text-neutral-300'
                  }
                >
                  {stat.count}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </aside>
  );
};
