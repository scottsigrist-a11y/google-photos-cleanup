import { CleanupCategoryDefinition, CleanupCategoryId } from '../types/media';

export const CLEANUP_CATEGORIES: CleanupCategoryDefinition[] = [
  {
    id: 'exact-duplicates',
    number: '01',
    title: 'Exact & Checksum Duplicates',
    shortLabel: 'Exact Duplicates',
    description:
      'Byte-identical photos and videos uploaded multiple times across folders, devices, or Takeout imports.',
    deletionTip:
      'Always keep the oldest original timestamped copy and remove redundant identical copies.',
    typicalSavings: '100% of duplicate bytes',
    riskLevel: 'Safe',
    defaultAction: 'Keep Best',
  },
  {
    id: 'burst-near-duplicates',
    number: '02',
    title: 'Burst & Near-Duplicate Shots',
    shortLabel: 'Burst Near-Dupes',
    description:
      'Rapid-fire sequences taken within seconds of the same subject where 3–10 nearly identical frames exist.',
    deletionTip:
      'Compare edge sharpness and facial focus side-by-side, keep the crispest frame, and drop the rest.',
    typicalSavings: '65–85% per burst group',
    riskLevel: 'Review',
    defaultAction: 'Keep Best',
  },
  {
    id: 'oversized-raw',
    number: '03',
    title: 'Oversized RAW & Uncompressed Files',
    shortLabel: 'Oversized Originals',
    description:
      'Heavy DNG/RAW, uncompressed PNG, or ultra-high-bitrate 12–48 MP photos taking 10–40 MB each.',
    deletionTip:
      'Convert archival keepsakes to visually lossless WebP or AVIF (cutting size by ~75–88%) before deleting raw bloat.',
    typicalSavings: '75–88% via conversion',
    riskLevel: 'Careful',
    defaultAction: 'Compress',
  },
  {
    id: 'screenshots',
    number: '04',
    title: 'Screenshots & Screen Captures',
    shortLabel: 'Screenshots',
    description:
      'Phone and desktop screen grabs of maps, shipping trackers, app menus, and fleeting conversations.',
    deletionTip:
      'Sort oldest-first; screenshots older than 90 days are rarely needed unless tagged as tax or legal records.',
    typicalSavings: '100% when deleted',
    riskLevel: 'Safe',
    defaultAction: 'Delete',
  },
  {
    id: 'blurry-out-of-focus',
    number: '05',
    title: 'Blurry & Motion-Shaken Shots',
    shortLabel: 'Blurry Shots',
    description:
      'Low-contrast or smeared handheld captures caused by slow shutter speeds, missed autofocus, or movement.',
    deletionTip:
      'Check if a sharper photo exists from the same minute; if not an irreplaceable memory, delete immediately.',
    typicalSavings: '100% when deleted',
    riskLevel: 'Review',
    defaultAction: 'Delete',
  },
  {
    id: 'corrupted-broken',
    number: '06',
    title: 'Corrupted & Broken Media',
    shortLabel: 'Broken Files',
    description:
      'Zero-byte stubs, truncated downloads, unreadable image headers, or half-rendered grey frame glitches.',
    deletionTip:
      'Unplayable or zero-dimension files cannot be restored from cloud thumbnails and are safe to purge.',
    typicalSavings: '100% of stub bytes',
    riskLevel: 'Safe',
    defaultAction: 'Delete',
  },
  {
    id: 'receipts-documents',
    number: '07',
    title: 'Receipts, Invoices & Paper Scans',
    shortLabel: 'Receipts & Docs',
    description:
      'Coffee receipts, boarding passes, warranty slips, and white-paper documents snapped for temporary reference.',
    deletionTip:
      'Purge expired return-window receipts or convert essential tax documents into ultra-compact grayscale WebP.',
    typicalSavings: '80–100% recovery',
    riskLevel: 'Review',
    defaultAction: 'Delete',
  },
  {
    id: 'dark-pocket-shots',
    number: '08',
    title: 'Accidental Pocket & Dark Frames',
    shortLabel: 'Pocket & Dark',
    description:
      'Near-black photos and 1-second videos triggered accidentally inside pockets, bags, or with lens caps on.',
    deletionTip:
      'Frames with average luminance under 10% almost never contain usable subject detail.',
    typicalSavings: '100% when deleted',
    riskLevel: 'Safe',
    defaultAction: 'Delete',
  },
  {
    id: 'overexposed-washed',
    number: '09',
    title: 'Overexposed & Washed-Out Shots',
    shortLabel: 'Overexposed',
    description:
      'Blinding white frames caused by failed flash metering, direct sun flare, or accidental shutter presses.',
    deletionTip:
      'When over 75% of highlights clip to pure white, detail is unrecoverable—safe to remove.',
    typicalSavings: '100% when deleted',
    riskLevel: 'Review',
    defaultAction: 'Delete',
  },
  {
    id: 'memes-chat-forwards',
    number: '10',
    title: 'Downloaded Memes & Chat Forwards',
    shortLabel: 'Memes & Forwards',
    description:
      'Auto-saved WhatsApp, Telegram, Discord, and SMS reaction images cluttering personal photo timelines.',
    deletionTip:
      'Filter by messaging filename patterns (IMG-WA, received_) and purge group-chat clutter in one batch.',
    typicalSavings: '100% when deleted',
    riskLevel: 'Safe',
    defaultAction: 'Delete',
  },
  {
    id: 'large-unedited-videos',
    number: '11',
    title: 'Giant Unedited Videos & Recordings',
    shortLabel: 'Giant Videos',
    description:
      'Multi-hundred-MB 4K60 clips, long accidental recordings, and bloated screen recordings consuming top quota.',
    deletionTip:
      'Re-encode keeper videos to high-efficiency WebM VP9 or H.265 to reclaim 60–82% space without losing clarity.',
    typicalSavings: '60–82% via transcode',
    riskLevel: 'Careful',
    defaultAction: 'Compress',
  },
  {
    id: 'live-photo-clips',
    number: '12',
    title: 'Redundant Live Photo Motion Clips',
    shortLabel: 'Live Photo Clips',
    description:
      'Short 1.5–3 second companion .MOV/.MP4 clips exported alongside still JPEGs during cloud sync or Takeout.',
    deletionTip:
      'Keep the high-resolution still photo and strip the redundant 2-second motion wrapper for static scenes.',
    typicalSavings: '50–70% per Live Photo',
    riskLevel: 'Review',
    defaultAction: 'Delete',
  },
  {
    id: 'qr-wifi-ephemera',
    number: '13',
    title: 'QR Codes, Wi-Fi Passwords & Labels',
    shortLabel: 'QR & Ephemera',
    description:
      'One-time hotel Wi-Fi routers, parking spot numbers, locker combos, and serial number sticker photos.',
    deletionTip:
      'Move active serial numbers or passwords into a password manager, then clear all ephemeral snapshots.',
    typicalSavings: '100% when deleted',
    riskLevel: 'Safe',
    defaultAction: 'Delete',
  },
  {
    id: 'tiny-thumbnails',
    number: '14',
    title: 'Low-Res Thumbnails & Cached Icons',
    shortLabel: 'Tiny Thumbnails',
    description:
      'Sub-0.5 megapixel previews, contact avatars, and web thumbnails accidentally synced into your photo library.',
    deletionTip:
      'Images smaller than 640px wide are typically app cache leftovers rather than real camera memories.',
    typicalSavings: '100% when deleted',
    riskLevel: 'Safe',
    defaultAction: 'Delete',
  },
  {
    id: 'old-edited-exports',
    number: '15',
    title: 'Old Edited Copies & Numbered Exports',
    shortLabel: 'Edited Exports',
    description:
      'Duplicate files ending in _edited, -EFFECTS, (1), or (2) created by mobile editors and social apps.',
    deletionTip:
      'Choose either your final graded export or the clean original and remove intermediate editing versions.',
    typicalSavings: '50% per pair',
    riskLevel: 'Review',
    defaultAction: 'Keep Best',
  },
];

export const CLEANUP_CATEGORY_MAP: Record<CleanupCategoryId, CleanupCategoryDefinition> =
  CLEANUP_CATEGORIES.reduce(
    (acc, category) => {
      acc[category.id] = category;
      return acc;
    },
    {} as Record<CleanupCategoryId, CleanupCategoryDefinition>
  );
