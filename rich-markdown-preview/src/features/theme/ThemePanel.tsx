import React, { useState } from 'react';
import type { Theme } from '../../shared/types';
import { createDefaultThemeColors } from '../../shared/utils/themeStyles';
import { ThemeEditor } from './ThemeEditor';
import { ThemeList } from './ThemeList';
import type { ColorKey } from './themeConstants';

interface ThemePanelProps {
  currentTheme: Theme;
  allThemes: Theme[];
  onSelectTheme: (themeId: string) => void;
  onSaveCustomTheme: (theme: Theme) => void;
  onDeleteCustomTheme: (themeId: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const ThemePanel: React.FC<ThemePanelProps> = ({
  currentTheme, allThemes, onSelectTheme, onSaveCustomTheme, onDeleteCustomTheme, isOpen, onClose,
}) => {
  const [editingTheme, setEditingTheme] = useState<Theme | null>(null);
  const [themeName, setThemeName] = useState('');
  const [activeGroup, setActiveGroup] = useState(0);

  const handleStartCustomize = () => {
    const t: Theme = { id: `custom-${Date.now()}`, name: 'カスタムテーマ', isDark: currentTheme.isDark, colors: { ...currentTheme.colors } };
    setEditingTheme(t);
    setThemeName(t.name);
  };
  const handleEditTheme = (theme: Theme) => { setEditingTheme({ ...theme, colors: { ...theme.colors } }); setThemeName(theme.name); };
  const handleColorChange = (key: ColorKey, value: string) => {
    if (!editingTheme) return;
    setEditingTheme({ ...editingTheme, colors: { ...editingTheme.colors, [key]: value } });
  };
  const handleBulkColorChange = (keys: ColorKey[], value: string) => {
    if (!editingTheme) return;
    const c = { ...editingTheme.colors };
    keys.forEach((k) => { c[k] = value; });
    setEditingTheme({ ...editingTheme, colors: c });
  };
  const handleSave = () => {
    if (!editingTheme || !themeName.trim()) return;
    onSaveCustomTheme({ ...editingTheme, name: themeName.trim() });
    setEditingTheme(null); setThemeName('');
  };
  const handleCancel = () => { setEditingTheme(null); setThemeName(''); };
  const handleToggleDark = () => {
    if (!editingTheme) return;
    const d = !editingTheme.isDark;
    setEditingTheme({ ...editingTheme, isDark: d, colors: createDefaultThemeColors(d) });
  };

  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-neutral-800 rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-neutral-700">
          <h2 className="text-lg font-semibold text-white">{editingTheme ? 'テーマをカスタマイズ' : 'テーマ設定'}</h2>
          <button onClick={onClose} className="text-neutral-400 hover:text-white transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          {editingTheme ? (
            <ThemeEditor editingTheme={editingTheme} themeName={themeName} activeGroup={activeGroup} onThemeNameChange={setThemeName} onColorChange={handleColorChange} onBulkColorChange={handleBulkColorChange} onToggleDark={handleToggleDark} onActiveGroupChange={setActiveGroup} />
          ) : (
            <ThemeList currentTheme={currentTheme} allThemes={allThemes} onSelectTheme={onSelectTheme} onEditTheme={handleEditTheme} onDeleteCustomTheme={onDeleteCustomTheme} onStartCustomize={handleStartCustomize} />
          )}
        </div>
        <div className="p-4 border-t border-neutral-700 flex justify-end gap-2">
          {editingTheme ? (
            <>
              <button onClick={handleCancel} className="px-4 py-2 bg-neutral-700 hover:bg-neutral-600 text-white rounded transition-colors">キャンセル</button>
              <button onClick={handleSave} disabled={!themeName.trim()} className="px-4 py-2 bg-neutral-600 hover:bg-neutral-500 disabled:bg-neutral-800 disabled:cursor-not-allowed text-white rounded transition-colors">保存</button>
            </>
          ) : (
            <button onClick={onClose} className="px-4 py-2 bg-neutral-700 hover:bg-neutral-600 text-white rounded transition-colors">閉じる</button>
          )}
        </div>
      </div>
    </div>
  );
};
