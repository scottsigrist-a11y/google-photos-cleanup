import React from 'react';

export type ActiveTab = 'workspace' | 'suggestions' | 'converter' | 'queue';

interface TopNavProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  stagedCount: number;
  selectedCount: number;
  isGoogleConnected: boolean;
  onOpenConnectModal: () => void;
}

export const TopNav: React.FC<TopNavProps> = ({
  activeTab,
  onSelectTab,
  stagedCount,
  selectedCount,
  isGoogleConnected,
  onOpenConnectModal,
}) => {
  const navItems: Array<{ id: ActiveTab; label: string }> = [
    { id: 'workspace', label: 'Workspace' },
    { id: 'suggestions', label: '15 Suggestions' },
    {
      id: 'converter',
      label: selectedCount > 0 ? `Converter (${selectedCount})` : 'Converter',
    },
    {
      id: 'queue',
      label: stagedCount > 0 ? `Removal Queue (${stagedCount})` : 'Removal Queue',
    },
  ];

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-neutral-200">
      <div className="max-w-[1440px] mx-auto px-6 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Single-element wordmark */}
        <button
          type="button"
          onClick={() => onSelectTab('workspace')}
          className="font-display text-lg font-bold tracking-tight text-neutral-900 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563EB]"
        >
          FrameTrim
        </button>

        {/* Zone 2: 4 single-line text navigation links */}
        <nav aria-label="Primary navigation" className="hidden md:flex items-center gap-7">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectTab(item.id)}
                className={`relative py-5 text-sm font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563EB] ${
                  isActive
                    ? 'text-neutral-900'
                    : 'text-neutral-500 hover:text-neutral-900'
                }`}
              >
                {item.label}
                {isActive && (
                  <span
                    aria-hidden="true"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#2563EB]"
                  />
                )}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={onOpenConnectModal}
            className="px-4 py-2 text-sm font-medium text-white bg-[#2563EB] hover:bg-[#1D4ED8] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563EB]"
          >
            {isGoogleConnected ? 'Library Sources' : 'Connect & Import'}
          </button>
        </div>
      </div>

      {/* Compact mobile nav row */}
      <nav
        aria-label="Mobile navigation"
        className="flex md:hidden items-center gap-4 px-4 py-2 border-t border-neutral-100 overflow-x-auto"
      >
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectTab(item.id)}
              className={`text-xs font-medium py-1.5 whitespace-nowrap shrink-0 border-b-2 transition-colors cursor-pointer ${
                isActive
                  ? 'border-[#2563EB] text-neutral-900'
                  : 'border-transparent text-neutral-500'
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </nav>
    </header>
  );
};
