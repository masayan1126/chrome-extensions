import React, { useState, useEffect, useRef, useCallback } from 'react';
import { SearchInput } from './SearchInput';

interface SearchBarProps {
  isOpen: boolean;
  onClose: () => void;
  onSearch: (query: string) => void;
  matchCount: number;
  currentMatch: number;
  onNextMatch: () => void;
  onPrevMatch: () => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  isOpen, onClose, onSearch, matchCount, currentMatch, onNextMatch, onPrevMatch,
}) => {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isOpen]);

  useEffect(() => {
    onSearch(query);
  }, [query, onSearch]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'Enter') {
        if (e.shiftKey) { onPrevMatch(); } else { onNextMatch(); }
      }
    },
    [onClose, onNextMatch, onPrevMatch]
  );

  if (!isOpen) return null;

  return (
    <div className="absolute top-0 right-0 m-4 z-50 bg-neutral-800 border border-neutral-600 rounded-lg shadow-xl p-3 flex items-center gap-2">
      <SearchInput query={query} onChange={setQuery} onKeyDown={handleKeyDown} inputRef={inputRef} />

      {query && (
        <span className="text-sm text-neutral-400 min-w-16 text-center">
          {matchCount > 0 ? `${currentMatch + 1} / ${matchCount}` : '0件'}
        </span>
      )}

      <div className="flex items-center gap-1">
        <button
          onClick={onPrevMatch}
          disabled={matchCount === 0}
          className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-700 rounded disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-neutral-400"
          title="前へ (Shift+Enter)"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
          </svg>
        </button>
        <button
          onClick={onNextMatch}
          disabled={matchCount === 0}
          className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-700 rounded disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-neutral-400"
          title="次へ (Enter)"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      <button onClick={onClose} className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-700 rounded" title="閉じる (Esc)">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
};
