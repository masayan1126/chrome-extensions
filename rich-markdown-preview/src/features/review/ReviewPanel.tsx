import React, { useState, useCallback } from 'react';
import type { ReviewComment } from '../../shared/types';
import { CommentItem } from './CommentItem';

type FilterType = 'all' | 'unresolved' | 'resolved';

interface ReviewPanelProps {
  comments: ReviewComment[];
  isVisible: boolean;
  onToggle: () => void;
  onEdit: (comment: ReviewComment) => void;
  onDelete: (id: string) => void;
  onResolve: (id: string) => void;
  onUnresolve: (id: string) => void;
  onScrollToComment: (comment: ReviewComment) => void;
  onOpenExport: () => void;
}

export const ReviewPanel: React.FC<ReviewPanelProps> = ({
  comments, isVisible, onToggle, onEdit, onDelete,
  onResolve, onUnresolve, onScrollToComment, onOpenExport,
}) => {
  const [filter, setFilter] = useState<FilterType>('all');

  const filteredComments = comments.filter((c) => {
    if (filter === 'unresolved') return !c.resolved;
    if (filter === 'resolved') return c.resolved;
    return true;
  });

  const unresolvedCount = comments.filter((c) => !c.resolved).length;

  const handleScrollTo = useCallback((comment: ReviewComment) => {
    onScrollToComment(comment);
  }, [onScrollToComment]);

  if (comments.length === 0 && !isVisible) return null;

  return (
    <div
      className={`border-l border-neutral-700 bg-neutral-800 transition-all duration-300 flex flex-col ${
        isVisible ? 'w-72' : 'w-10'
      }`}
    >
      <button
        onClick={onToggle}
        className="w-full p-2 text-neutral-400 hover:text-neutral-200 flex items-center justify-center border-b border-neutral-700 flex-shrink-0"
        title={isVisible ? 'レビューパネルを隠す' : 'レビューパネルを表示'}
      >
        <svg
          className={`w-5 h-5 transition-transform ${isVisible ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
        </svg>
      </button>

      {isVisible && (
        <div className="flex flex-col flex-1 overflow-hidden">
          <div className="p-3 border-b border-neutral-700 flex-shrink-0">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-neutral-400 uppercase tracking-wider">
                レビュー
              </h3>
              <div className="flex items-center gap-2">
                {unresolvedCount > 0 && (
                  <span className="bg-blue-600 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                    {unresolvedCount}
                  </span>
                )}
                <button
                  onClick={onOpenExport}
                  className="p-1 text-neutral-400 hover:text-white transition-colors"
                  title="エクスポート"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="flex gap-1">
              {(['all', 'unresolved', 'resolved'] as FilterType[]).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-2 py-1 text-[11px] rounded transition-colors ${
                    filter === f
                      ? 'bg-neutral-600 text-white'
                      : 'text-neutral-400 hover:bg-neutral-700 hover:text-neutral-200'
                  }`}
                >
                  {f === 'all' ? 'すべて' : f === 'unresolved' ? '未解決' : '解決済み'}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {filteredComments.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-neutral-500">
                  {comments.length === 0
                    ? 'テキストを選択してコメントを追加'
                    : 'コメントがありません'}
                </p>
              </div>
            ) : (
              filteredComments.map((comment) => (
                <CommentItem
                  key={comment.id}
                  comment={comment}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onResolve={onResolve}
                  onUnresolve={onUnresolve}
                  onScrollTo={handleScrollTo}
                />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
