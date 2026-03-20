import React, { useState, useCallback } from 'react';
import { Sidebar, useFileSystem } from './features/sidebar';
import { useTabs } from './features/tabs';
import { useSearch } from './features/search';
import { ThemePanel, useSettings } from './features/theme';
import { Toolbar } from './features/toolbar';
import { useReviewComments } from './features/review';
import { ExportPanel } from './features/export';
import { useDragDrop } from './shared/hooks/useDragDrop';
import { useAppHandlers } from './useAppHandlers';
import { MainContent } from './MainContent';
import type { TOCItem, ReviewComment } from './shared/types';

const App: React.FC = () => {
  const {
    settings, isLoading: settingsLoading, updateSettings, currentTheme, setCurrentTheme,
    addCustomTheme, updateCustomTheme, deleteCustomTheme, allThemes,
  } = useSettings();

  const {
    directory, isLoading: fileLoading, canRestore, error,
    openDirectory, toggleDirectory, refreshDirectory, restoreStoredDirectory,
  } = useFileSystem(settings.showHiddenFiles);

  const { tabs, activeTabId, activeContent, activeFile, openTab, openDroppedFile, closeTab, selectTab, reorderTabs } = useTabs();
  const { isDragOver, handleDragOver, handleDragLeave, handleDrop } = useDragDrop(openTab, openDroppedFile);

  const [tocItems, setTocItems] = useState<TOCItem[]>([]);
  const [showTOC, setShowTOC] = useState(true);
  const [isThemePanelOpen, setIsThemePanelOpen] = useState(false);
  const [activeHeadingId, setActiveHeadingId] = useState<string | null>(null);
  const [showReviewPanel, setShowReviewPanel] = useState(false);
  const [isExportPanelOpen, setIsExportPanelOpen] = useState(false);
  const activeFilePath = activeFile?.path || null;
  const {
    comments, unresolvedComments, addComment, updateComment,
    removeComment, resolveComment, unresolveComment,
  } = useReviewComments(activeFilePath, activeContent);

  const {
    isSearchOpen, searchQuery, matchCount, currentMatch,
    setMatchCount, handleSearch, handleNextMatch, handlePrevMatch, handleCloseSearch,
  } = useSearch();

  const handleTOCUpdate = useCallback((items: TOCItem[]) => { setTocItems(items); setActiveHeadingId(null); }, []);
  const handleActiveHeadingChange = useCallback((headingId: string | null) => { setActiveHeadingId(headingId); }, []);

  const {
    handleFontSizeChange, handleFontFamilyChange, handleLineHeightChange,
    handleLetterSpacingChange, handleSaveCustomTheme,
  } = useAppHandlers({
    updateSettings, customThemes: settings.customThemes, addCustomTheme, updateCustomTheme,
  });

  const handleAddComment = useCallback(async (comment: ReviewComment) => {
    await addComment(comment);
  }, [addComment]);

  const handleUpdateComment = useCallback(async (comment: ReviewComment) => {
    await updateComment(comment.id, {
      comment: comment.comment,
      type: comment.type,
      anchor: comment.anchor,
    });
  }, [updateComment]);

  const handleEditComment = useCallback(async (comment: ReviewComment) => {
    await updateComment(comment.id, {
      comment: comment.comment,
      type: comment.type,
    });
  }, [updateComment]);

  if (settingsLoading) {
    return (
      <div className="h-screen bg-neutral-900 flex items-center justify-center">
        <div className="text-white">読み込み中...</div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col" style={{ backgroundColor: currentTheme.colors.background }}>
      <Toolbar
        currentTheme={currentTheme} fileName={activeFile?.name || null}
        fontSize={settings.fontSize} fontFamily={settings.fontFamily}
        lineHeight={settings.lineHeight} letterSpacing={settings.letterSpacing}
        markdownContent={activeContent} onFontSizeChange={handleFontSizeChange}
        onFontFamilyChange={handleFontFamilyChange} onLineHeightChange={handleLineHeightChange}
        onLetterSpacingChange={handleLetterSpacingChange} onOpenThemePanel={() => setIsThemePanelOpen(true)}
        showTOC={showTOC} onToggleTOC={() => setShowTOC(!showTOC)}
        showReviewPanel={showReviewPanel}
        onToggleReviewPanel={() => setShowReviewPanel(!showReviewPanel)}
        reviewCount={unresolvedComments.length}
        onOpenExport={() => setIsExportPanelOpen(true)}
      />
      <div className="flex-1 flex overflow-hidden">
        <Sidebar
          directory={directory} selectedFile={activeFile} onSelectFile={openTab}
          onToggleDirectory={toggleDirectory} onOpenDirectory={openDirectory}
          onRefresh={refreshDirectory} isLoading={fileLoading} canRestore={canRestore}
          onRestore={restoreStoredDirectory} showHiddenFiles={settings.showHiddenFiles}
          onToggleHiddenFiles={() => updateSettings({ showHiddenFiles: !settings.showHiddenFiles })}
        />
        <MainContent
          tabs={tabs} activeTabId={activeTabId} activeContent={activeContent} error={error}
          showTOC={showTOC} tocItems={tocItems} activeHeadingId={activeHeadingId}
          currentTheme={currentTheme} settings={settings} isDragOver={isDragOver}
          isSearchOpen={isSearchOpen} searchQuery={searchQuery} matchCount={matchCount}
          currentMatch={currentMatch} onSelectTab={selectTab} onCloseTab={closeTab}
          onReorderTabs={reorderTabs} onDragOver={handleDragOver} onDragLeave={handleDragLeave}
          onDrop={handleDrop} onCloseSearch={handleCloseSearch} onSearch={handleSearch}
          onNextMatch={handleNextMatch} onPrevMatch={handlePrevMatch} onMatchCountChange={setMatchCount}
          onTOCUpdate={handleTOCUpdate} onActiveHeadingChange={handleActiveHeadingChange}
          onToggleTOC={() => setShowTOC(!showTOC)}
          filePath={activeFilePath}
          comments={comments}
          showReviewPanel={showReviewPanel}
          onToggleReviewPanel={() => setShowReviewPanel(!showReviewPanel)}
          onAddComment={handleAddComment}
          onUpdateComment={handleUpdateComment}
          onEditComment={handleEditComment}
          onDeleteComment={removeComment}
          onResolveComment={resolveComment}
          onUnresolveComment={unresolveComment}
          onOpenExport={() => setIsExportPanelOpen(true)}
        />
      </div>
      <ThemePanel
        currentTheme={currentTheme} allThemes={allThemes} onSelectTheme={setCurrentTheme}
        onSaveCustomTheme={handleSaveCustomTheme} onDeleteCustomTheme={deleteCustomTheme}
        isOpen={isThemePanelOpen} onClose={() => setIsThemePanelOpen(false)}
      />
      <ExportPanel
        comments={comments}
        filePath={activeFilePath}
        isOpen={isExportPanelOpen}
        onClose={() => setIsExportPanelOpen(false)}
      />
    </div>
  );
};

export default App;
