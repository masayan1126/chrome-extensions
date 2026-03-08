import React, { useState, useRef, useEffect } from 'react';
import type { Theme, FontFamily } from '../types';
import { fontOptions } from '../utils/fonts';
import { parseMarkdown } from '../utils/markdown';

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
}

export const Toolbar: React.FC<ToolbarProps> = ({
  currentTheme,
  fileName,
  fontSize,
  fontFamily,
  lineHeight,
  letterSpacing,
  markdownContent,
  onFontSizeChange,
  onFontFamilyChange,
  onLineHeightChange,
  onLetterSpacingChange,
  onOpenThemePanel,
  showTOC,
  onToggleTOC,
}) => {
  const [showFontDropdown, setShowFontDropdown] = useState(false);
  const [showTextSettingsDropdown, setShowTextSettingsDropdown] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [htmlCopySuccess, setHtmlCopySuccess] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const textSettingsRef = useRef<HTMLDivElement>(null);

  const handleCopyMarkdown = async () => {
    if (!markdownContent) return;
    try {
      await navigator.clipboard.writeText(markdownContent);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy markdown:', err);
    }
  };

  const handleCopyHtml = async () => {
    if (!markdownContent) return;
    try {
      const { html } = parseMarkdown(markdownContent);
      const blob = new Blob([html], { type: 'text/html' });
      const item = new ClipboardItem({ 'text/html': blob, 'text/plain': new Blob([html], { type: 'text/plain' }) });
      await navigator.clipboard.write([item]);
      setHtmlCopySuccess(true);
      setTimeout(() => setHtmlCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy HTML:', err);
    }
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowFontDropdown(false);
      }
      if (textSettingsRef.current && !textSettingsRef.current.contains(e.target as Node)) {
        setShowTextSettingsDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentFont = fontOptions.find((f) => f.id === fontFamily) || fontOptions[0];

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
            <span className="text-sm truncate max-w-xs">{fileName}</span>
          </div>
        )}

        {/* マークダウンコピーボタン */}
        {markdownContent && (
          <button
            onClick={handleCopyMarkdown}
            className={`flex items-center gap-1.5 px-2 py-1 rounded text-sm transition-colors ${
              copySuccess
                ? 'bg-green-600 text-white'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-700'
            }`}
            title="マークダウンをコピー"
          >
            {copySuccess ? (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>コピー完了</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                </svg>
                <span>MDコピー</span>
              </>
            )}
          </button>
        )}

        {/* HTMLコピーボタン */}
        {markdownContent && (
          <button
            onClick={handleCopyHtml}
            className={`flex items-center gap-1.5 px-2 py-1 rounded text-sm transition-colors ${
              htmlCopySuccess
                ? 'bg-green-600 text-white'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-700'
            }`}
            title="HTMLとしてコピー"
          >
            {htmlCopySuccess ? (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>コピー完了</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
                <span>HTMLコピー</span>
              </>
            )}
          </button>
        )}
      </div>

      <div className="flex items-center gap-3">
        {/* フォントファミリー */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setShowFontDropdown(!showFontDropdown)}
            className="flex items-center gap-2 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 rounded transition-colors"
            title="フォント選択"
          >
            <svg className="w-4 h-4 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            <span className="text-sm text-neutral-300 max-w-24 truncate">{currentFont.name}</span>
            <svg className="w-4 h-4 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {showFontDropdown && (
            <div className="absolute right-0 top-full mt-1 w-56 bg-neutral-800 border border-neutral-700 rounded-lg shadow-xl z-50">
              <div className="p-1">
                {fontOptions.map((font) => (
                  <button
                    key={font.id}
                    onClick={() => {
                      onFontFamilyChange(font.id);
                      setShowFontDropdown(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${
                      fontFamily === font.id
                        ? 'bg-neutral-600 text-white'
                        : 'text-neutral-300 hover:bg-neutral-700'
                    }`}
                  >
                    {font.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* フォントサイズ */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onFontSizeChange(Math.max(12, fontSize - 2))}
            className="p-1 text-neutral-400 hover:text-white transition-colors"
            title="文字を小さく"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
            </svg>
          </button>
          <span className="text-sm text-neutral-400 w-8 text-center">{fontSize}</span>
          <button
            onClick={() => onFontSizeChange(Math.min(32, fontSize + 2))}
            className="p-1 text-neutral-400 hover:text-white transition-colors"
            title="文字を大きく"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>

        {/* 行間・文字間隔設定 */}
        <div className="relative" ref={textSettingsRef}>
          <button
            onClick={() => setShowTextSettingsDropdown(!showTextSettingsDropdown)}
            className="flex items-center gap-2 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 rounded transition-colors"
            title="行間・文字間隔"
          >
            <svg className="w-4 h-4 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
            <span className="text-sm text-neutral-300">間隔</span>
            <svg className="w-4 h-4 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {showTextSettingsDropdown && (
            <div className="absolute right-0 top-full mt-1 w-64 bg-neutral-800 border border-neutral-700 rounded-lg shadow-xl z-50 p-4">
              <div className="space-y-4">
                {/* 行間 */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-sm text-neutral-300">行間</label>
                    <span className="text-sm text-neutral-400">{lineHeight.toFixed(1)}</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="3"
                    step="0.1"
                    value={lineHeight}
                    onChange={(e) => onLineHeightChange(parseFloat(e.target.value))}
                    className="w-full h-2 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-neutral-400"
                  />
                  <div className="flex justify-between text-xs text-neutral-500 mt-1">
                    <span>狭い</span>
                    <span>広い</span>
                  </div>
                </div>

                {/* 文字間隔 */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-sm text-neutral-300">文字間隔</label>
                    <span className="text-sm text-neutral-400">{letterSpacing.toFixed(2)}em</span>
                  </div>
                  <input
                    type="range"
                    min="-0.05"
                    max="0.2"
                    step="0.01"
                    value={letterSpacing}
                    onChange={(e) => onLetterSpacingChange(parseFloat(e.target.value))}
                    className="w-full h-2 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-neutral-400"
                  />
                  <div className="flex justify-between text-xs text-neutral-500 mt-1">
                    <span>詰める</span>
                    <span>広げる</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 目次トグル */}
        <button
          onClick={onToggleTOC}
          className={`p-2 rounded transition-colors ${
            showTOC ? 'bg-neutral-600 text-white' : 'text-neutral-400 hover:text-white'
          }`}
          title={showTOC ? '目次を隠す' : '目次を表示'}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 10h16M4 14h16M4 18h16"
            />
          </svg>
        </button>

        {/* テーマボタン */}
        <button
          onClick={onOpenThemePanel}
          className="flex items-center gap-2 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 rounded transition-colors"
          title="テーマ設定"
        >
          <div
            className="w-5 h-5 rounded border border-neutral-500"
            style={{ backgroundColor: currentTheme.colors.background }}
          >
            <div
              className="w-full h-full flex items-center justify-center text-[10px] font-bold"
              style={{ color: currentTheme.colors.h1 }}
            >
              A
            </div>
          </div>
          <span className="text-sm text-neutral-300">{currentTheme.name}</span>
          <svg className="w-4 h-4 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>
    </div>
  );
};
