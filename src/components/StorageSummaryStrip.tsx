import React from 'react';
import { LibrarySummary } from '../types/media';
import { formatBytes } from '../utils/analyzer';

interface StorageSummaryStripProps {
  summary: LibrarySummary;
  projectedConverterSavedBytes: number;
  sourceLabel: string;
}

export const StorageSummaryStrip: React.FC<StorageSummaryStripProps> = ({
  summary,
  projectedConverterSavedBytes,
  sourceLabel,
}) => {
  const reclaimPercent =
    summary.totalBytes > 0
      ? Math.round((summary.reclaimableBytes / summary.totalBytes) * 100)
      : 0;

  return (
    <section
      aria-label="Storage overview"
      className="bg-neutral-200 border border-neutral-200 rounded-xl overflow-hidden grid grid-cols-2 lg:grid-cols-4 gap-px"
    >
      <div className="bg-white p-5">
        <p className="text-xs font-medium text-neutral-500">Analyzed Library</p>
        <p className="mt-1.5 text-2xl font-display font-semibold text-neutral-900 tabular-nums">
          {formatBytes(summary.totalBytes)}
        </p>
        <p className="mt-1 text-xs text-neutral-500 tabular-nums">
          {summary.totalItems} {summary.totalItems === 1 ? 'item' : 'items'} · {sourceLabel}
        </p>
      </div>

      <div className="bg-white p-5">
        <p className="text-xs font-medium text-neutral-500">Recoverable via Cleanup</p>
        <p className="mt-1.5 text-2xl font-display font-semibold text-[#16A34A] tabular-nums">
          {formatBytes(summary.reclaimableBytes)}
        </p>
        <p className="mt-1 text-xs text-neutral-500 tabular-nums">
          {summary.flaggedItems} flagged · {reclaimPercent}% of total
        </p>
      </div>

      <div className="bg-white p-5">
        <p className="text-xs font-medium text-neutral-500">Est. Converter Savings</p>
        <p className="mt-1.5 text-2xl font-display font-semibold text-[#2563EB] tabular-nums">
          {formatBytes(
            summary.actualConvertedSavedBytes > 0
              ? summary.actualConvertedSavedBytes
              : projectedConverterSavedBytes
          )}
        </p>
        <p className="mt-1 text-xs text-neutral-500 tabular-nums">
          {summary.convertedItems > 0
            ? `${summary.convertedItems} ${summary.convertedItems === 1 ? 'file' : 'files'} converted`
            : 'WebP / AVIF + VP9 projection'}
        </p>
      </div>

      <div className="bg-white p-5">
        <p className="text-xs font-medium text-neutral-500">Staged for Elimination</p>
        <p className="mt-1.5 text-2xl font-display font-semibold text-neutral-900 tabular-nums">
          {formatBytes(summary.stagedBytes)}
        </p>
        <p className="mt-1 text-xs text-neutral-500 tabular-nums">
          {summary.stagedItems} item{summary.stagedItems === 1 ? '' : 's'} awaiting review
        </p>
      </div>
    </section>
  );
};
