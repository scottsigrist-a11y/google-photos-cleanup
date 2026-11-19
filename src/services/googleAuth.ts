import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  User,
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';
import { MediaItem } from '../types/media';

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

const SCOPES = [
  'https://www.googleapis.com/auth/drive.photos.readonly',
  'https://www.googleapis.com/auth/drive.readonly',
];

const provider = new GoogleAuthProvider();
for (const scope of SCOPES) {
  provider.addScope(scope);
}

// In-memory access token cache only (never stored in localStorage or sessionStorage).
let isSigningIn = false;
let cachedAccessToken: string | null = null;

export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: (user: User | null) => void
) => {
  return onAuthStateChanged(auth, (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        onAuthSuccess?.(user, cachedAccessToken);
      } else if (!isSigningIn) {
        cachedAccessToken = null;
        onAuthFailure?.(user);
      }
    } else {
      cachedAccessToken = null;
      onAuthFailure?.(null);
    }
  });
};

export const googleSignIn = async (): Promise<{ user: User; accessToken: string }> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Could not obtain Google access token from sign-in response.');
    }
    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = (): string | null => cachedAccessToken;

export const logoutGoogle = async (): Promise<void> => {
  await auth.signOut();
  cachedAccessToken = null;
};

interface DriveFileRecord {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  createdTime?: string;
  modifiedTime?: string;
  md5Checksum?: string;
  thumbnailLink?: string;
  trashed?: boolean;
  imageMediaMetadata?: {
    width?: number;
    height?: number;
    cameraModel?: string;
  };
  videoMediaMetadata?: {
    width?: number;
    height?: number;
    durationMillis?: string;
  };
}

export async function fetchGooglePhotosAndDriveMedia(
  accessToken: string,
  onProgress?: (loadedCount: number) => void
): Promise<MediaItem[]> {
  const collected: DriveFileRecord[] = [];
  let pageToken: string | undefined;
  let pageCount = 0;

  // Query both drive and photos spaces where available, up to 250 media files for fast responsive scan
  const query = "(mimeType contains 'image/' or mimeType contains 'video/') and trashed = false";
  const fields =
    'nextPageToken,files(id,name,mimeType,size,createdTime,modifiedTime,md5Checksum,thumbnailLink,imageMediaMetadata,videoMediaMetadata)';

  do {
    const params = new URLSearchParams({
      q: query,
      fields,
      pageSize: '100',
      orderBy: 'createdTime desc',
      spaces: 'drive,photos',
    });
    if (pageToken) {
      params.set('pageToken', pageToken);
    }

    let response = await fetch(`https://www.googleapis.com/drive/v3/files?${params.toString()}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    // Fallback to drive space alone if photos space is unsupported for the account
    if (response.status === 400) {
      params.set('spaces', 'drive');
      response = await fetch(`https://www.googleapis.com/drive/v3/files?${params.toString()}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
    }

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Google Drive API error (${response.status}): ${text}`);
    }

    const data = (await response.json()) as {
      nextPageToken?: string;
      files?: DriveFileRecord[];
    };

    if (data.files?.length) {
      collected.push(...data.files);
      onProgress?.(collected.length);
    }
    pageToken = data.nextPageToken;
    pageCount += 1;
  } while (pageToken && pageCount < 3);

  return collected.map((file) => {
    const isVideo = file.mimeType.startsWith('video/');
    const width = isVideo
      ? file.videoMediaMetadata?.width ?? 1920
      : file.imageMediaMetadata?.width ?? 0;
    const height = isVideo
      ? file.videoMediaMetadata?.height ?? 1080
      : file.imageMediaMetadata?.height ?? 0;
    const sizeBytes = Number(file.size ?? 0);
    const durationSec = file.videoMediaMetadata?.durationMillis
      ? Number(file.videoMediaMetadata.durationMillis) / 1000
      : undefined;

    return {
      id: `gdrive-${file.id}`,
      driveFileId: file.id,
      name: file.name,
      source: 'google-drive',
      mediaType: isVideo ? 'video' : 'image',
      mimeType: file.mimeType,
      sizeBytes,
      width,
      height,
      durationSec,
      createdAt: file.createdTime ?? file.modifiedTime ?? new Date().toISOString(),
      md5Checksum: file.md5Checksum,
      cameraModel: file.imageMediaMetadata?.cameraModel,
      previewUrl: file.thumbnailLink ? file.thumbnailLink.replace(/=s\d+$/, '=s640') : '',
      isBroken: sizeBytes === 0,
      categories: [],
      reasons: {},
    };
  });
}

export async function downloadDriveFileBlob(
  fileId: string,
  accessToken: string
): Promise<Blob> {
  const response = await fetch(
    `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?alt=media`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );
  if (!response.ok) {
    throw new Error(`Unable to download media from Google Drive (${response.status})`);
  }
  return response.blob();
}
