import { MediaItem } from '../types/media';

function svgDataUrl(svgBody: string, width = 800, height = 600): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${svgBody}</svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

const SCREENSHOT_PREVIEW = svgDataUrl(
  `
  <rect width="540" height="960" fill="#F8FAFC"/>
  <rect x="0" y="0" width="540" height="84" fill="#FFFFFF"/>
  <rect x="28" y="34" width="140" height="16" rx="4" fill="#0F172A"/>
  <rect x="440" y="30" width="72" height="24" rx="6" fill="#2563EB"/>
  <rect x="28" y="116" width="484" height="170" rx="12" fill="#FFFFFF" stroke="#E2E8F0"/>
  <rect x="52" y="146" width="210" height="20" rx="4" fill="#1E293B"/>
  <rect x="52" y="182" width="380" height="14" rx="3" fill="#94A3B8"/>
  <rect x="52" y="210" width="310" height="14" rx="3" fill="#CBD5E1"/>
  <rect x="28" y="310" width="484" height="240" rx="12" fill="#FFFFFF" stroke="#E2E8F0"/>
  <rect x="52" y="342" width="160" height="16" rx="4" fill="#334155"/>
  <rect x="52" y="378" width="436" height="52" rx="8" fill="#F1F5F9"/>
  <rect x="52" y="446" width="436" height="52" rx="8" fill="#F1F5F9"/>
  <rect x="28" y="576" width="484" height="320" rx="12" fill="#FFFFFF" stroke="#E2E8F0"/>
  <rect x="52" y="610" width="260" height="18" rx="4" fill="#1E293B"/>
  <rect x="52" y="652" width="436" height="180" rx="8" fill="#EFF6FF"/>
  `,
  540,
  960
);

const BROKEN_PREVIEW = svgDataUrl(
  `
  <rect width="800" height="600" fill="#E2E8F0"/>
  <rect x="0" y="0" width="800" height="190" fill="#94A3B8"/>
  <rect x="0" y="190" width="800" height="24" fill="#475569"/>
  <rect x="0" y="214" width="290" height="386" fill="#CBD5E1"/>
  <rect x="290" y="214" width="510" height="386" fill="#64748B"/>
  <rect x="30" y="250" width="740" height="12" fill="#DC2626" opacity="0.45"/>
  <rect x="0" y="410" width="800" height="18" fill="#1E293B" opacity="0.5"/>
  `
);

const OVEREXPOSED_PREVIEW = svgDataUrl(
  `
  <rect width="800" height="600" fill="#FAFAFA"/>
  <radialGradient id="glare" cx="50%" cy="42%" r="65%">
    <stop offset="0%" stop-color="#FFFFFF"/>
    <stop offset="72%" stop-color="#F8FAFC"/>
    <stop offset="100%" stop-color="#E2E8F0"/>
  </radialGradient>
  <rect width="800" height="600" fill="url(#glare)"/>
  <circle cx="410" cy="240" r="140" fill="#FFFFFF"/>
  <rect x="0" y="510" width="800" height="90" fill="#E5E7EB" opacity="0.55"/>
  `
);

const MEME_PREVIEW = svgDataUrl(
  `
  <rect width="800" height="800" fill="#1E293B"/>
  <rect x="48" y="130" width="704" height="520" rx="12" fill="#334155"/>
  <circle cx="400" cy="360" r="110" fill="#F59E0B"/>
  <circle cx="360" cy="335" r="14" fill="#0F172A"/>
  <circle cx="440" cy="335" r="14" fill="#0F172A"/>
  <path d="M 345 405 Q 400 445 455 405" stroke="#0F172A" stroke-width="10" fill="none" stroke-linecap="round"/>
  <text x="400" y="90" text-anchor="middle" fill="#FFFFFF" font-family="sans-serif" font-size="38" font-weight="700">MONDAY MORNING INBOX</text>
  <text x="400" y="720" text-anchor="middle" fill="#E2E8F0" font-family="sans-serif" font-size="30" font-weight="600">FORWARDED 14 TIMES</text>
  `,
  800,
  800
);

