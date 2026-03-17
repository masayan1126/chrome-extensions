import React, { useRef, useCallback } from 'react';
import type { FontFamily } from '../../shared/types';
import { fontOptions } from '../../shared/utils/fonts';
import { useClickOutside } from '../../shared/hooks/useClickOutside';

interface FontDropdownProps {
  fontFamily: FontFamily;
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
  onFontFamilyChange: (fontFamily: FontFamily) => void;
}

export const FontDropdown: React.FC<FontDropdownProps> = ({
  fontFamily,
  isOpen,
  onToggle,
  onClose,
  onFontFamilyChange,
}) => {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const closeDropdown = useCallback(() => onClose(), [onClose]);
  useClickOutside(dropdownRef, closeDropdown);

  const currentFont = fontOptions.find((f) => f.id === fontFamily) || fontOptions[0];

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={onToggle}
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

      {isOpen && (
        <div className="absolute right-0 top-full mt-1 w-56 bg-neutral-800 border border-neutral-700 rounded-lg shadow-xl z-50">
          <div className="p-1">
            {fontOptions.map((font) => (
              <button
                key={font.id}
                onClick={() => {
                  onFontFamilyChange(font.id);
                  onClose();
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
  );
};
