import React from 'react';
import type { Theme } from '../../shared/types';

interface ThemeButtonProps {
  currentTheme: Theme;
  showTOC: boolean;
  onToggleTOC: () => void;
  onOpenThemePanel: () => void;
}

export const ThemeButton: React.FC<ThemeButtonProps> = ({
  currentTheme,
  showTOC,
  onToggleTOC,
  onOpenThemePanel,
}) => {
  return (
    <>
      <button
        onClick={onToggleTOC}
        className={`p-2 rounded transition-colors ${
          showTOC ? 'bg-neutral-600 text-white' : 'text-neutral-400 hover:text-white'
        }`}
        title={showTOC ? '目次を隠す' : '目次を表示'}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
        </svg>
      </button>

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
    </>
  );
};
