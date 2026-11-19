import React, { useState } from 'react';
import { FolderOpen, RefreshCw, Upload, X } from 'lucide-react';

interface ConnectImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail: string | null;
  isGoogleConnected: boolean;
  isScanningGoogle: boolean;
  googleStatusMessage: string | null;
  onGoogleSignInAndScan: () => Promise<void>;
  onGoogleSignOut: () => Promise<void>;
  onUploadFiles: (files: FileList) => Promise<void>;
  onResetSampleLibrary: () => void;
}

export const ConnectImportModal: React.FC<ConnectImportModalProps> = ({
  isOpen,
  onClose,
  userEmail,
  isGoogleConnected,
  isScanningGoogle,
  googleStatusMessage,
  onGoogleSignInAndScan,
  onGoogleSignOut,
  onUploadFiles,
  onResetSampleLibrary,
}) => {
  const [isDragging, setIsDragging] = useState(false);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="connect-import-title"
      className="fixed inset-0 z-50 bg-neutral-950/50 flex items-center justify-center p-4"
    >
      <div className="bg-white border border-neutral-200 rounded-xl max-w-xl w-full p-6 shadow-xl">
        <div className="flex items-center justify-between pb-4 border-b border-neutral-100">
          <h2
            id="connect-import-title"
            className="font-display text-lg font-semibold text-neutral-900"
          >
            Connect Google Photos &amp; Import Media
          </h2>
          <button
            type="button"
            aria-label="Close connect and import dialog"
            onClick={onClose}
            className="p-1.5 text-neutral-500 hover:text-neutral-900 rounded-lg hover:bg-neutral-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-5 space-y-6">
          {/* Google Account Integration */}
          <section className="space-y-2.5">
            <h3 className="font-display text-sm font-semibold text-neutral-900">
              1. Cloud Scan via Google Sign-In (Google Drive &amp; Photos)
            </h3>
            <p className="text-xs text-neutral-600 leading-relaxed">
              The initial workspace loads a built-in 23-item sample library. Sign in with Google to
              pull your own cloud photos and videos stored in Google Drive / Google Photos
              (read-only metadata, MD5 duplicate checksums, dimensions, and thumbnails). Note: if
              your photos live exclusively in Google Photos and not in Google Drive, export them via{' '}
              <strong>Google Takeout</strong> and import the folder in Step 2 below.
            </p>

            {isGoogleConnected ? (
              <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-neutral-50 border border-neutral-200 rounded-lg">
                <div className="text-xs">
                  <div className="font-medium text-neutral-900">
                    Connected as {userEmail || 'Google Account'}
                  </div>
                  <div className="text-neutral-500">Read-only access active for this session</div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onGoogleSignInAndScan}
                    disabled={isScanningGoogle}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-[#2563EB] hover:bg-[#1D4ED8] rounded-md cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isScanningGoogle ? 'animate-spin' : ''}`} />
                    {isScanningGoogle ? 'Scanning...' : 'Rescan Library'}
                  </button>
                  <button
                    type="button"
                    onClick={onGoogleSignOut}
                    className="px-3 py-1.5 text-xs font-medium text-neutral-700 bg-neutral-200 hover:bg-neutral-300 rounded-md cursor-pointer"
                  >
                    Disconnect
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={onGoogleSignInAndScan}
                disabled={isScanningGoogle}
                className="gsi-material-button"
              >
                <div className="gsi-material-button-content-wrapper">
                  <div className="gsi-material-button-icon">
                    <svg
                      version="1.1"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 48 48"
                      style={{ display: 'block' }}
                    >
                      <path
                        fill="#EA4335"
                        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                      />
                      <path
                        fill="#4285F4"
                        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                      />
                      <path
                        fill="#34A853"
                        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                      />
                    </svg>
                  </div>
                  <span>{isScanningGoogle ? 'Scanning Google Photos...' : 'Sign in with Google'}</span>
                </div>
              </button>
            )}

            {googleStatusMessage && (
              <p className="text-xs text-neutral-600 bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2">
                {googleStatusMessage}
              </p>
            )}
          </section>

          {/* Local / Google Takeout Upload */}
          <section className="pt-4 border-t border-neutral-100 space-y-2.5">
            <h3 className="font-display text-sm font-semibold text-neutral-900">
              2. Import Photos &amp; Videos from Device (or Google Takeout Folder)
            </h3>
            <p className="text-xs text-neutral-600">
              Imports photos and videos directly from your computer or unzipped Google Takeout
              archive into the analyzer and converter (processed locally in your browser).
            </p>
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={async (e) => {
                e.preventDefault();
                setIsDragging(false);
                if (e.dataTransfer.files?.length) {
                  await onUploadFiles(e.dataTransfer.files);
                  onClose();
                }
              }}
              className={`border border-dashed rounded-xl p-5 text-center transition-colors ${
                isDragging
                  ? 'border-[#2563EB] bg-[#EFF6FF]'
                  : 'border-neutral-300 bg-neutral-50'
              }`}
            >
              <Upload className="w-6 h-6 text-neutral-400 mx-auto mb-2" />
              <p className="text-sm font-medium text-neutral-800">
                Drag and drop photos or videos here
              </p>
              <p className="mt-1 text-xs text-neutral-500">
                Supports JPG, PNG, WebP, AVIF, DNG/RAW, MP4, and MOV.
              </p>
              <div className="mt-3.5 flex flex-wrap items-center justify-center gap-2.5">
                <label className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-white bg-neutral-900 hover:bg-neutral-800 rounded-lg cursor-pointer">
                  <Upload className="w-3.5 h-3.5" />
                  Import Files
                  <input
                    type="file"
                    multiple
                    accept="image/*,video/*"
                    className="sr-only"
                    onChange={async (e) => {
                      if (e.target.files?.length) {
                        await onUploadFiles(e.target.files);
                        onClose();
                      }
                    }}
                  />
                </label>

                <label className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-neutral-700 bg-white border border-neutral-300 hover:bg-neutral-100 rounded-lg cursor-pointer">
                  <FolderOpen className="w-3.5 h-3.5" />
                  Import Takeout Folder
                  <input
                    type="file"
                    multiple
                    {...({ webkitdirectory: '', directory: '' } as Record<string, string>)}
                    className="sr-only"
                    onChange={async (e) => {
                      if (e.target.files?.length) {
                        await onUploadFiles(e.target.files);
                        onClose();
                      }
                    }}
                  />
                </label>
              </div>
            </div>
          </section>

          <div className="pt-3 border-t border-neutral-100 flex items-center justify-between text-xs text-neutral-500">
            <span>Testing without your own files?</span>
            <button
              type="button"
              onClick={() => {
                onResetSampleLibrary();
                onClose();
              }}
              className="font-medium text-[#2563EB] hover:underline cursor-pointer"
            >
              Restore Sample Library
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
