import { CLEANUP_CATEGORIES } from '../data/cleanupCategories';
import {
  CategoryStat,
  CleanupCategoryId,
  CompressionPreset,
  ConversionOptions,
  LibrarySummary,
  MediaItem,
} from '../types/media';

export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / Math.pow(1024, exponent);
  return `${value >= 100 || exponent === 0 ? value.toFixed(0) : value.toFixed(1)} ${units[exponent]}`;
}

export function hammingDistanceHex(a?: string, b?: string): number {
  if (!a || !b || a.length !== b.length) return Number.MAX_SAFE_INTEGER;
  let dist = 0;
  for (let i = 0; i < a.length; i++) {
    const xor = parseInt(a[i], 16) ^ parseInt(b[i], 16);
    if (Number.isNaN(xor)) return Number.MAX_SAFE_INTEGER;
    dist += xor.toString(2).split('1').length - 1;
  }
  return dist;
}

export function classifyMediaItem(
  item: MediaItem,
  allItems: MediaItem[]
): {
  categories: CleanupCategoryId[];
  reasons: Partial<Record<CleanupCategoryId, string>>;
} {
  const categories = new Set<CleanupCategoryId>(item.categories);
  const reasons: Partial<Record<CleanupCategoryId, string>> = { ...item.reasons };
  const lowerName = item.name.toLowerCase();
  const lowerMime = item.mimeType.toLowerCase();

  // 06. Corrupted & Broken Media
  if (item.isBroken || item.sizeBytes === 0 || (item.width === 0 && item.height === 0)) {
    categories.add('corrupted-broken');
    reasons['corrupted-broken'] ??=
      item.sizeBytes === 0
        ? '0-byte empty file stub'
        : 'Unreadable dimensions or corrupted media stream';
  }

  // 01. Exact & Checksum Duplicates
  const exactDupes = allItems.filter((other) => {
    if (other.id === item.id) return false;
    if (item.md5Checksum && other.md5Checksum && item.md5Checksum === other.md5Checksum) {
      return true;
    }
    if (
      item.sizeBytes > 0 &&
      item.sizeBytes === other.sizeBytes &&
      item.width === other.width &&
      item.height === other.height &&
      item.perceptualHash &&
      other.perceptualHash &&
      item.perceptualHash === other.perceptualHash
    ) {
      return true;
    }
    return false;
  });
  if (exactDupes.length > 0) {
    categories.add('exact-duplicates');
    reasons['exact-duplicates'] ??= `Matches ${exactDupes[0].name} (${formatBytes(item.sizeBytes)})`;
  }

  // 03. Oversized RAW & Uncompressed Files
  const isRaw = /\.(dng|cr2|cr3|nef|arw|raf|raw|tiff|tif|bmp)$/i.test(item.name);
  const isLargeUncompressedPng = lowerMime.includes('png') && item.sizeBytes > 4 * 1024 * 1024;
  const isHugePhoto = item.mediaType === 'image' && item.sizeBytes > 7.5 * 1024 * 1024;
  if (isRaw || isLargeUncompressedPng || isHugePhoto) {
    categories.add('oversized-raw');
    reasons['oversized-raw'] ??= isRaw
      ? `Uncompressed RAW format (${formatBytes(item.sizeBytes)})`
      : `Oversized ${item.width}×${item.height} image (${formatBytes(item.sizeBytes)})`;
  }

  // 11. Large Unedited Videos
  if (
    item.mediaType === 'video' &&
    (item.sizeBytes >= 28 * 1024 * 1024 || (item.durationSec ?? 0) >= 35)
  ) {
    categories.add('large-unedited-videos');
    reasons['large-unedited-videos'] ??= `Large video (${formatBytes(item.sizeBytes)}${
      item.durationSec ? ` · ${Math.round(item.durationSec)}s` : ''
    })`;
  }

  // 12. Redundant Live Photo Clips
  if (
    item.mediaType === 'video' &&
    typeof item.durationSec === 'number' &&
    item.durationSec > 0 &&
    item.durationSec <= 3.5
  ) {
    categories.add('live-photo-clips');
    reasons['live-photo-clips'] ??= `${item.durationSec.toFixed(1)}s Live Photo motion companion clip`;
  }

  // 04. Screenshots & Screen Captures
  const aspect = item.height > 0 ? item.width / item.height : 0;
  const isMobileScreenAspect =
    item.mediaType === 'image' &&
    item.width >= 700 &&
    item.width <= 1440 &&
    (Math.abs(aspect - 9 / 19.5) < 0.04 || Math.abs(aspect - 9 / 16) < 0.04);
  if (/screenshot|screen.?shot|screen.?capture|snip/i.test(lowerName) || isMobileScreenAspect) {
    categories.add('screenshots');
    reasons['screenshots'] ??= 'Matches screen-capture naming or device display dimensions';
  }

  // 07. Receipts, Invoices & Documents
  if (/receipt|invoice|bill|tax|scan|document|boarding|ticket/i.test(lowerName)) {
    categories.add('receipts-documents');
    reasons['receipts-documents'] ??= 'Document or receipt pattern detected';
  }

  // 13. QR Codes, Wi-Fi Passwords & Notes
  if (/wifi|wi-fi|qr|password|router|parking|locker|serial/i.test(lowerName)) {
    categories.add('qr-wifi-ephemera');
    reasons['qr-wifi-ephemera'] ??= 'Ephemeral QR code, Wi-Fi label, or reminder photo';
  }

  // 10. Downloaded Memes & Chat Forwards
  if (/img-\d{8}-wa|whatsapp|received_|meme|giphy|tenor|discord/i.test(lowerName)) {
    categories.add('memes-chat-forwards');
    reasons['memes-chat-forwards'] ??= 'Messaging app download or forwarded image pattern';
  }

  // 08. Accidental Pocket & Dark Shots
  if (typeof item.avgLuminance === 'number' && item.avgLuminance < 26 && !item.isBroken) {
    categories.add('dark-pocket-shots');
    reasons['dark-pocket-shots'] ??= `Extremely low brightness (${Math.round((item.avgLuminance / 255) * 100)}% luminance)`;
  }

  // 09. Overexposed & Washed-Out Frames
  if (
    ((typeof item.avgLuminance === 'number' && item.avgLuminance > 226) ||
      (typeof item.overexposedRatio === 'number' && item.overexposedRatio > 0.72)) &&
    !item.isBroken
  ) {
    categories.add('overexposed-washed');
    reasons['overexposed-washed'] ??= 'Clipped highlights across >72% of frame';
  }

  // 05. Blurry & Out-of-Focus Shots
  if (typeof item.sharpnessScore === 'number' && item.sharpnessScore < 0.28 && !item.isBroken) {
    categories.add('blurry-out-of-focus');
    reasons['blurry-out-of-focus'] ??= `Low edge sharpness index (${Math.round(item.sharpnessScore * 100)}%)`;
  }

  // 14. Tiny Thumbnails & Cached Icons
  const megapixels = (item.width * item.height) / 1_000_000;
  if (
    item.mediaType === 'image' &&
    !item.isBroken &&
    item.width > 0 &&
    item.height > 0 &&
    (megapixels < 0.35 || Math.max(item.width, item.height) < 640)
  ) {
    categories.add('tiny-thumbnails');
    reasons['tiny-thumbnails'] ??= `Low resolution (${item.width}×${item.height}, ${megapixels.toFixed(2)} MP)`;
  }

  // 15. Old Edited Copies & Numbered Exports
  if (/(_edited|-edited|-effects|-pop|\(\d+\)|_copy|export_)/i.test(lowerName)) {
    categories.add('old-edited-exports');
    reasons['old-edited-exports'] ??= 'Numbered duplicate or intermediate edited export';
  }

  // 02. Burst & Near-Duplicates
  const itemTime = Date.parse(item.createdAt);
  const nearDupes = allItems.filter((other) => {
    if (other.id === item.id) return false;
    if (exactDupes.some((d) => d.id === other.id)) return false;
    const otherTime = Date.parse(other.createdAt);
    const closeInTime =
      !Number.isNaN(itemTime) &&
      !Number.isNaN(otherTime) &&
      Math.abs(itemTime - otherTime) <= 8000;
    const similarHash = hammingDistanceHex(item.perceptualHash, other.perceptualHash) <= 6;
    return (closeInTime && item.mediaType === other.mediaType) || similarHash;
  });
  if (nearDupes.length > 0) {
    categories.add('burst-near-duplicates');
    reasons['burst-near-duplicates'] ??= `Near-duplicate frame captured alongside ${nearDupes[0].name}`;
  }

  return {
    categories: Array.from(categories),
    reasons,
  };
}

