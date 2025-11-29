import React, { useState } from 'react';
import type { Theme, ThemeColors } from '../types';
import { ColorPicker } from './ColorPicker';
import { createDefaultThemeColors } from '../utils/themeStyles';
import { presetThemes } from '../themes/presets';

interface ThemePanelProps {
  currentTheme: Theme;
  allThemes: Theme[];
  onSelectTheme: (themeId: string) => void;
  onSaveCustomTheme: (theme: Theme) => void;
  onDeleteCustomTheme: (themeId: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

type ColorKey = keyof ThemeColors;

const colorLabels: Record<ColorKey, string> = {
  background: '背景色',
  text: 'テキスト',
  h1: '見出し1 (H1)',
  h2: '見出し2 (H2)',
  h3: '見出し3 (H3)',
  h4: '見出し4 (H4)',
  h5: '見出し5 (H5)',
  h6: '見出し6 (H6)',
  link: 'リンク',
  linkHover: 'リンク(ホバー)',
  codeBackground: 'コードブロック背景',
  codeText: 'コードブロック文字',
  inlineCodeBackground: 'インラインコード背景',
  inlineCodeText: 'インラインコード文字',
  blockquoteBorder: '引用ボーダー',
  blockquoteText: '引用テキスト',
  blockquoteBackground: '引用背景',
  listMarker: 'リストマーカー',
  tableBorder: 'テーブルボーダー',
  tableHeaderBackground: 'テーブルヘッダー背景',
  tableRowEvenBackground: 'テーブル偶数行背景',
  horizontalRule: '水平線',
  bold: '太字',
  italic: '斜体',
};

const colorGroups: { title: string; keys: ColorKey[] }[] = [
  { title: '一括設定', keys: [] },
  { title: '基本', keys: ['background', 'text'] },
  { title: '見出し', keys: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'] },
  { title: 'リンク', keys: ['link', 'linkHover'] },
  { title: 'コード', keys: ['codeBackground', 'codeText', 'inlineCodeBackground', 'inlineCodeText'] },
  { title: '引用', keys: ['blockquoteBorder', 'blockquoteText', 'blockquoteBackground'] },
  { title: 'リスト・テーブル', keys: ['listMarker', 'tableBorder', 'tableHeaderBackground', 'tableRowEvenBackground'] },
  { title: 'その他', keys: ['horizontalRule', 'bold', 'italic'] },
];

// 一括設定で変更する対象のキー
const accentColorKeys: ColorKey[] = [
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'link', 'linkHover',
  'blockquoteBorder',
  'listMarker',
  'bold', 'italic',
];

const textColorKeys: ColorKey[] = [
  'text', 'blockquoteText', 'codeText', 'inlineCodeText',
];

const backgroundColorKeys: ColorKey[] = [
  'codeBackground', 'inlineCodeBackground', 'blockquoteBackground',
  'tableHeaderBackground', 'tableRowEvenBackground',
];

export const ThemePanel: React.FC<ThemePanelProps> = ({
  currentTheme,
  allThemes,
  onSelectTheme,
  onSaveCustomTheme,
  onDeleteCustomTheme,
  isOpen,
  onClose,
}) => {
  const [editingTheme, setEditingTheme] = useState<Theme | null>(null);
  const [themeName, setThemeName] = useState('');
  const [activeGroup, setActiveGroup] = useState(0);

  const isCustomTheme = (themeId: string) => !presetThemes.some((t) => t.id === themeId);

  const handleStartCustomize = () => {
    const newTheme: Theme = {
      id: `custom-${Date.now()}`,
      name: 'カスタムテーマ',
      isDark: currentTheme.isDark,
      colors: { ...currentTheme.colors },
    };
    setEditingTheme(newTheme);
    setThemeName(newTheme.name);
  };

  const handleEditTheme = (theme: Theme) => {
    setEditingTheme({ ...theme, colors: { ...theme.colors } });
    setThemeName(theme.name);
  };

  const handleColorChange = (key: ColorKey, value: string) => {
    if (!editingTheme) return;
    setEditingTheme({
      ...editingTheme,
      colors: { ...editingTheme.colors, [key]: value },
    });
  };

  const handleBulkColorChange = (keys: ColorKey[], value: string) => {
    if (!editingTheme) return;
    const newColors = { ...editingTheme.colors };
    keys.forEach((key) => {
      newColors[key] = value;
    });
    setEditingTheme({
      ...editingTheme,
      colors: newColors,
    });
  };

  const handleSave = () => {
    if (!editingTheme || !themeName.trim()) return;
    const themeToSave = { ...editingTheme, name: themeName.trim() };
    onSaveCustomTheme(themeToSave);
    setEditingTheme(null);
    setThemeName('');
  };

  const handleCancel = () => {
    setEditingTheme(null);
    setThemeName('');
  };

  const handleToggleDark = () => {
    if (!editingTheme) return;
    const isDark = !editingTheme.isDark;
    setEditingTheme({
      ...editingTheme,
      isDark,
      colors: createDefaultThemeColors(isDark),
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-neutral-800 rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-neutral-700">
          <h2 className="text-lg font-semibold text-white">
            {editingTheme ? 'テーマをカスタマイズ' : 'テーマ設定'}
          </h2>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {editingTheme ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-neutral-300 mb-1">テーマ名</label>
                <input
                  type="text"
                  value={themeName}
                  onChange={(e) => setThemeName(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded text-white"
                  placeholder="テーマ名を入力"
                />
              </div>

              <div className="flex items-center gap-2">
                <label className="text-sm text-neutral-300">ベース:</label>
                <button
                  onClick={handleToggleDark}
                  className={`px-3 py-1 rounded text-sm ${
                    editingTheme.isDark
                      ? 'bg-neutral-700 text-white'
                      : 'bg-neutral-200 text-neutral-800'
                  }`}
                >
                  {editingTheme.isDark ? 'ダーク' : 'ライト'}
                </button>
              </div>

              <div className="flex gap-2 overflow-x-auto pb-2">
                {colorGroups.map((group, i) => (
                  <button
                    key={group.title}
                    onClick={() => setActiveGroup(i)}
                    className={`px-3 py-1 rounded text-sm whitespace-nowrap ${
                      activeGroup === i
                        ? 'bg-neutral-600 text-white'
                        : 'bg-neutral-700 text-neutral-300 hover:bg-neutral-600'
                    }`}
                  >
                    {group.title}
                  </button>
                ))}
              </div>

              <div className="space-y-3">
                {activeGroup === 0 ? (
                  // 一括設定パネル
                  <div className="space-y-4">
                    <p className="text-sm text-neutral-400">
                      一括で複数の要素に同じ色を適用できます。個別設定は各タブで行えます。
                    </p>
                    <ColorPicker
                      label="アクセントカラー（見出し・リンク・リストマーカー等）"
                      color={editingTheme.colors.h1}
                      onChange={(value) => handleBulkColorChange(accentColorKeys, value)}
                    />
                    <ColorPicker
                      label="テキストカラー（本文・引用・コード文字）"
                      color={editingTheme.colors.text}
                      onChange={(value) => handleBulkColorChange(textColorKeys, value)}
                    />
                    <ColorPicker
                      label="サブ背景色（コード・引用・テーブル背景）"
                      color={editingTheme.colors.codeBackground}
                      onChange={(value) => handleBulkColorChange(backgroundColorKeys, value)}
                    />
                    <ColorPicker
                      label="ボーダー・線（テーブル・水平線）"
                      color={editingTheme.colors.tableBorder}
                      onChange={(value) => handleBulkColorChange(['tableBorder', 'horizontalRule'], value)}
                    />
                  </div>
                ) : (
                  colorGroups[activeGroup].keys.map((key) => (
                    <ColorPicker
                      key={key}
                      label={colorLabels[key]}
                      color={editingTheme.colors[key]}
                      onChange={(value) => handleColorChange(key, value)}
                    />
                  ))
                )}
              </div>
            </div>
          ) : (
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
                      <div
                        className="w-8 h-8 rounded border border-neutral-500"
                        style={{ backgroundColor: theme.colors.background }}
                      >
                        <div
                          className="w-full h-full flex items-center justify-center text-xs font-bold"
                          style={{ color: theme.colors.h1 }}
                        >
                          A
                        </div>
                      </div>
                      <div className="text-left">
                        <div className="text-sm text-white">{theme.name}</div>
                        <div className="text-xs text-neutral-500">
                          {theme.isDark ? 'ダーク' : 'ライト'}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {allThemes.filter((t) => isCustomTheme(t.id)).length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-neutral-400 mb-2">カスタムテーマ</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {allThemes
                      .filter((t) => isCustomTheme(t.id))
                      .map((theme) => (
                        <div
                          key={theme.id}
                          className={`flex items-center gap-3 p-3 rounded border transition-colors ${
                            currentTheme.id === theme.id
                              ? 'border-neutral-400 bg-neutral-700/50'
                              : 'border-neutral-600 hover:border-neutral-500'
                          }`}
                        >
                          <button
                            onClick={() => onSelectTheme(theme.id)}
                            className="flex items-center gap-3 flex-1"
                          >
                            <div
                              className="w-8 h-8 rounded border border-neutral-500"
                              style={{ backgroundColor: theme.colors.background }}
                            >
                              <div
                                className="w-full h-full flex items-center justify-center text-xs font-bold"
                                style={{ color: theme.colors.h1 }}
                              >
                                A
                              </div>
                            </div>
                            <div className="text-left">
                              <div className="text-sm text-white">{theme.name}</div>
                              <div className="text-xs text-neutral-500">カスタム</div>
                            </div>
                          </button>
                          <div className="flex gap-1">
                            <button
                              onClick={() => handleEditTheme(theme)}
                              className="p-1 text-neutral-400 hover:text-white"
                              title="編集"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => onDeleteCustomTheme(theme.id)}
                              className="p-1 text-neutral-400 hover:text-red-400"
                              title="削除"
                            >
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
                onClick={handleStartCustomize}
                className="w-full py-3 border-2 border-dashed border-neutral-600 rounded text-neutral-400 hover:border-neutral-500 hover:text-neutral-300 transition-colors"
              >
                + 新しいカスタムテーマを作成
              </button>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-neutral-700 flex justify-end gap-2">
          {editingTheme ? (
            <>
              <button
                onClick={handleCancel}
                className="px-4 py-2 bg-neutral-700 hover:bg-neutral-600 text-white rounded transition-colors"
              >
                キャンセル
              </button>
              <button
                onClick={handleSave}
                disabled={!themeName.trim()}
                className="px-4 py-2 bg-neutral-600 hover:bg-neutral-500 disabled:bg-neutral-800 disabled:cursor-not-allowed text-white rounded transition-colors"
              >
                保存
              </button>
            </>
          ) : (
            <button
              onClick={onClose}
              className="px-4 py-2 bg-neutral-700 hover:bg-neutral-600 text-white rounded transition-colors"
            >
              閉じる
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
