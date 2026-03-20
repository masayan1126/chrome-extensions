import React, { useState, useRef, useEffect } from 'react';
import type { ReviewComment } from '../../shared/types';

interface CommentItemProps {
  comment: ReviewComment;
  onEdit: (comment: ReviewComment) => void;
  onDelete: (id: string) => void;
  onResolve: (id: string) => void;
  onUnresolve: (id: string) => void;
  onScrollTo: (comment: ReviewComment) => void;
}

const typeLabels: Record<ReviewComment['type'], string> = {
  modify: '修正',
  delete: '削除',
  add: '追加',
  question: '質問',
};

const typeBadgeColors: Record<ReviewComment['type'], string> = {
  modify: 'bg-blue-500',
  delete: 'bg-red-500',
  add: 'bg-green-500',
  question: 'bg-yellow-500',
};

const commentTypes: { value: ReviewComment['type']; label: string; color: string }[] = [
  { value: 'modify', label: '修正', color: 'bg-blue-500' },
  { value: 'delete', label: '削除', color: 'bg-red-500' },
  { value: 'add', label: '追加', color: 'bg-green-500' },
  { value: 'question', label: '質問', color: 'bg-yellow-500' },
];

export const CommentItem: React.FC<CommentItemProps> = ({
  comment, onEdit, onDelete, onResolve, onUnresolve, onScrollTo,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(comment.comment);
  const [editType, setEditType] = useState(comment.type);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isEditing) {
      textareaRef.current?.focus();
    }
  }, [isEditing]);

  const handleStartEdit = () => {
    setEditText(comment.comment);
    setEditType(comment.type);
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    if (editType !== 'delete' && !editText.trim()) return;
    onEdit({
      ...comment,
      comment: editText.trim(),
      type: editType,
      updatedAt: new Date().toISOString(),
    });
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditText(comment.comment);
    setEditType(comment.type);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSaveEdit();
    }
    if (e.key === 'Escape') {
      handleCancelEdit();
    }
  };

  const displayText = comment.anchor.selectedText.length > 50
    ? comment.anchor.selectedText.substring(0, 50) + '...'
    : comment.anchor.selectedText;

  const lineRange = comment.anchor.markdownLineStart > 0
    ? comment.anchor.markdownLineStart === comment.anchor.markdownLineEnd
      ? `L${comment.anchor.markdownLineStart}`
      : `L${comment.anchor.markdownLineStart}-L${comment.anchor.markdownLineEnd}`
    : null;

  // 編集モード
  if (isEditing) {
    return (
      <div className="p-3 rounded-lg border bg-neutral-800 border-blue-500">
        <div className="text-xs text-neutral-400 bg-neutral-700/50 rounded px-2 py-1 mb-2 truncate">
          &ldquo;{displayText}&rdquo;
        </div>

        <div className="flex gap-1.5 mb-2">
          {commentTypes.map((t) => (
            <button
              key={t.value}
              onClick={() => setEditType(t.value)}
              className={`px-2 py-0.5 text-[10px] rounded transition-colors ${
                editType === t.value
                  ? `${t.color} text-white`
                  : 'bg-neutral-700 text-neutral-300 hover:bg-neutral-600'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <textarea
          ref={textareaRef}
          value={editText}
          onChange={(e) => setEditText(e.target.value)}
          onKeyDown={handleKeyDown}
          className="w-full h-16 bg-neutral-700 text-neutral-200 text-sm rounded px-2 py-1.5 resize-none focus:outline-none focus:ring-1 focus:ring-blue-500"
        />

        <div className="flex justify-between items-center mt-2">
          <span className="text-[10px] text-neutral-500">Ctrl+Enter で保存</span>
          <div className="flex gap-2">
            <button
              onClick={handleCancelEdit}
              className="px-2 py-1 text-[11px] bg-neutral-700 text-neutral-300 rounded hover:bg-neutral-600 transition-colors"
            >
              キャンセル
            </button>
            <button
              onClick={handleSaveEdit}
              disabled={editType !== 'delete' && !editText.trim()}
              className="px-2 py-1 text-[11px] bg-blue-600 text-white rounded hover:bg-blue-500 transition-colors disabled:opacity-50"
            >
              保存
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 通常表示
  return (
    <div
      className={`p-3 rounded-lg border transition-colors ${
        comment.resolved
          ? 'bg-neutral-800/50 border-neutral-700/50 opacity-60'
          : 'bg-neutral-800 border-neutral-700 hover:border-neutral-600'
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`px-1.5 py-0.5 text-[10px] rounded text-white ${typeBadgeColors[comment.type]}`}>
            {typeLabels[comment.type]}
          </span>
          {lineRange && (
            <span className="text-[10px] text-neutral-500 font-mono">{lineRange}</span>
          )}
          {comment.anchor.nearestHeadingText && (
            <span className="text-[10px] text-neutral-500 truncate max-w-[120px]" title={comment.anchor.nearestHeadingText}>
              {comment.anchor.nearestHeadingText}
            </span>
          )}
        </div>
        {/* アクションボタン — 常時表示 */}
        <div className="flex gap-0.5 flex-shrink-0">
          <button
            onClick={() => onScrollTo(comment)}
            className="p-1 text-neutral-500 hover:text-white transition-colors"
            title="該当箇所へ移動"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </button>
          <button
            onClick={handleStartEdit}
            className="p-1 text-neutral-500 hover:text-white transition-colors"
            title="編集"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          {comment.resolved ? (
            <button
              onClick={() => onUnresolve(comment.id)}
              className="p-1 text-neutral-500 hover:text-yellow-400 transition-colors"
              title="未解決に戻す"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          ) : (
            <button
              onClick={() => onResolve(comment.id)}
              className="p-1 text-neutral-500 hover:text-green-400 transition-colors"
              title="解決済みにする"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </button>
          )}
          <button
            onClick={() => onDelete(comment.id)}
            className="p-1 text-neutral-500 hover:text-red-400 transition-colors"
            title="削除"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      <button
        onClick={() => onScrollTo(comment)}
        className="text-xs text-neutral-400 bg-neutral-700/50 rounded px-2 py-1 mb-2 text-left w-full truncate hover:bg-neutral-700 transition-colors"
      >
        &ldquo;{displayText}&rdquo;
      </button>

      <p className="text-sm text-neutral-200 leading-relaxed">{comment.comment}</p>
    </div>
  );
};
