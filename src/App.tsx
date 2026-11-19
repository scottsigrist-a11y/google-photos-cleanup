import { useEffect, useMemo, useState } from 'react';
import { CategorySidebar } from './components/CategorySidebar';
import { CleanupGuideView } from './components/CleanupGuideView';
import { ConnectImportModal } from './components/ConnectImportModal';
import { EliminationQueueView } from './components/EliminationQueueView';
import { MediaDetailModal } from './components/MediaDetailModal';
import { MediaGrid, SortMode, ViewMode } from './components/MediaGrid';
import { StorageSummaryStrip } from './components/StorageSummaryStrip';
import { ActiveTab, TopNav } from './components/TopNav';
import { BatchConverterView } from './components/BatchConverterView';
import { SAMPLE_LIBRARY } from './data/sampleLibrary';
import {
  fetchGooglePhotosAndDriveMedia,
  googleSignIn,
  initAuth,
  logoutGoogle,
} from './services/googleAuth';
import { CleanupCategoryId, ConvertedMediaResult, MediaItem } from './types/media';
import { analyzeLibrary, estimateBatchSavings } from './utils/analyzer';
import { inspectLocalFile } from './utils/mediaProcessor';

async function imageUrlToBase64(url: string): Promise<string | undefined> {
  if (!url || url.startsWith('data:image/svg+xml')) return undefined;
  try {
    const res = await fetch(url);
    if (!res.ok) return undefined;
    const blob = await res.blob();
    if (!blob.type.startsWith('image/') || blob.type === 'image/svg+xml') return undefined;
    return await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(String(reader.result ?? ''));
      reader.onerror = () => resolve('');
      reader.readAsDataURL(blob);
    });
  } catch {
    return undefined;
  }
}

