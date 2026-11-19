export type CleanupCategoryId =
  | 'exact-duplicates'
  | 'burst-near-duplicates'
  | 'oversized-raw'
  | 'screenshots'
  | 'blurry-out-of-focus'
  | 'corrupted-broken'
  | 'receipts-documents'
  | 'dark-pocket-shots'
  | 'overexposed-washed'
  | 'memes-chat-forwards'
  | 'large-unedited-videos'
  | 'live-photo-clips'
  | 'qr-wifi-ephemera'
  | 'tiny-thumbnails'
  | 'old-edited-exports';

export type MediaSource = 'sample' | 'local' | 'google-drive';

export type MediaType = 'image' | 'video';

export type TargetImageFormat = 'image/webp' | 'image/avif' | 'image/jpeg';

export type TargetVideoFormat = 'video/webm' | 'video/mp4';

export type CompressionPreset = 'lossless-visual' | 'balanced' | 'maximum-compact';

export interface ConversionOptions {
  imageFormat: TargetImageFormat;
  videoFormat: TargetVideoFormat;
  preset: CompressionPreset;
  maxDimension: 'original' | '3840' | '1920';
}

export interface ConvertedMediaResult {
  blobUrl: string;
  blob: Blob;
  outputMimeType: string;
  outputExtension: string;
  outputBytes: number;
  savedBytes: number;
  savingsPercent: number;
  durationMs: number;
  mode: 'real-encode' | 'bitrate-transcode';
  note?: string;
}

export interface MediaItem {
  id: string;
  name: string;
  source: MediaSource;
  mediaType: MediaType;
  mimeType: string;
  sizeBytes: number;
  width: number;
  height: number;
  durationSec?: number;
  createdAt: string;
  md5Checksum?: string;
  perceptualHash?: string;
  sharpnessScore?: number; // 0 to 1 (higher = sharper)
  avgLuminance?: number; // 0 to 255
  overexposedRatio?: number; // 0 to 1
  isBroken?: boolean;
  cameraModel?: string;
  previewUrl: string;
  driveFileId?: string;
  localFile?: File;
  categories: CleanupCategoryId[];
  reasons: Partial<Record<CleanupCategoryId, string>>;
  aiNotes?: string;
  stagedForRemoval?: boolean;
  convertedResult?: ConvertedMediaResult;
}

export interface CleanupCategoryDefinition {
  id: CleanupCategoryId;
  number: string;
  title: string;
  shortLabel: string;
  description: string;
  deletionTip: string;
  typicalSavings: string;
  riskLevel: 'Safe' | 'Review' | 'Careful';
  defaultAction: 'Delete' | 'Compress' | 'Keep Best';
}

export interface CategoryStat {
  count: number;
  totalBytes: number;
  reclaimableBytes: number;
}

export interface LibrarySummary {
  totalItems: number;
  totalBytes: number;
  flaggedItems: number;
  reclaimableBytes: number;
  stagedItems: number;
  stagedBytes: number;
  convertedItems: number;
  actualConvertedSavedBytes: number;
}
