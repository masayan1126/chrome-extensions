import React from 'react';
import type { Theme } from '../../shared/types';
import { ColorPicker } from './ColorPicker';
import { colorLabels, colorGroups, accentColorKeys, textColorKeys, backgroundColorKeys, type ColorKey } from './themeConstants';

interface ThemeEditorProps {
  editingTheme: Theme;
  themeName: string;
  activeGroup: number;
  onThemeNameChange: (name: string) => void;
  onColorChange: (key: ColorKey, value: string) => void;
  onBulkColorChange: (keys: ColorKey[], value: string) => void;
  onToggleDark: () => void;
  onActiveGroupChange: (group: number) => void;
}

export const ThemeEditor: React.FC<ThemeEditorProps> = ({
  editingTheme, themeName, activeGroup, onThemeNameChange, onColorChange, onBulkColorChange, onToggleDark, onActiveGroupChange,
}) => {
  const { colors, isDark } = editingTheme;
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm text-neutral-300 mb-1">テーマ名</label>
        <input type="text" value={themeName} onChange={(e) => onThemeNameChange(e.target.value)} className="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded text-white" placeholder="テーマ名を入力" />
      </div>
      <div className="flex items-center gap-2">
        <label className="text-sm text-neutral-300">ベース:</label>
        <button onClick={onToggleDark} className={`px-3 py-1 rounded text-sm ${isDark ? 'bg-neutral-700 text-white' : 'bg-neutral-200 text-neutral-800'}`}>
          {isDark ? 'ダーク' : 'ライト'}
        </button>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-2">
        {colorGroups.map((group, i) => (
          <button key={group.title} onClick={() => onActiveGroupChange(i)} className={`px-3 py-1 rounded text-sm whitespace-nowrap ${activeGroup === i ? 'bg-neutral-600 text-white' : 'bg-neutral-700 text-neutral-300 hover:bg-neutral-600'}`}>
            {group.title}
          </button>
        ))}
      </div>
      <div className="space-y-3">
        {activeGroup === 0 ? (
          <div className="space-y-4">
            <p className="text-sm text-neutral-400">一括で複数の要素に同じ色を適用できます。個別設定は各タブで行えます。</p>
            <ColorPicker label="アクセントカラー（見出し・リンク・リストマーカー等）" color={colors.h1} onChange={(v) => onBulkColorChange(accentColorKeys, v)} />
            <ColorPicker label="テキストカラー（本文・引用・コード文字）" color={colors.text} onChange={(v) => onBulkColorChange(textColorKeys, v)} />
            <ColorPicker label="サブ背景色（コード・引用・テーブル背景）" color={colors.codeBackground} onChange={(v) => onBulkColorChange(backgroundColorKeys, v)} />
            <ColorPicker label="ボーダー・線（テーブル・水平線）" color={colors.tableBorder} onChange={(v) => onBulkColorChange(['tableBorder', 'horizontalRule'], v)} />
          </div>
        ) : (
          colorGroups[activeGroup].keys.map((key) => (
            <ColorPicker key={key} label={colorLabels[key]} color={colors[key]} onChange={(v) => onColorChange(key, v)} />
          ))
        )}
      </div>
    </div>
  );
};
