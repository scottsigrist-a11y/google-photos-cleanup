import React, { useState } from 'react';
import { RotateCcw, Trash2 } from 'lucide-react';
import { CLEANUP_CATEGORY_MAP } from '../data/cleanupCategories';
import { MediaItem } from '../types/media';
import { formatBytes } from '../utils/analyzer';

interface EliminationQueueViewProps {
  stagedItems: MediaItem[];
  onUnstageItem: (id: string) => void;
  onClearQueue: () => void;
  onConfirmEliminate: (ids: string[]) => void;
}

export const EliminationQueueView: React.FC<EliminationQueueViewProps> = ({
  stagedItems,
  onUnstageItem,
  onClearQueue,
  onConfirmEliminate,
}) => {
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const totalStagedBytes = stagedItems.reduce((sum, i) => sum + i.sizeBytes, 0);
  const driveCount = stagedItems.filter((i) => i.source === 'google-drive').length;

  return (
    <div className="space-y-6">
      <div className="bg-white border border-neutral-200 rounded-xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-neutral-900">
            Elimination Review Queue
          </h1>
          <p className="mt-1 text-sm text-neutral-600">
            Review every file before removal. Nothing is deleted from your library until you
            explicitly confirm below.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <div className="text-right mr-2">
            <div className="text-xs text-neutral-500">Total Space to Free</div>
            <div className="text-lg font-display font-semibold text-[#16A34A] tabular-nums">
              {formatBytes(totalStagedBytes)} ({stagedItems.length} files)
            </div>
          </div>

          {stagedItems.length > 0 && (
            <>
              <button
                type="button"
                onClick={onClearQueue}
                className="px-3.5 py-2 text-xs font-medium text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors cursor-pointer"
              >
                Restore All
              </button>
              <button
                type="button"
                onClick={() => setShowConfirmModal(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-[#DC2626] hover:bg-[#B91C1C] rounded-lg transition-colors cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                Eliminate {stagedItems.length} Item{stagedItems.length === 1 ? '' : 's'}
              </button>
            </>
          )}
        </div>
      </div>

      {stagedItems.length === 0 ? (
        <div className="bg-white border border-neutral-200 rounded-xl p-12 text-center">
          <p className="font-display text-base font-semibold text-neutral-900">
            Your elimination queue is empty
          </p>
          <p className="mt-1 text-sm text-neutral-500">
            Select cluttered files in the Workspace or click &ldquo;Stage Group&rdquo; on any of the
            15 Cleanup Suggestions to stage items here for safe review.
          </p>
        </div>
      ) : (
        <div className="bg-white border border-neutral-200 rounded-xl divide-y divide-neutral-100">
          {stagedItems.map((item) => (
            <div
              key={item.id}
              className="p-4 flex items-center justify-between gap-4 hover:bg-neutral-50 transition-colors"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-14 h-11 rounded-md bg-neutral-100 overflow-hidden shrink-0">
                  {item.previewUrl ? (
                    <img
                      src={item.previewUrl}
                      alt={item.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  ) : null}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-neutral-900 truncate">{item.name}</p>
                  <p className="text-xs text-neutral-500 truncate">
                    {item.categories.length > 0
                      ? item.categories
                          .map((c) => CLEANUP_CATEGORY_MAP[c]?.shortLabel)
                          .join(' · ')
                      : 'Manual selection'}{' '}
                    · <span className="font-mono tabular-nums">{formatBytes(item.sizeBytes)}</span>
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onUnstageItem(item.id)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-700 hover:text-neutral-900 bg-neutral-100 hover:bg-neutral-200 rounded-lg shrink-0 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Keep File
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Explicit Confirmation Modal */}
      {showConfirmModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-eliminate-title"
          className="fixed inset-0 z-50 bg-neutral-950/50 flex items-center justify-center p-4"
        >
          <div className="bg-white border border-neutral-200 rounded-xl max-w-md w-full p-6 shadow-lg">
            <h2
              id="confirm-eliminate-title"
              className="font-display text-lg font-semibold text-neutral-900"
            >
              Confirm Elimination of {stagedItems.length} Item
              {stagedItems.length === 1 ? '' : 's'}?
            </h2>
            <p className="mt-2 text-sm text-neutral-600">
              You are about to remove{' '}
              <strong className="font-mono tabular-nums">{formatBytes(totalStagedBytes)}</strong>{' '}
              across {stagedItems.length} staged media file(s) from your workspace.
            </p>
            {driveCount > 0 && (
              <p className="mt-2 text-xs text-neutral-500">
                Note: {driveCount} item(s) come from read-only Google Drive/Photos access, so they
                will be removed from this cleanup list and exported as a deletion checklist rather
                than silently modified in Google Drive.
              </p>
            )}

            <ul className="mt-3 max-h-36 overflow-y-auto border border-neutral-100 rounded-lg p-2.5 text-xs text-neutral-700 space-y-1 bg-neutral-50">
              {stagedItems.slice(0, 10).map((item) => (
                <li key={item.id} className="truncate font-mono">
                  • {item.name} ({formatBytes(item.sizeBytes)})
                </li>
              ))}
              {stagedItems.length > 10 && (
                <li className="text-neutral-500">
                  ...and {stagedItems.length - 10} more file(s)
                </li>
              )}
            </ul>

            <div className="mt-5 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 text-sm font-medium text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  onConfirmEliminate(stagedItems.map((i) => i.id));
                  setShowConfirmModal(false);
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-[#DC2626] hover:bg-[#B91C1C] rounded-lg cursor-pointer"
              >
                Confirm Removal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
