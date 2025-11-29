import React, { useEffect, useRef } from 'react';
import type { TOCItem } from '../types';

interface TOCProps {
  items: TOCItem[];
  isVisible: boolean;
  onToggle: () => void;
  activeHeadingId?: string | null;
}

export const TOC: React.FC<TOCProps> = ({ items, isVisible, onToggle, activeHeadingId }) => {
  const activeItemRef = useRef<HTMLButtonElement | null>(null);
  const navContainerRef = useRef<HTMLDivElement | null>(null);

  // アクティブな項目が変わったら、その項目が見えるようにスクロール
  useEffect(() => {
    if (activeItemRef.current && navContainerRef.current && isVisible) {
      const container = navContainerRef.current;
      const activeItem = activeItemRef.current;
      const containerRect = container.getBoundingClientRect();
      const itemRect = activeItem.getBoundingClientRect();

      // アクティブな項目がコンテナの表示範囲外の場合、スクロール
      if (itemRect.top < containerRect.top || itemRect.bottom > containerRect.bottom) {
        activeItem.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [activeHeadingId, isVisible]);

  if (items.length === 0) {
    return null;
  }

  const handleClick = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div
      className={`border-l border-neutral-700 bg-neutral-800 transition-all duration-300 ${
        isVisible ? 'w-64' : 'w-10'
      }`}
    >
      <button
        onClick={onToggle}
        className="w-full p-2 text-neutral-400 hover:text-neutral-200 flex items-center justify-center border-b border-neutral-700"
        title={isVisible ? '目次を隠す' : '目次を表示'}
      >
        <svg
          className={`w-5 h-5 transition-transform ${isVisible ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M11 19l-7-7 7-7m8 14l-7-7 7-7"
          />
        </svg>
      </button>

      {isVisible && (
        <div ref={navContainerRef} className="p-3 overflow-y-auto max-h-[calc(100vh-120px)]">
          <h3 className="text-sm font-semibold text-neutral-400 mb-3 uppercase tracking-wider">
            目次
          </h3>
          <nav>
            <ul className="space-y-1">
              {items.map((item) => {
                const isActive = activeHeadingId === item.id;
                return (
                  <li key={item.id}>
                    <button
                      ref={isActive ? activeItemRef : null}
                      onClick={() => handleClick(item.id)}
                      className={`text-left w-full text-sm rounded px-2 py-1 transition-colors truncate ${
                        isActive
                          ? 'bg-neutral-600 text-white font-medium'
                          : 'text-neutral-300 hover:bg-neutral-700/50 hover:text-white'
                      }`}
                      style={{ paddingLeft: `${(item.level - 1) * 12 + 8}px` }}
                      title={item.text}
                    >
                      {item.text}
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>
      )}
    </div>
  );
};
