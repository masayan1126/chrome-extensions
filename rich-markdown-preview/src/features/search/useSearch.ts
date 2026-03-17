import { useState, useCallback, useEffect } from 'react';

export const useSearch = () => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [matchCount, setMatchCount] = useState(0);
  const [currentMatch, setCurrentMatch] = useState(0);

  // キーボードショートカット (Ctrl+F / Cmd+F)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    setCurrentMatch(0);
  }, []);

  const handleNextMatch = useCallback(() => {
    if (matchCount === 0) return;
    setCurrentMatch((prev) => (prev + 1) % matchCount);
  }, [matchCount]);

  const handlePrevMatch = useCallback(() => {
    if (matchCount === 0) return;
    setCurrentMatch((prev) => (prev - 1 + matchCount) % matchCount);
  }, [matchCount]);

  const handleCloseSearch = useCallback(() => {
    setIsSearchOpen(false);
    setSearchQuery('');
    setMatchCount(0);
    setCurrentMatch(0);
  }, []);

  return {
    isSearchOpen,
    searchQuery,
    matchCount,
    currentMatch,
    setMatchCount,
    handleSearch,
    handleNextMatch,
    handlePrevMatch,
    handleCloseSearch,
  };
};
