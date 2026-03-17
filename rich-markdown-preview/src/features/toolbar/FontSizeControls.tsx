import React from 'react';

interface FontSizeControlsProps {
  fontSize: number;
  onFontSizeChange: (size: number) => void;
}

export const FontSizeControls: React.FC<FontSizeControlsProps> = ({ fontSize, onFontSizeChange }) => {
  return (
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
  );
};
