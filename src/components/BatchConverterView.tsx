import React, { useMemo, useState } from 'react';
import { Archive, Download, Play, Upload } from 'lucide-react';
import {
  CompressionPreset,
  ConversionOptions,
  ConvertedMediaResult,
  MediaItem,
  TargetImageFormat,
  TargetVideoFormat,
} from '../types/media';
import {
  estimateBatchSavings,
  estimateConversionSavings,
  formatBytes,
} from '../utils/analyzer';
import {
  convertMediaItem,
  downloadBatchZip,
  getConvertedFilename,
  triggerFileDownload,
} from '../utils/mediaProcessor';

interface BatchConverterViewProps {
  allItems: MediaItem[];
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onSelectPresetGroup: (ids: string[]) => void;
  onItemConverted: (itemId: string, result: ConvertedMediaResult) => void;
  onUploadLocalFiles: (files: FileList) => Promise<void>;
}

export const BatchConverterView: React.FC<BatchConverterViewProps> = ({
  allItems,
  selectedIds,
  onToggleSelect,
  onSelectPresetGroup,
  onItemConverted,
  onUploadLocalFiles,
}) => {
  const [options, setOptions] = useState<ConversionOptions>({
    imageFormat: 'image/webp',
    videoFormat: 'video/webm',
    preset: 'lossless-visual',
    maxDimension: 'original',
  });
  const [isConverting, setIsConverting] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const convertibleItems = useMemo(
    () => allItems.filter((item) => !item.isBroken && item.sizeBytes > 0),
    [allItems]
  );

  const queueItems = useMemo(() => {
    const selected = convertibleItems.filter((item) => selectedIds.has(item.id));
    return selected.length > 0
      ? selected
      : convertibleItems.filter(
          (i) =>
            i.categories.includes('oversized-raw') ||
            i.categories.includes('large-unedited-videos') ||
            i.sizeBytes >= 2_500_000
        );
  }, [convertibleItems, selectedIds]);

  const batchEstimate = useMemo(
    () => estimateBatchSavings(queueItems, options),
    [queueItems, options]
  );

  const convertedInQueue = useMemo(
    () =>
      queueItems
        .filter((i) => i.convertedResult)
        .map((i) => ({ item: i, result: i.convertedResult! })),
    [queueItems]
  );

  const actualConvertedStats = useMemo(() => {
    if (convertedInQueue.length === 0) return null;
    const orig = convertedInQueue.reduce((s, x) => s + x.item.sizeBytes, 0);
    const out = convertedInQueue.reduce((s, x) => s + x.result.outputBytes, 0);
    const saved = Math.max(0, orig - out);
    return {
      count: convertedInQueue.length,
      orig,
      out,
      saved,
      pct: orig > 0 ? Math.round((saved / orig) * 100) : 0,
    };
  }, [convertedInQueue]);

  const handleRunBatch = async () => {
    if (queueItems.length === 0) return;
    setErrorMessage(null);
    setIsConverting(true);
    setProgress({ done: 0, total: queueItems.length });

    try {
      for (let i = 0; i < queueItems.length; i++) {
        const item = queueItems[i];
        const result = await convertMediaItem(item, options);
        onItemConverted(item.id, result);
        setProgress({ done: i + 1, total: queueItems.length });
      }
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Batch conversion failed.');
    } finally {
      setIsConverting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top configuration & savings projection */}
      <div className="bg-white border border-neutral-200 rounded-xl p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-neutral-100">
          <div>
            <h1 className="font-display text-2xl font-semibold text-neutral-900">
              Single &amp; Batch Quality-Preserving Converter
            </h1>
            <p className="mt-1 text-sm text-neutral-600 max-w-2xl">
              Re-encode oversized photos (RAW, PNG, heavy JPEG) to compact WebP or AVIF and shrink
              bloated videos to WebM VP9 while preserving crisp visual detail.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <label className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-lg cursor-pointer transition-colors">
              <Upload className="w-3.5 h-3.5" />
              <span>Add Local Files</span>
              <input
                type="file"
                multiple
                accept="image/*,video/*"
                className="sr-only"
                onChange={(e) => {
                  if (e.target.files?.length) {
                    onUploadLocalFiles(e.target.files);
                  }
                }}
              />
            </label>

            <button
              type="button"
              onClick={() => onSelectPresetGroup(convertibleItems.map((i) => i.id))}
              className="px-3.5 py-2 text-xs font-medium text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              Queue All ({convertibleItems.length})
            </button>
          </div>
        </div>

        {/* Encoding Controls */}
        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label
              htmlFor="target-image-format"
              className="block text-xs font-medium text-neutral-700 mb-1.5"
            >
              Target Photo Format
            </label>
            <select
              id="target-image-format"
              value={options.imageFormat}
              onChange={(e) =>
                setOptions((prev) => ({
                  ...prev,
                  imageFormat: e.target.value as TargetImageFormat,
                }))
              }
              className="w-full px-3 py-2 text-sm bg-neutral-50 border border-neutral-200 rounded-lg text-neutral-900 focus:outline-none focus:border-[#2563EB] cursor-pointer"
            >
              <option value="image/webp">WebP (Universal, ~65–82% smaller)</option>
              <option value="image/avif">AVIF (Next-gen, ~72–88% smaller)</option>
              <option value="image/jpeg">Optimized JPEG (Max compatibility)</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="target-video-format"
              className="block text-xs font-medium text-neutral-700 mb-1.5"
            >
              Target Video Format
            </label>
            <select
              id="target-video-format"
              value={options.videoFormat}
              onChange={(e) =>
                setOptions((prev) => ({
                  ...prev,
                  videoFormat: e.target.value as TargetVideoFormat,
                }))
              }
              className="w-full px-3 py-2 text-sm bg-neutral-50 border border-neutral-200 rounded-lg text-neutral-900 focus:outline-none focus:border-[#2563EB] cursor-pointer"
            >
              <option value="video/webm">WebM VP9 (Best web compression)</option>
              <option value="video/mp4">MP4 High-Efficiency Profile</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="quality-preset"
              className="block text-xs font-medium text-neutral-700 mb-1.5"
            >
              Quality vs. Size Profile
            </label>
            <select
              id="quality-preset"
              value={options.preset}
              onChange={(e) =>
                setOptions((prev) => ({
                  ...prev,
                  preset: e.target.value as CompressionPreset,
                }))
              }
              className="w-full px-3 py-2 text-sm bg-neutral-50 border border-neutral-200 rounded-lg text-neutral-900 focus:outline-none focus:border-[#2563EB] cursor-pointer"
            >
              <option value="lossless-visual">Visually Lossless (90% quality)</option>
              <option value="balanced">Balanced Storage Saver (80% quality)</option>
              <option value="maximum-compact">Maximum Compact (68% quality)</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="max-dimension"
              className="block text-xs font-medium text-neutral-700 mb-1.5"
            >
              Max Resolution Cap
            </label>
            <select
              id="max-dimension"
              value={options.maxDimension}
              onChange={(e) =>
                setOptions((prev) => ({
                  ...prev,
                  maxDimension: e.target.value as ConversionOptions['maxDimension'],
                }))
              }
              className="w-full px-3 py-2 text-sm bg-neutral-50 border border-neutral-200 rounded-lg text-neutral-900 focus:outline-none focus:border-[#2563EB] cursor-pointer"
            >
              <option value="original">Keep Original Dimensions</option>
              <option value="3840">Cap at 4K UHD (3840px)</option>
              <option value="1920">Cap at 1080p HD (1920px)</option>
            </select>
          </div>
        </div>

        {/* Live Estimated Savings Readout */}
        <div className="mt-6 pt-5 border-t border-neutral-200 grid grid-cols-1 sm:grid-cols-4 gap-4 items-center">
          <div>
            <p className="text-xs text-neutral-500">Queue Original Size ({queueItems.length} files)</p>
            <p className="mt-1 text-xl font-display font-semibold text-neutral-900 tabular-nums">
              {formatBytes(batchEstimate.totalOriginalBytes)}
            </p>
          </div>

          <div>
            <p className="text-xs text-neutral-500">Projected Converted Size</p>
            <p className="mt-1 text-xl font-display font-semibold text-neutral-900 tabular-nums">
              {formatBytes(batchEstimate.totalEstimatedOutputBytes)}
            </p>
          </div>

          <div>
            <p className="text-xs text-neutral-500">Estimated Space Savings</p>
            <p className="mt-1 text-xl font-display font-semibold text-[#16A34A] tabular-nums">
              {formatBytes(batchEstimate.totalEstimatedSavedBytes)} (
              {batchEstimate.averageSavingsPercent}%)
            </p>
          </div>

          <div className="flex flex-wrap sm:justify-end gap-2">
            <button
              type="button"
              onClick={handleRunBatch}
              disabled={isConverting || queueItems.length === 0}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-[#2563EB] hover:bg-[#1D4ED8] disabled:opacity-50 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Play className="w-4 h-4" />
              {isConverting
                ? `Converting ${progress.done}/${progress.total}...`
                : `Convert ${queueItems.length} File${queueItems.length === 1 ? '' : 's'}`}
            </button>

            {convertedInQueue.length > 0 && (
              <button
                type="button"
                onClick={() => downloadBatchZip(convertedInQueue)}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-neutral-900 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Archive className="w-4 h-4" />
                Download ZIP ({convertedInQueue.length})
              </button>
            )}
          </div>
        </div>

        {!isConverting && actualConvertedStats && (
          <div
            role="status"
            className="mt-4 px-4 py-3 rounded-lg bg-[#F0FDF4] border border-[#BBF7D0] text-sm text-[#166534] tabular-nums"
          >
            Measured conversion complete for {actualConvertedStats.count}{' '}
            {actualConvertedStats.count === 1 ? 'file' : 'files'}: reduced from{' '}
            <strong>{formatBytes(actualConvertedStats.orig)}</strong> to{' '}
            <strong>{formatBytes(actualConvertedStats.out)}</strong> — saved{' '}
            <strong>
              {formatBytes(actualConvertedStats.saved)} ({actualConvertedStats.pct}%)
            </strong>
            .
          </div>
        )}

        {errorMessage && (
          <div
            role="alert"
            className="mt-4 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-800"
          >
            {errorMessage}
          </div>
        )}
      </div>

      {/* Per-File Breakdown Table */}
      <div className="bg-white border border-neutral-200 rounded-xl overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-neutral-200 text-xs font-medium text-neutral-500">
              <th className="py-3 pl-4 pr-2 w-10">
                <span className="sr-only">Include in batch</span>
              </th>
              <th className="py-3 px-3">Media File</th>
              <th className="py-3 px-3">Target Format</th>
              <th className="py-3 px-3 text-right">Original</th>
              <th className="py-3 px-3 text-right">Est. / Actual Output</th>
              <th className="py-3 px-3 text-right">Space Saved</th>
              <th className="py-3 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100 text-sm">
            {convertibleItems.map((item) => {
              const est = estimateConversionSavings(item, options);
              const res = item.convertedResult;
              const isQueued = queueItems.some((q) => q.id === item.id);

              return (
                <tr key={item.id} className="hover:bg-neutral-50 transition-colors">
                  <td className="py-2.5 pl-4 pr-2">
                    <input
                      type="checkbox"
                      aria-label={`Include ${item.name} in conversion queue`}
                      checked={selectedIds.has(item.id) || (selectedIds.size === 0 && isQueued)}
                      onChange={() => onToggleSelect(item.id)}
                      className="w-4 h-4 rounded border-neutral-300 text-[#2563EB] cursor-pointer"
                    />
                  </td>
                  <td className="py-2.5 px-3">
                    <div className="font-medium text-neutral-900 truncate max-w-[260px]">
                      {item.name}
                    </div>
                    <div className="text-xs text-neutral-500 font-mono tabular-nums">
                      {item.width}×{item.height} · {item.mediaType.toUpperCase()}
                    </div>
                  </td>
                  <td className="py-2.5 px-3 text-xs text-neutral-600">
                    {res ? res.outputExtension.toUpperCase() : est.rationale}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-xs text-neutral-700 tabular-nums">
                    {formatBytes(item.sizeBytes)}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-xs text-neutral-900 tabular-nums">
                    {res ? formatBytes(res.outputBytes) : `~${formatBytes(est.estimatedOutputBytes)}`}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-xs font-medium text-[#16A34A] tabular-nums">
                    {res
                      ? `${formatBytes(res.savedBytes)} (${res.savingsPercent}%)`
                      : `~${formatBytes(est.estimatedSavedBytes)} (${est.estimatedSavingsPercent}%)`}
                  </td>
                  <td className="py-2.5 px-4 text-right">
                    {res ? (
                      <button
                        type="button"
                        onClick={() =>
                          triggerFileDownload(
                            res.blobUrl,
                            getConvertedFilename(item.name, res.outputExtension)
                          )
                        }
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-[#2563EB] hover:bg-[#EFF6FF] rounded-md cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                        Save
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={async () => {
                          setErrorMessage(null);
                          try {
                            const converted = await convertMediaItem(item, options);
                            onItemConverted(item.id, converted);
                          } catch (err: unknown) {
                            setErrorMessage(
                              err instanceof Error ? err.message : 'Conversion failed'
                            );
                          }
                        }}
                        className="px-2.5 py-1 text-xs font-medium text-neutral-700 hover:text-neutral-900 bg-neutral-100 hover:bg-neutral-200 rounded-md cursor-pointer"
                      >
                        Convert 1
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
