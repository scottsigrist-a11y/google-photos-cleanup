import React, { useState } from 'react';
import { ArrowRight, Check } from 'lucide-react';
import { CLEANUP_CATEGORIES } from '../data/cleanupCategories';
import { CategoryStat, CleanupCategoryId } from '../types/media';
import { formatBytes } from '../utils/analyzer';

interface CleanupGuideViewProps {
  categoryStats: Record<CleanupCategoryId, CategoryStat>;
  onInspectCategory: (catId: CleanupCategoryId) => void;
  onStageCategory: (catId: CleanupCategoryId) => void;
}

export const CleanupGuideView: React.FC<CleanupGuideViewProps> = ({
  categoryStats,
  onInspectCategory,
  onStageCategory,
}) => {
  const [riskFilter, setRiskFilter] = useState<'all' | 'Safe' | 'Review' | 'Careful'>('all');
  const [stagedBanner, setStagedBanner] = useState<string | null>(null);

  const visible = CLEANUP_CATEGORIES.filter((c) =>
    riskFilter === 'all' ? true : c.riskLevel === riskFilter
  );

  return (
    <div className="space-y-6">
      <div className="bg-white border border-neutral-200 rounded-xl p-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-neutral-900">
            15 Automated Ways to Clean Up Your Photo Library
          </h1>
          <p className="mt-1.5 text-sm text-neutral-600 max-w-3xl">
            Every photo and video in your library is evaluated against these 15 deletion and
            compression rules. Start with Safe categories for instant zero-regret space recovery,
            then review burst sequences and oversized videos.
          </p>
        </div>

        <div className="flex items-center gap-1 p-1 bg-neutral-100 rounded-lg shrink-0 self-start md:self-auto">
          {(['all', 'Safe', 'Review', 'Careful'] as const).map((level) => (
            <button
              key={level}
              type="button"
              onClick={() => setRiskFilter(level)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                riskFilter === level
                  ? 'bg-white text-neutral-900 shadow-xs'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              {level === 'all' ? 'All 15 Rules' : `${level} Risk`}
            </button>
          ))}
        </div>
      </div>

      {stagedBanner && (
        <div
          role="status"
          className="bg-[#EFF6FF] border border-[#BFDBFE] rounded-xl px-4 py-3 text-sm text-[#1E40AF] flex items-center gap-2"
        >
          <Check className="w-4 h-4 shrink-0" />
          <span>{stagedBanner}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {visible.map((cat) => {
          const stat = categoryStats[cat.id];
          return (
            <article
              key={cat.id}
              className="bg-white border border-neutral-200 rounded-xl p-5 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-baseline justify-between gap-3">
                  <h2 className="font-display text-base font-semibold text-neutral-900">
                    <span className="font-mono text-neutral-400 mr-2">{cat.number}.</span>
                    {cat.title}
                  </h2>
                </div>

                {/* Clean unboxed metadata line */}
                <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-xs text-neutral-500">
                  <span
                    className={
                      cat.riskLevel === 'Safe'
                        ? 'text-[#16A34A] font-medium'
                        : cat.riskLevel === 'Review'
                          ? 'text-[#D97706] font-medium'
                          : 'text-neutral-700 font-medium'
                    }
                  >
                    {cat.riskLevel} Risk
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>Action: {cat.defaultAction}</span>
                  <span aria-hidden="true">·</span>
                  <span>{cat.typicalSavings}</span>
                </div>

                <p className="mt-3 text-sm text-neutral-700 leading-relaxed">{cat.description}</p>

                <p className="mt-3 pt-3 border-t border-neutral-100 text-xs text-neutral-500 leading-relaxed">
                  <strong className="text-neutral-700 font-medium">How to decide:</strong>{' '}
                  {cat.deletionTip}
                </p>
              </div>

              <div className="mt-4 pt-3.5 border-t border-neutral-100 flex items-center justify-between gap-2">
                <div className="text-xs font-mono tabular-nums text-neutral-700">
                  <span className="font-semibold text-neutral-900">{stat.count}</span>{' '}
                  {stat.count === 1 ? 'match' : 'matches'} · {formatBytes(stat.reclaimableBytes)}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {stat.count > 0 && cat.defaultAction === 'Delete' && (
                    <button
                      type="button"
                      onClick={() => {
                        onStageCategory(cat.id);
                        setStagedBanner(
                          `Staged ${stat.count} item(s) from "${cat.title}" into your Removal Queue.`
                        );
                      }}
                      className="px-2.5 py-1.5 text-xs font-medium text-[#DC2626] hover:bg-red-50 rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      Stage Group
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => onInspectCategory(cat.id)}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-[#2563EB] hover:bg-[#EFF6FF] rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    Inspect
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
};
