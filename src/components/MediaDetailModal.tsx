import React, { useMemo, useState } from 'react';
import { Download, ImageOff, Trash2, X, Zap } from 'lucide-react';
import { CLEANUP_CATEGORY_MAP } from '../data/cleanupCategories';
import {
  CompressionPreset,
  ConversionOptions,
  ConvertedMediaResult,
  MediaItem,
  TargetImageFormat,
  TargetVideoFormat,
} from '../types/media';
import { estimateConversionSavings, formatBytes } from '../utils/analyzer';
import {
  convertMediaItem,
  getConvertedFilename,
  triggerFileDownload,
} from '../utils/mediaProcessor';

interface MediaDetailModalProps {
  item: MediaItem;
  onClose: () => void;
  onToggleStage: (id: string) => void;
  onConverted: (id: string, result: ConvertedMediaResult) => void;
}

export const MediaDetailModal: React.FC<MediaDetailModalProps> = ({
  item,
  onClose,
  onToggleStage,
  onConverted,
}) => {
  const [options, setOptions] = useState<ConversionOptions>({
    imageFormat: 'image/webp',
    videoFormat: 'video/webm',
    preset: 'lossless-visual',
    maxDimension: 'original',
  });
  const [isConverting, setIsConverting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const estimate = useMemo(() => estimateConversionSavings(item, options), [item, options]);

  const handleConvert = async () => {
    setError(null);
    setIsConverting(true);
    try {
      const result = await convertMediaItem(item, options);
      onConverted(item.id, result);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Conversion failed');
    } finally {
      setIsConverting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="media-inspector-title"
      className="fixed inset-0 z-50 bg-neutral-950/60 flex items-center justify-center p-4"
    >
      <div className="bg-white border border-neutral-200 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200">
          <h2
            id="media-inspector-title"
            className="font-display text-base font-semibold text-neutral-900 truncate pr-4"
          >
            {item.name}
          </h2>
          <button
            type="button"
            aria-label="Close inspector"
            onClick={onClose}
            className="p-1.5 text-neutral-500 hover:text-neutral-900 rounded-lg hover:bg-neutral-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Preview Column */}
          <div>
            <div className="aspect-[4/3] bg-neutral-100 rounded-lg overflow-hidden border border-neutral-200 flex items-center justify-center">
              {item.previewUrl ? (
                <img
                  src={item.previewUrl}
                  alt={item.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="text-neutral-400 flex flex-col items-center">
                  <ImageOff className="w-10 h-10 mb-2" />
                  <span className="text-xs">No readable image frame</span>
                </div>
              )}
            </div>

            <dl className="mt-4 grid grid-cols-2 gap-3 text-xs border-t border-neutral-100 pt-4">
              <div>
                <dt className="text-neutral-500">Original Size</dt>
                <dd className="mt-0.5 font-mono font-medium text-neutral-900 tabular-nums">
                  {formatBytes(item.sizeBytes)}
                </dd>
              </div>
              <div>
                <dt className="text-neutral-500">Resolution</dt>
                <dd className="mt-0.5 font-mono font-medium text-neutral-900 tabular-nums">
                  {item.width > 0 ? `${item.width} × ${item.height}` : 'Unreadable'}
                </dd>
              </div>
              <div>
                <dt className="text-neutral-500">Format</dt>
                <dd className="mt-0.5 font-mono text-neutral-800">{item.mimeType}</dd>
              </div>
              <div>
                <dt className="text-neutral-500">Captured</dt>
                <dd className="mt-0.5 font-mono text-neutral-800">
                  {new Date(item.createdAt).toLocaleDateString()}
                </dd>
              </div>
            </dl>
          </div>

          {/* Cleanup & Single Conversion Column */}
          <div className="space-y-5">
            <div>
              <h3 className="font-display text-sm font-semibold text-neutral-900">
                Detected Cleanup Signals
              </h3>
              {item.categories.length === 0 ? (
                <p className="mt-1.5 text-sm text-neutral-600">
                  No deletion flags triggered. You can still convert this file to save storage.
                </p>
              ) : (
                <ul className="mt-2 space-y-2">
                  {item.categories.map((catId) => {
                    const def = CLEANUP_CATEGORY_MAP[catId];
                    return (
                      <li
                        key={catId}
                        className="text-xs bg-neutral-50 border border-neutral-200 rounded-lg p-3"
                      >
                        <div className="font-medium text-neutral-900">
                          {def.number}. {def.title}
                        </div>
                        <div className="mt-0.5 text-neutral-600">
                          {item.reasons[catId] || def.description}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}

              {item.aiNotes && (
                <p className="mt-2 text-xs text-[#1D4ED8] bg-[#EFF6FF] border border-[#BFDBFE] rounded-lg p-3">
                  AI Visual Note: {item.aiNotes}
                </p>
              )}
            </div>

            {/* Single-file converter */}
            {!item.isBroken && item.sizeBytes > 0 && (
              <div className="pt-4 border-t border-neutral-200 space-y-3">
                <h3 className="font-display text-sm font-semibold text-neutral-900">
                  Convert &amp; Compress Single File
                </h3>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label
                      htmlFor="single-format"
                      className="block text-[11px] font-medium text-neutral-500 mb-1"
                    >
                      Format
                    </label>
                    {item.mediaType === 'image' ? (
                      <select
                        id="single-format"
                        value={options.imageFormat}
                        onChange={(e) =>
                          setOptions((p) => ({
                            ...p,
                            imageFormat: e.target.value as TargetImageFormat,
                          }))
                        }
                        className="w-full px-2.5 py-1.5 text-xs bg-neutral-50 border border-neutral-200 rounded-lg"
                      >
                        <option value="image/webp">WebP</option>
                        <option value="image/avif">AVIF</option>
                        <option value="image/jpeg">Compact JPEG</option>
                      </select>
                    ) : (
                      <select
                        id="single-format"
                        value={options.videoFormat}
                        onChange={(e) =>
                          setOptions((p) => ({
                            ...p,
                            videoFormat: e.target.value as TargetVideoFormat,
                          }))
                        }
                        className="w-full px-2.5 py-1.5 text-xs bg-neutral-50 border border-neutral-200 rounded-lg"
                      >
                        <option value="video/webm">WebM VP9</option>
                        <option value="video/mp4">MP4 HEVC-Profile</option>
                      </select>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="single-preset"
                      className="block text-[11px] font-medium text-neutral-500 mb-1"
                    >
                      Quality
                    </label>
                    <select
                      id="single-preset"
                      value={options.preset}
                      onChange={(e) =>
                        setOptions((p) => ({
                          ...p,
                          preset: e.target.value as CompressionPreset,
                        }))
                      }
                      className="w-full px-2.5 py-1.5 text-xs bg-neutral-50 border border-neutral-200 rounded-lg"
                    >
                      <option value="lossless-visual">Visually Lossless (90%)</option>
                      <option value="balanced">Balanced (80%)</option>
                      <option value="maximum-compact">Max Compact (68%)</option>
                    </select>
                  </div>
                </div>

                <div className="text-xs bg-neutral-50 border border-neutral-200 rounded-lg p-3 flex items-center justify-between">
                  <span className="text-neutral-600">Estimated Savings:</span>
                  <span className="font-mono font-semibold text-[#16A34A] tabular-nums">
                    ~{formatBytes(estimate.estimatedSavedBytes)} ({estimate.estimatedSavingsPercent}
                    %)
                  </span>
                </div>

                {error && <p className="text-xs text-red-600">{error}</p>}

                {item.convertedResult && (
                  <div className="text-xs bg-[#F0FDF4] border border-[#BBF7D0] rounded-lg p-3 flex items-center justify-between gap-2">
                    <span className="text-[#166534] tabular-nums">
                      Converted ({item.convertedResult.outputExtension.toUpperCase()}):{' '}
                      <strong>{formatBytes(item.convertedResult.outputBytes)}</strong> · Saved{' '}
                      <strong>{item.convertedResult.savingsPercent}%</strong>
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        triggerFileDownload(
                          item.convertedResult!.blobUrl,
                          getConvertedFilename(item.name, item.convertedResult!.outputExtension)
                        )
                      }
                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-[#86EFAC] text-[#166534] rounded-md font-medium cursor-pointer shrink-0"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Save
                    </button>
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleConvert}
                  disabled={isConverting}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#2563EB] hover:bg-[#1D4ED8] disabled:opacity-50 rounded-lg cursor-pointer"
                >
                  <Zap className="w-4 h-4" />
                  {isConverting ? 'Converting...' : 'Convert Now'}
                </button>
              </div>
            )}

            <div className="pt-4 border-t border-neutral-200 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => {
                  onToggleStage(item.id);
                  onClose();
                }}
                className={`inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg cursor-pointer ${
                  item.stagedForRemoval
                    ? 'bg-neutral-100 text-neutral-800 hover:bg-neutral-200'
                    : 'bg-[#DC2626] text-white hover:bg-[#B91C1C]'
                }`}
              >
                <Trash2 className="w-4 h-4" />
                {item.stagedForRemoval ? 'Remove from Elimination Queue' : 'Stage for Elimination'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
