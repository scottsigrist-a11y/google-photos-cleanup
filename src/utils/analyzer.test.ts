import test from 'node:test';
import assert from 'node:assert/strict';
import { CLEANUP_CATEGORIES } from '../data/cleanupCategories';
import {
  analyzeLibrary,
  classifyMediaItem,
  estimateBatchSavings,
  estimateConversionSavings,
  formatBytes,
} from './analyzer';
import { MediaItem } from '../types/media';

function makeItem(overrides: Partial<MediaItem>): MediaItem {
  return {
    id: overrides.id ?? 'id-1',
    name: overrides.name ?? 'IMG_1001.jpg',
    source: overrides.source ?? 'sample',
    mediaType: overrides.mediaType ?? 'image',
    mimeType: overrides.mimeType ?? 'image/jpeg',
    sizeBytes: overrides.sizeBytes ?? 3_200_000,
    width: overrides.width ?? 4032,
    height: overrides.height ?? 3024,
    createdAt: overrides.createdAt ?? '2026-06-15T14:20:00Z',
    previewUrl: overrides.previewUrl ?? '/sample.jpg',
    categories: overrides.categories ?? [],
    reasons: overrides.reasons ?? {},
    ...overrides,
  };
}

test('catalog contains all 15 distinct cleanup suggestions', () => {
  assert.equal(CLEANUP_CATEGORIES.length, 15);
  const ids = new Set(CLEANUP_CATEGORIES.map((c) => c.id));
  assert.equal(ids.size, 15);
});

test('formatBytes renders clean human-readable byte sizes', () => {
  assert.equal(formatBytes(0), '0 B');
  assert.equal(formatBytes(512), '512 B');
  assert.equal(formatBytes(1024 * 1024 * 4.5), '4.5 MB');
  assert.equal(formatBytes(1024 * 1024 * 1024 * 2.2), '2.2 GB');
});

test('classifyMediaItem detects exact duplicates, burst near-dupes, screenshots, broken, dark, and edited copies', () => {
  const a = makeItem({
    id: 'a',
    name: 'IMG_2026.jpg',
    md5Checksum: 'abc123',
    perceptualHash: 'ffffffff00000000',
    createdAt: '2026-06-15T14:20:00Z',
  });
  const b = makeItem({
    id: 'b',
    name: 'IMG_2026 (1).jpg',
    md5Checksum: 'abc123',
    perceptualHash: 'ffffffff00000000',
    createdAt: '2026-06-15T14:20:02Z',
  });
  const c = makeItem({
    id: 'c',
    name: 'IMG_2027.jpg',
    md5Checksum: 'def456',
    perceptualHash: 'ffffffff00000001',
    createdAt: '2026-06-15T14:20:04Z',
  });
  const screenshot = makeItem({
    id: 'scr',
    name: 'Screenshot_20261012-1940.png',
    mimeType: 'image/png',
    width: 1170,
    height: 2532,
    sizeBytes: 2_400_000,
  });
  const broken = makeItem({
    id: 'brk',
    name: 'corrupted_upload.jpg',
    sizeBytes: 0,
    width: 0,
    height: 0,
    isBroken: true,
  });
  const pocket = makeItem({
    id: 'drk',
    name: 'IMG_9991.jpg',
    avgLuminance: 10,
    sharpnessScore: 0.14,
  });

  const all = [a, b, c, screenshot, broken, pocket];

  const resB = classifyMediaItem(b, all);
  assert.ok(resB.categories.includes('exact-duplicates'));
  assert.ok(resB.categories.includes('old-edited-exports'));

  const resC = classifyMediaItem(c, all);
  assert.ok(resC.categories.includes('burst-near-duplicates'));

  const resScr = classifyMediaItem(screenshot, all);
  assert.ok(resScr.categories.includes('screenshots'));

  const resBrk = classifyMediaItem(broken, all);
  assert.ok(resBrk.categories.includes('corrupted-broken'));

  const resPocket = classifyMediaItem(pocket, all);
  assert.ok(resPocket.categories.includes('dark-pocket-shots'));
  assert.ok(resPocket.categories.includes('blurry-out-of-focus'));
});

test('estimateConversionSavings & estimateBatchSavings calculate substantial WebP/AVIF and WebM savings', () => {
  const rawPhoto = makeItem({
    id: 'raw',
    name: 'DSC_0412.DNG',
    mimeType: 'image/x-adobe-dng',
    sizeBytes: 24_000_000,
    width: 6000,
    height: 4000,
  });
  const bigVideo = makeItem({
    id: 'vid',
    name: 'VID_4K_CONCERT.MOV',
    mediaType: 'video',
    mimeType: 'video/quicktime',
    sizeBytes: 180_000_000,
    width: 3840,
    height: 2160,
    durationSec: 64,
  });

  const options = {
    imageFormat: 'image/avif' as const,
    videoFormat: 'video/webm' as const,
    preset: 'balanced' as const,
    maxDimension: 'original' as const,
  };

  const photoEst = estimateConversionSavings(rawPhoto, options);
  assert.ok(photoEst.estimatedSavingsPercent >= 75);
  assert.ok(photoEst.estimatedOutputBytes < rawPhoto.sizeBytes);

  const videoEst = estimateConversionSavings(bigVideo, options);
  assert.ok(videoEst.estimatedSavingsPercent >= 65);
  assert.ok(videoEst.estimatedOutputBytes < bigVideo.sizeBytes);

  const batch = estimateBatchSavings([rawPhoto, bigVideo], options);
  assert.equal(batch.totalOriginalBytes, 204_000_000);
  assert.ok(batch.totalEstimatedSavedBytes > 130_000_000);
  assert.ok(batch.averageSavingsPercent >= 65);
});

test('analyzeLibrary aggregates category stats and summary accurately', () => {
  const items = [
    makeItem({ id: '1', name: 'IMG-20260101-WA0004.jpg', sizeBytes: 420_000, width: 800, height: 800 }),
    makeItem({ id: '2', name: 'Receipt_Coffee.jpg', sizeBytes: 1_200_000 }),
  ];

  const analysis = analyzeLibrary(items);
  assert.equal(analysis.summary.totalItems, 2);
  assert.equal(analysis.summary.totalBytes, 1_620_000);
  assert.equal(analysis.categoryStats['memes-chat-forwards'].count, 1);
  assert.equal(analysis.categoryStats['receipts-documents'].count, 1);
});
