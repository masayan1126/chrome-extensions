import React, { useState, useCallback } from 'react';
import { Sidebar, MarkdownPreview, TOC, Toolbar, ThemePanel, SearchBar, TabBar } from './components';
import { useSettings } from './hooks/useSettings';
import { useFileSystem } from './hooks/useFileSystem';
import { useSearch } from './hooks/useSearch';
import { useTabs } from './hooks/useTabs';
import type { TOCItem, Theme, FontFamily } from './types';

const App: React.FC = () => {
  const {
    settings,
    isLoading: settingsLoading,
    updateSettings,
    getCurrentTheme,
    setCurrentTheme,
    addCustomTheme,
    updateCustomTheme,
    deleteCustomTheme,
    allThemes,
  } = useSettings();

  const {
    directory,
    isLoading: fileLoading,
    canRestore,
    error,
    openDirectory,
    toggleDirectory,
    refreshDirectory,
    restoreStoredDirectory,
  } = useFileSystem();

  const {
    tabs,
    activeTabId,
    activeContent,
    activeFile,
    openTab,
    openDroppedFile,
    closeTab,
    selectTab,
    reorderTabs,
  } = useTabs();

  const [tocItems, setTocItems] = useState<TOCItem[]>([]);
  const [showTOC, setShowTOC] = useState(true);
  const [isThemePanelOpen, setIsThemePanelOpen] = useState(false);
  const [activeHeadingId, setActiveHeadingId] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const {
    isSearchOpen,
    searchQuery,
    matchCount,
    currentMatch,
    setMatchCount,
    handleSearch,
    handleNextMatch,
    handlePrevMatch,
    handleCloseSearch,
  } = useSearch();

  const currentTheme = getCurrentTheme();

  const handleTOCUpdate = useCallback((items: TOCItem[]) => {
    setTocItems(items);
    setActiveHeadingId(null); // コンテンツ変更時にリセット
  }, []);

  const handleActiveHeadingChange = useCallback((headingId: string | null) => {
    setActiveHeadingId(headingId);
  }, []);

  const handleFontSizeChange = useCallback(
    (size: number) => {
      updateSettings({ fontSize: size });
    },
    [updateSettings]
  );

  const handleFontFamilyChange = useCallback(
    (fontFamily: FontFamily) => {
      updateSettings({ fontFamily });
    },
    [updateSettings]
  );

  const handleLineHeightChange = useCallback(
    (lineHeight: number) => {
      updateSettings({ lineHeight });
    },
    [updateSettings]
  );

  const handleLetterSpacingChange = useCallback(
    (letterSpacing: number) => {
      updateSettings({ letterSpacing });
    },
    [updateSettings]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.types.includes('Files')) {
      setIsDragOver(true);
    }
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    for (const file of files) {
      if (file.name.endsWith('.md') || file.name.endsWith('.markdown')) {
        openDroppedFile(file);
      }
    }
  }, [openDroppedFile]);

  const handleSaveCustomTheme = useCallback(
    (theme: Theme) => {
      const existingTheme = settings.customThemes.find((t) => t.id === theme.id);
      if (existingTheme) {
        updateCustomTheme(theme);
      } else {
        addCustomTheme(theme);
      }
    },
    [settings.customThemes, addCustomTheme, updateCustomTheme]
  );

  if (settingsLoading) {
    return (
      <div className="h-screen bg-neutral-900 flex items-center justify-center">
        <div className="text-white">読み込み中...</div>
      </div>
    );
  }

  return (
    <div
      className="h-screen flex flex-col"
      style={{ backgroundColor: currentTheme.colors.background }}
    >
      <Toolbar
        currentTheme={currentTheme}
        fileName={activeFile?.name || null}
        fontSize={settings.fontSize}
        fontFamily={settings.fontFamily}
        lineHeight={settings.lineHeight}
        letterSpacing={settings.letterSpacing}
        markdownContent={activeContent}
        onFontSizeChange={handleFontSizeChange}
        onFontFamilyChange={handleFontFamilyChange}
        onLineHeightChange={handleLineHeightChange}
        onLetterSpacingChange={handleLetterSpacingChange}
        onOpenThemePanel={() => setIsThemePanelOpen(true)}
        showTOC={showTOC}
        onToggleTOC={() => setShowTOC(!showTOC)}
      />

      <div className="flex-1 flex overflow-hidden">
        <Sidebar
          directory={directory}
          selectedFile={activeFile}
          onSelectFile={openTab}
          onToggleDirectory={toggleDirectory}
          onOpenDirectory={openDirectory}
          onRefresh={refreshDirectory}
          isLoading={fileLoading}
          canRestore={canRestore}
          onRestore={restoreStoredDirectory}
        />

        <div
          className="flex-1 flex flex-col overflow-hidden relative"
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
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
          <TabBar
            tabs={tabs}
            activeTabId={activeTabId}
            onSelectTab={selectTab}
            onCloseTab={closeTab}
            onReorderTabs={reorderTabs}
          />

          <div className="flex-1 flex overflow-hidden relative">
            <SearchBar
              isOpen={isSearchOpen}
              onClose={handleCloseSearch}
              onSearch={handleSearch}
              matchCount={matchCount}
              currentMatch={currentMatch}
              onNextMatch={handleNextMatch}
              onPrevMatch={handlePrevMatch}
            />

            {error ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-red-400 text-center">
                  <svg
                    className="w-12 h-12 mx-auto mb-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                  <p>{error}</p>
                </div>
              </div>
            ) : (
              <MarkdownPreview
                content={activeContent}
                theme={currentTheme}
                fontSize={settings.fontSize}
                lineHeight={settings.lineHeight}
                letterSpacing={settings.letterSpacing}
                contentWidth={settings.contentWidth}
                fontFamily={settings.fontFamily}
                onTOCUpdate={handleTOCUpdate}
                onActiveHeadingChange={handleActiveHeadingChange}
                searchQuery={searchQuery}
                currentMatch={currentMatch}
                onMatchCountChange={setMatchCount}
              />
            )}

            {showTOC && tocItems.length > 0 && (
              <TOC
                items={tocItems}
                isVisible={showTOC}
                onToggle={() => setShowTOC(!showTOC)}
                activeHeadingId={activeHeadingId}
              />
            )}
          </div>
        </div>
      </div>

      <ThemePanel
        currentTheme={currentTheme}
        allThemes={allThemes}
        onSelectTheme={setCurrentTheme}
        onSaveCustomTheme={handleSaveCustomTheme}
        onDeleteCustomTheme={deleteCustomTheme}
        isOpen={isThemePanelOpen}
        onClose={() => setIsThemePanelOpen(false)}
      />
    </div>
  );
};

export default App;