export default function App() {
  const [rawItems, setRawItems] = useState<MediaItem[]>(SAMPLE_LIBRARY);
  const [activeTab, setActiveTab] = useState<ActiveTab>('workspace');
  const [selectedCategory, setSelectedCategory] = useState<CleanupCategoryId | 'all' | 'flagged'>(
    'all'
  );
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [sortMode, setSortMode] = useState<SortMode>('largest');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [inspectorItemId, setInspectorItemId] = useState<string | null>(null);
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);

  // Google Auth & Drive scanning state
  const [isGoogleConnected, setIsGoogleConnected] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isScanningGoogle, setIsScanningGoogle] = useState(false);
  const [googleStatusMessage, setGoogleStatusMessage] = useState<string | null>(null);

  // AI Deep Scan state
  const [isAnalyzingAi, setIsAnalyzingAi] = useState(false);
  const [bannerMessage, setBannerMessage] = useState<{
    type: 'info' | 'error';
    text: string;
  } | null>(null);

  useEffect(() => {
    const unsub = initAuth(
      (user) => {
        setIsGoogleConnected(true);
        setUserEmail(user.email ?? user.displayName ?? null);
      },
      () => {
        setIsGoogleConnected(false);
        setUserEmail(null);
      }
    );
    return () => unsub();
  }, []);

  const analysis = useMemo(() => analyzeLibrary(rawItems), [rawItems]);

  const projectedConverter = useMemo(
    () =>
      estimateBatchSavings(analysis.items, {
        imageFormat: 'image/webp',
        videoFormat: 'video/webm',
        preset: 'lossless-visual',
        maxDimension: 'original',
      }),
    [analysis.items]
  );

  const visibleItems = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const filtered = analysis.items.filter((item) => {
      if (selectedCategory === 'flagged' && item.categories.length === 0) return false;
      if (
        selectedCategory !== 'all' &&
        selectedCategory !== 'flagged' &&
        !item.categories.includes(selectedCategory)
      ) {
        return false;
      }
      if (!query) return true;
      const reasonBlob = Object.values(item.reasons).join(' ').toLowerCase();
      return (
        item.name.toLowerCase().includes(query) ||
        reasonBlob.includes(query) ||
        (item.aiNotes ?? '').toLowerCase().includes(query)
      );
    });

    return [...filtered].sort((a, b) => {
      if (sortMode === 'largest') return b.sizeBytes - a.sizeBytes;
      if (sortMode === 'most-issues') return b.categories.length - a.categories.length;
      if (sortMode === 'newest') return Date.parse(b.createdAt) - Date.parse(a.createdAt);
      return Date.parse(a.createdAt) - Date.parse(b.createdAt);
    });
  }, [analysis.items, selectedCategory, searchQuery, sortMode]);

  const stagedItems = useMemo(
    () => analysis.items.filter((item) => item.stagedForRemoval),
    [analysis.items]
  );

  const selectedCategoryCounts = useMemo(() => {
    const counts: Partial<Record<CleanupCategoryId, number>> = {};
    for (const item of analysis.items) {
      if (!selectedIds.has(item.id)) continue;
      for (const catId of item.categories) {
        counts[catId] = (counts[catId] ?? 0) + 1;
      }
    }
    return counts;
  }, [analysis.items, selectedIds]);

  const [lastSelectedId, setLastSelectedId] = useState<string | null>(null);

  const inspectorItem = useMemo(
    () => analysis.items.find((item) => item.id === inspectorItemId) ?? null,
    [analysis.items, inspectorItemId]
  );

  const sourceLabel = useMemo(() => {
    const hasDrive = rawItems.some((i) => i.source === 'google-drive');
    const hasLocal = rawItems.some((i) => i.source === 'local');
    if (hasDrive && hasLocal) return 'Google Drive + Local';
    if (hasDrive) return 'Google Drive / Photos';
    if (hasLocal) return 'Local Media';
    return 'Sample Library (Demo)';
  }, [rawItems]);

  const handleToggleSelect = (
    id: string,
    shiftKey?: boolean,
    visibleOrderedIds?: string[]
  ) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (shiftKey && lastSelectedId && visibleOrderedIds?.length) {
        const startIdx = visibleOrderedIds.indexOf(lastSelectedId);
        const endIdx = visibleOrderedIds.indexOf(id);
        if (startIdx !== -1 && endIdx !== -1) {
          const [lo, hi] = startIdx < endIdx ? [startIdx, endIdx] : [endIdx, startIdx];
          for (let i = lo; i <= hi; i++) {
            next.add(visibleOrderedIds[i]);
          }
          return next;
        }
      }
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    setLastSelectedId(id);
  };

  const handleSelectAllVisible = () => {
    setSelectedIds(new Set(visibleItems.map((i) => i.id)));
  };

  const handleClearSelection = () => {
    setSelectedIds(new Set());
  };

  const handleStageSelectedForRemoval = () => {
    if (selectedIds.size === 0) return;
    const count = selectedIds.size;
    setRawItems((prev) =>
      prev.map((item) =>
        selectedIds.has(item.id) ? { ...item, stagedForRemoval: true } : item
      )
    );
    setSelectedIds(new Set());
    setBannerMessage({
      type: 'info',
      text: `Staged ${count} selected item(s) in your Removal Queue for review.`,
    });
  };

  const handleToggleStageSingle = (id: string) => {
    setRawItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, stagedForRemoval: !item.stagedForRemoval } : item
      )
    );
  };

  const handleStageCategory = (catId: CleanupCategoryId) => {
    const matchingIds = new Set(
      analysis.items.filter((i) => i.categories.includes(catId)).map((i) => i.id)
    );
    setRawItems((prev) =>
      prev.map((item) =>
        matchingIds.has(item.id) ? { ...item, stagedForRemoval: true } : item
      )
    );
  };

  const handleConfirmEliminate = (ids: string[]) => {
    const idSet = new Set(ids);
    setRawItems((prev) => prev.filter((item) => !idSet.has(item.id)));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => next.delete(id));
      return next;
    });
    setBannerMessage({
      type: 'info',
      text: `Eliminated ${ids.length} item(s) from your workspace.`,
    });
  };

  const handleItemConverted = (itemId: string, result: ConvertedMediaResult) => {
    setRawItems((prev) =>
      prev.map((item) => (item.id === itemId ? { ...item, convertedResult: result } : item))
    );
  };

  const handleUploadLocalFiles = async (fileList: FileList) => {
    const files = Array.from(fileList).filter(
      (f) =>
        f.type.startsWith('image/') ||
        f.type.startsWith('video/') ||
        /\.(jpg|jpeg|png|webp|avif|gif|heic|dng|cr2|nef|mp4|mov|webm|mkv)$/i.test(f.name)
    );
    if (files.length === 0) {
      setBannerMessage({
        type: 'error',
        text: 'No supported image or video files were found in your selection.',
      });
      return;
    }

    const inspected = await Promise.all(files.slice(0, 60).map(inspectLocalFile));
    setRawItems((prev) => {
      const withoutSampleIfFirstUpload = prev.every((i) => i.source === 'sample') ? [] : prev;
      return [...inspected, ...withoutSampleIfFirstUpload];
    });
    setBannerMessage({
      type: 'info',
      text: `Analyzed ${inspected.length} local media file(s) across all 15 cleanup categories.`,
    });
  };

  const handleGoogleSignInAndScan = async () => {
    setGoogleStatusMessage(null);
    setIsScanningGoogle(true);
    try {
      const { user, accessToken } = await googleSignIn();
      setIsGoogleConnected(true);
      setUserEmail(user.email ?? user.displayName ?? null);

      const driveItems = await fetchGooglePhotosAndDriveMedia(accessToken, (count) => {
        setGoogleStatusMessage(`Loaded ${count} media items from Google Drive & Photos...`);
      });

      if (driveItems.length === 0) {
        setGoogleStatusMessage(
          'Connected! No photos or videos were returned in your Drive/Photos scope. You can also import a Google Takeout folder below.'
        );
      } else {
        setRawItems(driveItems);
        setGoogleStatusMessage(
          `Successfully scanned ${driveItems.length} photo and video files from your Google account.`
        );
        setIsConnectModalOpen(false);
      }
    } catch (err: unknown) {
      setGoogleStatusMessage(
        err instanceof Error ? err.message : 'Unable to connect to Google Photos / Drive.'
      );
    } finally {
      setIsScanningGoogle(false);
    }
  };

  const handleGoogleSignOut = async () => {
    await logoutGoogle();
    setIsGoogleConnected(false);
    setUserEmail(null);
    setGoogleStatusMessage('Disconnected Google account.');
  };

  const handleRunAiAnalysis = async () => {
    const candidates = visibleItems.slice(0, 6);
    if (candidates.length === 0) return;

    setIsAnalyzingAi(true);
    setBannerMessage(null);

    try {
      const payload = await Promise.all(
        candidates.map(async (item) => ({
          id: item.id,
          name: item.name,
          mimeType: item.mimeType,
          sizeBytes: item.sizeBytes,
          width: item.width,
          height: item.height,
          imageBase64: item.mediaType === 'image' ? await imageUrlToBase64(item.previewUrl) : undefined,
        }))
      );

      const response = await fetch('/api/analyze-media', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: payload }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || `AI analysis failed (${response.status})`);
      }

      const results = (data.results ?? []) as Array<{
        id: string;
        suggestedCategories: CleanupCategoryId[];
        rationale: string;
        recommendedAction: string;
      }>;

      const byId = new Map(results.map((r) => [r.id, r]));
      setRawItems((prev) =>
        prev.map((item) => {
          const match = byId.get(item.id);
          if (!match) return item;
          const mergedCats = Array.from(
            new Set<CleanupCategoryId>([...item.categories, ...match.suggestedCategories])
          );
          return {
            ...item,
            categories: mergedCats,
            aiNotes: `${match.rationale} (Recommended: ${match.recommendedAction})`,
          };
        })
      );

      setBannerMessage({
        type: 'info',
        text: `AI visual scan reviewed ${results.length} item(s) and updated cleanup recommendations.`,
      });
    } catch (err: unknown) {
      setBannerMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'AI visual scan failed.',
      });
    } finally {
      setIsAnalyzingAi(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAFA] text-[#111827]">
      <TopNav
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        stagedCount={stagedItems.length}
        selectedCount={selectedIds.size}
        isGoogleConnected={isGoogleConnected}
        onOpenConnectModal={() => setIsConnectModalOpen(true)}
      />

      <main className="flex-1 max-w-[1440px] w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        <StorageSummaryStrip
          summary={analysis.summary}
          projectedConverterSavedBytes={projectedConverter.totalEstimatedSavedBytes}
          sourceLabel={sourceLabel}
        />

        {bannerMessage && (
          <div
            role={bannerMessage.type === 'error' ? 'alert' : 'status'}
            className={`rounded-xl px-4 py-3 text-sm flex items-center justify-between gap-4 border ${
              bannerMessage.type === 'error'
                ? 'bg-red-50 border-red-200 text-red-800'
                : 'bg-[#EFF6FF] border-[#BFDBFE] text-[#1E40AF]'
            }`}
          >
            <span>{bannerMessage.text}</span>
            <button
              type="button"
              onClick={() => setBannerMessage(null)}
              className="text-xs font-medium underline shrink-0 cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {activeTab === 'workspace' && (
          <div className="flex flex-col lg:flex-row gap-5 items-start">
            <CategorySidebar
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
              categoryStats={analysis.categoryStats}
              selectedCategoryCounts={selectedCategoryCounts}
              totalItems={analysis.summary.totalItems}
              flaggedItems={analysis.summary.flaggedItems}
              totalBytes={analysis.summary.totalBytes}
              reclaimableBytes={analysis.summary.reclaimableBytes}
            />

            <MediaGrid
              items={visibleItems}
              allItems={analysis.items}
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
              selectedIds={selectedIds}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              sortMode={sortMode}
              onSortChange={setSortMode}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              onToggleSelect={handleToggleSelect}
              onSelectAllVisible={handleSelectAllVisible}
              onClearSelection={handleClearSelection}
              onOpenInspector={(item) => setInspectorItemId(item.id)}
              onStageSelectedForRemoval={handleStageSelectedForRemoval}
              onSendSelectedToConverter={() => setActiveTab('converter')}
              onRunAiAnalysis={handleRunAiAnalysis}
              isAnalyzingAi={isAnalyzingAi}
            />
          </div>
        )}

        {activeTab === 'suggestions' && (
          <CleanupGuideView
            categoryStats={analysis.categoryStats}
            onInspectCategory={(catId) => {
              setSelectedCategory(catId);
              setActiveTab('workspace');
            }}
            onStageCategory={handleStageCategory}
          />
        )}

        {activeTab === 'converter' && (
          <BatchConverterView
            allItems={analysis.items}
            selectedIds={selectedIds}
            onToggleSelect={handleToggleSelect}
            onSelectPresetGroup={(ids) => setSelectedIds(new Set(ids))}
            onItemConverted={handleItemConverted}
            onUploadLocalFiles={handleUploadLocalFiles}
          />
        )}

        {activeTab === 'queue' && (
          <EliminationQueueView
            stagedItems={stagedItems}
            onUnstageItem={handleToggleStageSingle}
            onClearQueue={() =>
              setRawItems((prev) => prev.map((i) => ({ ...i, stagedForRemoval: false })))
            }
            onConfirmEliminate={handleConfirmEliminate}
          />
        )}
      </main>

      {inspectorItem && (
        <MediaDetailModal
          item={inspectorItem}
          onClose={() => setInspectorItemId(null)}
          onToggleStage={handleToggleStageSingle}
          onConverted={handleItemConverted}
        />
      )}

      <ConnectImportModal
        isOpen={isConnectModalOpen}
        onClose={() => setIsConnectModalOpen(false)}
        userEmail={userEmail}
        isGoogleConnected={isGoogleConnected}
        isScanningGoogle={isScanningGoogle}
        googleStatusMessage={googleStatusMessage}
        onGoogleSignInAndScan={handleGoogleSignInAndScan}
        onGoogleSignOut={handleGoogleSignOut}
        onUploadFiles={handleUploadLocalFiles}
        onResetSampleLibrary={() => {
          setRawItems(SAMPLE_LIBRARY);
          setSelectedIds(new Set());
          setBannerMessage({
            type: 'info',
            text: 'Restored the 23-item sample photo and video library.',
          });
        }}
      />
    </div>
  );
}
