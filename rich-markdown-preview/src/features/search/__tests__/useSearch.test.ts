import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSearch } from '../useSearch';

describe('useSearch', () => {
  it('初期状態が正しい', () => {
    const { result } = renderHook(() => useSearch());
    expect(result.current.isSearchOpen).toBe(false);
    expect(result.current.searchQuery).toBe('');
    expect(result.current.matchCount).toBe(0);
    expect(result.current.currentMatch).toBe(0);
  });

  it('handleSearch が searchQuery を更新する', () => {
    const { result } = renderHook(() => useSearch());
    act(() => {
      result.current.handleSearch('test query');
    });
    expect(result.current.searchQuery).toBe('test query');
  });

  it('handleSearch が currentMatch を 0 にリセットする', () => {
    const { result } = renderHook(() => useSearch());

    // マッチ数を設定し、次のマッチに移動
    act(() => {
      result.current.setMatchCount(5);
    });
    act(() => {
      result.current.handleNextMatch();
    });
    expect(result.current.currentMatch).toBe(1);

    // 新しい検索で currentMatch が 0 にリセットされる
    act(() => {
      result.current.handleSearch('new query');
    });
    expect(result.current.currentMatch).toBe(0);
  });

  it('handleNextMatch がマッチを循環する', () => {
    const { result } = renderHook(() => useSearch());

    act(() => {
      result.current.setMatchCount(3);
    });

    act(() => {
      result.current.handleNextMatch();
    });
    expect(result.current.currentMatch).toBe(1);

    act(() => {
      result.current.handleNextMatch();
    });
    expect(result.current.currentMatch).toBe(2);

    // 末尾から先頭に戻る
    act(() => {
      result.current.handleNextMatch();
    });
    expect(result.current.currentMatch).toBe(0);
  });

  it('handleNextMatch が matchCount=0 のとき何もしない', () => {
    const { result } = renderHook(() => useSearch());
    act(() => {
      result.current.handleNextMatch();
    });
    expect(result.current.currentMatch).toBe(0);
  });

  it('handlePrevMatch が逆方向に循環する', () => {
    const { result } = renderHook(() => useSearch());

    act(() => {
      result.current.setMatchCount(3);
    });

    // 最初の状態 (0) から前へ行くと末尾 (2) に
    act(() => {
      result.current.handlePrevMatch();
    });
    expect(result.current.currentMatch).toBe(2);

    act(() => {
      result.current.handlePrevMatch();
    });
    expect(result.current.currentMatch).toBe(1);

    act(() => {
      result.current.handlePrevMatch();
    });
    expect(result.current.currentMatch).toBe(0);
  });

  it('handlePrevMatch が matchCount=0 のとき何もしない', () => {
    const { result } = renderHook(() => useSearch());
    act(() => {
      result.current.handlePrevMatch();
    });
    expect(result.current.currentMatch).toBe(0);
  });

  it('handleCloseSearch がすべての状態をリセットする', () => {
    const { result } = renderHook(() => useSearch());

    // 状態を変更
    act(() => {
      result.current.handleSearch('query');
    });
    act(() => {
      result.current.setMatchCount(5);
    });

    // 閉じる
    act(() => {
      result.current.handleCloseSearch();
    });

    expect(result.current.isSearchOpen).toBe(false);
    expect(result.current.searchQuery).toBe('');
    expect(result.current.matchCount).toBe(0);
    expect(result.current.currentMatch).toBe(0);
  });

  it('setMatchCount が matchCount を更新する', () => {
    const { result } = renderHook(() => useSearch());
    act(() => {
      result.current.setMatchCount(10);
    });
    expect(result.current.matchCount).toBe(10);
  });
});
