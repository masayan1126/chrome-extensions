import React, { useState } from 'react';
import type { Theme, FontFamily } from '../../shared/types';
import { sanitizeFileName } from '../../shared/utils/fileSystem';
import { CopyButtons } from './CopyButtons';
import { FontDropdown } from './FontDropdown';
import { FontSizeControls } from './FontSizeControls';
import { TextSettingsDropdown } from './TextSettingsDropdown';
import { ThemeButton } from './ThemeButton';

interface ToolbarProps {
  currentTheme: Theme;
  fileName: string | null;
  fontSize: number;
  fontFamily: FontFamily;
  lineHeight: number;
  letterSpacing: number;
  markdownContent: string;
  onFontSizeChange: (size: number) => void;
  onFontFamilyChange: (fontFamily: FontFamily) => void;
  onLineHeightChange: (lineHeight: number) => void;
  onLetterSpacingChange: (letterSpacing: number) => void;
  onOpenThemePanel: () => void;
  showTOC: boolean;
  onToggleTOC: () => void;
  // レビュー関連
  showReviewPanel: boolean;
  onToggleReviewPanel: () => void;
  reviewCount: number;
  onOpenExport: () => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  currentTheme, fileName, fontSize, fontFamily, lineHeight, letterSpacing,
  markdownContent, onFontSizeChange, onFontFamilyChange, onLineHeightChange,
  onLetterSpacingChange, onOpenThemePanel, showTOC, onToggleTOC,
  showReviewPanel, onToggleReviewPanel, reviewCount, onOpenExport,
}) => {
  const [showFontDropdown, setShowFontDropdown] = useState(false);
  const [showTextSettingsDropdown, setShowTextSettingsDropdown] = useState(false);

  return (
    <div className="h-12 bg-neutral-900 border-b border-neutral-700 flex items-center justify-between px-4">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <svg className="w-6 h-6 text-neutral-300" viewBox="0 0 24 24" fill="currentColor">
            <path d="M3 3h18v18H3V3zm16 16V5H5v14h14zM7 7h4v2H7V7zm0 4h10v2H7v-2zm0 4h10v2H7v-2z" />
          </svg>
          <span className="font-semibold text-white">Rich Markdown Preview</span>
        </div>
        {fileName && (
          <div className="flex items-center gap-2 text-neutral-400">
            <span className="text-neutral-600">|</span>
            <span className="text-sm truncate max-w-xs">{sanitizeFileName(fileName)}</span>
          </div>
        )}
        <CopyButtons markdownContent={markdownContent} />
      </div>

      <div className="flex items-center gap-3">
        <FontDropdown
          fontFamily={fontFamily}
          isOpen={showFontDropdown}
          onToggle={() => setShowFontDropdown(!showFontDropdown)}
          onClose={() => setShowFontDropdown(false)}
          onFontFamilyChange={onFontFamilyChange}
        />
        <FontSizeControls fontSize={fontSize} onFontSizeChange={onFontSizeChange} />
        <TextSettingsDropdown
          lineHeight={lineHeight}
          letterSpacing={letterSpacing}
          isOpen={showTextSettingsDropdown}
          onToggle={() => setShowTextSettingsDropdown(!showTextSettingsDropdown)}
          onClose={() => setShowTextSettingsDropdown(false)}
          onLineHeightChange={onLineHeightChange}
          onLetterSpacingChange={onLetterSpacingChange}
        />

        {/* レビューボタン */}
        <button
          onClick={onToggleReviewPanel}
          className={`relative p-2 rounded transition-colors ${
            showReviewPanel ? 'bg-neutral-600 text-white' : 'text-neutral-400 hover:text-white'
          }`}
          title={showReviewPanel ? 'レビューパネルを隠す' : 'レビューパネルを表示'}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
          </svg>
          {reviewCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-[9px] min-w-[16px] h-4 flex items-center justify-center rounded-full px-1">
              {reviewCount}
            </span>
          )}
        </button>

        {/* エクスポートボタン */}
        <button
          onClick={onOpenExport}
          className="p-2 text-neutral-400 hover:text-white rounded transition-colors"
          title="AIエクスポート"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </button>

        <ThemeButton
          currentTheme={currentTheme}
          showTOC={showTOC}
          onToggleTOC={onToggleTOC}
          onOpenThemePanel={onOpenThemePanel}
        />
      </div>
    </div>
  );
};