export function analyzeLibrary(rawItems: MediaItem[]): {
  items: MediaItem[];
  categoryStats: Record<CleanupCategoryId, CategoryStat>;
  summary: LibrarySummary;
} {
  const classified = rawItems.map((item) => {
    const result = classifyMediaItem(item, rawItems);
    return {
      ...item,
      categories: result.categories,
      reasons: result.reasons,
    };
  });

  const categoryStats = {} as Record<CleanupCategoryId, CategoryStat>;
  for (const cat of CLEANUP_CATEGORIES) {
    categoryStats[cat.id] = { count: 0, totalBytes: 0, reclaimableBytes: 0 };
  }

  for (const item of classified) {
    for (const catId of item.categories) {
      const stat = categoryStats[catId];
      if (!stat) continue;
      stat.count += 1;
      stat.totalBytes += item.sizeBytes;
      // Estimate reclaimable bytes depending on whether default action is compress vs delete
      const ratio = catId === 'oversized-raw' || catId === 'large-unedited-videos' ? 0.74 : 1;
      stat.reclaimableBytes += Math.round(item.sizeBytes * ratio);
    }
  }

  let totalBytes = 0;
  let flaggedItems = 0;
  let reclaimableBytes = 0;
  let stagedItems = 0;
  let stagedBytes = 0;
  let convertedItems = 0;
  let actualConvertedSavedBytes = 0;

  for (const item of classified) {
    totalBytes += item.sizeBytes;
    if (item.categories.length > 0) {
      flaggedItems += 1;
      const isCompressionCandidate = item.categories.every(
        (c) => c === 'oversized-raw' || c === 'large-unedited-videos'
      );
      reclaimableBytes += isCompressionCandidate ? Math.round(item.sizeBytes * 0.74) : item.sizeBytes;
    }
    if (item.stagedForRemoval) {
      stagedItems += 1;
      stagedBytes += item.sizeBytes;
    }
    if (item.convertedResult) {
      convertedItems += 1;
      actualConvertedSavedBytes += Math.max(0, item.convertedResult.savedBytes);
    }
  }

  return {
    items: classified,
    categoryStats,
    summary: {
      totalItems: classified.length,
      totalBytes,
      flaggedItems,
      reclaimableBytes,
      stagedItems,
      stagedBytes,
      convertedItems,
      actualConvertedSavedBytes,
    },
  };
}