const QR_WIFI_PREVIEW = svgDataUrl(
  `
  <rect width="800" height="600" fill="#F1F5F9"/>
  <rect x="140" y="70" width="520" height="460" rx="16" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="2"/>
  <text x="400" y="135" text-anchor="middle" fill="#0F172A" font-family="sans-serif" font-size="26" font-weight="700">GUEST WI-FI ACCESS</text>
  <rect x="300" y="170" width="200" height="200" fill="#0F172A"/>
  <rect x="320" y="190" width="52" height="52" fill="#FFFFFF"/>
  <rect x="334" y="204" width="24" height="24" fill="#0F172A"/>
  <rect x="428" y="190" width="52" height="52" fill="#FFFFFF"/>
  <rect x="442" y="204" width="24" height="24" fill="#0F172A"/>
  <rect x="320" y="298" width="52" height="52" fill="#FFFFFF"/>
  <rect x="334" y="312" width="24" height="24" fill="#0F172A"/>
  <rect x="396" y="260" width="84" height="84" fill="#FFFFFF"/>
  <rect x="412" y="276" width="52" height="52" fill="#0F172A"/>
  <text x="400" y="425" text-anchor="middle" fill="#475569" font-family="monospace" font-size="22">SSID: HotelLobby_5G</text>
  <text x="400" y="462" text-anchor="middle" fill="#475569" font-family="monospace" font-size="22">PASS: AutumnOak#482</text>
  `
);

const TINY_THUMB_PREVIEW = svgDataUrl(
  `
  <rect width="320" height="240" fill="#DBEAFE"/>
  <circle cx="160" cy="100" r="42" fill="#60A5FA"/>
  <path d="M 85 210 C 85 155 235 155 235 210" fill="#3B82F6"/>
  `,
  320,
  240
);

