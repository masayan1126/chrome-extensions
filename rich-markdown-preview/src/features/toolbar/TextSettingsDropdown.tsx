import React, { useRef, useCallback } from 'react';
import { useClickOutside } from '../../shared/hooks/useClickOutside';

interface TextSettingsDropdownProps {
  lineHeight: number;
  letterSpacing: number;
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
  onLineHeightChange: (lineHeight: number) => void;
  onLetterSpacingChange: (letterSpacing: number) => void;
}

export const TextSettingsDropdown: React.FC<TextSettingsDropdownProps> = ({
  lineHeight,
  letterSpacing,
  isOpen,
  onToggle,
  onClose,
  onLineHeightChange,
  onLetterSpacingChange,
}) => {
  const textSettingsRef = useRef<HTMLDivElement>(null);
  const closeDropdown = useCallback(() => onClose(), [onClose]);
  useClickOutside(textSettingsRef, closeDropdown);

  return (
    <div className="relative" ref={textSettingsRef}>
      <button
        onClick={onToggle}
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

      {isOpen && (
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
  );
};