const PRESET_FACTOR: Record<CompressionPreset, number> = {
  'lossless-visual': 1.0,
  balanced: 0.72,
  'maximum-compact': 0.52,
};

export function getPresetQuality(preset: CompressionPreset): number {
  switch (preset) {
    case 'lossless-visual':
      return 0.9;
    case 'balanced':
      return 0.8;
    case 'maximum-compact':
      return 0.68;
  }
}

export function estimateConversionSavings(
  item: MediaItem,
  options: ConversionOptions
): {
  estimatedOutputBytes: number;
  estimatedSavedBytes: number;
  estimatedSavingsPercent: number;
  qualityRetentionLabel: string;
  rationale: string;
} {
  if (item.sizeBytes <= 0) {
    return {
      estimatedOutputBytes: 0,
      estimatedSavedBytes: 0,
      estimatedSavingsPercent: 0,
      qualityRetentionLabel: 'N/A',
      rationale: 'Empty or broken file cannot be compressed.',
    };
  }

  const presetFactor = PRESET_FACTOR[options.preset];
  const qualityLabel =
    options.preset === 'lossless-visual'
      ? '98% perceptual fidelity'
      : options.preset === 'balanced'
        ? '95% perceptual fidelity'
        : '90% perceptual fidelity';

  // Resolution scaling factor if downscaling large media
  let dimensionScale = 1.0;
  if (options.maxDimension !== 'original') {
    const cap = Number(options.maxDimension);
    const maxSide = Math.max(item.width, item.height);
    if (maxSide > cap && cap > 0) {
      const linear = cap / maxSide;
      dimensionScale = Math.max(0.32, linear * linear);
    }
  }

  if (item.mediaType === 'video') {
    const codecMultiplier = options.videoFormat === 'video/webm' ? 0.34 : 0.42;
    const rawRatio = codecMultiplier * presetFactor * dimensionScale;
    const clampedRatio = Math.min(0.88, Math.max(0.14, rawRatio));
    const estimatedOutputBytes = Math.round(item.sizeBytes * clampedRatio);
    const estimatedSavedBytes = Math.max(0, item.sizeBytes - estimatedOutputBytes);
    const estimatedSavingsPercent = Math.round((estimatedSavedBytes / item.sizeBytes) * 100);
    return {
      estimatedOutputBytes,
      estimatedSavedBytes,
      estimatedSavingsPercent,
      qualityRetentionLabel: qualityLabel,
      rationale: `Re-encodes to ${
        options.videoFormat === 'video/webm' ? 'WebM (VP9)' : 'MP4 (HEVC-profile)'
      } variable bitrate`,
    };
  }

  // Image conversion efficiency based on source format
  const lowerMime = item.mimeType.toLowerCase();
  const isUncompressedOrRaw =
    lowerMime.includes('png') ||
    lowerMime.includes('tiff') ||
    lowerMime.includes('bmp') ||
    /\.(dng|cr2|cr3|nef|arw|raw)$/i.test(item.name);

  let baseRatio = 0.42;
  if (options.imageFormat === 'image/avif') {
    baseRatio = isUncompressedOrRaw ? 0.14 : 0.28;
  } else if (options.imageFormat === 'image/webp') {
    baseRatio = isUncompressedOrRaw ? 0.19 : 0.36;
  } else {
    baseRatio = isUncompressedOrRaw ? 0.28 : 0.56;
  }

  // If image is already tiny or already WebP/AVIF, savings are smaller
  if (lowerMime === options.imageFormat && options.preset === 'lossless-visual' && dimensionScale === 1) {
    baseRatio = 0.88;
  }

  const finalRatio = Math.min(0.92, Math.max(0.08, baseRatio * presetFactor * dimensionScale));
  const estimatedOutputBytes = Math.max(1024, Math.round(item.sizeBytes * finalRatio));
  const estimatedSavedBytes = Math.max(0, item.sizeBytes - estimatedOutputBytes);
  const estimatedSavingsPercent = Math.round((estimatedSavedBytes / item.sizeBytes) * 100);

  const fmtName =
    options.imageFormat === 'image/avif'
      ? 'AVIF'
      : options.imageFormat === 'image/webp'
        ? 'WebP'
        : 'High-Efficiency JPEG';

  return {
    estimatedOutputBytes,
    estimatedSavedBytes,
    estimatedSavingsPercent,
    qualityRetentionLabel: qualityLabel,
    rationale: `Converts ${item.mimeType.replace('image/', '').toUpperCase()} to ${fmtName}`,
  };
}

export function estimateBatchSavings(
  items: MediaItem[],
  options: ConversionOptions
): {
  totalOriginalBytes: number;
  totalEstimatedOutputBytes: number;
  totalEstimatedSavedBytes: number;
  averageSavingsPercent: number;
} {
  let totalOriginalBytes = 0;
  let totalEstimatedOutputBytes = 0;

  for (const item of items) {
    if (item.isBroken || item.sizeBytes <= 0) continue;
    totalOriginalBytes += item.sizeBytes;
    const est = estimateConversionSavings(item, options);
    totalEstimatedOutputBytes += est.estimatedOutputBytes;
  }

  const totalEstimatedSavedBytes = Math.max(0, totalOriginalBytes - totalEstimatedOutputBytes);
  const averageSavingsPercent =
    totalOriginalBytes > 0 ? Math.round((totalEstimatedSavedBytes / totalOriginalBytes) * 100) : 0;

  return {
    totalOriginalBytes,
    totalEstimatedOutputBytes,
    totalEstimatedSavedBytes,
    averageSavingsPercent,
  };
}
