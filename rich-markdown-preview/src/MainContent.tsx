import React from 'react';
import type { OpenTab, TOCItem, Theme, AppSettings } from './shared/types';
import { MarkdownPreview } from './features/preview';
import { TabBar } from './features/tabs';
import { SearchBar } from './features/search';
import { TOC } from './features/toc';

interface MainContentProps {
  tabs: OpenTab[];
  activeTabId: string | null;
  activeContent: string;
  error: string | null;
  showTOC: boolean;
  tocItems: TOCItem[];
  activeHeadingId: string | null;
  currentTheme: Theme;
  settings: AppSettings;
  isDragOver: boolean;
  isSearchOpen: boolean;
  searchQuery: string;
  matchCount: number;
  currentMatch: number;
  onSelectTab: (tabId: string) => void;
  onCloseTab: (tabId: string) => void;
  onReorderTabs: (tabs: OpenTab[]) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  onCloseSearch: () => void;
  onSearch: (query: string) => void;
  onNextMatch: () => void;
  onPrevMatch: () => void;
  onMatchCountChange: (count: number) => void;
  onTOCUpdate: (toc: TOCItem[]) => void;
  onActiveHeadingChange: (headingId: string | null) => void;
  onToggleTOC: () => void;
}

export const MainContent: React.FC<MainContentProps> = ({
  tabs, activeTabId, activeContent, error, showTOC, tocItems, activeHeadingId,
  currentTheme, settings, isDragOver, isSearchOpen, searchQuery, matchCount, currentMatch,
  onSelectTab, onCloseTab, onReorderTabs, onDragOver, onDragLeave, onDrop,
  onCloseSearch, onSearch, onNextMatch, onPrevMatch, onMatchCountChange,
  onTOCUpdate, onActiveHeadingChange, onToggleTOC,
}) => {
  return (
    <div className="flex-1 flex flex-col overflow-hidden relative" onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop}>
      {isDragOver && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 border-2 border-dashed border-blue-400 rounded-lg pointer-events-none">
          <div className="text-center">
            <svg className="w-16 h-16 mx-auto mb-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <p className="text-blue-400 text-lg font-medium">Markdownファイルをドロップ</p>
            <p className="text-neutral-400 text-sm mt-1">.md / .markdown</p>
          </div>
        </div>
      )}
      <TabBar tabs={tabs} activeTabId={activeTabId} onSelectTab={onSelectTab} onCloseTab={onCloseTab} onReorderTabs={onReorderTabs} />
      <div className="flex-1 flex overflow-hidden relative">
        <SearchBar isOpen={isSearchOpen} onClose={onCloseSearch} onSearch={onSearch} matchCount={matchCount} currentMatch={currentMatch} onNextMatch={onNextMatch} onPrevMatch={onPrevMatch} />
        {error ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-red-400 text-center">
              <svg className="w-12 h-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <p>{error}</p>
            </div>
          </div>
        ) : (
          <MarkdownPreview
            content={activeContent} theme={currentTheme} fontSize={settings.fontSize}
            lineHeight={settings.lineHeight} letterSpacing={settings.letterSpacing}
            contentWidth={settings.contentWidth} fontFamily={settings.fontFamily}
            onTOCUpdate={onTOCUpdate} onActiveHeadingChange={onActiveHeadingChange}
            searchQuery={searchQuery} currentMatch={currentMatch} onMatchCountChange={onMatchCountChange}
          />
        )}
        {showTOC && tocItems.length > 0 && (
          <TOC items={tocItems} isVisible={showTOC} onToggle={onToggleTOC} activeHeadingId={activeHeadingId} />
        )}
      </div>
    </div>
  );
};
