import React, { useState, useRef, useEffect } from 'react';

interface ColorPickerProps {
  label: string;
  color: string;
  onChange: (color: string) => void;
}

export const ColorPicker: React.FC<ColorPickerProps> = ({ label, color, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState(color);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setInputValue(color);
  }, [color]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);

    // 有効なカラーコードの場合のみ更新
    if (/^#[0-9A-Fa-f]{6}$/.test(value) || /^#[0-9A-Fa-f]{3}$/.test(value)) {
      onChange(value);
    }
  };

  const handleColorInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    onChange(value);
  };

  return (
    <div ref={containerRef} className="relative">
      <div className="flex items-center justify-between">
        <label className="text-sm text-neutral-300">{label}</label>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            className="w-20 px-2 py-1 text-xs bg-neutral-700 border border-neutral-600 rounded text-neutral-200 font-mono"
          />
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="w-8 h-8 rounded border-2 border-neutral-600 cursor-pointer"
            style={{ backgroundColor: color }}
            title="カラーピッカーを開く"
          />
        </div>
      </div>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 z-50 bg-neutral-800 border border-neutral-600 rounded-lg p-3 shadow-xl">
          <input
            type="color"
            value={color}
            onChange={handleColorInputChange}
            className="w-32 h-32 cursor-pointer bg-transparent"
          />
        </div>
      )}
    </div>
  );
};
