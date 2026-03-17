import React from 'react';
import type { Theme } from '../../shared/types';
import { presetThemes } from './presets';

interface ThemeListProps {
  currentTheme: Theme;
  allThemes: Theme[];
  onSelectTheme: (themeId: string) => void;
  onEditTheme: (theme: Theme) => void;
  onDeleteCustomTheme: (themeId: string) => void;
  onStartCustomize: () => void;
}

const isCustomTheme = (themeId: string) => !presetThemes.some((t) => t.id === themeId);

export const ThemeList: React.FC<ThemeListProps> = ({
  currentTheme, allThemes, onSelectTheme, onEditTheme, onDeleteCustomTheme, onStartCustomize,
}) => {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-medium text-neutral-400 mb-2">プリセットテーマ</h3>
        <div className="grid grid-cols-2 gap-2">
          {presetThemes.map((theme) => (
            <button
              key={theme.id}
              onClick={() => onSelectTheme(theme.id)}
              className={`flex items-center gap-3 p-3 rounded border transition-colors ${
                currentTheme.id === theme.id
                  ? 'border-neutral-400 bg-neutral-700/50'
                  : 'border-neutral-600 hover:border-neutral-500'
              }`}
            >
              <div className="w-8 h-8 rounded border border-neutral-500" style={{ backgroundColor: theme.colors.background }}>
                <div className="w-full h-full flex items-center justify-center text-xs font-bold" style={{ color: theme.colors.h1 }}>A</div>
              </div>
              <div className="text-left">
                <div className="text-sm text-white">{theme.name}</div>
                <div className="text-xs text-neutral-500">{theme.isDark ? 'ダーク' : 'ライト'}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {allThemes.filter((t) => isCustomTheme(t.id)).length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-neutral-400 mb-2">カスタムテーマ</h3>
          <div className="grid grid-cols-2 gap-2">
            {allThemes.filter((t) => isCustomTheme(t.id)).map((theme) => (
              <div
                key={theme.id}
                className={`flex items-center gap-3 p-3 rounded border transition-colors ${
                  currentTheme.id === theme.id ? 'border-neutral-400 bg-neutral-700/50' : 'border-neutral-600 hover:border-neutral-500'
                }`}
              >
                <button onClick={() => onSelectTheme(theme.id)} className="flex items-center gap-3 flex-1">
                  <div className="w-8 h-8 rounded border border-neutral-500" style={{ backgroundColor: theme.colors.background }}>
                    <div className="w-full h-full flex items-center justify-center text-xs font-bold" style={{ color: theme.colors.h1 }}>A</div>
                  </div>
                  <div className="text-left">
                    <div className="text-sm text-white">{theme.name}</div>
                    <div className="text-xs text-neutral-500">カスタム</div>
                  </div>
                </button>
                <div className="flex gap-1">
                  <button onClick={() => onEditTheme(theme)} className="p-1 text-neutral-400 hover:text-white" title="編集">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button onClick={() => onDeleteCustomTheme(theme.id)} className="p-1 text-neutral-400 hover:text-red-400" title="削除">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <button
        onClick={onStartCustomize}
        className="w-full py-3 border-2 border-dashed border-neutral-600 rounded text-neutral-400 hover:border-neutral-500 hover:text-neutral-300 transition-colors"
      >
        + 新しいカスタムテーマを作成
      </button>
    </div>
  );
};