export const SAMPLE_LIBRARY: MediaItem[] = [
  {
    id: 'sample-1',
    name: 'IMG_4021_Sierra_Sunrise.jpg',
    source: 'sample',
    mediaType: 'image',
    mimeType: 'image/jpeg',
    sizeBytes: 5_420_000,
    width: 4032,
    height: 3024,
    createdAt: '2026-08-14T06:42:10Z',
    md5Checksum: 'sierra-hash-991a',
    perceptualHash: 'aa55aa55ff00ff00',
    sharpnessScore: 0.92,
    avgLuminance: 138,
    cameraModel: 'Pixel 9 Pro',
    previewUrl: '/src/assets/images/sample_mountain_golden_1795121578619.jpg',
    categories: [],
    reasons: {},
  },
  {
    id: 'sample-2',
    name: 'IMG_4021_Sierra_Sunrise_Copy.jpg',
    source: 'sample',
    mediaType: 'image',
    mimeType: 'image/jpeg',
    sizeBytes: 5_420_000,
    width: 4032,
    height: 3024,
    createdAt: '2026-08-14T06:42:11Z',
    md5Checksum: 'sierra-hash-991a',
    perceptualHash: 'aa55aa55ff00ff00',
    sharpnessScore: 0.92,
    avgLuminance: 138,
    cameraModel: 'Pixel 9 Pro',
    previewUrl: '/src/assets/images/sample_mountain_golden_1795121578619.jpg',
    categories: [],
    reasons: {},
  },
  {
    id: 'sample-3',
    name: 'DSC_0884_Alpine_Ridge.DNG',
    source: 'sample',
    mediaType: 'image',
    mimeType: 'image/x-adobe-dng',
    sizeBytes: 28_600_000,
    width: 6000,
    height: 4000,
    createdAt: '2026-08-14T06:45:00Z',
    perceptualHash: 'aa55aa55ff00ff01',
    sharpnessScore: 0.95,
    avgLuminance: 140,
    cameraModel: 'Sony A7 IV',
    previewUrl: '/src/assets/images/sample_mountain_golden_1795121578619.jpg',
    categories: [],
    reasons: {},
  },
  {
    id: 'sample-4',
    name: 'IMG_5102_Beach_Wave_Burst1.jpg',
    source: 'sample',
    mediaType: 'image',
    mimeType: 'image/jpeg',
    sizeBytes: 4_180_000,
    width: 4032,
    height: 3024,
    createdAt: '2026-07-22T15:10:01Z',
    perceptualHash: '1122334455667788',
    sharpnessScore: 0.89,
    avgLuminance: 162,
    cameraModel: 'iPhone 16 Pro',
    previewUrl: '/src/assets/images/sample_beach_burst_1795121579027.jpg',
    categories: [],
    reasons: {},
  },
  {
    id: 'sample-5',
    name: 'IMG_5103_Beach_Wave_Burst2.jpg',
    source: 'sample',
    mediaType: 'image',
    mimeType: 'image/jpeg',
    sizeBytes: 4_210_000,
    width: 4032,
    height: 3024,
    createdAt: '2026-07-22T15:10:03Z',
    perceptualHash: '1122334455667789',
    sharpnessScore: 0.74,
    avgLuminance: 164,
    cameraModel: 'iPhone 16 Pro',
    previewUrl: '/src/assets/images/sample_beach_burst_1795121579027.jpg',
    categories: [],
    reasons: {},
  },
  {
    id: 'sample-6',
    name: 'IMG_5104_Beach_Wave_Burst3.jpg',
    source: 'sample',
    mediaType: 'image',
    mimeType: 'image/jpeg',
    sizeBytes: 4_150_000,
    width: 4032,
    height: 3024,
    createdAt: '2026-07-22T15:10:04Z',
    perceptualHash: '112233445566778a',
    sharpnessScore: 0.68,
    avgLuminance: 163,
    cameraModel: 'iPhone 16 Pro',
    previewUrl: '/src/assets/images/sample_beach_burst_1795121579027.jpg',
    categories: [],
    reasons: {},
  },
  {
    id: 'sample-7',
    name: 'IMG_5102_Beach_Wave_edited.jpg',
    source: 'sample',
    mediaType: 'image',
    mimeType: 'image/jpeg',
    sizeBytes: 4_850_000,
    width: 4032,
    height: 3024,
    createdAt: '2026-07-23T09:12:00Z',
    perceptualHash: '1122334455667788',
    sharpnessScore: 0.87,
    avgLuminance: 168,
    previewUrl: '/src/assets/images/sample_beach_burst_1795121579027.jpg',
    categories: [],
    reasons: {},
  },
  {
    id: 'sample-8',
    name: 'Screenshot_2026-09-02_Flight_Checkin.png',
    source: 'sample',
    mediaType: 'image',
    mimeType: 'image/png',
    sizeBytes: 2_890_000,
    width: 1179,
    height: 2556,
    createdAt: '2026-09-02T08:15:00Z',
    sharpnessScore: 0.94,
    avgLuminance: 214,
    previewUrl: SCREENSHOT_PREVIEW,
    categories: [],
    reasons: {},
  },
  {
    id: 'sample-9',
    name: 'Screenshot_2026-10-11_Order_Summary.png',
    source: 'sample',
    mediaType: 'image',
    mimeType: 'image/png',
    sizeBytes: 3_120_000,
    width: 1179,
    height: 2556,
    createdAt: '2026-10-11T19:04:00Z',
    sharpnessScore: 0.93,
    avgLuminance: 212,
    previewUrl: SCREENSHOT_PREVIEW,
    categories: [],
    reasons: {},
  },
  {
    id: 'sample-10',
    name: 'IMG_6210_Night_Street_Shake.jpg',
    source: 'sample',
    mediaType: 'image',
    mimeType: 'image/jpeg',
    sizeBytes: 3_640_000,
    width: 4032,
    height: 3024,
    createdAt: '2026-10-18T22:48:00Z',
    sharpnessScore: 0.14,
    avgLuminance: 42,
    cameraModel: 'Pixel 9 Pro',
    previewUrl: '/src/assets/images/sample_blurry_night_1795121578768.jpg',
    categories: [],
    reasons: {},
  },
  {
    id: 'sample-11',
    name: 'IMG_6211_Night_Taillights_Blur.jpg',
    source: 'sample',
    mediaType: 'image',
    mimeType: 'image/jpeg',
    sizeBytes: 3_520_000,
    width: 4032,
    height: 3024,
    createdAt: '2026-10-18T22:48:18Z',
    sharpnessScore: 0.16,
    avgLuminance: 46,
    cameraModel: 'Pixel 9 Pro',
    previewUrl: '/src/assets/images/sample_blurry_night_1795121578768.jpg',
    categories: [],
    reasons: {},
  },
  {
    id: 'sample-12',
    name: 'PXL_20261019_Corrupted_Sync.jpg',
    source: 'sample',
    mediaType: 'image',
    mimeType: 'image/jpeg',
    sizeBytes: 0,
    width: 0,
    height: 0,
    createdAt: '2026-10-19T11:02:00Z',
    isBroken: true,
    previewUrl: BROKEN_PREVIEW,
    categories: ['corrupted-broken'],
    reasons: { 'corrupted-broken': '0-byte failed cloud sync stub' },
  },
  {
    id: 'sample-13',
    name: 'IMG_7004_Truncated_Header.jpg',
    source: 'sample',
    mediaType: 'image',
    mimeType: 'image/jpeg',
    sizeBytes: 184_000,
    width: 0,
    height: 0,
    createdAt: '2026-10-20T16:33:00Z',
    isBroken: true,
    previewUrl: BROKEN_PREVIEW,
    categories: ['corrupted-broken'],
    reasons: { 'corrupted-broken': 'Truncated JPEG EOI marker; lower frame missing' },
  },
  {
    id: 'sample-14',
    name: 'Receipt_JavaBlend_PrintInvoice.jpg',
    source: 'sample',
    mediaType: 'image',
    mimeType: 'image/jpeg',
    sizeBytes: 3_950_000,
    width: 3024,
    height: 4032,
    createdAt: '2026-10-18T09:15:00Z',
    sharpnessScore: 0.88,
    avgLuminance: 146,
    previewUrl: '/src/assets/images/sample_receipt_desk_1795121579703.jpg',
    categories: [],
    reasons: {},
  },
  {
    id: 'sample-15',
    name: 'IMG_8390_Pocket_Trigger.jpg',
    source: 'sample',
    mediaType: 'image',
    mimeType: 'image/jpeg',
    sizeBytes: 1_940_000,
    width: 4032,
    height: 3024,
    createdAt: '2026-11-01T13:20:00Z',
    sharpnessScore: 0.08,
    avgLuminance: 9,
    previewUrl: '/src/assets/images/sample_dark_pocket_1795121578939.jpg',
    categories: [],
    reasons: {},
  },
  {
    id: 'sample-16',
    name: 'IMG_8412_Flash_Blowout.jpg',
    source: 'sample',
    mediaType: 'image',
    mimeType: 'image/jpeg',
    sizeBytes: 2_380_000,
    width: 4032,
    height: 3024,
    createdAt: '2026-11-03T12:08:00Z',
    sharpnessScore: 0.25,
    avgLuminance: 241,
    overexposedRatio: 0.86,
    previewUrl: OVEREXPOSED_PREVIEW,
    categories: [],
    reasons: {},
  },
  {
    id: 'sample-17',
    name: 'IMG-20261104-WA0019_Meme.jpg',
    source: 'sample',
    mediaType: 'image',
    mimeType: 'image/jpeg',
    sizeBytes: 342_000,
    width: 800,
    height: 800,
    createdAt: '2026-11-04T08:40:00Z',
    sharpnessScore: 0.72,
    avgLuminance: 108,
    previewUrl: MEME_PREVIEW,
    categories: [],
    reasons: {},
  },
  {
    id: 'sample-18',
    name: 'VID_20260914_4K60_Coastline_Unedited.MOV',
    source: 'sample',
    mediaType: 'video',
    mimeType: 'video/quicktime',
    sizeBytes: 312_000_000,
    width: 3840,
    height: 2160,
    durationSec: 118,
    createdAt: '2026-09-14T17:30:00Z',
    cameraModel: 'iPhone 16 Pro',
    previewUrl: '/src/assets/images/sample_beach_burst_1795121579027.jpg',
    categories: [],
    reasons: {},
  },
  {
    id: 'sample-19',
    name: 'Screen_Recording_App_Bug_Full.mp4',
    source: 'sample',
    mediaType: 'video',
    mimeType: 'video/mp4',
    sizeBytes: 84_500_000,
    width: 1179,
    height: 2556,
    durationSec: 74,
    createdAt: '2026-10-08T14:12:00Z',
    previewUrl: SCREENSHOT_PREVIEW,
    categories: [],
    reasons: {},
  },
  {
    id: 'sample-20',
    name: 'IMG_5102_LivePhoto_Motion.MOV',
    source: 'sample',
    mediaType: 'video',
    mimeType: 'video/quicktime',
    sizeBytes: 5_800_000,
    width: 1920,
    height: 1440,
    durationSec: 2.1,
    createdAt: '2026-07-22T15:10:01Z',
    previewUrl: '/src/assets/images/sample_beach_burst_1795121579027.jpg',
    categories: [],
    reasons: {},
  },
  {
    id: 'sample-21',
    name: 'Hotel_WiFi_QR_Router_Pass.jpg',
    source: 'sample',
    mediaType: 'image',
    mimeType: 'image/jpeg',
    sizeBytes: 1_850_000,
    width: 3024,
    height: 2268,
    createdAt: '2026-10-25T20:05:00Z',
    sharpnessScore: 0.91,
    avgLuminance: 205,
    previewUrl: QR_WIFI_PREVIEW,
    categories: [],
    reasons: {},
  },
  {
    id: 'sample-22',
    name: 'contact_avatar_cache_320.png',
    source: 'sample',
    mediaType: 'image',
    mimeType: 'image/png',
    sizeBytes: 48_000,
    width: 320,
    height: 240,
    createdAt: '2026-05-03T10:00:00Z',
    sharpnessScore: 0.78,
    avgLuminance: 184,
    previewUrl: TINY_THUMB_PREVIEW,
    categories: [],
    reasons: {},
  },
  {
    id: 'sample-23',
    name: 'Alpine_Panorama_Uncompressed.png',
    source: 'sample',
    mediaType: 'image',
    mimeType: 'image/png',
    sizeBytes: 18_400_000,
    width: 5472,
    height: 3648,
    createdAt: '2026-08-15T07:10:00Z',
    sharpnessScore: 0.94,
    avgLuminance: 145,
    previewUrl: '/src/assets/images/sample_mountain_golden_1795121578619.jpg',
    categories: [],
    reasons: {},
  },
];
